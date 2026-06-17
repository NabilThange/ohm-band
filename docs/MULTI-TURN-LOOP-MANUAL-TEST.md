# Manual Testing Guide: Multi-Turn Agent Loop

## Quick Test Scenarios

### Test 1: Basic Multi-Tool Workflow

**Test**: Verify AI can call multiple tools sequentially

**Steps**:
1. Start the development server: `npm run dev`
2. Open the chat interface
3. Send message: "Create a new project called TestApp"

**Expected Behavior**:
```
🔄 [AgentLoop] Turn 1/10
🔧 [AgentLoop] AI called 1 tool(s)
🔧 Executing tool: open_drawer

🔄 [AgentLoop] Turn 2/10
🔧 [AgentLoop] AI called 1 tool(s)
🔧 Executing tool: write

🔄 [AgentLoop] Turn 3/10
✅ ProjectInitializer completed in 3 turn(s) (XXX chars, 2 total tool calls)
```

**Success Criteria**:
- ✅ AI makes multiple tool calls
- ✅ Final response includes text (not empty)
- ✅ Console shows multiple turns
- ✅ Total turn count < 10

---

### Test 2: Single Turn Completion

**Test**: Verify models that do everything in one turn still work

**Steps**:
1. Use a model like `gpt-4o` (if available)
2. Send message: "What's in the context drawer?"

**Expected Behavior**:
```
🔄 [AgentLoop] Turn 1/10
✅ Agent completed in 1 turn(s) (XXX chars, 0 total tool calls)
```

**Success Criteria**:
- ✅ Completes in 1 turn
- ✅ Returns text response immediately
- ✅ No errors

---

### Test 3: Loop Detection

**Test**: Verify loop detection prevents infinite loops

**Steps**:
1. This requires a crafted scenario where AI might repeat a tool call
2. Monitor console for loop detection error

**Expected Behavior**:
```
❌ Error: Loop detected: repeated call to open_drawer
```

**Success Criteria**:
- ✅ Loop is detected
- ✅ Error is thrown
- ✅ User sees clear error message

---

### Test 4: Tool Error Handling

**Test**: Verify tool errors are handled gracefully

**Steps**:
1. Send a message that triggers a tool that might fail
2. Example: "Read file that-does-not-exist.txt"

**Expected Behavior**:
```
🔄 [AgentLoop] Turn 1/10
🔧 Executing tool: read_artifact
❌ Tool read_artifact failed: File not found

🔄 [AgentLoop] Turn 2/10
✅ Agent completed in 2 turn(s)
```

**Success Criteria**:
- ✅ Tool error is caught
- ✅ Error is logged
- ✅ AI gets another turn
- ✅ AI can explain the error to user

---

### Test 5: Max Turns Limit

**Test**: Verify safety limit prevents runaway loops

**Steps**:
1. This requires a scenario where AI keeps calling tools
2. Observe if loop stops at 10 turns

**Expected Behavior**:
```
🔄 [AgentLoop] Turn 10/10
❌ Error: Agent loop exceeded max turns (10)
```

**Success Criteria**:
- ✅ Loop stops at turn 10
- ✅ Clear error message
- ✅ No infinite execution

---

## Regression Tests

### Test 6: Existing Single-Turn Workflows

**Test**: Verify existing functionality still works

**Steps**:
1. Test all existing chat scenarios that worked before
2. Verify no regressions

**Success Criteria**:
- ✅ All previous use cases still work
- ✅ No unexpected errors
- ✅ Response quality unchanged

---

## Console Log Monitoring

Watch for these patterns in the browser/server console:

### Good Patterns ✅
```
🔄 [AgentLoop] Turn X/10
🔧 [AgentLoop] AI called N tool(s)
🔧 Executing tool: tool_name
✅ Agent completed in X turn(s)
```

### Warning Patterns ⚠️
```
❌ Tool tool_name failed: error_message
```
→ Should be followed by AI adapting (another turn)

### Error Patterns ❌
```
Error: Loop detected: repeated call to tool_name
Error: Agent loop exceeded max turns (10)
```
→ These indicate safety nets working

---

## Quick Validation Checklist

After implementing, verify:

- [ ] Dev server starts without errors
- [ ] Chat interface loads
- [ ] Simple message gets response
- [ ] Multi-tool workflow completes
- [ ] Console shows turn numbers
- [ ] Final response is not empty
- [ ] No TypeScript errors in console
- [ ] Existing features still work

---

## Debugging Tips

### If AI returns empty response:
1. Check console for errors
2. Verify tools are being executed
3. Check if AI is stuck in loop detection
4. Increase logging verbosity

### If loop runs forever:
1. Should not happen (max turns = 10)
2. Check console for turn count
3. Verify max turns limit is working

### If tools fail silently:
1. Check console for error logs
2. Verify tool executor is working
3. Check if errors are being returned to AI

---

## Success Metrics

**Implementation is successful if**:

1. ✅ AI can complete multi-step workflows
2. ✅ Tool results are fed back to AI
3. ✅ Final responses are complete (not empty)
4. ✅ Safety limits prevent runaway loops
5. ✅ Existing functionality is preserved
6. ✅ Console logs are clear and helpful

**Green light for Phase 3 (streaming) when all tests pass.**
