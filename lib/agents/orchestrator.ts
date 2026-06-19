import OpenAI from "openai";
import { AGENTS, type AgentType, getChatAgentType, getModelForAgent } from "./config";
import { KeyManager, type KeyRotationEvent } from "./key-manager";
import { getToolsForAgent, type ToolCall } from "./tools";
import { ConversationSummarizer } from "./summarizer";
import { getProviderConfig, getNextProvider, validateProviderModel, type ProviderType, getAgentAutoConfig, getActiveProvider } from "./provider-config";
import { parseQuestions } from "./question-parser";
import { ProjectStateService } from "@/lib/stages/project-state";
import { buildOrchestratorPrompt } from "@/lib/stages/prompt-builder";
import { STAGE_CONFIG } from "@/lib/stages/stage-config";

/**
 * Multi-Provider LLM Client Singleton with Automatic Failover
 * Supports OpenRouter, Groq Cloud, and AIML API with unified interface
 * 
 * Provider Configuration:
 * - Set LLM_PROVIDER env var to: openrouter | groq | aiml
 * - Each provider has its own API keys and baseURL
 * - Uses OpenAI-compatible SDK for all providers
 * - Supports streaming, tool calling, and vision (provider-dependent)
 * 
 * Agent Model Mapping (Dynamic via modelRole):
 * - Orchestrator: "fast" role → provider-specific fast model
 * - Conversational: "reasoning" role → provider-specific reasoning model
 * - BOM Generator: "reasoning" role → provider-specific reasoning model
 * - Code Generator: "code" role → provider-specific code model
 * - Wiring Diagram: "code" role → provider-specific code model
 * - Debugger: "reasoning" role → provider-specific reasoning model
 * - Datasheet Analyzer: "reasoning" role → provider-specific reasoning model
 * - Budget Optimizer: "reasoning" role → provider-specific reasoning model
 * - Conversation Summarizer: "fast" role → provider-specific fast model
 * 
 * See lib/agents/provider-config.ts for model mappings per provider
 */
/**
 * Provider Client Singleton with Automatic Failover
 * Supports multiple LLM providers: OpenRouter, Groq, AIML API
 */
class ProviderClient {
    private static instance: OpenAI | null = null;
    private static currentKey: string | null = null;
    private static currentProvider: string | null = null;
    private static isRefreshing: boolean = false;

    /**
     * Get singleton instance with thread-safety
     * @param provider Optional provider override
     * @param forceRefresh Force recreation of client
     */
    static async getInstance(provider?: ProviderType, forceRefresh: boolean = false): Promise<OpenAI> {
        // Wait if another request is refreshing
        let waitCount = 0;
        while (this.isRefreshing && waitCount < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            waitCount++;
        }

        const keyManager = KeyManager.getInstance();
        
        // If provider override, ensure KeyManager has correct keys loaded
        if (provider && keyManager.getCurrentProvider() !== provider) {
            keyManager.reloadKeysForProvider(provider);
        }
        
        const activeKey = keyManager.getCurrentKey();
        const providerConfig = getProviderConfig(provider);

        if (!this.instance || 
            this.currentKey !== activeKey || 
            this.currentProvider !== providerConfig.name ||
            forceRefresh) {
            
            this.isRefreshing = true;
            try {
                this.currentKey = activeKey;
                this.currentProvider = providerConfig.name;
                this.instance = new OpenAI({
                    apiKey: activeKey,
                    baseURL: providerConfig.baseURL,
                    dangerouslyAllowBrowser: true // For client-side usage
                });
                console.log(`🔌 ${providerConfig.name} connected: ${keyManager.getStatus().split('\n')[0]}`);
            } finally {
                this.isRefreshing = false;
            }
        }

        return this.instance;
    }
}

/**
 * Sequential Agent Runner with Automatic Failover
 * Executes agents one at a time with automatic API key rotation on quota errors
 */
export class AgentRunner {
    /**
     * Classify if an error is quota/billing related
     */
    private isQuotaError(error: any): boolean {
        // Check HTTP status codes
        if (error.status === 429 || error.status === 402) return true;

        // Check error message content
        const message = (error.message || '').toLowerCase();
        const keywords = [
            'quota', 'insufficient_quota', 'rate_limit', 'credits', 'billing', 'payment',
            'exceeded', 'limit', 'throttle', 'too many requests'
        ];
        return keywords.some(keyword => message.includes(keyword));
    }

    /**
     * Determine if error is provider-level (timeout, network, 5xx)
     */
    private isProviderLevelFailure(error: any): boolean {
        const errorMessage = error.message?.toLowerCase() || '';
        const statusCode = error.status || error.statusCode;
        
        if ([500, 502, 503, 504].includes(statusCode)) return true;
        if (errorMessage.includes('timeout')) return true;
        if (errorMessage.includes('connection')) return true;
        if (errorMessage.includes('network')) return true;
        if (errorMessage.includes('unavailable')) return true;
        
        // Tool errors, validations, or auth failures are NOT provider-level failures
        if (errorMessage.includes('tool')) return false;
        if (errorMessage.includes('function')) return false;
        if (errorMessage.includes('schema')) return false;
        if (errorMessage.includes('validation')) return false;
        if (errorMessage.includes('api key') || errorMessage.includes('auth')) return false;
        
        return false;
    }

    /**
     * Execute API call with automatic failover
     */
    private async executeWithRetry<T>(
        operation: (client: OpenAI, provider: ProviderType) => Promise<T>,
        operationName: string = "API Call",
        overrideProvider?: ProviderType | '',
        autoFallbackConfig?: {
            fallbackProvider: ProviderType;
            fallbackModel: string;
            allowFallback: boolean;
        }
    ): Promise<T> {
        const keyManager = KeyManager.getInstance();
        const activeProvider = overrideProvider || getActiveProvider();
        
        // Ensure KeyManager loads correct keys if they aren't loaded
        if (keyManager.getCurrentProvider() !== activeProvider) {
            keyManager.reloadKeysForProvider(activeProvider);
        }
        
        const totalKeys = keyManager.getTotalKeys();
        const providerConfig = getProviderConfig(activeProvider);
        let attempt = 0;

        while (attempt < totalKeys) {
            try {
                const client = await ProviderClient.getInstance(activeProvider);
                const result = await operation(client, activeProvider);

                // Record success
                keyManager.recordSuccess();
                return result;

            } catch (error: any) {
                attempt++;

                if (this.isQuotaError(error)) {
                    console.warn(`⚠️ ${operationName} failed (attempt ${attempt}/${totalKeys}): ${error.message}`);

                    // Mark key as failed permanently
                    keyManager.markCurrentKeyAsFailed();

                    // Try to rotate
                    const rotated = keyManager.rotateKey();
                    if (!rotated) {
                        break; // Break loop to switch provider
                    }

                    // Force client refresh and retry
                    await ProviderClient.getInstance(activeProvider, true);
                    console.log(`🔄 Retrying ${operationName} with new key...`);
                    continue;
                }

                // In AUTO mode, check if it's a provider-level error (5xx, timeout, connection)
                if (autoFallbackConfig?.allowFallback && this.isProviderLevelFailure(error)) {
                    console.warn(`⚠️ Provider-level failure on ${providerConfig.name}: ${error.message}. Triggering fallback...`);
                    break; 
                }

                // Non-quota error - don't retry
                console.error(`❌ ${operationName} failed with non-quota error:`, error.message);
                throw error;
            }
        }

        // AUTO mode fallback triggers first
        if (autoFallbackConfig?.allowFallback) {
            console.warn(`🔄 [AgentRunner] AUTO mode: Falling back from ${providerConfig.name} to ${autoFallbackConfig.fallbackProvider} / ${autoFallbackConfig.fallbackModel}`);
            try {
                return await this.executeWithRetry(
                    operation,
                    operationName,
                    autoFallbackConfig.fallbackProvider,
                    {
                        ...autoFallbackConfig,
                        allowFallback: false // prevent loops
                    }
                );
            } catch (fallbackError: any) {
                console.error(`❌ [Fallback Failed] ${autoFallbackConfig.fallbackProvider} also failed:`, fallbackError.message);
                throw fallbackError;
            }
        }

        // All keys exhausted for current provider - try default next provider in chain
        console.warn(`💀 All keys exhausted for ${providerConfig.name}, trying next provider...`);
        
        const nextProvider = getNextProvider(activeProvider);
        if (nextProvider) {
            console.log(`🔄 Switching to ${nextProvider}...`);
            const switched = keyManager.switchProvider(nextProvider);
            
            if (switched) {
                await ProviderClient.getInstance(nextProvider, true);
                // Retry with new provider (recursive call)
                return this.executeWithRetry(operation, operationName, nextProvider);
            }
        }

        throw new Error(`❌ All providers and keys exhausted. Please add more API keys or check your accounts.`);
    }

    /**
     * Run a single agent with the given messages (with tool support)
     * @param agentType The type of agent to run
     * @param messages Conversation messages
     * @param options Optional configurations including provider/model overrides
     */
    async runAgent(
        agentType: AgentType,
        messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
        options?: {
            onStream?: (chunk: string) => void;
            stream?: boolean;
            onToolCall?: (toolCall: ToolCall) => Promise<any>;
            chatId?: string;
            // NEW: Runtime provider/model overrides
            overrideProvider?: ProviderType;
            overrideModel?: string;
        }
    ): Promise<{ response: string; toolCalls: ToolCall[] }> {
        const agent = AGENTS[agentType];

        if (!agent) {
            throw new Error(`Unknown agent type: ${agentType}`);
        }

        // NEW: Build dynamic context if chatId provided
        let systemPrompt = agent.systemPrompt;

        if (options?.chatId) {
            console.log(`🔍 [Orchestrator] chatId provided: ${options.chatId}, building context...`);
            try {
                const { AgentContextBuilder } = await import('./context-builder');
                const contextBuilder = new AgentContextBuilder(options.chatId);
                const dynamicContext = await contextBuilder.buildDynamicContext();

                if (dynamicContext) {
                    systemPrompt = `${agent.systemPrompt}\n\n${dynamicContext}`;
                    console.log(`💡 [Orchestrator] ✅ Injected conversation context for ${agent.name} (${dynamicContext.length} chars)`);
                } else {
                    console.log(`💡 [Orchestrator] ⏭️  No context to inject (new conversation or empty)`);
                }
            } catch (error: any) {
                console.error(`❌ [Orchestrator] Failed to build context:`, error.message);
                // Continue without context - don't break the agent
            }
        } else {
            console.log(`⚠️  [Orchestrator] No chatId provided, skipping context injection`);
        }

        // Prepend system prompt
        const fullMessages = [
            { role: "system" as const, content: systemPrompt },
            ...messages
        ];

        // NEW: Get actual model with overrides
        const modelConfig = getModelForAgent(
            agentType,
            options?.overrideProvider,
            options?.overrideModel
        );
        
        const providerName = options?.overrideProvider || getProviderConfig().name;
        console.log(`🤖 Running ${agent.name} (configured: ${modelConfig.model} via ${modelConfig.provider})${modelConfig.isAuto ? ' [AUTO]' : ''}...`);
        console.log(`📊 [Orchestrator] Messages count: ${fullMessages.length}, System prompt length: ${systemPrompt.length} chars`);

        // Get tools for this agent
        const tools = getToolsForAgent(agentType);
        console.log(`🔧 [Orchestrator] Tools available: ${tools.length}`);

        // ponytail: If agent needs tools, try user's model first, fallback to reliable tool-calling models
        const needsTools = tools.length > 0;
        // Try these models in order if primary fails
        const fallbackOptions = [
            { model: 'nex-agi/nex-n2-pro:free', provider: 'openrouter' as ProviderType },
            { model: 'openai/gpt-4.1-nano-2025-04-14', provider: 'aiml' as ProviderType }
        ];

        // Prepare AUTO fallback config
        let autoFallbackConfig = undefined;
        if (modelConfig.isAuto) {
            const fallbackConf = getAgentAutoConfig(agentType).fallback;
            autoFallbackConfig = {
                fallbackProvider: fallbackConf.provider,
                fallbackModel: fallbackConf.model,
                allowFallback: true
            };
        }
        
        try {
            const result = await this.executeWithRetry(
                async (client, provider) => {
                    const activeModelConfig = getModelForAgent(
                        agentType,
                        provider,
                        options?.overrideModel
                    );
                    const activeModel = activeModelConfig.model;
                    
                    if (options?.stream) {
                        return await this.runStreamingAgentWithTools(client, agent, activeModel, fullMessages, tools, options?.onStream, options?.onToolCall);
                    } else {
                        return await this.runNonStreamingAgentWithTools(client, agent, activeModel, fullMessages, tools, options?.onToolCall);
                    }
                },
                agent.name,
                modelConfig.provider,
                autoFallbackConfig
            );

            // ponytail: Check if tools were expected but not used (model doesn't support function calling properly)
            if (needsTools && result.toolCalls.length === 0 && result.response.length > 0) {
                // Check if response contains tool-like JSON that wasn't parsed as tool calls
                const hasToolLikeContent = result.response.includes('"name"') && result.response.includes('"arguments"');
                
                if (hasToolLikeContent) {
                    // Try fallback models in order
                    for (const fallback of fallbackOptions) {
                        if (modelConfig.model === fallback.model) continue; // Skip if already using this model
                        
                        console.warn(`⚠️ [Orchestrator] Model ${modelConfig.model} returned text instead of tool calls, retrying with ${fallback.model}...`);
                        
                        try {
                            return await this.executeWithRetry(
                                async (client, provider) => {
                                    if (options?.stream) {
                                        return await this.runStreamingAgentWithTools(client, agent, fallback.model, fullMessages, tools, options?.onStream, options?.onToolCall);
                                    } else {
                                        return await this.runNonStreamingAgentWithTools(client, agent, fallback.model, fullMessages, tools, options?.onToolCall);
                                    }
                                },
                                `${agent.name} (Fallback: ${fallback.model})`,
                                fallback.provider
                            );
                        } catch (fallbackError: any) {
                            console.warn(`⚠️ Fallback ${fallback.model} also failed: ${fallbackError.message}`);
                            // Try next fallback
                        }
                    }
                }
            }
            
            return result;
            
        } catch (error: any) {
            // ponytail: If tool calling failed and we're not already using fallback, retry with reliable models
            const isToolError = error.message?.toLowerCase().includes('function') || 
                               error.message?.toLowerCase().includes('tool');
            
            // ponytail: Never trigger provider cascade for validation errors (should be caught in inner loop)
            const isValidationError = 
                error.message?.includes('did not match schema') ||
                error.message?.includes('value must be one of');
                               
            if (needsTools && isToolError && !isValidationError) {
                // Try fallback models in order
                for (const fallback of fallbackOptions) {
                    if (modelConfig.model === fallback.model) continue; // Skip if already using this model
                    
                    console.warn(`⚠️ [Orchestrator] Tool calling failed with ${modelConfig.model}, retrying with ${fallback.model}...`);
                    console.warn(`⚠️ Original error: ${error.message}`);
                    
                    try {
                        return await this.executeWithRetry(
                            async (client, provider) => {
                                if (options?.stream) {
                                    return await this.runStreamingAgentWithTools(client, agent, fallback.model, fullMessages, tools, options?.onStream, options?.onToolCall);
                                } else {
                                    return await this.runNonStreamingAgentWithTools(client, agent, fallback.model, fullMessages, tools, options?.onToolCall);
                                }
                            },
                            `${agent.name} (Fallback: ${fallback.model})`,
                            fallback.provider
                        );
                    } catch (fallbackError: any) {
                        console.warn(`⚠️ Fallback ${fallback.model} also failed: ${fallbackError.message}`);
                        // Try next fallback
                    }
                }
            }
            
            // If not a tool error or all fallbacks failed, rethrow
            throw error;
        }
    }

    /**
     * Internal non-streaming agent execution (with tool support)
     * Multi-turn loop: AI gets multiple turns until it returns text without tool calls
     */
    private async runNonStreamingAgentWithTools(
        client: OpenAI,
        agent: typeof AGENTS[AgentType],
        model: string,
        messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
        tools: any[],
        onToolCall?: (toolCall: ToolCall) => Promise<any>
    ): Promise<{ response: string; toolCalls: ToolCall[] }> {
        const allToolCalls: ToolCall[] = [];
        const conversationMessages = [...messages]; // Copy to avoid mutating original
        const maxTurns = 10; // ponytail: hard loop limit, upgrade path is configurable per-agent
        const seenCalls = new Set<string>(); // Loop detection

        for (let turn = 0; turn < maxTurns; turn++) {
            console.log(`🔄 [AgentLoop] Turn ${turn + 1}/${maxTurns}`);

            const requestParams: any = {
                model: model,
                messages: conversationMessages,
                temperature: agent.temperature,
                stream: false
            };

            if (tools.length > 0) {
                requestParams.tools = tools.map(t => ({
                    type: "function",
                    function: t
                }));
            }

            try {
                const response = await client.chat.completions.create(requestParams);
                const message = response.choices[0]?.message;

                // Check for tool calls
                if (message?.tool_calls && message.tool_calls.length > 0) {
                    console.log(`🔧 [AgentLoop] AI called ${message.tool_calls.length} tool(s)`);

                    // Add assistant message with tool calls to history
                    conversationMessages.push({
                        role: "assistant",
                        content: message.content || "",
                        tool_calls: message.tool_calls
                    } as any);

                    // Execute each tool and collect results
                    for (const tc of message.tool_calls) {
                        if (tc.type === 'function' && 'function' in tc) {
                            const toolCall: ToolCall = {
                                name: tc.function.name,
                                arguments: JSON.parse(tc.function.arguments)
                            };

                            // Loop detection: same tool + args = abort
                            const callSig = `${toolCall.name}:${JSON.stringify(toolCall.arguments)}`;
                            if (seenCalls.has(callSig)) {
                                throw new Error(`Loop detected: repeated call to ${toolCall.name}`);
                            }
                            seenCalls.add(callSig);

                            allToolCalls.push(toolCall);

                            // Execute tool
                            let toolResult: any;
                            try {
                                if (onToolCall) {
                                    console.log(`🔧 Executing tool: ${toolCall.name}`);
                                    toolResult = await onToolCall(toolCall);
                                } else {
                                    toolResult = { success: true };
                                }
                            } catch (error: any) {
                                console.error(`❌ Tool ${toolCall.name} failed:`, error.message);
                                toolResult = {
                                    success: false,
                                    error: error.message
                                };
                            }

                            // ponytail: Ensure content is never empty (OpenAI requires it)
                            const resultContent = toolResult !== undefined 
                                ? JSON.stringify(toolResult)
                                : JSON.stringify({ success: true });

                            // Add tool result to conversation
                            conversationMessages.push({
                                role: "tool",
                                tool_call_id: tc.id,
                                content: resultContent
                            } as any);
                        }
                    }

                    // Continue loop - give AI another turn
                    continue;
                }

                // No tool calls - AI provided final response
                const finalContent = message?.content || "";
                console.log(`✅ ${agent.name} completed in ${turn + 1} turn(s) (${finalContent.length} chars, ${allToolCalls.length} total tool calls)`);
                return { response: finalContent, toolCalls: allToolCalls };
                
            } catch (apiError: any) {
                // ponytail: Provider validation errors should trigger self-correction, not provider fallback
                const isValidationError = 
                    apiError.message?.includes('did not match schema') ||
                    apiError.message?.includes('value must be one of');
                
                if (!isValidationError) throw apiError; // Real API error, let outer catch handle it
                
                console.warn(`⚠️ [AgentLoop] Provider rejected tool call (validation error), converting to correctable tool result`);
                
                // Convert provider validation error into a correctable tool result
                // so the LLM can self-correct on the next turn
                conversationMessages.push({
                    role: 'tool',
                    tool_call_id: 'validation_error', // ponytail: placeholder ID, providers may require actual ID
                    content: JSON.stringify({
                        success: false,
                        error: apiError.message,
                        hint: 'Your last tool call used an invalid parameter value. Check the schema and retry.'
                    })
                } as any);
                
                // Loop continues — LLM sees the error and self-corrects
                continue;
            }
        }

        throw new Error(`Agent loop exceeded max turns (${maxTurns})`);
    }

    /**
     * Internal streaming agent execution (with tool support)
     * Multi-turn loop: AI gets multiple turns until it returns text without tool calls
     */
    private async runStreamingAgentWithTools(
        client: OpenAI,
        agent: typeof AGENTS[AgentType],
        model: string,
        messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
        tools: any[],
        onStream?: (chunk: string) => void,
        onToolCall?: (toolCall: ToolCall) => Promise<any>
    ): Promise<{ response: string; toolCalls: ToolCall[] }> {
        const allToolCalls: ToolCall[] = [];
        const conversationMessages = [...messages]; // Copy to avoid mutating original
        const maxTurns = 10; // ponytail: hard loop limit, upgrade path is configurable per-agent
        const seenCalls = new Set<string>(); // Loop detection
        let fullText = "";

        for (let turn = 0; turn < maxTurns; turn++) {
            console.log(`🔄 [AgentLoop] Turn ${turn + 1}/${maxTurns} (streaming)`);

            const requestParams: any = {
                model: model,
                messages: conversationMessages,
                temperature: agent.temperature,
                stream: true
            };

            if (tools.length > 0) {
                requestParams.tools = tools.map(t => ({
                    type: "function",
                    function: t
                }));
            }

            const stream = await client.chat.completions.create(requestParams) as any;

            let turnText = "";
            const toolCallBuffers: Map<number, { id: string; name: string; args: string }> = new Map();

            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta;

                // Handle text content
                if (delta?.content) {
                    turnText += delta.content;
                    fullText += delta.content;
                    onStream?.(delta.content);
                }

                // Handle tool calls (buffering)
                if (delta?.tool_calls) {
                    for (const tc of delta.tool_calls) {
                        const index = tc.index;

                        if (!toolCallBuffers.has(index)) {
                            toolCallBuffers.set(index, { id: tc.id || "", name: "", args: "" });
                        }

                        const buffer = toolCallBuffers.get(index)!;

                        if (tc.id) {
                            buffer.id = tc.id;
                        }
                        if (tc.function?.name) {
                            buffer.name = tc.function.name;
                        }
                        if (tc.function?.arguments) {
                            buffer.args += tc.function.arguments;
                        }
                    }
                }
            }

            // Check if we got tool calls this turn
            if (toolCallBuffers.size > 0) {
                console.log(`🔧 [AgentLoop] AI called ${toolCallBuffers.size} tool(s)`);

                // Build tool_calls array for the assistant message
                const toolCallsForMessage: any[] = [];
                
                for (const buffer of toolCallBuffers.values()) {
                    if (buffer.name && buffer.args) {
                        toolCallsForMessage.push({
                            id: buffer.id,
                            type: "function",
                            function: {
                                name: buffer.name,
                                arguments: buffer.args
                            }
                        });
                    }
                }

                // Add assistant message with tool calls to history
                conversationMessages.push({
                    role: "assistant",
                    content: turnText,
                    tool_calls: toolCallsForMessage
                } as any);

                // Execute each tool and collect results
                for (const buffer of toolCallBuffers.values()) {
                    if (buffer.name && buffer.args) {
                        try {
                            const toolCall: ToolCall = {
                                name: buffer.name,
                                arguments: JSON.parse(buffer.args)
                            };

                            // Loop detection: same tool + args = abort
                            const callSig = `${toolCall.name}:${JSON.stringify(toolCall.arguments)}`;
                            if (seenCalls.has(callSig)) {
                                throw new Error(`Loop detected: repeated call to ${toolCall.name}`);
                            }
                            seenCalls.add(callSig);

                            allToolCalls.push(toolCall);

                            // Execute tool
                            let toolResult: any;
                            try {
                                if (onToolCall) {
                                    console.log(`🔧 Executing tool: ${toolCall.name}`);
                                    toolResult = await onToolCall(toolCall);
                                } else {
                                    toolResult = { success: true };
                                }
                            } catch (error: any) {
                                console.error(`❌ Tool ${toolCall.name} failed:`, error.message);
                                toolResult = {
                                    success: false,
                                    error: error.message
                                };
                            }

                            // ponytail: Ensure content is never empty (OpenAI requires it)
                            const resultContent = toolResult !== undefined 
                                ? JSON.stringify(toolResult)
                                : JSON.stringify({ success: true });

                            // Add tool result to conversation
                            conversationMessages.push({
                                role: "tool",
                                tool_call_id: buffer.id,
                                content: resultContent
                            } as any);
                        } catch (error) {
                            console.error(`❌ Failed to parse tool call ${buffer.name}:`, error);
                        }
                    }
                }

                // Continue loop - give AI another turn
                continue;
            }

            // No tool calls - AI provided final response
            console.log(`✅ ${agent.name} completed in ${turn + 1} turn(s) (${fullText.length} chars, ${allToolCalls.length} total tool calls)`);
            
            // ponytail: Fallback - parse tool calls from text if model doesn't support function calling
            if (allToolCalls.length === 0 && fullText.length > 0) {
                const parsedCalls = this.parseToolCallsFromText(fullText);
                if (parsedCalls.length > 0) {
                    console.log(`🔧 [Fallback] Parsed ${parsedCalls.length} tool calls from text response`);
                    for (const toolCall of parsedCalls) {
                        allToolCalls.push(toolCall);
                        if (onToolCall) {
                            console.log(`🔧 Executing parsed tool call: ${toolCall.name}`);
                            await onToolCall(toolCall);
                        }
                    }
                    // Clear text since it was just tool calls
                    fullText = "";
                }
            }
            
            return { response: fullText, toolCalls: allToolCalls };
        }

        throw new Error(`Agent loop exceeded max turns (${maxTurns})`);
    }

    /**
     * Parse tool calls from text response (fallback for models without function calling)
     */
    private parseToolCallsFromText(text: string): ToolCall[] {
        const toolCalls: ToolCall[] = [];
        
        // Match JSON objects with "name" and "arguments" fields
        const jsonPattern = /\{\s*"name"\s*:\s*"([^"]+)"\s*,\s*"arguments"\s*:\s*(\{[^}]+\})\s*\}/g;
        let match;
        
        while ((match = jsonPattern.exec(text)) !== null) {
            try {
                const name = match[1];
                const args = JSON.parse(match[2]);
                toolCalls.push({ name, arguments: args });
            } catch (e) {
                console.warn('[Orchestrator] Failed to parse tool call from text:', e);
            }
        }
        
        return toolCalls;
    }

    /**
     * Run vision agent with image and failover protection
     */
    async runVisionAgent(
        agentType: AgentType,
        imageUrl: string,
        blueprintJson: string,
        options?: {
            overrideProvider?: ProviderType;
            overrideModel?: string;
        }
    ): Promise<string> {
        const agent = AGENTS[agentType];

        if (!agent) {
            throw new Error(`Unknown agent type: ${agentType}`);
        }

        const modelConfig = getModelForAgent(agentType, options?.overrideProvider, options?.overrideModel);
        const actualModel = modelConfig.model;
        console.log(`👁️ Running ${agent.name} with vision (${actualModel} via ${modelConfig.provider})${modelConfig.isAuto ? ' [AUTO]' : ''}...`);

        let autoFallbackConfig = undefined;
        if (modelConfig.isAuto) {
            const fallbackConf = getAgentAutoConfig(agentType).fallback;
            autoFallbackConfig = {
                fallbackProvider: fallbackConf.provider,
                fallbackModel: fallbackConf.model,
                allowFallback: true
            };
        }

        return this.executeWithRetry(
            async (client, provider) => {
                const activeModelConfig = getModelForAgent(agentType, provider, options?.overrideModel);
                const activeModel = activeModelConfig.model;

                // Create request params - BYTEZ only supports max_tokens, not max_completion_tokens
                const requestParams: any = {
                    model: activeModel,
                    messages: [
                        { role: "system", content: agent.systemPrompt },
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: `Here is the Blueprint for reference:\n\n${blueprintJson}\n\nPlease inspect the circuit image and verify it matches the Blueprint.`
                                },
                                {
                                    type: "image_url",
                                    image_url: { url: imageUrl }
                                }
                            ] as any
                        }
                    ],
                    temperature: agent.temperature
                };

                const response = await client.chat.completions.create(requestParams);

                const content = response.choices[0]?.message?.content || "";
                console.log(`✅ ${agent.name} completed vision analysis`);

                return content;
            },
            `${agent.name} (Vision)`,
            modelConfig.provider,
            autoFallbackConfig
        );
    }
}

/**
 * Sequential Assembly Line Orchestrator
 * Manages the flow: Conversational → BOM Generator → Code Generator → Circuit Verifier
 */
/**
 * Sequential Assembly Line Orchestrator
 * Manages the flow: Conversational → BOM Generator → Code Generator → Circuit Verifier
 * 
 * DB INTEGRATED VERSION
 */
import { ChatService } from "@/lib/db/chat";
import { ArtifactService } from "@/lib/db/artifacts";
import { ComponentService } from "@/lib/db/components";
import { ToolExecutor } from "./tool-executor";

export class AssemblyLineOrchestrator {
    private runner: AgentRunner;
    private chatId: string | null = null;

    constructor(chatId?: string) {
        this.runner = new AgentRunner();
        this.chatId = chatId || null;
    }

    private async getHistory() {
        if (this.chatId) {
            const dbMessages = await ChatService.getMessages(this.chatId);
            return dbMessages
                .map(m => {
                    let content = m.content;
                    const metadata = m.metadata as any;

                    // If content is empty but we have tool calls, reconstruct a description
                    // This prevents "all messages must have non-empty content" errors from the API
                    if ((!content || content.trim() === '') && metadata?.toolCalls?.length) {
                        content = `[Agent executed tool(s): ${metadata.toolCalls.map((t: any) => t.name).join(', ')}]`;
                    }

                    return {
                        role: m.role as "user" | "assistant" | "system",
                        content: content
                    };
                })
                .filter(m => m.content && m.content.trim() !== ''); // Double-check: removing any remaining empty messages
        }
        return [];
    }

    /**
     * Generate a concise chat title based on the first message
     */
    async generateTitle(userMessage: string): Promise<string> {
        console.log(`🏷️ Generating title for: "${userMessage.substring(0, 50)}..."`);

        try {
            const result = await this.runner.runAgent(
                'orchestrator',
                [
                    {
                        role: 'system',
                        content: `You are a project title generator for a hardware/IoT development platform.
                        
Generate a concise, descriptive title (3-6 words) that captures the essence of the user's project.

Guidelines:
- Focus on the main purpose or function (e.g., "Smart Home Temperature Monitor")  
- Include the key technology if relevant (e.g., "Arduino LED Matrix Display")
- Make it specific and descriptive, not generic
- Do NOT use quotes in your response
- Return ONLY the title, nothing else

Examples:
- "I want to build something to monitor my plants" → Plant Watering Monitor System
- "help me create a device that tracks my fitness" → Wearable Fitness Tracker
- "build an iot thermostat" → Smart WiFi Thermostat Controller`
                    },
                    { role: 'user', content: userMessage }
                ],
                { stream: false }
            );

            const title = result.response.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
            console.log(`🏷️ Generated title: ${title}`);
            return title;
        } catch (error) {
            console.error('❌ Title generation failed:', error);
            return 'New Hardware Project';
        }
    }

    /**
     * Step 1: Chat with dynamic agent selection based on intent
     */
    async chat(
        userMessage: string,
        onStream?: (chunk: string) => void,
        forceAgent?: string,
        onAgentDetermined?: (agent: { type: string; name: string; icon: string; intent: string }) => void,
        onToolCall?: (toolCall: ToolCall) => void,
        onKeyRotation?: (event: KeyRotationEvent) => void
    ): Promise<{
        response: string;
        isReadyToLock: boolean;
        agentType: string;
        agentName: string;
        agentIcon: string;
        intent: string;
        toolCalls?: ToolCall[];
        questions?: any;
        hasQuestions?: boolean;
        keyRotationEvent?: KeyRotationEvent | null;
    }> {
        // 1. Get History BEFORE adding new message (to determine if this is first message)
        const historyBeforeNewMessage = await this.getHistory();
        const messageCount = historyBeforeNewMessage.length;

        // 1.5 Load session provider/model preferences
        let overrideProvider: ProviderType | undefined;
        let overrideModel: string | undefined;
        
        if (this.chatId) {
            try {
                const { getSupabaseClient } = await import('@/lib/supabase/client');
                const supabase = getSupabaseClient();
                const { data: session } = await supabase
                    .from('chat_sessions')
                    .select('selected_provider, selected_model')
                    .eq('chat_id', this.chatId)
                    .single();

                if (session) {
                    overrideProvider = session.selected_provider as ProviderType | undefined;
                    overrideModel = session.selected_model || undefined;
                    
                    if (overrideProvider !== undefined && overrideProvider !== null) {
                        console.log(`🎛️ [Orchestrator] Session preferences: ${overrideProvider || 'AUTO'}${overrideModel ? ` / ${overrideModel}` : ''}`);
                        
                        // Validate provider/model combination
                        const validation = validateProviderModel(overrideProvider, overrideModel);
                        if (!validation.valid) {
                            console.warn(`⚠️ [Orchestrator] ${validation.error}, using fallback`);
                            overrideProvider = validation.fallback?.provider;
                            overrideModel = validation.fallback?.model;
                        }
                    }
                }
            } catch (error: any) {
                console.error(`❌ [Orchestrator] Failed to load session provider preferences:`, error.message);
                // Continue with defaults
            }
        }

        // 2. Determine agent to use
        let finalAgentType: AgentType;
        let intent = 'CHAT';

        if (forceAgent) {
            // User manually selected an agent
            finalAgentType = forceAgent as AgentType;
            intent = 'MANUAL';
            console.log(`👤 User forced agent: ${forceAgent}`);
        } else if (messageCount === 0) {
            // First message - use project initializer
            finalAgentType = 'projectInitializer';
            intent = 'INIT';
            console.log(`🚀 First message, using projectInitializer`);
        } else {
            // Stage-aware routing: pick from 2-3 eligible agents for the current stage
            console.log(`🎯 [Orchestrator] Stage-aware routing for: "${userMessage.substring(0, 50)}..."`);

            try {
                const projectState = await ProjectStateService.loadProjectState(this.chatId!);
                const stageConfig = STAGE_CONFIG[projectState.projectStage];

                if (projectState.autoOrchestration) {
                    // Build a focused prompt that only exposes eligible agents
                    const orchestratorPrompt = buildOrchestratorPrompt(userMessage, projectState);

                    const intentResult = await this.runner.runAgent(
                        'orchestrator',
                        [{ role: 'user', content: orchestratorPrompt }],
                        { 
                            stream: false,
                            overrideProvider,
                            overrideModel
                        }
                    );

                    const selectedAgent = intentResult.response.trim().toLowerCase() as AgentType;
                    console.log(`🎯 [Orchestrator] Stage '${projectState.projectStage}' — LLM picked: ${selectedAgent}`);

                    // Validate selection against eligible list, fallback if invalid
                    if (stageConfig.eligibleAgents.includes(selectedAgent)) {
                        finalAgentType = selectedAgent;
                        intent = `${projectState.projectStage.toUpperCase()}_STAGE`;
                    } else {
                        finalAgentType = stageConfig.eligibleAgents[0];
                        intent = 'FALLBACK';
                        console.warn(`⚠️ [Orchestrator] LLM selected ineligible agent '${selectedAgent}', using fallback: ${finalAgentType}`);
                    }

                    console.log(`🤖 [Orchestrator] Stage: ${projectState.projectStage} | Agent: ${finalAgentType}`);
                } else {
                    // Auto-orchestration off: default to first eligible agent for stage
                    finalAgentType = stageConfig.eligibleAgents[0];
                    intent = 'MANUAL_MODE';
                    console.log(`🔧 [Orchestrator] Manual mode — defaulting to: ${finalAgentType}`);
                }

            } catch (error) {
                console.error('[Orchestrator] Stage-aware routing failed, falling back to conversational:', error);
                finalAgentType = 'conversational';
                intent = 'CHAT';
            }
        }

        // 2.5 IMMEDIATELY notify client which agent is handling this request
        const agentConfig = AGENTS[finalAgentType];
        if (onAgentDetermined) {
            console.log(`📢 Sending early agent notification: ${agentConfig.name}`);
            onAgentDetermined({
                type: finalAgentType,
                name: agentConfig.name,
                icon: agentConfig.icon,
                intent: intent
            });
        }

        // 3. Persist User Message
        if (this.chatId) {
            const seq = await ChatService.getNextSequenceNumber(this.chatId);
            await ChatService.addMessage({
                chat_id: this.chatId,
                role: "user",
                content: userMessage,
                sequence_number: seq,
                intent: intent
            });
        }

        // 4. Get History (inclusive of new message)
        const history = await this.getHistory();

        // 5. Create ToolExecutor for this chat
        const toolExecutor = this.chatId ? new ToolExecutor(this.chatId) : null;

        // 6. Run Selected Agent with tool support
        const result = await this.runner.runAgent(
            finalAgentType,
            history,
            {
                stream: true,
                onStream,
                onToolCall: async (toolCall) => {
                    // Notify client about tool call via callback
                    if (onToolCall) {
                        console.log(`📢 Sending tool call notification: ${toolCall.name}`);
                        onToolCall(toolCall);
                    }

                    // Execute tool and RETURN the result (required for multi-turn loop)
                    if (toolExecutor) {
                        return await toolExecutor.executeToolCall(toolCall);
                    }
                    
                    // ponytail: Default result if no executor
                    return { success: true };
                },
                chatId: this.chatId || undefined,  // Pass chatId for context injection
                overrideProvider,  // NEW: Pass provider override from session
                overrideModel  // NEW: Pass model override from session
            }
        );

        const response = result.response;
        const toolCalls = result.toolCalls;

        console.log(`✅ [Orchestrator] Agent completed! Response length: ${response.length} chars, Tool calls: ${toolCalls.length}`);

        // ponytail: Don't persist empty responses - return error message instead
        if (response.length === 0 && toolCalls.length === 0) {
            console.error(`❌ [Orchestrator] Agent returned EMPTY response - aborting persistence`);
            
            return {
                response: "I apologize, but I encountered an issue generating a response. Please try rephrasing your message.",
                isReadyToLock: false,
                agentType: finalAgentType,
                agentName: agentConfig.name,
                agentIcon: agentConfig.icon,
                intent: `${intent}_ERROR`,
                toolCalls: [],
                questions: undefined,
                hasQuestions: false,
                keyRotationEvent: null
            };
        }

        if (response.length > 0) {
            console.log(`📝 [Orchestrator] First 150 chars: "${response.substring(0, 150)}..."`);
        }

        // 6.5 Parse questions from response
        const parsed = parseQuestions(response);
        if (parsed.hasQuestions) {
            console.log(`❓ [Orchestrator] Questions detected: ${parsed.questions?.questions.length} questions`);
        }

        // 6.6 Check for stage advancement (non-blocking, only if agent wrote an artifact)
        if (this.chatId && toolCalls.some((tc: ToolCall) => tc.name === 'write')) {
            ProjectStateService.checkAndAdvanceStage(this.chatId).then((advanced) => {
                if (advanced) {
                    console.log(`🎉 [Orchestrator] Stage advanced for chat: ${this.chatId}`);
                }
            }).catch((err: any) => {
                console.error('[Orchestrator] Stage advancement check failed:', err.message);
            });
        }

        // 6.6 Check for key rotation events and notify immediately
        const keyRotationEvent = KeyManager.getInstance().getAndClearLastEvent();
        if (keyRotationEvent && onKeyRotation) {
            console.log(`📢 Sending key rotation event: ${keyRotationEvent.type}`);
            onKeyRotation(keyRotationEvent);
        }

        // 7. Persist Assistant Response
        if (this.chatId) {
            try {
                console.log(`💾 [Orchestrator] Attempting to save assistant message:`, {
                    chatId: this.chatId,
                    role: 'assistant',
                    contentLength: response.length,
                    agentName: finalAgentType,
                    intent: intent
                });

                const seq = await ChatService.getNextSequenceNumber(this.chatId);
                console.log(`📊 [Orchestrator] Got sequence number: ${seq}`);

                const messagePayload = {
                    chat_id: this.chatId,
                    role: "assistant" as const,
                    content: parsed.text, // Store clean text without question JSON
                    agent_name: finalAgentType,
                    agent_id: finalAgentType, // NEW: Add agent_id for proper avatar display
                    sequence_number: seq,
                    intent: intent,
                    metadata: {
                        ...(toolCalls.length > 0 ? { toolCalls } : {}),
                        ...(parsed.hasQuestions ? { 
                            questions: parsed.questions,
                            hasQuestions: true 
                        } : {})
                    } as any
                };

                console.log(`📝 [Orchestrator] Message payload prepared:`, {
                    ...messagePayload,
                    content: `${messagePayload.content.substring(0, 50)}...` // Log first 50 chars only
                });

                const savedMessage = await ChatService.addMessage(messagePayload);
                console.log(`✅ [Orchestrator] Message saved successfully with ID: ${savedMessage.id}`);

                // Update last active
                console.log(`🔄 [Orchestrator] Updating session state...`);
                await ChatService.updateSession(this.chatId, {
                    current_agent: finalAgentType,
                    last_active_at: new Date().toISOString()
                });
                console.log(`✅ [Orchestrator] Session updated`);

                // 8. Trigger conversation summarization (non-blocking)
                // This runs in background and doesn't affect response time
                const summarizer = new ConversationSummarizer(this.chatId);
                summarizer.updateSummary('system').catch(err => {
                    console.error('[Orchestrator] Background summarization failed:', err);
                });
            } catch (error: any) {
                console.error(`❌ [Orchestrator] CRITICAL: Failed to save assistant message:`, {
                    error: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint,
                    chatId: this.chatId,
                    responseLength: response.length
                });
                // Re-throw to let caller know about the failure
                throw new Error(`Failed to persist assistant message: ${error.message}`);
            }
        } else {
            console.warn(`⚠️  [Orchestrator] No chatId provided, skipping message persistence`);
        }

        // Check if ready to lock
        const isReadyToLock = response.toLowerCase().includes("lock this design") ||
            response.toLowerCase().includes("shall we lock");

        // Return with agent metadata, tool calls, questions, and rotation event
        return {
            response: parsed.text, // Return clean text without question JSON
            isReadyToLock,
            agentType: finalAgentType,
            agentName: agentConfig.name,
            agentIcon: agentConfig.icon,
            intent,
            toolCalls, // NEW: Include tool calls for frontend
            questions: parsed.questions, // NEW: Include questions for frontend
            hasQuestions: parsed.hasQuestions, // NEW: Include questions flag
            keyRotationEvent // Include rotation event for client-side toasts (also sent via callback)
        };
    }

    /**
     * Step 2: Generate Blueprint (BOM Generator)
     */
    async generateBlueprint(): Promise<string> {
        const history = await this.getHistory();

        // Summarize conversation for BOM generator
        const summary = history
            .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
            .join("\n\n");

        let overrideProvider: ProviderType | undefined;
        let overrideModel: string | undefined;

        if (this.chatId) {
            try {
                const { getSupabaseClient } = await import('@/lib/supabase/client');
                const supabase = getSupabaseClient();
                const { data: session } = await supabase
                    .from('chat_sessions')
                    .select('selected_provider, selected_model')
                    .eq('chat_id', this.chatId)
                    .single();

                if (session) {
                    overrideProvider = session.selected_provider as ProviderType | undefined;
                    overrideModel = session.selected_model || undefined;
                }
            } catch (error) {
                console.error('[generateBlueprint] Failed to load session overrides:', error);
            }
        }

        const result = await this.runner.runAgent("bomGenerator", [
            { role: "user", content: `Based on this conversation, create the comprehensive BOM and Blueprint:\n\n${summary}` }
        ], {
            overrideProvider,
            overrideModel,
            chatId: this.chatId || undefined
        });

        const blueprintJson = result.response;

        if (this.chatId) {
            // Persist Artifact
            // Note: In real impl, parse JSON and insert into 'parts' table via ComponentService
            const artifact = await ArtifactService.createArtifact("system", {
                chat_id: this.chatId,
                type: 'bom',
                title: 'Autogenerated BOM'
            });

            await ArtifactService.createVersion({
                artifact_id: artifact.id,
                version_number: 1,
                content_json: JSON.parse(blueprintJson),
                change_summary: "Initial generation"
            });
        }

        return blueprintJson;
    }

    /**
     * Step 3: Generate Code (Code Generator)
     */
    async generateCode(blueprintJson: string, onStream?: (chunk: string) => void): Promise<string> {
        let overrideProvider: ProviderType | undefined;
        let overrideModel: string | undefined;

        if (this.chatId) {
            try {
                const { getSupabaseClient } = await import('@/lib/supabase/client');
                const supabase = getSupabaseClient();
                const { data: session } = await supabase
                    .from('chat_sessions')
                    .select('selected_provider, selected_model')
                    .eq('chat_id', this.chatId)
                    .single();

                if (session) {
                    overrideProvider = session.selected_provider as ProviderType | undefined;
                    overrideModel = session.selected_model || undefined;
                }
            } catch (error) {
                console.error('[generateCode] Failed to load session overrides:', error);
            }
        }

        const result = await this.runner.runAgent(
            "codeGenerator",
            [{ role: "user", content: `Here is the authorized Blueprint:\n\n${blueprintJson}\n\nGenerate the firmware code.` }],
            { 
                stream: true, 
                onStream,
                overrideProvider,
                overrideModel,
                chatId: this.chatId || undefined
            }
        );

        const code = result.response;

        if (this.chatId) {
            const artifact = await ArtifactService.createArtifact("system", {
                chat_id: this.chatId,
                type: 'code',
                title: 'Firmware'
            });

            await ArtifactService.createVersion({
                artifact_id: artifact.id,
                version_number: 1,
                content: code,
                change_summary: "Initial generation"
            });
        }

        return code;
    }

    /**
     * Step 4: Verify Circuit (Circuit Verifier)
     */
    async verifyCircuit(imageUrl: string, blueprintJson: string): Promise<string> {
        let overrideProvider: ProviderType | undefined;
        let overrideModel: string | undefined;

        if (this.chatId) {
            try {
                const { getSupabaseClient } = await import('@/lib/supabase/client');
                const supabase = getSupabaseClient();
                const { data: session } = await supabase
                    .from('chat_sessions')
                    .select('selected_provider, selected_model')
                    .eq('chat_id', this.chatId)
                    .single();

                if (session) {
                    overrideProvider = session.selected_provider as ProviderType | undefined;
                    overrideModel = session.selected_model || undefined;
                }
            } catch (error) {
                console.error('[verifyCircuit] Failed to load session overrides:', error);
            }
        }

        const inspectionResult = await this.runner.runVisionAgent(
            "circuitVerifier",
            imageUrl,
            blueprintJson,
            { overrideProvider, overrideModel }
        );

        // Note: Persist verification to 'circuit_verifications' table if needed

        return inspectionResult;
    }

    /**
     * Get conversation history
     */
    async getConversationHistory() {
        return this.getHistory();
    }

    /**
     * Reset conversation
     */
    reset() {
        // No-op for db-backed
    }
}