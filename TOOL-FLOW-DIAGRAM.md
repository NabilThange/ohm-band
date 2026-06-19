# Tool Call Flow: How Inline Components Render

## New Tool System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ AI Agent                                                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────────┐
        │ Calls New Unified Tool               │
        │                                      │
        │ write({                              │
        │   artifact_type: 'bom',              │
        │   content: {                         │
        │     components: [...],               │
        │     totalCost: 125.50                │
        │   }                                  │
        │ })                                   │
        └──────────────┬───────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │ Orchestrator                         │
        │ • Receives tool call                 │
        │ • Passes to ToolExecutor             │
        └──────────────┬───────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │ ToolExecutor.executeToolCall()       │
        │ • Routes 'write' to write()          │
        │ • Detects artifact_type='bom'        │
        │ • Calls updateBOM()                  │
        │ • Saves to database                  │
        └──────────────┬───────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │ Database (Supabase)                  │
        │ artifacts table:                     │
        │   type: 'bom'                        │
        │ artifact_versions table:             │
        │   content_json: { components: ... }  │
        └──────────────┬───────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │ Response sent to Frontend            │
        │                                      │
        │ {                                    │
        │   role: 'assistant',                 │
        │   content: 'Created BOM...',         │
        │   metadata: {                        │
        │     toolCalls: [{                    │
        │       name: 'write',                 │
        │       arguments: {                   │
        │         artifact_type: 'bom',        │
        │         content: { components: ...}  │
        │       }                              │
        │     }]                               │
        │   }                                  │
        │ }                                    │
        └──────────────┬───────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │ Message.jsx (AI Message Renderer)   │
        │                                      │
        │ 1. Extracts toolCalls from metadata  │
        │ 2. Finds tool with name='write'      │
        │ 3. Checks artifact_type === 'bom'    │
        │ 4. Extracts content.components       │
        │ 5. Renders: <BOMCard data={content}/>│
        └──────────────┬───────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │ BOMCard Component                    │
        │ • Displays component table           │
        │ • Shows total cost                   │
        │ • Export CSV button                  │
        │ • Safety warnings (if any)           │
        └──────────────────────────────────────┘
```

## Legacy Tool System Flow (Still Works)

```
┌─────────────────────────────────────────────────────────────────┐
│ AI Agent (Old Prompts)                                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────────┐
        │ Calls Legacy Tool                    │
        │                                      │
        │ update_bom({                         │
        │   project_name: 'LED Circuit',       │
        │   components: [...],                 │
        │   totalCost: 125.50                  │
        │ })                                   │
        └──────────────┬───────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │ ToolExecutor.executeToolCall()       │
        │ • Detects legacy 'update_bom'        │
        │ • Converts to:                       │
        │   write({                            │
        │     artifact_type: 'bom',            │
        │     content: arguments               │
        │   })                                 │
        │ • Calls updateBOM()                  │
        └──────────────┬───────────────────────┘
                       │
        [Rest of flow identical to new system]
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │ Message.jsx                          │
        │ • Detects toolName === 'update_bom'  │
        │ • Extracts components from arguments │
        │ • Renders: <BOMCard data={args} />   │
        └──────────────────────────────────────┘
```

## Code Generation Flow (Multiple Files)

```
AI Agent calls write() three times:
  ├─ write({ artifact_type: 'code', path: 'src/main.cpp', content: '...' })
  ├─ write({ artifact_type: 'code', path: 'include/config.h', content: '...' })
  └─ write({ artifact_type: 'code', path: 'platformio.ini', content: '...' })

                            │
                            ▼
        ┌──────────────────────────────────────┐
        │ Message.jsx                          │
        │                                      │
        │ 1. Finds ALL toolCalls with:         │
        │    name='write' &&                   │
        │    artifact_type='code'              │
        │                                      │
        │ 2. Collects all into array:          │
        │    [{                                │
        │      filename: 'src/main.cpp',       │
        │      content: '...'                  │
        │    }, {                              │
        │      filename: 'include/config.h',   │
        │      content: '...'                  │
        │    }, {                              │
        │      filename: 'platformio.ini',     │
        │      content: '...'                  │
        │    }]                                │
        │                                      │
        │ 3. Renders single card:              │
        │    <InlineCodeCard                   │
        │       files={allFiles}               │
        │       projectName="Generated Code"   │
        │    />                                │
        └──────────────────────────────────────┘
```

## Drawer Auto-Opening

```
AI calls write() or open_drawer()
        │
        ▼
┌───────────────────────────────┐
│ AIAssistantUI.jsx             │
│ (Initial message handler)     │
│                               │
│ Detects tool in first chunk:  │
│  • write + artifact_type      │
│  • open_drawer + drawer param │
│  • Legacy tools               │
│                               │
│ Maps to drawer name:          │
│  bom → 'bom'                  │
│  code → 'code'                │
│  context/mvp/prd → 'context'  │
│                               │
│ Dispatches event:             │
│ window.dispatchEvent(         │
│   'open-drawer',              │
│   { drawer: 'bom' }           │
│ )                             │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ Drawer component listens      │
│ Opens with animation          │
└───────────────────────────────┘
```

## Key Detection Logic in Message.jsx

### For BOM
```javascript
const bomToolCall = toolCalls.find(tc => {
    const toolName = tc.function?.name || tc.name;
    
    // New tool: check artifact_type
    if (toolName === 'write') {
        const args = tc.function?.arguments || tc.arguments;
        const parsed = typeof args === 'string' ? JSON.parse(args) : args;
        return parsed?.artifact_type === 'bom';
    }
    
    // Legacy tool: direct match
    return toolName === 'update_bom';
});
```

### For Code
```javascript
const codeToolCalls = toolCalls.filter(tc => {
    const toolName = tc.function?.name || tc.name;
    
    // New tool: check artifact_type
    if (toolName === 'write') {
        const args = tc.function?.arguments || tc.arguments;
        const parsed = typeof args === 'string' ? JSON.parse(args) : args;
        return parsed?.artifact_type === 'code';
    }
    
    // Legacy tool: direct match
    return toolName === 'add_code_file';
});

// Map to unified format
const files = codeToolCalls.map(tc => {
    const args = tc.function?.arguments || tc.arguments;
    const parsed = typeof args === 'string' ? JSON.parse(args) : args;
    
    // New format
    if (parsed.artifact_type === 'code') {
        return {
            filename: parsed.path,
            content: parsed.content
        };
    }
    
    // Legacy format
    return {
        filename: parsed.filename,
        content: parsed.content
    };
});
```

## Decision Tree

```
Tool call arrives
    │
    ├─ Is name='write'?
    │   │
    │   ├─ artifact_type='bom'? → Render BOMCard
    │   ├─ artifact_type='code'? → Render InlineCodeCard
    │   ├─ artifact_type='context/mvp/prd'? → Show "Open Context Drawer" button
    │   ├─ artifact_type='wiring'? → Show "Open Wiring Drawer" button
    │   └─ artifact_type='budget'? → Show "Open Budget Drawer" button
    │
    ├─ Is name='update_bom'? → Render BOMCard (legacy)
    ├─ Is name='add_code_file'? → Render InlineCodeCard (legacy)
    ├─ Is name='update_context/mvp/prd'? → Show "Open Context Drawer" button (legacy)
    ├─ Is name='update_wiring'? → Show "Open Wiring Drawer" button (legacy)
    └─ Is name='update_budget'? → Show "Open Budget Drawer" button (legacy)
```
