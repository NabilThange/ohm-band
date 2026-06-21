import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { parseMessageContent, splitMessageIntoSegments } from "@/lib/parsers"
import BOMCard from "./BOMCard"
import InlineCodeCard from "./InlineCodeCard"
import { CodeBlock } from "@/components/ui/code-block"
import { Message as UIMessage, MessageContent, MessageAvatar } from "@/components/ui/message"
import { getAgentIdentity, findAgentIdByName, AGENT_IDENTITIES } from "@/lib/agents/agent-identities"
import { QuestionComponent } from "./QuestionComponent"
import { formatAnswersForAgent } from "@/lib/agents/question-parser"

export default function Message({ role, children, metadata, artifacts }) {
    const isUser = role === "user"

    // Convert children to string for parsing
    let rawContent = typeof children === 'string' ? children : String(children || '')

    // Extract questions from metadata FIRST
    const questions = metadata?.questions
    const hasQuestions = metadata?.hasQuestions

    // Debug logging for questions
    console.log('[Message] 🔍 Message metadata:', { 
        hasQuestions, 
        questionsCount: questions?.questions?.length, 
        metadataKeys: Object.keys(metadata || {}),
        metadataFull: metadata  // Log full metadata to see what's there
    });

    // ponytail: If message has questions, strip the <QUESTIONS> tags from display
    // The parser already extracted them to metadata, so we don't want to render the JSON
    if (hasQuestions) {
        console.log('[Message] ⚠️ BEFORE strip, rawContent length:', rawContent.length);
        console.log('[Message] ⚠️ BEFORE strip, has <QUESTIONS>:', rawContent.includes('<QUESTIONS>'));
        rawContent = rawContent.replace(/<QUESTIONS>\s*[\s\S]*?\s*<\/QUESTIONS>/gi, '').trim();
        console.log('[Message] ✅ AFTER strip, rawContent length:', rawContent.length);
        console.log('[Message] ✅ AFTER strip, has <QUESTIONS>:', rawContent.includes('<QUESTIONS>'));
    } else {
        console.log('[Message] ℹ️ No questions in metadata, rawContent has <QUESTIONS>:', rawContent.includes('<QUESTIONS>'));
    }

    // Extract tool calls and agent info from metadata
    const toolCalls = metadata?.toolCalls || []

    // Try to get agentId from multiple sources
    // Priority: metadata.agentId > metadata.agent_id > agent_name (from message object)
    let agentId = metadata?.agentId || metadata?.agent_id

    // If no agentId in metadata, try to infer from agent_name
    // This handles messages that have agent_name but no explicit agentId
    if (!agentId && metadata?.agent_name && metadata.agent_name !== 'thinking...') {
        // Try direct match first (if agent_name is already an ID like "conversational")
        if (metadata.agent_name in AGENT_IDENTITIES) {
            agentId = metadata.agent_name
        } else {
            // Try reverse lookup by display name
            agentId = findAgentIdByName(metadata.agent_name)
        }
    }

    // Get agent identity for avatar and name
    const agentIdentity = getAgentIdentity(agentId)

    // Debug logging
    if (!isUser && toolCalls.length > 0) {
        console.log('[Message] 📦 Message has tool calls:', toolCalls.length, toolCalls);
    }

    // For user messages, we just render the text. 
    // For AI messages, we handle parsing inside the render method to support sequential segments.
    const cleanedText = isUser ? rawContent : null;


    return (
        <UIMessage from={isUser ? "user" : "assistant"} className="mb-4">
            {!isUser && (
                <MessageAvatar
                    src={agentIdentity.avatar}
                    name={agentIdentity.name}
                    fallback={agentIdentity.icon}
                />
            )}
            <MessageContent variant={isUser ? "contained" : "flat"}>
                {isUser ? (
                    // User messages: render with Markdown support
                    <div className="prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-p:my-1.5 prose-pre:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 text-foreground [&_*]:text-foreground dark:prose-invert">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                                code({ node, inline, className, children, ...props }) {
                                    return (
                                        <code
                                            className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs"
                                            {...props}
                                        >
                                            {children}
                                        </code>
                                    )
                                },
                                a({ node, children, ...props }) {
                                    return (
                                        <a
                                            className="text-primary hover:text-primary/80 hover:underline"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            {...props}
                                        >
                                            {children}
                                        </a>
                                    )
                                },
                            }}
                        >
                            {cleanedText}
                        </ReactMarkdown>
                    </div>
                ) : (
                    // AI messages: render with Markdown + BOM Card (Sequential Rendering)
                    <div className="flex flex-col gap-2">
                        {(() => {
                            // 1. First parse artifacts (BOM, Context) and get cleaned text (removes XML containers)
                            // This preserves Markdown code blocks in the text for the next step.
                            const { cleanedText: textWithCode, bomData, isStreamingBOM } = parseMessageContent(rawContent);

                            // 2. Split the text into segments (Text vs Code CodeBlocks)
                            const segments = splitMessageIntoSegments(textWithCode);

                            return (
                                <>
                                    {segments.map((segment, index) => {
                                        if (segment.type === 'text') {
                                            return (
                                                <div key={index} className="prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-p:my-1.5 prose-pre:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 text-foreground [&_*]:text-foreground dark:prose-invert">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        rehypePlugins={[rehypeRaw]}
                                                        components={{
                                                            // Customize code blocks - inline only (since block code is handled by segment.type === 'code')
                                                            code({ node, inline, className, children, ...props }) {
                                                                // If it's a block code block that somehow survived slicing (shouldn't happen if regex matches), 
                                                                // or just inline code.
                                                                // Since splitMessageIntoSegments catches ```...```, mostly this will be inline `code`.
                                                                return (
                                                                    <code
                                                                        className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs"
                                                                        {...props}
                                                                    >
                                                                        {children}
                                                                    </code>
                                                                )
                                                            },
                                                            a({ node, children, ...props }) {
                                                                return (
                                                                    <a
                                                                        className="text-primary hover:text-primary/80 hover:underline"
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        {...props}
                                                                    >
                                                                        {children}
                                                                    </a>
                                                                )
                                                            },
                                                        }}
                                                    >
                                                        {segment.content}
                                                    </ReactMarkdown>
                                                </div>
                                            );
                                        } else if (segment.type === 'code' && segment.data) {
                                            return (
                                                <CodeBlock
                                                    key={index}
                                                    files={[segment.data]}
                                                    projectName="Generated Code"
                                                    onViewAll={() => {
                                                        window.dispatchEvent(new CustomEvent('open-code-drawer', {
                                                            detail: { files: [segment.data], projectName: "Generated Code" }
                                                        }));
                                                    }}
                                                />
                                            );
                                        }
                                        return null;
                                    })}

                                    {isStreamingBOM && (
                                        <div className="my-4 overflow-hidden rounded-xl border border-dashed border-border bg-muted/50 p-8 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="relative h-10 w-10">
                                                    <div className="absolute inset-0 animate-ping rounded-full bg-primary/10"></div>
                                                    <div className="relative flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                        <div className="h-4 w-4 rounded-sm border-2 border-current border-t-transparent animate-spin"></div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-foreground">Building Bill of Materials...</p>
                                                    <p className="text-xs text-muted-foreground">Analyzing components and estimating costs</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {bomData && <BOMCard data={bomData} />}

                                    {/* BOM Card - shown inline when BOM tool call is present */}
                                    {toolCalls.length > 0 && (() => {
                                        // First check if THIS message has a BOM tool call
                                        const bomToolCall = toolCalls.find(tc => {
                                            const toolName = tc.function?.name || tc.name;
                                            // New tool: write with artifact_type='bom'
                                            if (toolName === 'write') {
                                                const args = tc.function?.arguments || tc.arguments;
                                                const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
                                                return parsedArgs?.artifact_type === 'bom';
                                            }
                                            // Legacy tool: update_bom
                                            return toolName === 'update_bom';
                                        });

                                        // Only show BOM if THIS message created it
                                        if (!bomToolCall) {
                                            return null;
                                        }

                                        // Prefer fresh database artifact over stale tool call data
                                        const bomFromDatabase = artifacts?.bom?.version?.content_json;
                                        
                                        if (bomFromDatabase) {
                                            console.log('[Message] 📦 Using BOM from database artifact (fresh data)');
                                            return <BOMCard data={bomFromDatabase} />;
                                        }
                                        
                                        // Fallback: Use tool call data
                                        try {
                                            console.log('[Message] 🔍 Using BOM from tool call (fallback - may have stale data)');

                                            // Extract arguments
                                            let bomArgs = bomToolCall.function?.arguments || bomToolCall.arguments;

                                            // Parse if string
                                            let parsedBomData = bomArgs;
                                            if (typeof bomArgs === 'string') {
                                                try {
                                                    parsedBomData = JSON.parse(bomArgs);
                                                } catch (err) {
                                                    console.error('[Message] ❌ Failed to parse BOM arguments string:', err);
                                                    return null;
                                                }
                                            }

                                            // Extract content from new tool format
                                            const bomData = parsedBomData?.content || parsedBomData;

                                            console.log('[Message] 📄 Parsed BOM Data:', bomData ? 'Object' : 'Null');

                                            if (bomData && bomData.components) {
                                                // ponytail: Map DB field names (component) to UI field names (name) but preserve all price fields
                                                // Let BOMCard's getComponentPrice() handle price field resolution
                                                const mappedBomData = {
                                                    ...bomData,
                                                    components: bomData.components.map(c => ({
                                                        ...c, // Keep ALL original fields (unitCost, lineCost, etc.)
                                                        name: c.component || c.name, // Support both field names
                                                        // Don't override price fields - let getComponentPrice() handle fallbacks
                                                    }))
                                                };
                                                
                                                console.log('[Message] 📦 Rendering BOMCard with', mappedBomData.components.length, 'components');
                                                return <BOMCard data={mappedBomData} />;
                                            } else {
                                                console.warn('[Message] ⚠️ BOM data missing "components" array:', bomData);
                                            }
                                        } catch (e) {
                                            console.error('[Message] 💥 Unexpected error rendering BOM card:', e);
                                        }
                                        
                                        return null;
                                    })()}

                                    {/* Code Card - shown inline when code tool calls are present */}
                                    {toolCalls.length > 0 && (() => {
                                        // Find code tool calls - support both new (write) and legacy (add_code_file) tools
                                        const codeToolCalls = toolCalls.filter(tc => {
                                            const toolName = tc.function?.name || tc.name;
                                            // New tool: write with artifact_type='code'
                                            if (toolName === 'write') {
                                                const args = tc.function?.arguments || tc.arguments;
                                                const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
                                                return parsedArgs?.artifact_type === 'code';
                                            }
                                            // Legacy tool: add_code_file
                                            return toolName === 'add_code_file';
                                        });

                                        if (codeToolCalls.length > 0) {
                                            try {
                                                const codeFiles = codeToolCalls.map(tc => {
                                                    const args = tc.function?.arguments || tc.arguments;
                                                    const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
                                                    
                                                    // Handle new tool format (write with artifact_type='code')
                                                    if (parsedArgs.artifact_type === 'code') {
                                                        return {
                                                            filename: parsedArgs.path,
                                                            content: parsedArgs.content
                                                        };
                                                    }
                                                    
                                                    // Handle legacy format (add_code_file)
                                                    return {
                                                        filename: parsedArgs.filename,
                                                        content: parsedArgs.content
                                                    };
                                                }).filter(f => f.filename && f.content);

                                                if (codeFiles.length > 0) {
                                                    console.log('[Message] 💻 Rendering InlineCodeCard from tool calls:', codeFiles.length, 'files');
                                                    return <InlineCodeCard files={codeFiles} projectName="Generated Code" />;
                                                }
                                            } catch (e) {
                                                console.error('[Message] Failed to parse code data from tool calls:', e);
                                            }
                                        }
                                        return null;
                                    })()}

                                    {/* Drawer Link Buttons - shown after AI responses with tool calls */}
                                    {toolCalls.length > 0 && (() => {
                                        const renderedDrawers = new Set();
                                        return (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {toolCalls.map((toolCall, idx) => {
                                                    const toolName = toolCall.function?.name || toolCall.name;
                                                    
                                                    // Handle new 'write' tool - map artifact_type to drawer
                                                    if (toolName === 'write') {
                                                        const args = toolCall.function?.arguments || toolCall.arguments;
                                                        const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
                                                        const artifactType = parsedArgs?.artifact_type;
                                                        
                                                        const artifactDrawerMap = {
                                                            'context': { label: 'Open Context Drawer', drawer: 'context' },
                                                            'mvp': { label: 'Open Context Drawer', drawer: 'context' },
                                                            'prd': { label: 'Open Context Drawer', drawer: 'context' },
                                                            'bom': { label: 'Open BOM Drawer', drawer: 'bom' },
                                                            'code': { label: 'Open Code Drawer', drawer: 'code' },
                                                            'wiring': { label: 'Open Wiring Drawer', drawer: 'wiring' },
                                                            'budget': { label: 'Open Budget Drawer', drawer: 'budget' },
                                                            'enclosure': { label: 'Open Enclosure Drawer', drawer: 'enclosure' },
                                                        };
                                                        
                                                        const config = artifactDrawerMap[artifactType];
                                                        if (!config) return null;
                                                        
                                                        // Deduplicate by drawer type
                                                        if (renderedDrawers.has(config.drawer)) return null;
                                                        renderedDrawers.add(config.drawer);
                                                        
                                                        return (
                                                            <button
                                                                key={idx}
                                                                onClick={() => {
                                                                    console.log('[Message] 💆 Button clicked! Opening drawer:', config.drawer, 'for artifact:', artifactType);
                                                                    const event = new CustomEvent('open-drawer', {
                                                                        detail: { drawer: config.drawer }
                                                                    });
                                                                    console.log('[Message] 📤 Dispatching event:', event);
                                                                    window.dispatchEvent(event);
                                                                    console.log('[Message] ✅ Event dispatched successfully');
                                                                }}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent hover:bg-accent/80 text-accent-foreground transition-colors border border-border cursor-pointer"
                                                            >
                                                                {config.label} →
                                                            </button>
                                                        );
                                                    }
                                                    
                                                    // Handle legacy tools
                                                    const drawerMap = {
                                                        'update_context': { label: 'Open Context Drawer', drawer: 'context' },
                                                        'update_mvp': { label: 'Open Context Drawer', drawer: 'context' },
                                                        'update_prd': { label: 'Open Context Drawer', drawer: 'context' },
                                                        'update_bom': { label: 'Open BOM Drawer', drawer: 'bom' },
                                                        'add_code_file': { label: 'Open Code Drawer', drawer: 'code' },
                                                        'update_wiring': { label: 'Open Wiring Drawer', drawer: 'wiring' },
                                                        'update_budget': { label: 'Open Budget Drawer', drawer: 'budget' },
                                                    };

                                                    const config = drawerMap[toolName];
                                                    if (!config) return null;

                                                    // Deduplicate by drawer type
                                                    if (renderedDrawers.has(config.drawer)) return null;
                                                    renderedDrawers.add(config.drawer);

                                                    return (
                                                        <button
                                                            key={idx}
                                                            onClick={() => {
                                                                console.log('[Message] 💆 Button clicked! Opening drawer:', config.drawer, 'for tool:', toolName);
                                                                const event = new CustomEvent('open-drawer', {
                                                                    detail: { drawer: config.drawer }
                                                                });
                                                                console.log('[Message] 📤 Dispatching event:', event);
                                                                window.dispatchEvent(event);
                                                                console.log('[Message] ✅ Event dispatched successfully');
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent hover:bg-accent/80 text-accent-foreground transition-colors border border-border cursor-pointer"
                                                        >
                                                            {config.label} →
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}

                                    {/* Question Component - shown when agent needs clarification */}
                                    {hasQuestions && questions && (
                                        <QuestionComponent
                                            questions={questions.questions}
                                            messageId={metadata?.id}
                                            initialAnswers={metadata?.answers || null}
                                            onSubmit={(answers) => {
                                                // Format answers and send as new message
                                                const formattedAnswers = formatAnswersForAgent(
                                                    questions.questions,
                                                    answers
                                                );
                                                
                                                // Dispatch event to send answers back to agent
                                                window.dispatchEvent(new CustomEvent('send-question-answers', {
                                                    detail: { answers: formattedAnswers }
                                                }));
                                            }}
                                        />
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}
            </MessageContent>
        </UIMessage>
    )
}
