# Multi-Turn Agent Loop Architecture Analysis

## Executive Summary

**Current Issue**: OpenAI's `gpt-oss-120b` returns only an `open_drawer` tool call with no text response and no subsequent `write` tool call. This is a **model limitation**, not a framework bug.

**Root Cause**: The current architecture enforces a **1 user message → 1 AI response** pattern. When a model calls a tool, that tool result is fed back to the model, but the model's turn effectively ends after the first tool call.

**Solution**: Implement an **autonomous agent loop** where the AI can take multiple consecutive turns, calling tools and refining its output until it explicitly signals completion.

---

## 1. Current Tool-Calling Flow

### Architecture Overview

```
User Message
    ↓
API Route (app/api/agents/chat/route.ts)
    ↓
AssemblyLineOrchestrator.chat()
    ↓
AgentRunner.runAgent()
    ↓
runNonStreamingAgentWithTools() OR runStreamingAgentWithTools()
    ↓
OpenAI API call with tools
    ↓
[Tool calls detected]
    ↓
onToolCall callback → ToolExecutor.executeToolCall()
    ↓
[Tool results returned, but AI turn ends here]
    ↓
Response returned to user
```

### Key Files

1. **`app/api/agents/chat/route.ts`**
   - Entry point for chat requests
   - Calls `orchestrator.chat()`
   - Handles streaming responses

2. **`lib/agents/orchestrator.ts`**
   - `AssemblyLineOrchestrator.chat()` (lines 681-978)
   - Determines which agent to use
   - Calls `AgentRunner.runAgent()`
   - Single call, returns once

3. **`lib/agents/orchestrator.ts`** (AgentRunner class)
   - `runAgent()` method (lines 189-343)
   - `runNonStreamingAgentWithTools()` (lines 348-399)
   - `runStreamingAgentWithTools()` (lines 404-488)
   - Makes ONE OpenAI API call
   - If tool calls are present, executes them via callback
   - Returns immediately after tool execution

4. **`lib/agents/tool-executor.ts`**
   - `ToolExecutor.executeToolCall()` (lines 256-312)
   - Executes individual tools
   - Returns tool results
   - **But these results don't automatically trigger another AI turn**

### Where the Single-Turn Limitation Exists

**Location**: `lib/agents/orchestrator.ts`, lines 857-877

```typescript
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

            if (toolExecutor) {
                await toolExecutor.executeToolCall(toolCall);
            }
        },
        chatId: this.chatId || undefined,
        overrideProvider,
        overrideModel
    }
);
```

**The problem**: `runAgent` is called **once**, executes tools via callback, then returns. There's no loop to give the model another turn after tool execution.

---

## 2. Why the Model Stops After a Tool Call

### Model Behavior

When an LLM is given tools:
1. It can return **text content**, **tool calls**, or **both**
2. OpenAI models typically:
   - Call tools when they need information or actions
   - Return text when they're ready to respond to the user
3. **The model doesn't know it will get another turn**

### Current Flow

```
User: "Create a new project called MyApp"
    ↓
AI: [Calls open_drawer tool]
    ↓ 
Tool executed: { success: true, drawer: 'context' }
    ↓
[Response returned to user - AI never gets to see the tool result]
```

The AI has no chance to:
- See the tool result
- Decide what to do next
- Call additional tools
- Write the final response

### Why It's Model-Specific

**Some models** (like Claude, GPT-4) are trained to:
- Return both tool calls AND text in one response
- Chain multiple actions in a single turn

**Other models** (like `gpt-oss-120b`) are trained to:
- Return ONE action per turn
- Expect another turn after each tool call

---

## 3. Proposed Multi-Turn Agent Loop Architecture

### Concept

Instead of `1 user message → 1 AI response`, implement:

```
1 user message → N AI turns → final response

Turn 1: AI calls tool_a
Turn 2: AI sees tool_a result, calls tool_b  
Turn 3: AI sees tool_b result, calls tool_c
Turn 4: AI sees tool_c result, writes final text response
```

### High-Level Design

```typescript
async function agentLoop(
    userMessage: string,
    maxIterations: number = 10
): Promise<string> {
    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
    ];
    
    let iteration = 0;
    
    while (iteration < maxIterations) {
        iteration++;
        
        // AI gets a turn
        const response = await callAI(messages);
        
        // Check if AI called tools
        if (response.tool_calls.length > 0) {
            // Execute tools
            for (const toolCall of response.tool_calls) {
                const result = await executeTool(toolCall);
                
                // Add tool result to conversation
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result)
                });
            }
            
            // Continue loop - give AI another turn
            continue;
        }
        
        // No tools called - AI provided final response
        if (response.content) {
            return response.content;
        }
        
        // Edge case: no tools, no content
        throw new Error("AI returned neither tools nor content");
    }
    
    throw new Error(`Max iterations (${maxIterations}) reached`);
}
```

---

## 4. Implementation Plan

### Phase 1: Core Agent Loop

**Files to modify:**
- `lib/agents/orchestrator.ts` - `AgentRunner.runAgent()`

**Changes:**
1. Wrap the OpenAI API call in a loop
2. After tool execution, append tool results to message history
3. Give the AI another turn
4. Stop when AI returns text without tool calls

**Code changes:**

```typescript
// lib/agents/orchestrator.ts
private async runNonStreamingAgentWithTools(
    client: OpenAI,
    agent: typeof AGENTS[AgentType],
    model: string,
    messages: Array<{ role: string; content: string }>,
    tools: any[],
    onToolCall?: (toolCall: ToolCall) => Promise<any>
): Promise<{ response: string; toolCalls: ToolCall[] }> {
    const allToolCalls: ToolCall[] = [];
    let conversationMessages = [...messages]; // Copy to avoid mutating original
    const maxTurns = 10; // ponytail: ceiling is hard loop limit, upgrade path is configurable per-agent
    
    for (let turn = 0; turn < maxTurns; turn++) {
        console.log(`🔄 [AgentRunner] Turn ${turn + 1}/${maxTurns}`);
        
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

        const response = await client.chat.completions.create(requestParams);
        const message = response.choices[0]?.message;

        // Check for tool calls
        if (message?.tool_calls && message.tool_calls.length > 0) {
            console.log(`🔧 [AgentRunner] AI called ${message.tool_calls.length} tools`);
            
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
                    allToolCalls.push(toolCall);

                    // Execute tool
                    let toolResult: any;
                    if (onToolCall) {
                        console.log(`🔧 Executing tool: ${toolCall.name}`);
                        toolResult = await onToolCall(toolCall);
                    } else {
                        toolResult = { success: true };
                    }

                    // Add tool result to conversation
                    conversationMessages.push({
                        role: "tool",
                        tool_call_id: tc.id,
                        content: JSON.stringify(toolResult)
                    } as any);
                }
            }
            
            // Continue loop - give AI another turn
            continue;
        }

        // No tool calls - AI provided final response
        const finalContent = message?.content || "";
        console.log(`✅ [AgentRunner] AI provided final response (${finalContent.length} chars)`);
        return { response: finalContent, toolCalls: allToolCalls };
    }

    throw new Error(`Agent loop exceeded max turns (${maxTurns})`);
}
```

### Phase 2: Streaming Support

**Challenge**: Streaming requires handling partial responses

**Solution**: Stream text chunks as they arrive, but pause streaming during tool execution

**Implementation**:
1. Stream AI response as usual
2. If tool calls detected, pause stream
3. Execute tools
4. Resume streaming with next AI turn
5. Continue until final response

### Phase 3: Stop Conditions

**Primary condition**: AI returns text without tool calls

**Secondary conditions**:
- Max iterations reached (10 turns)
- AI returns empty response (error)
- Tool execution fails (error)
- User cancels request (abort signal)

**Explicit completion signal** (optional enhancement):
- Add a special tool: `complete_task(reason: string)`
- AI calls this when truly done
- More explicit than implicit "no tool calls" check

### Phase 4: UI Implications

**What changes**:
- User sees multiple "tool executing" indicators
- Progress indication: "Turn 3/10"
- Tool results can be shown in real-time

**What stays the same**:
- Final response is still streamed to user
- Chat history structure unchanged
- Database schema unchanged

---

## 5. State Management

### Conversation Context

**Current**: Messages array is static for each `runAgent` call

**New**: Messages array grows during the loop as tool results are added

**Structure**:
```typescript
[
    { role: "system", content: "..." },
    { role: "user", content: "Create MyApp" },
    { role: "assistant", content: "", tool_calls: [...] },  // Turn 1
    { role: "tool", tool_call_id: "call_1", content: "{...}" },
    { role: "assistant", content: "", tool_calls: [...] },  // Turn 2
    { role: "tool", tool_call_id: "call_2", content: "{...}" },
    { role: "assistant", content: "I've created..." }  // Turn 3 - final
]
```

### Token Budget

**Risk**: Long loops consume many tokens

**Mitigation**:
1. **Max iterations limit**: Hard cap at 10 turns (ponytail: prevents runaway costs)
2. **Token counting**: Track cumulative tokens, stop if approaching context limit
3. **Summarization**: After N turns, summarize tool results to reduce context size

---

## 6. Infinite Loop Protections

### Hard Limits

1. **Max iterations**: 10 turns per user message
2. **Time limit**: 60 seconds total execution time
3. **Token limit**: Stop if cumulative tokens > 90% of model's context window

### Detection

**Loop detection**: If AI calls the same tool with the same arguments twice in a row, abort

**Example**:
```typescript
const toolCallHistory: string[] = [];

// In loop:
const callSignature = `${toolCall.name}:${JSON.stringify(toolCall.arguments)}`;
if (toolCallHistory.includes(callSignature)) {
    throw new Error(`Loop detected: repeated call to ${toolCall.name}`);
}
toolCallHistory.push(callSignature);
```

### Graceful Degradation

If limits are hit:
1. Log warning
2. Return partial response with explanation
3. User can retry or rephrase

---

## 7. Error Handling & Recovery

### Tool Execution Failures

**Current**: Tool error likely crashes the agent

**New**: Tool error is fed back to AI, which can:
- Retry with different arguments
- Try an alternative approach
- Explain the error to the user

**Implementation**:
```typescript
try {
    toolResult = await onToolCall(toolCall);
} catch (error: any) {
    console.error(`❌ Tool ${toolCall.name} failed:`, error.message);
    toolResult = {
        success: false,
        error: error.message
    };
}

// AI sees the error and can adapt
conversationMessages.push({
    role: "tool",
    tool_call_id: tc.id,
    content: JSON.stringify(toolResult)
});
```

### Model Errors

**Rate limits**: Existing `executeWithRetry` mechanism handles this

**Invalid responses**: If AI returns neither tools nor text, treat as error and abort loop

---

## 8. Testing Strategy

### Unit Tests

1. **Single tool call**: Verify AI can call one tool and respond
2. **Multiple sequential tools**: AI calls tool A, then tool B, then responds
3. **Tool error recovery**: AI receives tool error and adapts
4. **Max iterations**: Loop stops at limit
5. **Loop detection**: Repeated tool call triggers abort

### Integration Tests

1. **End-to-end flow**: Real chat request → multi-turn loop → final response
2. **Streaming**: Verify streaming works across multiple turns
3. **Database persistence**: All turns are logged correctly

### Model Compatibility Tests

Test with different models:
- `openai/gpt-4o` - Should work, may do fewer turns (does more in one turn)
- `openai/gpt-oss-120b` - Primary target, expect multiple turns
- `anthropic/claude-3.5-sonnet` - Should work, may do fewer turns

---

## 9. Risks & Tradeoffs

### Risks

1. **Increased latency**: Multiple API calls take longer
   - *Mitigation*: Stream partial results, show progress

2. **Higher costs**: More tokens consumed
   - *Mitigation*: Hard caps on iterations and tokens

3. **Complexity**: More states to manage
   - *Mitigation*: Clear logging, good tests

4. **Infinite loops**: AI gets stuck
   - *Mitigation*: Multiple safety nets (max iterations, loop detection, timeouts)

### Tradeoffs

**Before**: Fast, predictable, but limited capability

**After**: Slower, more variable, but much more capable

**ponytail**: This is necessary complexity - the alternative is models that can't complete multi-step tasks.

---

## 10. Rollout Plan

### Phase 1: Non-streaming proof-of-concept (Week 1)

- Implement basic loop in `runNonStreamingAgentWithTools`
- Add max iterations limit
- Test with `gpt-oss-120b`
- Verify tool calls work correctly

### Phase 2: Safety features (Week 1-2)

- Add loop detection
- Add token budget tracking  
- Add timeout protection
- Comprehensive error handling

### Phase 3: Streaming support (Week 2)

- Adapt `runStreamingAgentWithTools`
- Handle streaming across multiple turns
- UI progress indicators

### Phase 4: Optimization (Week 3)

- Token usage optimization
- Response time improvements
- Model-specific tuning

### Phase 5: Full rollout (Week 4)

- Enable for all users
- Monitor costs and performance
- Iterate based on feedback

---

## 11. Monitoring & Observability

### Metrics to Track

1. **Average turns per request**: How many turns do agents typically need?
2. **Tool call distribution**: Which tools are called most often?
3. **Completion rate**: % of requests that complete vs hit limits
4. **Average latency**: Time from user message to final response
5. **Token usage**: Tokens per request (before/after)
6. **Error rate**: % of requests that fail

### Logging

```typescript
console.log(`🔄 [AgentLoop] Turn ${turn}/${maxTurns}`);
console.log(`🔧 [AgentLoop] Tool calls: ${toolCalls.length}`);
console.log(`📊 [AgentLoop] Tokens used: ${tokenCount}`);
console.log(`✅ [AgentLoop] Completed in ${turn} turns`);
```

---

## 12. Alternative Approaches Considered

### Approach A: Prompt Engineering

**Idea**: Train model to do everything in one turn

**Pros**: No architecture changes

**Cons**: Doesn't work - `gpt-oss-120b` is what it is

**Verdict**: Not viable

### Approach B: Model Switching

**Idea**: Switch to a model that handles multi-step in one turn

**Pros**: Simple

**Cons**: Defeats purpose of supporting multiple models

**Verdict**: Defeats the goal

### Approach C: Manual Chaining

**Idea**: User manually sends follow-up messages

**Pros**: No automation needed

**Cons**: Terrible UX

**Verdict**: Not acceptable

### Approach D: Agent Loop (Proposed)

**Idea**: Autonomous multi-turn loop

**Pros**: Works with any model, great UX

**Cons**: More complex

**Verdict**: Best option

---

## 13. Conclusion

### Problem

`gpt-oss-120b` returns only tool calls without final text because the framework only gives it one turn.

### Solution

Implement an autonomous agent loop where the AI gets multiple consecutive turns until it signals completion (by returning text without tool calls).

### Impact

- ✅ Fixes the immediate issue with `gpt-oss-120b`
- ✅ Makes the system more capable for all models
- ✅ Enables complex multi-step workflows
- ⚠️ Increases latency and costs (manageable with limits)
- ⚠️ Adds complexity (manageable with good testing)

### Recommendation

**Proceed with implementation**. This is a necessary evolution to support the full range of LLM tool-calling patterns. The tradeoffs are acceptable given the capability gains.

---

## Appendix: Code Locations Reference

### Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `app/api/agents/chat/route.ts` | API entry point | 1-91 |
| `lib/agents/orchestrator.ts` | Main orchestrator | 681-978 |
| `lib/agents/orchestrator.ts` | AgentRunner class | 96-488 |
| `lib/agents/tool-executor.ts` | Tool execution | 256-312 |

### Key Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `AssemblyLineOrchestrator.chat()` | orchestrator.ts:681 | Main chat entry point |
| `AgentRunner.runAgent()` | orchestrator.ts:189 | Agent execution |
| `runNonStreamingAgentWithTools()` | orchestrator.ts:348 | Non-streaming tools |
| `runStreamingAgentWithTools()` | orchestrator.ts:404 | Streaming tools |
| `ToolExecutor.executeToolCall()` | tool-executor.ts:256 | Execute individual tool |

### Where to Make Changes

**Primary target**: `lib/agents/orchestrator.ts`, lines 348-399 (`runNonStreamingAgentWithTools`)

**Secondary target**: `lib/agents/orchestrator.ts`, lines 404-488 (`runStreamingAgentWithTools`)

**No changes needed**: `tool-executor.ts` (tool execution logic is fine)

**No changes needed**: `app/api/agents/chat/route.ts` (API route is fine)
