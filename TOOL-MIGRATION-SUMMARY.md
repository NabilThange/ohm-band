# Tool Migration Summary: Legacy → New Unified Tools

## What Changed

Updated inline component rendering (BOMCard, InlineCodeCard) and drawer auto-opening to support the new unified tool system (`read`, `write`, `delete`, `open_drawer`) while maintaining backward compatibility with legacy tools.

## Files Modified

### 1. `components/ai_chat/Message.jsx`
**What it does:** Renders AI messages and detects tool calls to show inline components (BOMCard, InlineCodeCard)

**Changes:**
- **BOM Card rendering** (lines ~188-230): Now detects both:
  - New: `write(artifact_type='bom', content={...})`
  - Legacy: `update_bom({...})`
  
- **Code Card rendering** (lines ~230-260): Now detects both:
  - New: `write(artifact_type='code', path='...', content='...')`
  - Legacy: `add_code_file(filename='...', content='...')`

- **Drawer buttons** (lines ~260-350): Now handles:
  - New: `write` tool → maps `artifact_type` to drawer
  - New: `open_drawer(drawer='bom')` → direct drawer parameter
  - Legacy: All old tool names still work

### 2. `components/ai_chat/AIAssistantUI.jsx`
**What it does:** Auto-opens drawers when initial message contains tool calls

**Changes (lines ~570-605):**
- Added handler for `write` tool → extracts `artifact_type` and maps to drawer
- Added handler for `open_drawer` tool → extracts `drawer` parameter directly
- Legacy tool mappings preserved

## How It Works

### New Tool Format Detection

#### BOM Generation
```javascript
// AI calls: write({ artifact_type: 'bom', content: { components: [...] } })
// Frontend detects:
toolName === 'write' && parsedArgs.artifact_type === 'bom'
// Renders: <BOMCard data={parsedArgs.content} />
```

#### Code Generation
```javascript
// AI calls: write({ artifact_type: 'code', path: 'main.cpp', content: '...' })
// Frontend detects:
toolName === 'write' && parsedArgs.artifact_type === 'code'
// Renders: <InlineCodeCard files={[{ filename: path, content }]} />
```

#### Drawer Opening
```javascript
// AI calls: open_drawer({ drawer: 'bom' })
// Frontend detects: toolName === 'open_drawer'
// Opens: drawer specified in arguments
```

### Backward Compatibility

All legacy tools still work:
- `update_bom()` → Renders BOMCard
- `add_code_file()` → Renders InlineCodeCard  
- `update_context/mvp/prd` → Opens context drawer
- `update_wiring/budget` → Opens respective drawers
- `open_*_drawer` → Opens respective drawers

## Testing Checklist

- [ ] AI uses new `write` tool with `artifact_type='bom'` → BOMCard renders
- [ ] AI uses legacy `update_bom` → BOMCard still renders
- [ ] AI uses new `write` tool with `artifact_type='code'` → InlineCodeCard renders
- [ ] AI uses legacy `add_code_file` → InlineCodeCard still renders
- [ ] AI uses `open_drawer({ drawer: 'bom' })` → BOM drawer opens
- [ ] AI uses legacy `open_bom_drawer` → BOM drawer still opens
- [ ] Drawer auto-open works for new tools
- [ ] "Open [X] Drawer" buttons appear after tool calls
- [ ] Multiple code files in single response → all render in InlineCodeCard

## Migration Path for Agents

**Current state:** Agents still use legacy tools (defined in agent prompts)

**Future state:** Update agent prompts to use new tools:
- Replace `update_bom({...})` → `write({ artifact_type: 'bom', content: {...} })`
- Replace `add_code_file(...)` → `write({ artifact_type: 'code', path: '...', content: '...' })`
- Replace `open_bom_drawer()` → `open_drawer({ drawer: 'bom' })`

**Timeline:** No rush - both systems work simultaneously

## ponytail Notes

- Zero breaking changes. Old tools route through `tool-executor.ts` which already converts them to new format internally.
- Frontend now understands both formats. AI agents can migrate at their own pace.
- `write` tool is cleaner: one tool vs. 7 legacy update tools.
- Drawer auto-open uses same detection logic as inline components → stays in sync.
- Error handling preserved: JSON parsing wrapped in try/catch for both formats.

## What's NOT Changed

- `lib/agents/tool-executor.ts` - Already handles both tool formats (was done earlier)
- `lib/agents/tools.ts` - Tool definitions unchanged (new + legacy tools defined)
- Agent prompts - Still use legacy tools (can migrate gradually)
- Database layer - Unchanged (all tools write to same artifact tables)
