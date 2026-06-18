# Retry Cascade Diagnosis: The 148-Second Delay

## The Problem

A tool schema validation error triggers a **full provider fallback cascade**, adding 148+ seconds to requests even when the primary model is working fine and just needs a correction prompt.

## Error Flow

```
User message → Orchestrator → runAgent → runNonStreamingAgentWithTools → Tool call
→ ToolExecutor.executeToolCall (line 270) → open_drawer handler (line 305)
→ Returns {success: true, action: 'open_drawer', drawer: toolCall.arguments.drawer}
→ But if drawer value is invalid (e.g. "mvp" instead of "context"), validation fails SOMEWHERE
→ Error propagates back up
→ Caught at orchestrator.ts:420 (tool execution error handler)
→ Returns {success: false, error: error.message} as tool result
→ Tool result added to conversation history
→ Agent loop continues (line 440)
→ LLM sees the error and... what? Another turn? Or exit?
```

## The Mystery

**Where does the validation error actually come from?**

The error message in logs says:
```
Tool call validation failed: parameters for tool open_drawer did not match schema: 
errors: [`/drawer`: value must be one of "context", "bom", "code", "wiring", "budget", "enclosure"]
```

But this validation doesn't exist in the codebase:
- ✅ `ToolExecutor.executeToolCall` (line 270-363) has NO schema validation
- ✅ `open_drawer` handler (line 305-310) just returns whatever was passed
- ✅ API route (app/api/agents/chat/route.ts) has NO validation
- ✅ No grep matches for "did not match schema"

**Hypothesis**: The OpenAI SDK or provider is validating against the tool schema before sending to the model, throwing an error that triggers the catch block at line 420.

## Current Retry Logic (lines 309-338)

```typescript
} catch (error: any) {
    // ponytail: If tool calling failed and we're not already using fallback, retry with reliable models
    const isToolError = error.message?.toLowerCase().includes('function') || 
                       error.message?.toLowerCase().includes('tool');
                       
    if (needsTools && isToolError) {
        // Try fallback models in order
        for (const fallback of fallbackOptions) {
            if (actualModel === fallback.model) continue; // Skip if already using this model
            
            console.warn(`⚠️ [Orchestrator] Tool calling failed with ${actualModel}, retrying with ${fallback.model}...`);
            console.warn(`⚠️ Original error: ${error.message}`);
            
            try {
                return await this.executeWithRetry(
                    async (client) => {
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
```

**Problem**: This catch block happens at the **outer runAgent call**, not inside the tool execution loop. By the time it fires:
1. The agent has already made 2-3 successful tool calls (write context, write mvp)
2. The agent loop is on turn 3
3. The error was for a SINGLE tool call in that turn
4. But now you're retrying the ENTIRE agent call with a different model

**Cost**: 
- Full `executeWithRetry` cascade (all keys, all providers) = ~30-60s
- Then try second fallback = another ~30-60s
- Then rethrow = original model already wasted time

## The Missing Piece: Self-Correction Loop

**Where it should happen**: Inside the agent loop at lines 405-444

**Current logic** (lines 418-428):
```typescript
} catch (error: any) {
    console.error(`❌ Tool ${toolCall.name} failed:`, error.message);
    toolResult = {
        success: false,
        error: error.message
    };
}
```

This **catches the error**, wraps it in a tool result, and **continues the loop**. That's the self-correction opportunity! The LLM sees:
```json
{
  "role": "tool",
  "tool_call_id": "call_abc123",
  "content": "{\"success\": false, \"error\": \"parameters for tool open_drawer did not match schema: ...\"}"
}
```

And can make another tool call with corrected parameters.

**But**: If the LLM doesn't self-correct (returns text instead of tool calls), the loop exits, and THEN the outer catch fires and triggers the provider cascade.

## The Hinge Point

**Line 447-449** (agent loop exit condition):
```typescript
// No tool calls - AI provided final response
const finalContent = message?.content || "";
console.log(`✅ ${agent.name} completed in ${turn + 1} turn(s)...`);
return { response: finalContent, toolCalls: allToolCalls };
```

If the LLM returns text after a tool error (instead of retrying with correct params), the loop exits successfully, returns to `runAgent`, and the **outer catch never fires**.

**If the outer catch DOES fire**, it means:
1. The entire API call threw an error (network, auth, rate limit)
2. The loop exceeded max turns (line 451)
3. Loop detection fired (line 410)

NOT a single tool validation error.

## Conclusion

The 148-second delay is caused by the **outer catch block** (lines 309-338) firing when the **inner loop** (lines 420-428) should have handled it.

**Root cause**: The outer catch triggers on errors that aren't actually "tool calling failures" in the model — they're application-level validation errors that should have been handled by the self-correction loop.

**Fix**: Distinguish between:
1. **Model doesn't support tool calling** (retry with different model)
2. **Model called tool with bad params** (return error as tool result, let model self-correct)
3. **Tool execution failed** (return error as tool result, let model self-correct)
4. **API/network/auth error** (retry with different keys/providers)

## Proposed Solution

**Option 1**: Remove the outer catch fallback entirely (lines 309-338). Let tool errors propagate as tool results, trust the self-correction loop.

**Option 2**: Add a check in the outer catch to distinguish validation errors from model capability errors:
```typescript
const isValidationError = error.message?.includes('did not match schema') ||
                         error.message?.includes('value must be one of');

if (needsTools && isToolError && !isValidationError) {
    // Only retry with fallback models if it's a model capability issue
    // ... existing fallback logic
}

// Validation errors should have been caught by inner loop - rethrow
throw error;
```

**Option 3**: Add explicit self-correction retry in the inner loop (lines 418-428):
```typescript
} catch (error: any) {
    console.error(`❌ Tool ${toolCall.name} failed:`, error.message);
    
    // ponytail: If validation error, give LLM ONE chance to self-correct before continuing
    const isValidationError = error.message?.includes('did not match schema');
    
    toolResult = {
        success: false,
        error: error.message,
        hint: isValidationError ? 'Check the tool schema and retry with valid parameters' : undefined
    };
}
```

Then continue the loop as normal. The LLM sees the error and hint, and makes another tool call.

## Recommendation

**Option 3 is safest**. It:
- Preserves existing retry logic for genuine model failures
- Adds an explicit self-correction hint for validation errors
- Doesn't break existing behavior
- Costs ~1 extra API call (~1-2s) instead of full provider cascade (~60-120s)
