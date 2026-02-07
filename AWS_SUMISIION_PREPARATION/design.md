# Design Document: OHM Hardware Orchestrator

## Overview

OHM is an AI-powered IoT/Hardware Development IDE that transforms natural language project descriptions into complete hardware prototypes. The system employs a multi-agent architecture where specialized AI agents collaborate through a sequential assembly line pattern, each contributing their expertise to different aspects of hardware development.

**Core Architecture Pattern:** Sequential Assembly Line with Dynamic Routing
- User describes project → Orchestrator classifies intent → Specialist agent executes → Artifacts persisted → UI updates in real-time

**AWS-Native Technology Stack:**
- **Frontend:** Next.js 15.1.6, React 19, TypeScript, Tailwind CSS
- **Backend:** AWS Lambda Functions (Serverless)
- **Database:** Amazon DynamoDB with Global Secondary Indexes
- **AI Service:** Amazon Bedrock (Claude 3.5 Sonnet, Claude 3 Opus)
- **Streaming:** Bedrock ConverseStream API for real-time responses
- **Real-time:** AWS AppSync with DynamoDB Streams
- **Storage:** Amazon S3 with presigned URLs (File uploads)
- **Hosting:** AWS Amplify (CI/CD + Hosting)
- **Monitoring:** Amazon CloudWatch + X-Ray

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Chat UI      │  │ Drawer System│  │ Tools Sidebar│          │
│  │ (Messages)   │  │ (Artifacts)  │  │ (Navigation) │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                   │
│                            │                                      │
│                    AppSync GraphQL Subscriptions (Real-time)     │
└────────────────────────────┼────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│              API LAYER (AWS Lambda Functions)                    │
│  ┌──────────────────────────┴──────────────────────────┐        │
│  │  /api/agents/chat (POST) - Lambda Function          │        │
│  │  - Receives user message via HTTP POST              │        │
│  │  - Creates SSE stream                               │        │
│  │  - Invokes AssemblyLineOrchestrator                 │        │
│  │  - Streams: text chunks, agent_selected,            │        │
│  │    tool_call, throttling_retry, metadata            │        │
│  └─────────────────────────┬───────────────────────────┘        │
└────────────────────────────┼────────────────────────────────────┘
                             │
┌────────────────────────────────────────────────────────────────┐
│              ORCHESTRATION LAYER (lib/agents/)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AssemblyLineOrchestrator                                │  │
│  │  - Manages conversation flow                             │  │
│  │  - Routes to appropriate agent                           │  │
│  │  - Handles tool execution                                │  │
│  │  - Triggers conversation summarization                   │  │
│  └────────────┬─────────────────────────────────────────────┘  │
│               │                                                  │
│  ┌────────────┴─────────────────────────────────────────────┐  │
│  │  AgentRunner (with BedrockClient)                        │  │
│  │  - Executes individual agents via Amazon Bedrock         │  │
│  │  - Handles streaming responses (ConverseStream API)      │  │
│  │  - Manages tool calls                                    │  │
│  │  - Automatic retry with exponential backoff             │  │
│  └────────────┬─────────────────────────────────────────────┘  │
│               │                                                  │
│  ┌────────────┴─────────────────────────────────────────────┐  │
│  │  BedrockClient (Singleton)                               │  │
│  │  - AWS SDK v3 with Bedrock Runtime                      │  │
│  │  - Manages API connections and throttling               │  │
│  │  - Handles model invocations and streaming              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                    AGENT LAYER (10 Specialists)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Orchestrator │  │ Project Init │  │Conversational│          │
│  │ (Routing)    │  │ (First Msg)  │  │ (General)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ BOM Generator│  │Code Generator│  │Wiring Diagram│          │
│  │ (Parts)      │  │ (Firmware)   │  │ (Assembly)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Circuit Verify│  │Datasheet Anal│  │Budget Optimiz│          │
│  │ (Vision)     │  │ (Extraction) │  │ (Cost Saving)│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐                                                │
│  │Conversation  │                                                │
│  │Summarizer    │                                                │
│  └──────────────┘                                                │
└────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                    TOOL EXECUTION LAYER                          │
│  ┌──────────────────────────┴──────────────────────────┐        │
│  │  ToolExecutor                                        │        │
│  │  - Parses tool calls from agents                     │        │
│  │  - Executes drawer-opening tools (UI events)         │        │
│  │  - Executes content-update tools (DB persistence)    │        │
│  │  - Handles read_file / write_file operations         │        │
│  └─────────────────────────┬───────────────────────────┘        │
└────────────────────────────┼────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                DATA LAYER (Amazon DynamoDB)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ ohm-chats    │  │ ohm-messages │  │ohm-sessions  │          │
│  │ (Projects)   │  │ (History)    │  │ (State)      │          │
│  │ PK: id (UUID)│  │ PK: id (UUID)│  │ PK: id (UUID)│          │
│  │ GSI: user_id │  │ GSI: chat_id │  │ GSI: chat_id │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ohm-artifacts │  │ohm-art-vers  │  │ ohm-parts    │          │
│  │ (Containers) │  │ (Versions)   │  │ (BOM Items)  │          │
│  │ PK: id (UUID)│  │ PK: id (UUID)│  │ PK: id (UUID)│          │
│  │ GSI: chat_id │  │ GSI: art_id  │  │ GSI: proj_id │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  Real-time: DynamoDB Streams → AppSync GraphQL subscriptions     │
│  Storage: Amazon S3 for file uploads (circuit photos, PDFs)      │
└──────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                    AI SERVICES (Amazon Bedrock)                  │
│  ┌──────────────────────────┴──────────────────────────┐        │
│  │  Amazon Bedrock Runtime                              │        │
│  │  - Claude 3.5 Sonnet (anthropic.claude-4-5-sonnet) │        │
│  │  - Claude 3 Opus (anthropic.claude-4-opus)          │        │
│  │  - ConverseStream API for real-time responses       │        │
│  │  - Function calling for structured tool use         │        │
│  └──────────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────┘
```

### Sequential Assembly Line Pattern

The system follows a sequential assembly line where each agent contributes to the project in a specific order:

1. **Initialization Phase** (First Message)
   - Project Initializer gathers requirements
   - Creates Context, MVP, PRD artifacts
   - Transitions to conversational mode

2. **Conversational Phase** (Subsequent Messages)
   - Orchestrator classifies intent
   - Routes to specialist agent
   - Agent executes and calls tools
   - Artifacts updated in database
   - UI refreshes via real-time subscriptions

3. **Artifact Generation Flow**
   - Agent determines artifact is ready
   - Calls open_*_drawer() tool (UI notification)
   - Calls update_*() or add_*_file() tool (DB persistence)
   - ToolExecutor persists to artifacts/artifact_versions tables
   - Client receives tool_call events and updates UI

## Components and Interfaces

### 1. AssemblyLineOrchestrator

**Location:** `lib/agents/orchestrator.ts`

**Responsibilities:**
- Manage conversation lifecycle
- Route messages to appropriate agents
- Execute tool calls via ToolExecutor
- Trigger conversation summarization
- Generate project titles

**Key Methods:**

```typescript
class AssemblyLineOrchestrator {
  constructor(chatId?: string)
  
  // Main chat interface with callbacks
  async chat(
    userMessage: string,
    onStream?: (chunk: string) => void,
    forceAgent?: string,
    onAgentDetermined?: (agent) => void,
    onToolCall?: (toolCall) => void,
    onKeyRotation?: (event) => void
  ): Promise<{
    response: string
    isReadyToLock: boolean
    agentType: string
    agentName: string
    agentIcon: string
    intent: string
    toolCalls?: ToolCall[]
    keyRotationEvent?: KeyRotationEvent | null
  }>
  
  // Generate concise project title
  async generateTitle(userMessage: string): Promise<string>
  
  // Get conversation history from database
  private async getHistory(): Promise<Message[]>
}
```

**Agent Routing Logic:**

```typescript
// First message (messageCount === 0)
if (messageCount === 0) {
  finalAgentType = 'projectInitializer'
}
// Manual agent selection
else if (forceAgent) {
  finalAgentType = forceAgent as AgentType
}
// Intent classification
else {
  const intentResult = await orchestrator.runAgent('orchestrator', [userMessage])
  intent = intentResult.response.trim().toUpperCase()
  
  const intentAgentMap = {
    'BOM': 'bomGenerator',
    'CODE': 'codeGenerator',
    'WIRING': 'wiringDiagram',
    'CIRCUIT_VERIFY': 'circuitVerifier',
    'DATASHEET': 'datasheetAnalyzer',
    'BUDGET': 'budgetOptimizer',
    'CHAT': 'conversational'
  }
  
  finalAgentType = intentAgentMap[intent] || 'conversational'
}
```

### 2. AgentRunner

**Location:** `lib/agents/orchestrator.ts`

**Responsibilities:**
- Execute individual agents with BYTEZ API
- Handle streaming and non-streaming responses
- Process tool calls from agents
- Automatic failover on API errors
- Vision agent support for image analysis

**Key Methods:**

```typescript
class AgentRunner {
  // Run agent with tool support and context injection
  async runAgent(
    agentType: AgentType,
    messages: Array<{ role: string; content: string }>,
    options?: {
      onStream?: (chunk: string) => void
      stream?: boolean
      onToolCall?: (toolCall: ToolCall) => Promise<any>
      chatId?: string  // For context injection
    }
  ): Promise<{ response: string; toolCalls: ToolCall[] }>
  
  // Run vision agent with image (using Bedrock Claude with vision)
  async runVisionAgent(
    agentType: AgentType,
    imageUrl: string,
    blueprintJson: string
  ): Promise<string>
  
  // Internal: Execute with automatic retry on Bedrock throttling
  private async executeWithRetry<T>(
    operation: (client: BedrockRuntimeClient) => Promise<T>,
    operationName: string
  ): Promise<T>
  
  // Internal: Classify throttling vs other errors
  private isThrottlingError(error: any): boolean
}
```

**Streaming Implementation (Bedrock ConverseStream API):**

```typescript
import { ConverseStreamCommand } from "@aws-sdk/client-bedrock-runtime";

// Streaming with tool call buffering using Bedrock ConverseStream
const command = new ConverseStreamCommand({
  modelId: agent.model,
  messages: messages.map(m => ({
    role: m.role,
    content: [{ text: m.content }]
  })),
  system: [{ text: systemPrompt }],
  inferenceConfig: {
    maxTokens: agent.maxTokens,
    temperature: agent.temperature,
  },
  toolConfig: tools.length > 0 ? {
    tools: tools.map(t => ({
      toolSpec: {
        name: t.name,
        description: t.description,
        inputSchema: { json: t.parameters }
      }
    }))
  } : undefined
});

const response = await bedrockClient.send(command);

let fullText = ""
const toolCalls: ToolCall[] = []

// Process streaming response
if (response.stream) {
  for await (const event of response.stream) {
    // Stream text content
    if (event.contentBlockDelta?.delta?.text) {
      fullText += event.contentBlockDelta.delta.text
      onStream?.(event.contentBlockDelta.delta.text)
    }
    
    // Handle tool use
    if (event.contentBlockStart?.start?.toolUse) {
      const toolUse = event.contentBlockStart.start.toolUse
      toolCalls.push({
        name: toolUse.name,
        arguments: JSON.parse(toolUse.input)
      })
    }
    
    // Message complete
    if (event.messageStop) {
      break
    }
  }
}

// Execute tool calls
for (const toolCall of toolCalls) {
  await onToolCall?.(toolCall)
}
```

### 3. BytezClient (Singleton)

**Location:** `lib/agents/orchestrator.ts`

**Responsibilities:**
- Maintain singleton OpenAI client instance with BYTEZ endpoint
- Connect to BYTEZ API service
- Handle API key rotation and failover
- Thread-safe instance management

**Implementation:**

```typescript
import OpenAI from "openai";

class BytezClient {
    private static instance: OpenAI | null = null
    private static currentKey: string | null = null
    private static isRefreshing: boolean = false
    
    static async getInstance(forceRefresh: boolean = false): Promise<OpenAI> {
        // Wait if another request is refreshing
        while (this.isRefreshing) {
            await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        const keyManager = KeyManager.getInstance();
        const activeKey = keyManager.getCurrentKey();

        if (!this.instance || this.currentKey !== activeKey || forceRefresh) {
            this.isRefreshing = true
            try {
                this.currentKey = activeKey;
                this.instance = new OpenAI({
                    apiKey: activeKey,
                    baseURL: "https://api.bytez.com/models/v2/openai/v1",
                    dangerouslyAllowBrowser: true
                });
                console.log(`🔌 BytezClient connected: ${keyManager.getStatus().split('\n')[0]}`);
            } finally {
                this.isRefreshing = false
            }
        }
        
        return this.instance
    }
}
```

### 4. KeyManager

**Location:** `lib/agents/key-manager.ts`

**Responsibilities:**
- Load and manage multiple BYTEZ API keys
- Automatic rotation on quota exhaustion
- Health tracking and metrics
- Toast notifications for key events

**Configuration:**

```typescript
// Environment variables support
// New numbered format: BYTEZ_API_KEY_1, BYTEZ_API_KEY_2, etc.
// Legacy format: BYTEZ_API_KEYS (comma-separated)
// Fallback: BYTEZ_API_KEY (single key)

// Supports up to 20 keys for maximum redundancy
for (let i = 1; i <= 20; i++) {
    const key = process.env[`BYTEZ_API_KEY_${i}`];
    if (key && key.trim().length > 0) {
        keys.push(key.trim());
    } else {
        break; // Stop at first gap
    }
}
```

**Service Clients:**

```typescript
// BYTEZ API Client (OpenAI-compatible)
import OpenAI from "openai";
const bytezClient = new OpenAI({
    apiKey: process.env.BYTEZ_API_KEY_1,
    baseURL: "https://api.bytez.com/models/v2/openai/v1"
});

// Supabase Client
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```


### 5. Agent Configuration System

**Location:** `lib/agents/config.ts`

**Agent Definitions:**

```typescript
export type AgentType = 
  | 'orchestrator'           // Intent classification
  | 'projectInitializer'     // First message handler
  | 'conversational'         // General conversation
  | 'bomGenerator'           // Parts selection
  | 'codeGenerator'          // Firmware generation
  | 'wiringDiagram'          // Assembly instructions
  | 'circuitVerifier'        // Image analysis
  | 'datasheetAnalyzer'      // PDF extraction
  | 'budgetOptimizer'        // Cost optimization
  | 'conversationSummarizer' // Context compression

export interface AgentConfig {
  name: string              // Display name
  model: string             // BYTEZ model ID
  systemPrompt: string      // Agent instructions
  maxTokens: number         // Response limit
  temperature: number       // Creativity (0-1)
  description: string       // Purpose
  icon: string              // Emoji for UI
}
```

**Model Assignments (BYTEZ API):**

| Agent | BYTEZ Model ID | Rationale |
|-------|----------------|-----------|
| Orchestrator | anthropic/claude-sonnet-4-5 | Fast routing, low latency |
| Project Initializer | anthropic/claude-opus-4-5 | Best conversational quality |
| Conversational | anthropic/claude-opus-4-5 | Elite reasoning for requirements |
| BOM Generator | anthropic/claude-opus-4-5 | Critical component selection |
| Code Generator | anthropic/claude-sonnet-4-5 | SOTA code generation |
| Wiring Diagram | anthropic/claude-sonnet-4-5 | Spatial reasoning |
| Circuit Verifier | google/gemini-2.5-flash | Vision capabilities for image analysis |
| Datasheet Analyzer | anthropic/claude-opus-4-5 | Document comprehension |
| Budget Optimizer | anthropic/claude-sonnet-4-5 | Multi-constraint optimization |
| Conversation Summarizer | anthropic/claude-sonnet-4-5 | Concise summarization |

**System Prompt Structure:**

Each agent has a carefully crafted system prompt with:
1. **Identity:** "You're [role] who [expertise]"
2. **Mission:** Clear objective and success criteria
3. **Constraints:** Rules and limitations
4. **Output Format:** Expected response structure
5. **Voice:** Personality and communication style

Example (BOM Generator):

```typescript
systemPrompt: `You're the components specialist whose BOMs have never caused a voltage mismatch fire. Your mantra: "Wrong parts waste more time than careful selection."

**Your job:** Turn requirements into a validated BOM that someone can actually buy and assemble without electrocuting their ESP32.

**Critical checks:**
1. **Power drama prevention** - 3.3V vs 5V mixups destroy components
2. **Real parts only** - Exact part numbers from DigiKey/Mouser/SparkFun
3. **Safety nets** - GPIO pins max 20-40mA, check I2C address conflicts

**CRITICAL - You MUST call BOTH tools in the SAME response:**
1. **open_bom_drawer()** - Opens the drawer immediately
2. **update_bom()** - Populate with validated component data

DO NOT use <BOM_CONTAINER> tags. Always use the tool calls.`
```

### 6. Tool System

**Location:** `lib/agents/tools.ts`

**Tool Categories:**

1. **Drawer Opening Tools** (No arguments, UI notification)
   - `open_context_drawer()`
   - `open_bom_drawer()`
   - `open_code_drawer()`
   - `open_wiring_drawer()`
   - `open_budget_drawer()`

2. **Content Update Tools** (With data, DB persistence)
   - `update_context(context: string)`
   - `update_mvp(mvp: string)`
   - `update_prd(prd: string)`
   - `update_bom(bomData: BOMData)`
   - `add_code_file(filename, language, content, description)`
   - `update_wiring(connections, instructions, warnings)`
   - `update_budget(originalCost, optimizedCost, recommendations)`

3. **File I/O Tools** (Read/write artifacts)
   - `read_file(artifact_type, file_path?)`
   - `write_file(artifact_type, content, merge_strategy?, file_path?, language?)`

**Tool Schema Example:**

```typescript
update_bom: {
  name: "update_bom",
  description: "Update the Bill of Materials drawer with validated component list...",
  parameters: {
    type: "object",
    properties: {
      project_name: { type: "string" },
      summary: { type: "string" },
      components: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            partNumber: { type: "string" },
            quantity: { type: "number" },
            voltage: { type: "string" },
            current: { type: "string" },
            estimatedCost: { type: "number" },
            supplier: { type: "string" },
            link: { type: "string" },
            notes: { type: "string" },
            alternatives: { type: "array", items: { type: "string" } }
          },
          required: ["name", "partNumber", "quantity"]
        }
      },
      totalCost: { type: "number" },
      powerAnalysis: { type: "object" },
      warnings: { type: "array", items: { type: "string" } },
      assemblyNotes: { type: "array", items: { type: "string" } }
    },
    required: ["project_name", "components", "totalCost"]
  }
}
```

**Tool Assignment by Agent:**

```typescript
export function getToolsForAgent(agentType: string): any[] {
  const toolMap: Record<string, string[]> = {
    conversational: [
      'read_file', 'write_file',
      'open_context_drawer', 'update_context', 'update_mvp', 'update_prd'
    ],
    projectInitializer: [
      'read_file', 'write_file',
      'open_context_drawer', 'update_context', 'update_mvp', 'update_prd'
    ],
    bomGenerator: [
      'read_file', 'write_file',
      'open_bom_drawer', 'update_bom'
    ],
    codeGenerator: [
      'read_file', 'write_file',
      'open_code_drawer', 'add_code_file'
    ],
    wiringDiagram: [
      'read_file', 'write_file',
      'open_wiring_drawer', 'update_wiring'
    ],
    budgetOptimizer: [
      'read_file', 'write_file',
      'open_budget_drawer', 'update_budget'
    ],
    conversationSummarizer: ['read_file'],
    orchestrator: [],
    circuitVerifier: [],
    datasheetAnalyzer: []
  }
  
  return toolMap[agentType]?.map(name => DRAWER_TOOLS[name]) || []
}
```

### 7. ToolExecutor

**Location:** `lib/agents/tool-executor.ts`

**Responsibilities:**
- Parse tool calls from agent responses
- Execute drawer-opening tools (emit UI events)
- Execute content-update tools (persist to database)
- Handle file I/O operations

**Key Methods:**

```typescript
class ToolExecutor {
  constructor(chatId: string)
  
  async executeToolCall(toolCall: ToolCall): Promise<void> {
    const { name, arguments: args } = toolCall
    
    // Drawer opening tools
    if (name.startsWith('open_')) {
      await this.handleDrawerOpen(name)
    }
    // Content update tools
    else if (name.startsWith('update_') || name === 'add_code_file') {
      await this.handleContentUpdate(name, args)
    }
    // File I/O tools
    else if (name === 'read_file' || name === 'write_file') {
      await this.handleFileIO(name, args)
    }
  }
  
  private async handleDrawerOpen(toolName: string): Promise<void>
  
  private async handleContentUpdate(toolName: string, args: any): Promise<void>
  
  private async handleFileIO(toolName: string, args: any): Promise<any>
}
```

**Tool Execution Flow:**

```typescript
// 1. Drawer Opening (UI notification only)
async handleDrawerOpen(toolName: string) {
  const drawerType = toolName.replace('open_', '').replace('_drawer', '')
  console.log(`🎨 Opening ${drawerType} drawer`)
  // Client receives tool_call event and opens drawer
}

// 2. Content Update (Database persistence)
async handleContentUpdate(toolName: string, args: any) {
  const artifactType = this.getArtifactType(toolName)
  
  // Create or get artifact container
  let artifact = await ArtifactService.getLatestArtifact(this.chatId, artifactType)
  if (!artifact) {
    artifact = await ArtifactService.createArtifact('system', {
      chat_id: this.chatId,
      type: artifactType,
      title: this.getArtifactTitle(artifactType)
    })
  }
  
  // Create new version
  const versionNumber = (artifact.current_version || 0) + 1
  await ArtifactService.createVersion({
    artifact_id: artifact.id,
    version_number: versionNumber,
    content: toolName === 'add_code_file' ? args.content : undefined,
    content_json: toolName !== 'add_code_file' ? args : undefined,
    filename: args.filename,
    language: args.language,
    file_path: args.file_path
  })
}
```

### 8. ConversationSummarizer

**Location:** `lib/agents/summarizer.ts`

**Responsibilities:**
- Generate incremental conversation summaries
- Reduce token usage for context injection
- Track project state evolution
- Store summaries as artifacts

**Key Methods:**

```typescript
class ConversationSummarizer {
  constructor(chatId: string)
  
  // Check if summary should be updated (every 5 messages)
  shouldUpdateSummary(messageCount: number): boolean
  
  // Initialize first summary
  async initializeSummary(userId: string): Promise<string>
  
  // Get current summary
  async getCurrentSummary(): Promise<{
    artifactId: string
    summary: ConversationSummary
  } | null>
  
  // Update summary with new messages
  async updateSummary(userId: string): Promise<void>
  
  // Get formatted summary for agent context
  async getSummaryForContext(): Promise<string>
}
```

**Summary Structure:**

```typescript
interface ConversationSummary {
  summary: string                    // Concise technical summary
  lastProcessedMessageId: string | null
  lastProcessedSequenceNumber: number
  messageCount: number
  projectSnapshot: {
    components: string[]             // ESP32, DHT22, etc.
    decisions: string[]              // Key technical decisions
    codeFiles: string[]              // main.cpp, config.h, etc.
    openQuestions: string[]          // Unresolved issues
  }
  updatedAt: string
}
```

**Summarization Trigger:**

```typescript
// In AssemblyLineOrchestrator.chat()
// After persisting assistant message
const summarizer = new ConversationSummarizer(this.chatId)
summarizer.updateSummary('system').catch(err => {
  console.error('[Orchestrator] Background summarization failed:', err)
})
```

**Summary Prompt:**

```typescript
// For incremental updates
`You are updating an existing IoT project summary in OHM.

**Current Summary:**
${currentSummary.summary}

**New messages to incorporate:**
${formatMessages(newMessages)}

**Update the summary** to include new information. Rules:
- Keep it under 400 words
- Preserve critical earlier context (components chosen, decisions made)
- Add new developments (code files created, wiring diagrams, parts added to BOM)
- Update project status
- Remove obsolete/superseded info
- Stay technical and concise

Return ONLY the updated summary text, no preamble.`
```

### 9. AgentContextBuilder

**Location:** `lib/agents/context-builder.ts`

**Responsibilities:**
- Retrieve conversation summaries
- Format context for agent system prompts
- Inject context dynamically before agent execution

**Implementation:**

```typescript
class AgentContextBuilder {
  constructor(chatId: string)
  
  async buildDynamicContext(): Promise<string | null> {
    const summarizer = new ConversationSummarizer(this.chatId)
    const current = await summarizer.getCurrentSummary()
    
    if (!current || current.summary.messageCount === 0) {
      return null
    }
    
    const snapshot = current.summary.projectSnapshot
    
    return `**CONVERSATION CONTEXT** (${current.summary.messageCount} messages):

${current.summary.summary}

**Quick Facts:**
- Components: ${snapshot.components.slice(0, 5).join(', ') || 'None yet'}
- Code Files: ${snapshot.codeFiles.slice(0, 3).join(', ') || 'None yet'}
- Open Questions: ${snapshot.openQuestions.length || 0}`
  }
}
```

**Context Injection in AgentRunner:**

```typescript
async runAgent(agentType, messages, options) {
  let systemPrompt = agent.systemPrompt
  
  if (options?.chatId) {
    const contextBuilder = new AgentContextBuilder(options.chatId)
    const dynamicContext = await contextBuilder.buildDynamicContext()
    
    if (dynamicContext) {
      systemPrompt = `${agent.systemPrompt}\n\n${dynamicContext}`
      console.log(`✅ Injected conversation context (${dynamicContext.length} chars)`)
    }
  }
  
  const fullMessages = [
    { role: "system", content: systemPrompt },
    ...messages
  ]
  
  // Continue with agent execution...
}
```

## Data Models

### Database Schema (Supabase PostgreSQL)

**PostgreSQL Tables:**

1. **chats** - Project containers
```sql
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  title TEXT,
  is_archived BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_created_at ON chats(created_at DESC);
```

2. **chat_sessions** - Multi-agent state
```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  current_agent TEXT,
  agent_context JSONB,
  is_plan_locked BOOLEAN DEFAULT false,
  locked_blueprint JSONB,
  budget_range TEXT,
  budget_target NUMERIC,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

3. **messages** - Conversation history
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  agent_name TEXT,
  agent_model TEXT,
  intent TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  created_artifact_ids UUID[],
  metadata JSONB,
  content_search TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(chat_id, sequence_number)
);

-- Indexes
CREATE INDEX idx_messages_chat_sequence ON messages(chat_id, sequence_number);
CREATE INDEX idx_messages_content_search ON messages USING GIN(content_search);
```

4. **artifacts** - Artifact containers
```sql
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  type TEXT NOT NULL CHECK (type IN (
    'context', 'mvp', 'prd', 'bom', 'code', 
    'wiring', 'circuit', 'budget', 'conversation_summary'
  )),
  title TEXT NOT NULL,
  current_version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_artifacts_chat_type ON artifacts(chat_id, type);
```

5. **artifact_versions** - Git-style versioning
```sql
CREATE TABLE artifact_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID REFERENCES artifacts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT,              -- For markdown (context, mvp, prd)
  content_json JSONB,        -- For structured data (bom, wiring, budget)
  filename TEXT,             -- For code files
  language TEXT,             -- For code files
  file_path TEXT,            -- For code files
  diagram_svg TEXT,          -- For wiring diagrams
  diagram_metadata JSONB,    -- For wiring diagrams
  fritzing_url TEXT,         -- For AI-generated breadboard images
  diagram_status TEXT,       -- queued, processing, completed, failed
  generation_attempts INTEGER DEFAULT 0,
  error_message TEXT,
  change_summary TEXT,
  parent_version_id UUID REFERENCES artifact_versions(id),
  created_by_message_id UUID REFERENCES messages(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(artifact_id, version_number)
);

-- Indexes
CREATE INDEX idx_artifact_versions_artifact ON artifact_versions(artifact_id, version_number DESC);
```
  voltage TEXT,
  current TEXT,
  estimated_cost NUMERIC,
  supplier TEXT,
  link TEXT,
  notes TEXT,
  alternatives JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Data Flow Diagrams

**Message Persistence Flow:**

```
User sends message
  ↓
API Route receives POST
  ↓
Orchestrator.chat() called
  ↓
1. Get history (SELECT messages WHERE chat_id = ?)
  ↓
2. Persist user message (INSERT INTO messages)
  ↓
3. Determine agent (first message → projectInitializer, else → classify intent)
  ↓
4. Run agent with streaming
  ↓
5. Agent calls tools (open_drawer, update_content)
  ↓
6. ToolExecutor persists artifacts
  ↓
7. Persist assistant message (INSERT INTO messages)
  ↓
8. Update session state (UPDATE chat_sessions)
  ↓
9. Trigger summarization (background, non-blocking)
  ↓
Client receives: text chunks, agent_selected, tool_call, metadata
```

**Artifact Versioning Flow:**

```
Agent calls update_bom(bomData)
  ↓
ToolExecutor.handleContentUpdate()
  ↓
1. Get or create artifact container
   SELECT * FROM artifacts WHERE chat_id = ? AND type = 'bom'
   (If not exists: INSERT INTO artifacts)
  ↓
2. Create new version
   INSERT INTO artifact_versions (
     artifact_id,
     version_number = current_version + 1,
     content_json = bomData
   )
  ↓
3. Update artifact version counter
   UPDATE artifacts SET current_version = current_version + 1
  ↓
Client queries latest version:
  SELECT av.* FROM artifact_versions av
  JOIN artifacts a ON a.id = av.artifact_id
  WHERE a.chat_id = ? AND a.type = 'bom'
  ORDER BY av.version_number DESC
  LIMIT 1
```


## Real-Time Subscription Architecture

### Supabase Real-time Implementation

**Location:** Client-side components

**Subscription Setup:**

```typescript
// In AIAssistantUI component
useEffect(() => {
  if (!chatId) return
  
  const channel = supabase
    .channel(`chat:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      },
      (payload) => {
        const newMessage = payload.new as Message
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.id === newMessage.id)) return prev
          return [...prev, newMessage]
        })
      }
    )
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}, [chatId])
```

**Real-time Events:**

1. **Message Insertion** - New messages appear instantly
2. **Artifact Updates** - Drawer content refreshes automatically
3. **Session State Changes** - Agent switches reflected in UI

**Optimistic Updates:**

```typescript
// Add message optimistically before API response
const optimisticMessage = {
  id: `temp-${Date.now()}`,
  role: 'user',
  content: input,
  created_at: new Date().toISOString()
}
setMessages(prev => [...prev, optimisticMessage])

// Send to API
const response = await fetch('/api/agents/chat', {
  method: 'POST',
  body: JSON.stringify({ message: input, chatId })
})

// Real message will arrive via subscription and replace optimistic one
```

## Streaming Response Implementation

### Server-Sent Events (SSE)

**API Route:** `app/api/agents/chat/route.ts`

**Stream Structure:**

```typescript
const stream = new ReadableStream({
  async start(controller) {
    const encoder = new TextEncoder()
    
    // 1. Agent Selection Event (Immediate)
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'agent_selected',
      agent: { type, name, icon, intent }
    })}\n\n`))
    
    // 2. Text Chunks (Streaming)
    orchestrator.chat(message, (chunk) => {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'text',
        content: chunk
      })}\n\n`))
    })
    
    // 3. Tool Call Events (As they occur)
    onToolCall: (toolCall) => {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'tool_call',
        toolCall: { name, arguments }
      })}\n\n`))
    }
    
    // 4. Key Rotation Events (If rotation occurs)
    onKeyRotation: (event) => {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'key_rotation',
        event: { type, failedKeyIndex, newKeyIndex, remainingKeys }
      })}\n\n`))
    }
    
    // 5. Final Metadata (After completion)
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'metadata',
      agent: { type, name, icon, intent },
      isReadyToLock: boolean,
      toolCalls: ToolCall[],
      keyRotationEvent: KeyRotationEvent | null
    })}\n\n`))
    
    controller.close()
  }
})

return new Response(stream, {
  headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  }
})
```

**Client-Side Consumption:**

```typescript
const response = await fetch('/api/agents/chat', {
  method: 'POST',
  body: JSON.stringify({ message, chatId })
})

const reader = response.body?.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  
  const chunk = decoder.decode(value)
  const lines = chunk.split('\n')
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6))
      
      switch (data.type) {
        case 'agent_selected':
          setCurrentAgent(data.agent)
          showToast(`${data.agent.icon} ${data.agent.name} is handling this`)
          break
          
        case 'text':
          setStreamingText(prev => prev + data.content)
          break
          
        case 'tool_call':
          handleToolCall(data.toolCall)
          break
          
        case 'key_rotation':
          showToast(`🔄 Switched to backup API key`, 'warning')
          break
          
        case 'metadata':
          finalizeMessage(data)
          break
      }
    }
  }
}
```

## Error Handling and Failover Mechanisms

### 1. API Key Rotation

**Trigger Conditions:**
- HTTP 429 (Rate Limit)
- HTTP 402 (Payment Required)
- Error message contains: 'quota', 'insufficient_quota', 'rate_limit', 'credits', 'billing', 'payment'

**Failover Flow:**

```typescript
async executeWithRetry<T>(operation, operationName) {
  const totalKeys = keyManager.getTotalKeys()
  let attempt = 0
  
  while (attempt < totalKeys) {
    try {
      const client = await BytezClient.getInstance()
      const result = await operation(client)
      keyManager.recordSuccess()
      return result
    } catch (error) {
      attempt++
      
      if (this.isQuotaError(error)) {
        // Mark key as failed permanently
        keyManager.markCurrentKeyAsFailed()
        
        // Try to rotate
        const rotated = keyManager.rotateKey()
        if (!rotated) {
          throw new Error(`All ${totalKeys} API keys exhausted`)
        }
        
        // Force client refresh and retry
        await BytezClient.getInstance(true)
        continue
      }
      
      // Non-quota error - don't retry
      throw error
    }
  }
  
  throw new Error(`Failed after ${totalKeys} attempts`)
}
```

### 2. Database Error Handling

**Retry Strategy:**

```typescript
async addMessage(message: MessageInsert) {
  let attempts = 0
  const maxAttempts = 2
  
  while (attempts < maxAttempts) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      attempts++
      if (attempts >= maxAttempts) throw error
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 100 * attempts))
    }
  }
}
```

### 3. Streaming Error Recovery

**Client-Side:**

```typescript
try {
  // Stream processing...
} catch (error) {
  console.error('Stream error:', error)
  
  // Show error to user
  setMessages(prev => [...prev, {
    id: `error-${Date.now()}`,
    role: 'assistant',
    content: `⚠️ Connection interrupted. Please try again.`,
    created_at: new Date().toISOString()
  }])
  
  // Reset streaming state
  setIsStreaming(false)
  setStreamingText('')
}
```

**Server-Side:**

```typescript
const stream = new ReadableStream({
  async start(controller) {
    try {
      // Agent execution...
    } catch (error) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'error',
        message: error.message
      })}\n\n`))
      controller.close()
    }
  }
})
```

### 4. Tool Execution Error Handling

**Non-Critical Failures:**

```typescript
async executeToolCall(toolCall: ToolCall) {
  try {
    // Execute tool...
  } catch (error) {
    console.error(`Tool execution failed: ${toolCall.name}`, error)
    // Don't throw - tool failures shouldn't break agent execution
    // Agent response will still be delivered to user
  }
}
```

### 5. Conversation Summarization Error Handling

**Background Processing:**

```typescript
// In AssemblyLineOrchestrator.chat()
const summarizer = new ConversationSummarizer(this.chatId)
summarizer.updateSummary('system').catch(err => {
  console.error('[Orchestrator] Background summarization failed:', err)
  // Don't throw - summarization is non-critical
  // Next summarization attempt will catch up
})
```

## UI Component Structure

### Component Hierarchy

```
BuildInterface (Main Container)
├── TopNavigationBar
│   ├── BackButton
│   ├── ProjectTitle
│   └── MissionStepper (Phase indicators)
│
├── ChatArea
│   ├── MessageList
│   │   ├── UserMessage
│   │   └── AssistantMessage
│   │       ├── AgentAvatar
│   │       ├── MessageContent
│   │       └── ArtifactIndicators (BOM Generated, Code Generated, etc.)
│   │
│   └── InputArea
│       ├── Textarea (Auto-resize)
│       └── SendButton
│
└── ArtifactSystem (Conditional render when showArtifacts = true)
    ├── ToolsSidebar (Fixed right side)
    │   ├── ContextIcon
    │   ├── BOMIcon
    │   ├── CodeIcon
    │   ├── WiringIcon
    │   └── BudgetIcon
    │
    └── Drawers (Slide in from right)
        ├── ContextDrawer (Context, MVP, PRD tabs)
        ├── BOMDrawer (Component table with costs)
        ├── CodeDrawer (File tree + syntax highlighting)
        ├── WiringDrawer (Connection table + instructions)
        └── BudgetDrawer (Cost comparison + recommendations)
```

### Key UI Components

**1. BuildInterface**

**Location:** `components/BuildInterface.tsx`

**State Management:**

```typescript
const [messages, setMessages] = useState<Message[]>([])
const [input, setInput] = useState('')
const [isThinking, setIsThinking] = useState(false)
const [currentPhase, setCurrentPhase] = useState<MissionPhase>('ideation')
const [completedPhases, setCompletedPhases] = useState<MissionPhase[]>([])
const [showArtifacts, setShowArtifacts] = useState(false)
const [activeTool, setActiveTool] = useState<ToolType>(null)

// Artifact data
const [bomData, setBomData] = useState<BOMData | null>(null)
const [codeData, setCodeData] = useState<CodeData | null>(null)
const [contextData, setContextData] = useState<ProjectContextData | null>(null)
```

**Message Parsing:**

```typescript
// Parse messages for artifacts on every update
useEffect(() => {
  if (messages.length === 0) return
  
  let foundBom: BOMData | null = null
  let foundCode: CodeData | null = null
  let accumulatedContext: ProjectContextData = { context: null, mvp: null, prd: null }
  
  // Iterate forwards (oldest → newest) to replay state evolution
  messages.forEach(msg => {
    if (msg.role === 'assistant') {
      const bom = extractBOMFromMessage(msg.content)
      if (bom) foundBom = bom
      
      const code = extractCodeFromMessage(msg.content)
      if (code) foundCode = code
      
      const ctx = extractContextFromMessage(msg.content)
      if (ctx.context || ctx.mvp || ctx.prd) {
        accumulatedContext = {
          context: ctx.context || accumulatedContext.context,
          mvp: ctx.mvp || accumulatedContext.mvp,
          prd: ctx.prd || accumulatedContext.prd
        }
      }
    }
  })
  
  // Update state
  if (foundBom) setBomData(foundBom)
  if (foundCode) setCodeData(foundCode)
  if (accumulatedContext.context || accumulatedContext.mvp || accumulatedContext.prd) {
    setContextData(accumulatedContext)
  }
}, [messages])
```

**2. AIAssistantUI**

**Location:** `components/ai_chat/AIAssistantUI.tsx`

**Streaming Handler:**

```typescript
const handleSendMessage = async () => {
  const userMessage = { id: tempId, role: 'user', content: input }
  setMessages(prev => [...prev, userMessage])
  setInput('')
  setIsStreaming(true)
  
  let streamingText = ''
  let currentAgent = null
  
  try {
    const response = await fetch('/api/agents/chat', {
      method: 'POST',
      body: JSON.stringify({ message: input, chatId })
    })
    
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))
          
          switch (data.type) {
            case 'agent_selected':
              currentAgent = data.agent
              setCurrentAgentInfo(data.agent)
              showToast(`${data.agent.icon} ${data.agent.name}`, 'info')
              break
              
            case 'text':
              streamingText += data.content
              setStreamingMessage({
                id: `streaming-${Date.now()}`,
                role: 'assistant',
                content: streamingText,
                agent_id: currentAgent?.type,
                agent_name: currentAgent?.name
              })
              break
              
            case 'tool_call':
              handleToolCall(data.toolCall)
              break
              
            case 'key_rotation':
              if (data.event.type === 'key_rotated') {
                showToast('🔄 Switched to backup API key', 'warning')
              } else if (data.event.type === 'all_keys_exhausted') {
                showToast('❌ All API keys exhausted', 'error')
              }
              break
              
            case 'metadata':
              // Finalize message
              const finalMessage = {
                id: data.messageId || `msg-${Date.now()}`,
                role: 'assistant',
                content: streamingText,
                agent_id: data.agent.type,
                agent_name: data.agent.name,
                created_at: new Date().toISOString()
              }
              setMessages(prev => {
                const withoutStreaming = prev.filter(m => !m.id.startsWith('streaming-'))
                return [...withoutStreaming, finalMessage]
              })
              break
          }
        }
      }
    }
  } catch (error) {
    console.error('Streaming error:', error)
    showToast('Connection interrupted', 'error')
  } finally {
    setIsStreaming(false)
    setStreamingMessage(null)
  }
}
```

**3. Drawer Components**

**Common Pattern:**

```typescript
interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  data?: ArtifactData
}

export default function ArtifactDrawer({ isOpen, onClose, data }: DrawerProps) {
  return (
    <div className={`fixed inset-y-0 right-0 w-[600px] bg-card border-l border-border
                     transform transition-transform duration-300 z-40
                     ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">Artifact Title</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {data ? (
            <ArtifactContent data={data} />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  )
}
```

**Drawer Types:**

1. **ContextDrawer** - Tabbed interface (Context, MVP, PRD)
2. **BOMDrawer** - Component table with costs, power analysis, warnings
3. **CodeDrawer** - File tree + syntax-highlighted code viewer
4. **WiringDrawer** - Connection table + step-by-step instructions
5. **BudgetDrawer** - Cost comparison + optimization recommendations

### Styling System

**Tailwind Configuration:**

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--primary))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        border: 'hsl(var(--border))',
        // ... more colors
      },
      animation: {
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out'
      }
    }
  }
}
```

**Custom CSS Classes:**

```css
/* globals.css */
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.border-dashed-tech {
  border: 1px dashed rgba(var(--primary), 0.3);
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
```

## Testing Strategy

### Unit Testing

**Target:** Individual functions and utilities

**Framework:** Jest + React Testing Library

**Coverage Areas:**
- Parser functions (extractBOMFromMessage, extractCodeFromMessage)
- Tool schema validation
- Key manager rotation logic
- Database service methods

**Example:**

```typescript
describe('extractBOMFromMessage', () => {
  it('should extract BOM data from XML container', () => {
    const message = `Here's your BOM:
    <BOM_CONTAINER>
    {"project_name": "Test", "components": []}
    </BOM_CONTAINER>`
    
    const result = extractBOMFromMessage(message)
    expect(result).toEqual({
      project_name: "Test",
      components: []
    })
  })
  
  it('should return null for messages without BOM', () => {
    const message = "Just a regular message"
    const result = extractBOMFromMessage(message)
    expect(result).toBeNull()
  })
})
```

### Integration Testing

**Target:** Agent → Database → UI flow

**Framework:** Playwright

**Test Scenarios:**
1. Complete project creation flow
2. Agent routing and tool execution
3. Real-time message synchronization
4. Artifact versioning
5. API key rotation

**Example:**

```typescript
test('should create project and generate BOM', async ({ page }) => {
  await page.goto('/build')
  
  // Enter project description
  await page.fill('textarea', 'Smart plant watering system')
  await page.click('button:has-text("Start")')
  
  // Wait for Project Initializer
  await page.waitForSelector('text=Project Initializer')
  
  // Answer questions
  await page.fill('textarea', 'Indoor, $50 budget')
  await page.click('button:has-text("Send")')
  
  // Request BOM
  await page.fill('textarea', 'Generate BOM')
  await page.click('button:has-text("Send")')
  
  // Verify BOM drawer opens
  await page.waitForSelector('[data-testid="bom-drawer"]')
  
  // Verify components are listed
  const components = await page.locator('[data-testid="bom-component"]').count()
  expect(components).toBeGreaterThan(0)
})
```

### Property-Based Testing

**Target:** Agent system prompts and tool schemas

**Framework:** fast-check

**Properties to Test:**
1. All agent system prompts contain required sections
2. Tool schemas have valid JSON structure
3. Agent routing is deterministic for same inputs
4. Key rotation always selects healthy keys

**Example:**

```typescript
import fc from 'fast-check'

test('agent routing is deterministic', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 100 }),
      async (userMessage) => {
        const orchestrator = new AssemblyLineOrchestrator('test-chat')
        
        // Run twice with same input
        const result1 = await orchestrator.classifyIntent(userMessage)
        const result2 = await orchestrator.classifyIntent(userMessage)
        
        // Should return same agent type
        expect(result1.agentType).toBe(result2.agentType)
      }
    )
  )
})
```

### End-to-End Testing

**Target:** Complete user workflows

**Framework:** Playwright + Real Database

**Test Scenarios:**
1. New user creates first project
2. Returning user continues existing project
3. Multi-device synchronization
4. API key exhaustion and recovery
5. Network interruption and reconnection

## Performance Considerations

### Optimization Strategies

1. **Database Indexing**
```sql
CREATE INDEX idx_messages_chat_sequence ON messages(chat_id, sequence_number);
CREATE INDEX idx_artifacts_chat_type ON artifacts(chat_id, type);
CREATE INDEX idx_artifact_versions_artifact ON artifact_versions(artifact_id, version_number DESC);
```

2. **Query Optimization**
```typescript
// Bad: N+1 query
for (const artifact of artifacts) {
  const versions = await getVersions(artifact.id)
}

// Good: Single query with join
const artifactsWithVersions = await supabase
  .from('artifacts')
  .select(`
    *,
    artifact_versions!inner(*)
  `)
  .eq('chat_id', chatId)
```

3. **Streaming Chunk Size**
```typescript
// Optimal chunk size for SSE: 1-4KB
const CHUNK_SIZE = 2048
let buffer = ''

for await (const chunk of stream) {
  buffer += chunk
  if (buffer.length >= CHUNK_SIZE) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: buffer })}\n\n`))
    buffer = ''
  }
}
```

4. **Client-Side Caching**
```typescript
// Cache artifact data to avoid re-parsing
const artifactCache = new Map<string, ArtifactData>()

function getArtifact(chatId: string, type: string): ArtifactData | null {
  const key = `${chatId}:${type}`
  if (artifactCache.has(key)) {
    return artifactCache.get(key)!
  }
  
  const artifact = fetchArtifact(chatId, type)
  artifactCache.set(key, artifact)
  return artifact
}
```

5. **Lazy Loading**
```typescript
// Load drawers only when opened
const BOMDrawer = lazy(() => import('./tools/BOMDrawer'))
const CodeDrawer = lazy(() => import('./tools/CodeDrawer'))

<Suspense fallback={<DrawerSkeleton />}>
  {activeTool === 'bom' && <BOMDrawer />}
  {activeTool === 'code' && <CodeDrawer />}
</Suspense>
```

## Security Considerations

### Row-Level Security (RLS)

**Supabase Policies:**

```sql
-- Users can only see their own chats
CREATE POLICY "Users can view own chats"
ON chats FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert messages to their own chats
CREATE POLICY "Users can insert own messages"
ON messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = messages.chat_id
    AND chats.user_id = auth.uid()
  )
);

-- Users can only view artifacts from their own chats
CREATE POLICY "Users can view own artifacts"
ON artifacts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = artifacts.chat_id
    AND chats.user_id = auth.uid()
  )
);
```

### API Key Protection

```typescript
// NEVER expose API keys to client
// Keys are loaded server-side only
const keys = process.env.BYTEZ_API_KEY_1  // Server environment only

// Client-side API calls go through Next.js API routes
// which run on the server
fetch('/api/agents/chat', {
  method: 'POST',
  body: JSON.stringify({ message })
})
```

### Input Validation

```typescript
// Validate all user inputs
export async function POST(req: NextRequest) {
  const { message, chatId } = await req.json()
  
  if (!message || typeof message !== 'string' || !message.trim()) {
    return new Response(JSON.stringify({ error: "Valid message required" }), {
      status: 400
    })
  }
  
  if (message.length > 10000) {
    return new Response(JSON.stringify({ error: "Message too long" }), {
      status: 400
    })
  }
  
  // Continue processing...
}
```

### XSS Prevention

```typescript
// React automatically escapes content
<div>{message.content}</div>  // Safe

// For markdown rendering, use sanitization
import DOMPurify from 'dompurify'

<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(markdownToHtml(message.content))
}} />
```

## Deployment Architecture

### Production Environment

**Hosting:** Vercel (Next.js optimized)
**Database:** Supabase (Managed PostgreSQL)
**AI Service:** BYTEZ API (Multi-region)

**Environment Variables:**

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# AI Service (Server-side only)
BYTEZ_API_KEY_1=sk-xxx...
BYTEZ_API_KEY_2=sk-xxx...
BYTEZ_API_KEY_3=sk-xxx...

# Application
NEXT_PUBLIC_APP_URL=https://ohm.app
NODE_ENV=production
```

### Scaling Considerations

1. **Horizontal Scaling** - Vercel auto-scales serverless functions
2. **Database Connection Pooling** - Supabase handles automatically
3. **CDN Caching** - Static assets cached at edge
4. **Rate Limiting** - Implemented at API route level

```typescript
// Simple rate limiting
const rateLimiter = new Map<string, number[]>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userRequests = rateLimiter.get(userId) || []
  
  // Remove requests older than 1 minute
  const recentRequests = userRequests.filter(t => now - t < 60000)
  
  if (recentRequests.length >= 60) {
    return false  // Exceeded 60 requests per minute
  }
  
  recentRequests.push(now)
  rateLimiter.set(userId, recentRequests)
  return true
}
```

## Monitoring and Observability

### Logging Strategy

```typescript
// Structured logging
console.log(`🤖 [${agentName}] Processing message`, {
  chatId,
  messageLength: message.length,
  intent,
  timestamp: new Date().toISOString()
})

// Error logging with context
console.error(`❌ [${agentName}] Failed to execute`, {
  error: error.message,
  stack: error.stack,
  chatId,
  userId,
  timestamp: new Date().toISOString()
})
```

### Metrics to Track

1. **Agent Performance**
   - Intent classification time
   - Agent response time
   - Tool execution time
   - Streaming latency

2. **API Health**
   - Key rotation frequency
   - Quota exhaustion events
   - Error rates by key
   - Success rates by agent

3. **User Engagement**
   - Messages per session
   - Artifacts generated per project
   - Session duration
   - Drawer open rates

4. **System Health**
   - Database query times
   - Real-time subscription count
   - Memory usage
   - CPU usage

### Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  const keyManager = KeyManager.getInstance()
  const healthyKeys = keyManager.getHealthyKeyCount()
  const totalKeys = keyManager.getTotalKeys()
  
  // Check database connection
  const { error: dbError } = await supabase.from('chats').select('id').limit(1)
  
  return Response.json({
    status: healthyKeys > 0 && !dbError ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: !dbError ? 'up' : 'down',
      ai_api: healthyKeys > 0 ? 'up' : 'down',
      keys: {
        healthy: healthyKeys,
        total: totalKeys
      }
    }
  })
}
```

---

## Conclusion

The OHM Hardware Orchestrator represents a sophisticated multi-agent AI system that transforms natural language descriptions into complete hardware prototypes. The architecture prioritizes:

1. **Modularity** - Each agent is independent and specialized
2. **Reliability** - Automatic failover and error recovery
3. **Performance** - Streaming responses and optimized queries
4. **Scalability** - Serverless architecture with connection pooling
5. **User Experience** - Real-time updates and intuitive UI

The system successfully bridges the gap between software and silicon, making hardware development accessible to makers of all skill levels.
