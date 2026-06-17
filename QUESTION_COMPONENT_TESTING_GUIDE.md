# Question Component Testing Guide

## Quick Start Testing

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Create a New Chat
- Navigate to the chat interface
- Start a new conversation

### 3. Test with Project Initializer Agent

**Trigger Message:**
```
I want to build a smart plant watering system
```

**Expected Behavior:**
1. Agent responds with enthusiastic acknowledgment
2. Agent provides 2-3 approach options
3. Agent outputs question JSON in `<QUESTIONS>` tags
4. Frontend renders interactive Question Component
5. Questions appear as step-by-step wizard

### 4. Interact with Questions
1. Answer the first question (select an option)
2. Click "Next →" to proceed
3. Answer remaining questions
4. Click "Submit ✓" on last question
5. See summary view of all answers
6. Answers automatically sent as new message

### 5. Verify Agent Receives Answers
- Check that agent's next response references your answers
- Verify agent proceeds with appropriate recommendations

## Test Cases

### Test Case 1: Single Select Question
```
User: "I want to build a temperature monitor"
Agent should ask: Power source? Environment? Display type?
Expected: Radio buttons with "Other" option
```

### Test Case 2: Multiple Select Question (Future Enhancement)
```
Agent asks: "What features do you want?"
Expected: Checkboxes for multiple selection
```

### Test Case 3: Text Input Question
```
Agent asks: "What's your budget range?"
Expected: Text input field
```

### Test Case 4: Textarea Question
```
Agent asks: "Any specific requirements or constraints?"
Expected: Multi-line textarea
```

### Test Case 5: Required Field Validation
```
Mark a question as required: true
Expected: "Next" button disabled until answered
```

### Test Case 6: Back Navigation
```
Answer question 1, go to question 2
Click "← Back"
Expected: Returns to question 1 with previous answer preserved
```

### Test Case 7: Submit and Continue
```
Complete all questions and submit
Expected: Shows summary, then agent responds with acknowledgment
```

## Manual Testing Checklist

### Backend:
- [ ] Questions parsed from agent response
- [ ] Question JSON removed from displayed text
- [ ] Questions stored in message metadata
- [ ] Questions streamed to frontend via SSE
- [ ] Malformed JSON handled gracefully
- [ ] Empty questions handled gracefully

### Frontend:
- [ ] QuestionComponent renders correctly
- [ ] Progress bar shows current step
- [ ] Single select options work
- [ ] "Other" option shows input field
- [ ] Text input works
- [ ] Textarea works
- [ ] Required validation works
- [ ] Back button works
- [ ] Next button works
- [ ] Submit shows summary
- [ ] Answers formatted correctly
- [ ] Answers sent as new message

### UX:
- [ ] Smooth animations on render
- [ ] Clear visual feedback on selection
- [ ] Disabled state visible
- [ ] Mobile responsive
- [ ] Accessible (keyboard navigation)
- [ ] Summary view clear and readable

### Integration:
- [ ] Agent receives formatted answers
- [ ] Conversation flow continues naturally
- [ ] Multiple question rounds work
- [ ] Page refresh preserves state
- [ ] Navigation doesn't break flow

## Debugging

### Enable Debug Logs:
Check browser console for:
```
[Orchestrator] Questions detected: N questions
[API Route] ❓ Sending questions: N
[useChat] ❓ Questions received: {...}
[Message] Rendering QuestionComponent
[ChatPane] ❓ Question answers received
```

### Check Database:
```sql
-- View messages with questions
SELECT 
  id, 
  role, 
  LEFT(content, 50) as content_preview,
  metadata->'hasQuestions' as has_questions,
  metadata->'questions' as questions_json
FROM messages 
WHERE chat_id = 'YOUR_CHAT_ID'
ORDER BY sequence_number;
```

### Common Issues:

**Issue: Questions not rendering**
- Check: Does metadata contain `hasQuestions: true`?
- Check: Is `questions` object in metadata?
- Check: Browser console for errors

**Issue: Answers not sending**
- Check: Event listener registered in ChatPane?
- Check: `send-question-answers` event dispatched?
- Check: handleSend function called?

**Issue: Agent doesn't see answers**
- Check: Formatted answer text in user message?
- Check: Agent receives message in context?
- Check: Network tab for POST to /api/agents/chat

## Example Test Scenario

### Full End-to-End Test:

1. **User:** "I want to build an IoT thermostat"

2. **Agent Response:**
   ```
   Awesome idea! 🌡️ Here are three approaches:
   
   • Simple ($20-30): DHT22 + relay + manual control
   • Smart ($40-60): ESP32 + WiFi + app scheduling
   • Advanced ($80-100): Touchscreen + learning algorithms
   
   <QUESTIONS>
   {
     "questions": [
       {
         "id": "heating_cooling",
         "text": "Will it control heating, cooling, or both?",
         "type": "single_select",
         "options": ["Heating only", "Cooling only", "Both heating and cooling", "Just monitoring"],
         "required": true
       },
       {
         "id": "connectivity",
         "text": "Do you need WiFi connectivity?",
         "type": "single_select",
         "options": ["Yes - remote control via app", "No - local control only", "Bluetooth is enough"],
         "required": true
       },
       {
         "id": "budget",
         "text": "What's your budget range?",
         "type": "single_select",
         "options": ["Under $30", "$30-$60", "$60-$100", "Over $100"],
         "required": false
       }
     ]
   }
   </QUESTIONS>
   ```

3. **User Interacts:**
   - Selects "Both heating and cooling"
   - Clicks Next
   - Selects "Yes - remote control via app"
   - Clicks Next
   - Selects "$30-$60"
   - Clicks Submit

4. **System Sends:**
   ```
   **User Provided Answers:**
   
   - Will it control heating, cooling, or both?
     Answer: Both heating and cooling
   
   - Do you need WiFi connectivity?
     Answer: Yes - remote control via app
   
   - What's your budget range?
     Answer: $30-$60
   ```

5. **Agent Responds:**
   ```
   Perfect! Based on your answers, I'll design a dual-zone thermostat with WiFi control...
   [Proceeds to create BOM and documentation]
   ```

## Performance Testing

### Metrics to Monitor:
- Question parsing time: < 10ms
- QuestionComponent render time: < 100ms
- Answer submission time: < 50ms
- Full round-trip (submit → agent response): < 2s

### Load Testing:
- Test with 5 questions (max allowed)
- Test with long option text (50+ chars)
- Test with large conversation history (100+ messages)
- Test with rapid back/next navigation
- Test with multiple users simultaneously

## Accessibility Testing

### Keyboard Navigation:
- [ ] Tab through options
- [ ] Space/Enter to select
- [ ] Tab to Next/Back buttons
- [ ] Enter to submit

### Screen Reader:
- [ ] Question text announced
- [ ] Option text announced
- [ ] Selection state announced
- [ ] Required field announced
- [ ] Progress announced

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Sign-Off Criteria

Ready for production when:
- ✅ All test cases pass
- ✅ No console errors
- ✅ No TypeScript errors
- ✅ Mobile responsive
- ✅ Accessible
- ✅ Agent prompts refined
- ✅ Documentation complete
- ✅ Team demo completed

## Rollout Plan

### Week 1: Internal Testing
- Test with projectInitializer agent only
- Gather internal feedback
- Fix any critical bugs

### Week 2: Beta Testing
- Enable for small user group
- Monitor usage and errors
- Iterate on agent prompts

### Week 3: Full Rollout
- Enable for all users
- Enable conversational agent
- Monitor and optimize

### Week 4: Iteration
- Analyze usage patterns
- Refine question types
- Expand to other agents
