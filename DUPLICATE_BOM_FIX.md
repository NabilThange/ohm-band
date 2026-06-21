# 🐛 Fix: Duplicate BOM Components & $0 Pricing Issues

## Problem 1: Multiple BOM Components
Multiple BOM inline components were being generated when the BOM was created. After refresh, it would be stuck at 2 BOMs.

### Root Cause
The system was creating duplicate artifacts because of **two separate parsing mechanisms**:
1. **Text-based parsing**: `<BOM_CONTAINER>` tags in `textChunks` were being parsed by `lib/parsers.ts`
2. **Tool-based creation**: `write(artifact_type='bom')` tool call was creating another BOM

### Solution
Removed `<BOM_CONTAINER>` tags from demo responses and rely **only on tool calls**.

---

## Problem 2: BOM Showing $0 Prices

### Root Cause
**Four separate issues** were causing the $0 pricing:

1. **tool-executor.ts normalizer** (line 478-482): Only checked `estimatedCost` and `price`, missing `unitCost`:
   ```typescript
   estimatedCost: c.estimatedCost ?? c.price ?? 0  // ❌ Missing unitCost!
   ```

2. **tool-executor.ts totalCost** (line 486-489): Calculated total using only `estimatedCost` which was 0

3. **Message.jsx mapper** (line 251-256): Overwrote all fields with `estimatedCost: c.unit_price ?? c.estimatedCost ?? 0`, ignoring `unitCost`

4. **Data source mismatch**: 
   - **Inline BOM component** read from `message.metadata.toolCalls` (normalized data with $0)
   - **BOM drawer** read from `artifacts.bom.version.content_json` (database with correct data)

### Solution

**1. tool-executor.ts** - Preserve original price fields instead of overwriting:
```typescript
// Only normalize if explicit price fields provided
if (c.estimatedCost !== undefined || c.price !== undefined) {
    return {
        ...c,
        estimatedCost: c.estimatedCost ?? c.price ?? c.unitCost ?? c.unit_price ?? 0
    };
}
return c; // Keep original unchanged
```

**2. tool-executor.ts** - Use same price resolution for totalCost:
```typescript
const price = c.estimatedCost ?? c.unitCost ?? c.unit_price ?? c.price ?? 0;
```

**3. Message.jsx** - Preserve all original fields:
```typescript
const mappedBomData = {
    ...bomData,
    components: bomData.components.map(c => ({
        ...c, // Keep ALL original fields (unitCost, lineCost, etc.)
        name: c.component || c.name
        // Don't override price fields
    }))
};
```

**4. Message.jsx** - Prefer database artifact over tool call data:
```typescript
// Prefer fresh database artifact over stale tool call data
const bomFromDatabase = artifacts?.bom?.version?.content_json;

if (bomFromDatabase) {
    return <BOMCard data={bomFromDatabase} />; // ✅ Same source as drawer!
}

// Fallback to tool call data
const bomToolCall = toolCalls.find(tc => ...);
```

**5. Data flow** - Pass artifacts through component tree:
```
AIAssistantUI (fetches artifacts from DB)
  ↓ artifacts prop
ChatPane
  ↓ artifacts prop  
Message
  ↓ uses artifacts.bom for inline component
```

---

## Files Changed

### Problem 1 (Duplicates)
1. `lib/agents/demo-responses.ts`
   - Updated `DRONE_PATROL_RESPONSE_5` (BOM generation)
   - Updated `DRONE_PATROL_RESPONSE_7` (Code generation)
   - Removed `<BOM_CONTAINER>` and `<CODE_CONTAINER>` tags

2. `lib/agents/__tests__/demo-responses.test.ts`
   - Updated tests to expect no container tags

### Problem 2 ($0 Pricing)
3. `lib/agents/tool-executor.ts` (lines 475-494)
   - Fixed BOM normalizer to preserve `unitCost`
   - Fixed totalCost calculation to check all price fields

4. `components/ai_chat/Message.jsx` (line 13, 209-265)
   - Added `artifacts` prop
   - Prefer database artifact over tool call data
   - Fixed mapper to preserve all price fields

5. `components/ai_chat/ChatPane.jsx` (line 15, 157)
   - Added `artifacts` prop to component signature
   - Pass `artifacts` to Message component

6. `components/ai_chat/AIAssistantUI.jsx` (line 961)
   - Pass `artifacts` to ChatPane component

---

## Price Field Priority Order

All three components now use the same fallback order:
```
estimatedCost → unitCost → unit_price → price → 0
```

Defined in:
- `BOMCard.jsx`: `getComponentPrice()` function (line 20)
- `Message.jsx`: Preserves all fields, no override
- `tool-executor.ts`: Matches BOMCard logic

---

## Testing
```bash
npm run test:demo
```
Result: **✓ All 11 tests passed!**

---

## Why This Pattern?

**Problem**: Different parts of the system (agent output, database, UI) use different field names for prices:
- Agents might generate: `estimatedCost`, `price`, `unitCost`, `unit_price`
- Database might store: `unit_price`
- UI expects: Any of the above

**Solution**: 
- ✅ **Preserve original data** through the pipeline
- ✅ **Single resolution point** (`getComponentPrice()`)  
- ✅ **Consistent fallback order** everywhere
- ❌ **Don't normalize/overwrite** intermediate data

---

## Best Practices Going Forward

1. ✅ **DO**: Use `write(artifact_type='X')` tool calls for structured data
2. ✅ **DO**: Preserve all fields when mapping/transforming data
3. ✅ **DO**: Let UI components handle field name variations
4. ❌ **DON'T**: Overwrite fields with default values (0, '', null)
5. ❌ **DON'T**: Assume one field name - always check multiple variants

## Root Cause
The system was creating duplicate artifacts because of **two separate parsing mechanisms**:

1. **Text-based parsing**: The `<BOM_CONTAINER>` tags in `textChunks` were being parsed by `lib/parsers.ts`
2. **Tool-based creation**: The `write(artifact_type='bom')` tool call was creating another BOM

### Before (Broken Code)
```typescript
const DRONE_PATROL_RESPONSE_5: DemoResponse = {
    textChunks: [
        'Here is the complete BOM for the Farm Patrol Drone.\n<BOM_CONTAINER>\n',
        JSON.stringify(FARM_DRONE_BOM_DATA, null, 2),
        '\n</BOM_CONTAINER>\nReady to generate the wiring diagram?'
    ],
    toolCalls: [
        { name: 'open_drawer', arguments: { drawer: 'bom' } },
        { name: 'write', arguments: { artifact_type: 'bom', content: FARM_DRONE_BOM_DATA } },
        { name: 'write', arguments: { artifact_type: 'budget', content: FARM_DRONE_BUDGET_DATA } }
    ]
};
```

This caused:
- **BOM #1**: Created from `<BOM_CONTAINER>` tags (often incomplete/zero price)
- **BOM #2**: Created from `write(artifact_type='bom')` tool call (correct data)
- **Extra inline cards**: Each chunk triggered UI rendering

## Solution
Removed `<BOM_CONTAINER>` tags from text and rely **only on tool calls**, as specified in your config at `lib/agents/config.ts:388-389`:

> `DO NOT use <BOM_CONTAINER> tags. Always use the tool calls.`

### After (Fixed Code)
```typescript
const DRONE_PATROL_RESPONSE_5: DemoResponse = {
    textChunks: [
        'I\'ve generated the complete Bill of Materials for the Farm Patrol Drone with 21 components totaling $308. The BOM includes detailed specs, supplier links, and assembly notes for each part.\n\nI\'ve also optimized the budget — saving $82 (21%) from the original quote by substituting premium components with cost-effective alternatives that still meet performance requirements.\n\nReady to generate the wiring diagram?'
    ],
    toolCalls: [
        { name: 'open_drawer', arguments: { drawer: 'bom' } },
        { name: 'write', arguments: { artifact_type: 'bom', content: FARM_DRONE_BOM_DATA } },
        { name: 'write', arguments: { artifact_type: 'budget', content: FARM_DRONE_BUDGET_DATA } }
    ]
};
```

## Files Changed
1. `lib/agents/demo-responses.ts`
   - Updated `DRONE_PATROL_RESPONSE_5` (BOM generation)
   - Updated `DRONE_PATROL_RESPONSE_7` (Code generation)
   
2. `lib/agents/__tests__/demo-responses.test.ts`
   - Updated tests to expect **no** `<BOM_CONTAINER>` tags
   - Updated tests to expect **no** `<CODE_CONTAINER>` tags
   - All 11 tests now pass ✅

## Why This Pattern?
Your system follows a **tool-first architecture** where:
- Tool calls create structured artifacts in the database/state
- Text chunks provide **human-readable summaries** only
- Container tags (`<BOM_CONTAINER>`, `<CODE_CONTAINER>`) are legacy patterns from earlier designs

This approach is cleaner because:
- ✅ Single source of truth (tool calls)
- ✅ No parsing ambiguity
- ✅ Better performance (no regex parsing on large JSON)
- ✅ Easier debugging (structured data in tool calls)

## Verification
```bash
npm run test:demo
```

Result: **✓ All 11 tests passed!**

## Best Practices Going Forward
When creating demo responses:

1. ✅ **DO**: Use `write(artifact_type='X')` tool calls for all structured data
2. ✅ **DO**: Keep textChunks as human-readable summaries with key metrics
3. ❌ **DON'T**: Include `<BOM_CONTAINER>` or `<CODE_CONTAINER>` tags in text
4. ❌ **DON'T**: Duplicate data between textChunks and tool calls

## Related Code References
- Parser logic: `lib/parsers.ts` (lines 46-260)
- Config guidelines: `lib/agents/config.ts` (line 388)
- Tool executor: `lib/agents/tool-executor.ts`
