# Race Condition Fix: Message Disappearing & Duplication

## Symptoms Fixed
1. ✅ User messages sometimes disappear
2. ✅ AI response bubbles sometimes replicate/duplicate themselves

## Root Cause
The `activeTempMessageId` state variable was being used inside a `setMessages` callback, creating stale closures. When the real-time subscription tried to replace the temporary AI message with the real one from the database, it would read an outdated value of `activeTempMessageId`, causing:
- **Duplication**: Temp message not removed, real message added = 2 AI responses
- **Disappearance**: Race between optimistic user message and DB message with fragile content matching

## Changes Made (Minimal, Lazy Senior Dev Approach)

### 1. **Fixed AI Message Duplication** (`lib/hooks/use-chat.ts`)
**Before:**
```typescript
const [activeTempMessageId, setActiveTempMessageId] = useState<string | null>(null);

// Later in code...
setActiveTempMessageId(aiTempId); // State update
// Inside setMessages callback:
const hasTempMessage = activeTempMessageId && prev.some(...); // STALE VALUE!
```

**After:**
```typescript
const activeTempMessageIdRef = useRef<string | null>(null);

// Later in code...
activeTempMessageIdRef.current = aiTempId; // Direct ref update
// Inside setMessages callback:
const tempId = activeTempMessageIdRef.current; // ALWAYS CURRENT!
```

**Why:** `useRef` doesn't create new closures on each render - always reads current value.

### 2. **Improved User Message Deduplication** (`lib/hooks/use-chat.ts`)
**Before:**
```typescript
const hasOptimisticUser = prev.some(m => 
    m.role === 'user' && 
    m.content === newMsg.content && // Exact match - fails with whitespace
    m.id !== newMsg.id
);
```

**After:**
```typescript
const contentHash = newMsg.content.trim().toLowerCase();
const hasOptimisticUser = prev.some(m => 
    m.role === 'user' && 
    m.content.trim().toLowerCase() === contentHash && // Normalized match
    m.id !== newMsg.id &&
    Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 2000 // Within 2s
);
```

**Why:** 
- Normalized content matching (trim + lowercase) handles whitespace variations
- Timestamp check ensures we only match recent optimistic messages, not unrelated duplicates

## Test Scenarios
- [x] Send message rapidly (< 500ms apart)
- [x] Switch chats immediately after sending
- [x] Multiple messages in quick succession
- [x] Long AI responses with streaming

## Technical Notes

### ponytail: Why useRef over useState?
- `useState` creates new closures on each render → callbacks capture stale state
- `useRef.current` is a mutable reference → always returns latest value
- No re-renders needed for temp message tracking (internal coordination only)

### ponytail: Why timestamp check?
- Prevents false positives when user sends identical messages later
- 2 second window covers network latency + DB insert + real-time propagation
- Ceiling: Won't work if client clock is >2s off - upgrade path: use server timestamps

## Files Changed
- `lib/hooks/use-chat.ts` (3 locations)
  - Import `useRef` 
  - Replace `activeTempMessageId` state with `activeTempMessageIdRef` ref
  - Improve user message deduplication logic

## Performance Impact
✅ **Positive:** One less state variable = fewer re-renders
✅ **No new dependencies added**
✅ **Zero API changes** - internal refactor only
