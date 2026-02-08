# 🔌 OHM - Hardware Lifecycle Orchestrator

## Complete Application Documentation v3.3 (Verified from Codebase)

**Last Updated: January 16, 2026**

---

## 📋 TABLE OF CONTENTS

1. [What is OHM?](#what-is-ohm)
2. [Technology Stack](#technology-stack)
3. [Multi-Agent AI System](#multi-agent-ai-system)
4. [✅ IMPLEMENTED FEATURES](#implemented-features)
5. [⚠️ PLANNED FEATURES (NOT YET IMPLEMENTED)](#planned-features-not-yet-implemented)
6. [User Flow](#user-flow)
7. [Project Architecture](#project-architecture)
8. [How to Run](#how-to-run)
9. [💰 Business Model](#business-model)

---

## 🎯 What is OHM?

**OHM** (named after "The path of least resistance") is an **AI-powered IoT/Hardware Development IDE** that bridges the gap between a **"Vague IoT Idea"** and a **"Working Physical Prototype"**.

Unlike standard AI IDEs that focus solely on code, **OHM manages the complex dependencies of the physical world**: hardware parts, electrical wiring, and software logic.

### The Problem OHM Solves

The **"Debug Wall"** in IoT is high: users often don't know if a project failed because of:

- A code bug
- A loose wire
- A blown sensor
- A power mismatch

**OHM removes these barriers** by acting as a **Lead Systems Engineer** that guides the user through a turn-based, "Mission-Based" progression.

---

## ⚙️ Technology Stack

| Category | Technology | Verified |
|----------|------------|----------|
| **Frontend Framework** | Next.js 15.1.6 with React 19 | ✅ |
| **Language** | TypeScript | ✅ |
| **Styling** | Tailwind CSS 3.4.17 | ✅ |
| **UI Components** | Radix UI + Ark UI | ✅ |
| **Animations** | Framer Motion | ✅ |
| **Icons** | Lucide React | ✅ |
| **Content Rendering** | React Markdown + remark-gfm | ✅ |
| **Database** | Supabase (PostgreSQL) | ✅ |
| **AI Integration** | BYTEZ API (OpenAI-compatible) | ✅ |
| **AI SDK** | OpenAI SDK v6.15.0 | ✅ |

---

## 🤖 Multi-Agent AI System

### Architecture Overview

OHM employs a **"Sequential Assembly Line"** architecture where specialized AI agents collaborate to guide a user from a vague idea to a fully verified hardware prototype.

**Verified from `lib/agents/config.ts`:**

```
User Query
    ↓
[Claude Sonnet 4.5] Orchestrator → Routes to:
    ↓
    ├─ [Claude Opus 4.5] ────────→ Project Initializer (first message)
    ├─ [Claude Opus 4.5] ────────→ Conversational Agent (subsequent)
    ├─ [Claude Opus 4.5] ────────→ BOM Generator
    ├─ [Claude Sonnet 4.5] ──────→ Code Generator
    ├─ [Claude Sonnet 4.5] ──────→ Wiring Specialist
    ├─ [Gemini 2.5 Flash] ───────→ Circuit Verifier (vision)
    ├─ [Claude Opus 4.5] ────────→ Datasheet Analyzer
    └─ [Claude Sonnet 4.5] ──────→ Budget Optimizer
```

### Agent Details (Verified from Config)

#### 1. Orchestrator

| Property | Value |
|----------|-------|
| **Model** | `anthropic/claude-sonnet-4-5` |
| **Temperature** | 0.1 (low for consistent routing) |
| **Max Tokens** | 150 |
| **Role** | Intent classification - routes to: CHAT, BOM, CODE, WIRING, CIRCUIT_VERIFY, DATASHEET, BUDGET |

#### 2. Project Initializer (First Message Only)

| Property | Value |
|----------|-------|
| **Model** | `anthropic/claude-opus-4-5` |
| **Temperature** | 0.7 |
| **Max Tokens** | 2000 |
| **Role** | Quick-start wizard - transforms vague ideas into concrete project direction |
| **Tools** | `read`, `write`, `open_drawer` |

#### 3. Conversational Agent (Subsequent Messages)

| Property | Value |
|----------|-------|
| **Model** | `anthropic/claude-opus-4-5` |
| **Temperature** | 0.8 (higher for creative conversation) |
| **Max Tokens** | 3000 |
| **Role** | The idea-to-blueprint translator - guides user through requirements |
| **Tools** | `read`, `write`, `open_drawer` |

#### 4. BOM Generator

| Property | Value |
|----------|-------|
| **Model** | `anthropic/claude-opus-4-5` |
| **Temperature** | 0.2 (low for precision) |
| **Max Tokens** | 25000 |
| **Role** | Creates validated Bill of Materials with voltage/current checks |
| **Tools** | `read`, `write`, `open_drawer` |

#### 5. Code Generator

| Property | Value |
|----------|-------|
| **Model** | `anthropic/claude-sonnet-4-5` |
| **Temperature** | 0.2 (low for consistent code) |
| **Max Tokens** | 16000 |
| **Role** | Writes production-ready firmware (Arduino C++, MicroPython) |
| **Tools** | `read`, `write`, `open_drawer` |

#### 6. Wiring Specialist

| Property | Value |
|----------|-------|
| **Model** | `anthropic/claude-sonnet-4-5` |
| **Temperature** | 0.15 (very low for precision) |
| **Max Tokens** | 4000 |
| **Role** | Creates step-by-step wiring instructions with safety warnings |
| **Tools** | `read`, `write`, `open_drawer` |

#### 7. Circuit Verifier (Vision Agent)

| Property | Value |
|----------|-------|
| **Model** | `google/gemini-2.5-flash` |
| **Temperature** | 0.3 |
| **Max Tokens** | 3000 |
| **Role** | Analyzes circuit photos to catch wiring mistakes |
| **Tools** | None (outputs JSON analysis) |

#### 8. Datasheet Analyzer

| Property | Value |
|----------|-------|
| **Model** | `anthropic/claude-opus-4-5` |
| **Temperature** | 0.25 |
| **Max Tokens** | 6000 |
| **Role** | Extracts critical specs from component datasheets |
| **Tools** | None (outputs JSON) |

#### 9. Budget Optimizer

| Property | Value |
|----------|-------|
| **Model** | `anthropic/claude-sonnet-4-5` |
| **Temperature** | 0.3 |
| **Max Tokens** | 25000 |
| **Role** | Finds cost savings without sacrificing quality |
| **Tools** | `read`, `write`, `open_drawer` |

#### 10. Conversation Summarizer (NEW)

| Property | Value |
|----------|-------|
| **Model** | `anthropic/claude-sonnet-4-5` |
| **Temperature** | 0.3 |
| **Max Tokens** | 2000 |
| **Role** | Maintains incremental conversation summaries and project state |
| **Trigger** | Runs in the background after assistant responses (about every 5 new messages) |
| **Storage** | Saves each version as a `conversation_summary` artifact in Supabase |

---

## 🔧 TOOLS & MCP INTEGRATION

### Overview

OHM uses a dual-layer tool system to extend AI agent capabilities:

1. **Internal Tools** - Native OHM tools for project management (drawers, updates, artifacts)
2. **MCP (Model Context Protocol)** - External tools for internet search, web scraping, and third-party integrations

### Internal Tool System (Simplified 4-Tool Interface)

**Verified from `lib/agents/tools.ts` and `lib/agents/tool-executor.ts`:**

OHM uses a simplified 4-tool interface that replaces 15 specialized tools. Each tool is flexible and works with all artifact types.

#### Core Tool Catalog

| Tool Name | Description | Parameters | Output |
|-----------|-------------|-----------|--------|
| `read` | Read any artifact (context, mvp, prd, bom, code, wiring, budget, conversation_summary) | `artifact_type`, `path` (optional) | Artifact content |
| `write` | Create/update any artifact with merge strategies | `artifact_type`, `content`, `merge_strategy`, `path`, `language` | Updated artifact |
| `delete` | Delete artifact or specific file within artifact | `artifact_type`, `path` (optional) | Deletion confirmation |
| `open_drawer` | Open any drawer (context, bom, code, wiring, budget) | `drawer` | Drawer UI event |

#### Artifact Types Supported

- `context` - Project overview, background, constraints
- `mvp` - MVP specification with core features
- `prd` - Product requirements document
- `bom` - Bill of materials with components
- `code` - Source code files (accumulates multiple files)
- `wiring` - Wiring connections and instructions
- `budget` - Budget optimization recommendations
- `conversation_summary` - (read-only) Incremental conversation summaries

#### Drawer Types

- `context` - Displays Context/MVP/PRD
- `bom` - Displays Bill of Materials
- `code` - Displays Code Files
- `wiring` - Displays Wiring Diagram
- `budget` - Displays Budget Analysis

#### Legacy Tool Support

All old tool names still work for backward compatibility:
- `update_context`, `update_mvp`, `update_prd` → `write(artifact_type='context'|'mvp'|'prd')`
- `update_bom` → `write(artifact_type='bom')`
- `add_code_file` → `write(artifact_type='code', path=...)`
- `update_wiring` → `write(artifact_type='wiring')`
- `update_budget` → `write(artifact_type='budget')`
- `read_file` → `read()`
- `write_file` → `write()`
- `open_context_drawer`, `open_bom_drawer`, etc. → `open_drawer(drawer=...)`

#### Tool Execution Flow

```
User Message
    ↓
Orchestrator (routes to appropriate agent)
    ↓
Specialized Agent (decides to call tool)
    ↓
Tool Executor (lib/agents/tool-executor.ts)
    ↓
    ├─ Routes to appropriate handler (read/write/delete/open_drawer)
    ├─ Validates tool arguments
    ├─ For write: Persists to Supabase (artifacts table)
    ├─ For write: Creates artifact version (Git-style versioning)
    ├─ For open_drawer: Triggers drawer auto-open event
    └─ Returns success/error to agent
    ↓
UI Updates (drawer opens with new content)
```

#### Drawer Auto-Open System

**Verified from `components/tools/` and event system:**

- When an agent calls a tool, the tool executor dispatches a `window.dispatchEvent('open-drawer')` event
- Corresponding drawer component listens for this event and automatically opens
- User can manually close drawers; they won't auto-reopen until chat restart
- Drawers subscribe to Supabase realtime updates for live artifact changes

**Example Event:**

```javascript
window.dispatchEvent(new CustomEvent('open-drawer', {
  detail: { drawerType: 'bom', artifactId: 'abc123' }
}));
```

### MCP (Model Context Protocol) Integration

**Status: 🚧 PLANNED - Infrastructure Ready**

MCP enables OHM agents to access external tools and data sources beyond the OHM ecosystem. This allows agents to search the internet, fetch real-time data, and interact with third-party APIs.

#### MCP Architecture

```
Agent Request
    ↓
MCP Client (lib/mcp/client.ts)
    ↓
    ├─ Internet Search Tool (Tavily/Perplexity API)
    ├─ Web Scraper Tool (Firecrawl/Jina AI)
    ├─ Component Database Tool (Octopart API)
    ├─ Datasheet Fetcher Tool (PDF extraction)
    └─ Supplier Pricing Tool (DigiKey/Mouser APIs)
    ↓
Structured Response → Agent
```

#### Planned MCP Tools

| MCP Tool | Provider | Purpose | Use Case |
|----------|----------|---------|----------|
| **Internet Search** | Tavily/Perplexity | Search web for component specs, tutorials, troubleshooting | "Find the latest ESP32 variant with Bluetooth 5.0" |
| **Web Scraper** | Firecrawl/Jina AI | Extract content from documentation pages | "Get setup instructions from Arduino docs" |
| **Component Database** | Octopart API | Search for electronic components with real-time availability | "Find alternatives to this out-of-stock sensor" |
| **Datasheet Fetcher** | PDF extraction | Download and parse component datasheets | "Extract pin configuration from datasheet" |
| **Supplier Pricing** | DigiKey/Mouser APIs | Get real-time pricing and stock levels | "Find cheapest supplier for this component" |
| **Image Analysis** | Vision API | Analyze circuit photos for verification | "Check if wiring matches the schematic" |

#### MCP Configuration

**Planned structure in `lib/mcp/config.ts`:**

```typescript
export const mcpTools = {
  internetSearch: {
    provider: 'tavily',
    apiKey: process.env.TAVILY_API_KEY,
    maxResults: 5,
    searchDepth: 'advanced'
  },
  componentSearch: {
    provider: 'octopart',
    apiKey: process.env.OCTOPART_API_KEY,
    includeAlternatives: true
  },
  supplierPricing: {
    providers: ['digikey', 'mouser', 'sparkfun'],
    apiKeys: {
      digikey: process.env.DIGIKEY_API_KEY,
      mouser: process.env.MOUSER_API_KEY
    }
  }
};
```

#### Agent Access to MCP Tools

Not all agents need access to all MCP tools. Access is granted based on agent role:

| Agent | MCP Tools Available |
|-------|---------------------|
| Conversational | Internet Search, Web Scraper |
| BOM Generator | Component Database, Supplier Pricing, Datasheet Fetcher |
| Code Generator | Internet Search, Web Scraper |
| Wiring Specialist | Datasheet Fetcher, Internet Search |
| Circuit Verifier | Image Analysis |
| Datasheet Analyzer | Datasheet Fetcher |
| Budget Optimizer | Supplier Pricing, Component Database |

#### Implementation Status

**What EXISTS:**

- ✅ Tool executor framework supports external tool calls
- ✅ Agent configuration allows tool whitelisting
- ✅ Error handling for API failures

**What's NEEDED:**

- ❌ MCP client implementation (`lib/mcp/client.ts`)
- ❌ API integrations with Tavily, Octopart, DigiKey, Mouser
- ❌ Rate limiting and caching for external API calls
- ❌ Cost tracking for MCP tool usage (for premium tier limits)
- ❌ Fallback mechanisms when external APIs are unavailable

### Tool Usage Analytics

**Planned for Premium Tier:**

Track tool usage to provide insights and enforce limits:

- **Free Tier**: 50 internal tool calls + 10 MCP tool calls per month
- **Premium Tier**: Unlimited internal tools + 500 MCP tool calls per month
- **Enterprise Tier**: Unlimited everything + dedicated API quotas

**Tracking Metrics:**

- Tool call frequency per agent
- MCP API costs per project
- Success/failure rates for external tools
- Average response time for tool execution

---

## ✅ IMPLEMENTED FEATURES

### 1. 🎨 UI & Design System

**Verified Components:**

- **Landing Page** (`components/LandingPage.tsx`)
- **Project Creator** (`components/text_area/ProjectCreator.tsx`) - with user level/complexity selection
- **AI Chat Interface** (`components/ai_chat/AIAssistantUI.jsx`) - full chat UI
- **Sidebar** with conversation history, folders, templates
- **Header** with agent dropdown selector
- **Theme Toggle** (dark/light mode with localStorage persistence)
- **Mesh Gradient** background effects
- **Faulty Terminal** animation component

### 2. 🤖 Real AI Integration (Fully Working)

**Verified from `lib/agents/orchestrator.ts` and API routes:**

- ✅ **BYTEZ API Integration** via OpenAI-compatible endpoint
- ✅ **Multi-Agent Orchestration** - automatic routing based on intent
- ✅ **Streaming Responses** - real-time token-by-token updates
- ✅ **API Key Failover** - automatic rotation on quota errors (`lib/agents/key-manager.ts`)
- ✅ **Tool Calling** - agents can call structured tools
- ✅ **SSE (Server-Sent Events)** for streaming (`app/api/agents/chat/route.ts`)

### 3. 🛠️ Tool System (Fully Implemented - Simplified 4-Tool Interface)

**Verified from `lib/agents/tools.ts` and `lib/agents/tool-executor.ts`:**

OHM uses a simplified 4-tool interface that replaces 15 specialized tools:

| Tool | Description | All Agents |
|------|-------------|-----------|
| `read` | Read any artifact (context, mvp, prd, bom, code, wiring, budget, conversation_summary) | ✅ |
| `write` | Create/update any artifact with merge strategies (replace/append/merge) | ✅ |
| `delete` | Delete artifact or specific file within artifact | ✅ |
| `open_drawer` | Open any drawer (context, bom, code, wiring, budget) | ✅ |

**Benefits:**
- Simpler API (4 tools instead of 15)
- More flexible (single `write` tool handles all artifact types)
- Easier to extend (adding new artifact types doesn't require new tools)
- Backward compatible (old tool names still work)

### 4. 📦 Drawer System (Fully Implemented)

**Verified from `components/tools/` directory:**

| Drawer | File | Status |
|--------|------|--------|
| **Context Drawer** | `ContextDrawer.tsx` | ✅ Full - Displays Context/MVP/PRD with tree navigation |
| **BOM Drawer** | `BOMDrawer.tsx` | ✅ Full - Component list with pricing and warnings |
| **Code Drawer** | `CodeDrawer.tsx` | ✅ Full - File tree with syntax highlighting |
| **Wiring Drawer** | `WiringDrawer.tsx` | ✅ Full - Connection table and instructions |
| **Budget Drawer** | `BudgetDrawer.tsx` | ✅ Full - Cost comparison and recommendations |
| **Resizable Drawer** | `ResizableDrawer.tsx` | ✅ Base component for drawer resizing |

**Auto-Open Behavior:**

- Drawers automatically open when agents call their corresponding tools
- User can close drawers; they won't auto-reopen until chat restart
- Event-driven via `window.dispatchEvent('open-drawer')`

### 5. 💾 Database Integration (Supabase)

**Verified from `lib/db/` and realtime subscriptions:**

- ✅ **Chat Persistence** (`lib/db/chat.ts`)
  - `createChat()`, `getMessages()`, `addMessage()`
  - `updateSession()`, `getNextSequenceNumber()`
- ✅ **Artifact Storage** (`lib/db/artifacts.ts`)
  - `createArtifact()`, `createVersion()`, `getLatestArtifact()`
  - Git-style versioning for all artifacts
- ✅ **Realtime Subscriptions**
  - Messages update live via Postgres changes
  - Artifacts refresh when new versions are created
- ✅ **Tables Used**: `chats`, `chat_sessions`, `messages`, `artifacts`, `artifact_versions`

### 6. 🔔 Toast Notification System

**Verified from `lib/agents/toast-notifications.ts`:**

- ✅ **Agent Change Toasts** - "🤖 [Agent Name] is handling this"
- ✅ **Tool Call Toasts** - "🔧 Agent called [tool_name]"
- ✅ **API Key Failure Toasts** - "⚠️ Key [X] exhausted"
- ✅ **API Key Rotation Toasts** - "✅ Switched to backup key [X]"

### 7. 👤 User Context System

**Verified from `components/text_area/ProjectCreator.tsx` and agent config:**

- ✅ **User Experience Level Selection**: Beginner, Intermediate, Advanced
- ✅ **Project Complexity Selection**: Simple, Moderate, Complex
- ✅ **Dynamic System Prompt Customization** via `getContextualSystemPrompt()`

**How it adapts:**

| Level | Communication Style |
|-------|---------------------|
| Beginner | Simple terms, explain concepts, be encouraging |
| Intermediate | Standard terminology, best practices |
| Advanced | Technical language, tradeoffs, optimizations |

| Complexity | Project Scope |
|------------|---------------|
| Simple | 3-5 components, prioritize ease |
| Moderate | 5-10 components, balanced |
| Complex | 10+ components, production-ready |

### 8. 🏷️ Dynamic Chat Titles

**Verified from `app/api/agents/title/route.ts`:**

- ✅ AI-generated titles (3-6 words) from first user message
- ✅ Background generation after chat creation
- ✅ Uses orchestrator agent for fast generation

### 9. 📊 Message & Artifact Rendering

**Verified from `components/ai_chat/Message.jsx`:**

- ✅ **Markdown Rendering** with ReactMarkdown
- ✅ **BOM Inline Display** - BOMCard component renders when BOM tool is called
- ✅ **Code Block Parsing** - Syntax highlighted code blocks
- ✅ **Drawer Link Buttons** - "Open [X] Drawer >" buttons appear after tool calls

### 10. 🔄 Streaming Architecture

**Verified from `lib/hooks/use-chat.ts` and API route:**

- ✅ **SSE Stream Parsing** with proper event handling
- ✅ **Event Types**: `text`, `agent_selected`, `tool_call`, `metadata`, `error`
- ✅ **Optimistic Updates** - User messages appear immediately
- ✅ **Real-time AI Response** - Characters stream as generated

### 11. 📝 Conversation Summarizer

**Verified from `lib/agents/summarizer.ts`, `lib/agents/config.ts`, and `components/tools/ConversationSummaryDrawer.tsx`:**

- ✅ **Incremental Summaries** – Updates the conversation summary approximately every 5 new messages instead of re-reading full history
- ✅ **Background Processing** – Runs after messages are saved and never blocks user responses
- ✅ **Artifact Storage** – Persists each summary as a versioned `conversation_summary` artifact in Supabase
- ✅ **Project Snapshot** – Extracts components, code files, and open questions into a structured snapshot for quick reference
- ✅ **Real-time Drawer** – `ConversationSummaryDrawer` subscribes to artifact version changes to show live updates
- ✅ **Context for Agents (Planned Usage)** – Designed so downstream agents can rely on the summary + last few messages instead of the entire history to cut context tokens

---

## ⚠️ PLANNED FEATURES (NOT YET IMPLEMENTED)

> **🚨 WARNING: The features listed below are from OLD documentation and have NOT been fully wired up or tested. The infrastructure exists but end-to-end functionality is incomplete.**

### 🔌 WIRING DIAGRAM VISUAL GENERATION (IMPLEMENTED)

> ✅ **STATUS: FULLY IMPLEMENTED WITH SVG + AI IMAGE GENERATION**

**What EXISTS:**

- ✅ `update_wiring` tool defined in `tools.ts`
- ✅ `WiringDrawer.tsx` component with table UI
- ✅ Tool executor persists wiring data to database
- ✅ **SVG schematic generation** via `visual-wiring-pipeline.ts` (synchronous, ~500ms)
- ✅ **AI breadboard image generation** via BYTEZ API (asynchronous background process)
- ✅ Automatic diagram generation when wiring tool is called
- ✅ Diagrams stored in `artifact_versions.diagram_svg` and `diagram_image_url` fields

**How it works:**

1. Agent calls `update_wiring` tool with connections
2. Tool executor immediately generates SVG schematic (fast)
3. Background process generates AI breadboard image (slower, doesn't block response)
4. Both diagrams saved to database and displayed in WiringDrawer

### 💰 BUDGET OPTIMIZATION (PARTIAL)

> ⚠️ **STATUS: TOOL EXISTS, OPTIMIZATION LOGIC NOT FULLY TESTED**

**What EXISTS:**

- ✅ `update_budget` tool defined
- ✅ `BudgetDrawer.tsx` component
- ✅ Budget Optimizer agent configured

**What's MISSING:**

- ❌ No actual supplier API integration for real pricing
- ❌ No automated bulk discount calculation
- ❌ End-to-end flow not thoroughly tested

### 👁️ CIRCUIT VERIFICATION (PARTIAL)

> ⚠️ **STATUS: AGENT EXISTS, NO UI FOR PHOTO UPLOAD**

**What EXISTS:**

- ✅ `circuitVerifier` agent configured with Gemini 2.5 Flash
- ✅ `runVisionAgent()` method in orchestrator
- ✅ System prompt for circuit analysis

**What's MISSING:**

- ❌ No photo upload UI in the chat interface
- ❌ No `/api/agents/verify/route.ts` implementation for frontend
- ❌ Cannot trigger vision verification from user action

### 📄 DATASHEET ANALYSIS (PARTIAL)

> ⚠️ **STATUS: AGENT EXISTS, NO FILE UPLOAD**

**What EXISTS:**

- ✅ `datasheetAnalyzer` agent configured
- ✅ System prompt for extraction

**What's MISSING:**

- ❌ No PDF/file upload UI
- ❌ No integration with document parsing
- ❌ Not triggerable from user action

### 🔗 RIPPLE EFFECT ENGINE (NOT IMPLEMENTED)

> ⚠️ **STATUS: OLD DOCUMENTATION - CONCEPT ONLY**

**What's MISSING:**

- ❌ No dependency monitoring between parts
- ❌ No automatic conflict detection when parts change
- ❌ No cascading update system

### 🔒 LOCKED PROJECT BLUEPRINT (PARTIAL)

> ⚠️ **STATUS: CONCEPT EXISTS, NOT ENFORCED**

**What EXISTS:**

- ✅ Agents mention "Lock" in responses
- ✅ `isReadyToLock` flag returned from orchestrator

**What's MISSING:**

- ❌ No actual "lock" action that freezes project state
- ❌ No "Golden Blueprint" JSON generation as single source of truth
- ❌ Parts can be changed after "locking"

### 🌐 COMMUNITY MARKETPLACE (PLANNED)

> 📋 **STATUS: CONCEPT - NOT YET IMPLEMENTED**

**Vision:**

Create a community-driven marketplace where users can share their successful hardware projects as templates for others to learn from and build.

**Planned Features:**

#### 1. Public Project Sharing

- Users can mark their completed chats as "Public Templates"
- Public templates appear in a community marketplace/gallery
- Each template includes:
  - AI-generated README/guidebook
  - Complete BOM with affiliate links
  - Full conversation history (optional)
  - Code files and wiring diagrams
  - Difficulty level and estimated cost

#### 2. AI-Generated Guidebook

- When a user publishes a template, AI analyzes the entire conversation
- Generates a step-by-step tutorial covering:
  - Project overview and goals
  - Required components (with affiliate links)
  - Assembly instructions
  - Code walkthrough
  - Testing and troubleshooting tips
- Guidebook is formatted as a polished README.md

#### 3. Template Browsing & Discovery

- Search and filter by:
  - Project category (Home Automation, Robotics, Sensors, etc.)
  - Difficulty level (Beginner, Intermediate, Advanced)
  - Budget range
  - Components used
- Featured projects and trending builds
- User ratings and comments

#### 4. Two Viewing Modes

- **Guided Mode**: Follow the AI-generated step-by-step guidebook
- **Conversation Mode**: View the original chat history to see how the project evolved

#### 5. Monetization Integration

- **Affiliate Marketing**: Component links use affiliate codes
- **Revenue Share**: Template creators earn a percentage of affiliate commissions
- **Premium Features**: Advanced templates or exclusive content for paid users

**Implementation Requirements:**

- Database schema for public templates
- Template publishing workflow
- AI guidebook generation agent
- Community marketplace UI
- Affiliate link management system
- Analytics for tracking conversions

---

## 🚶 User Flow

### Phase 1: Landing Page (`/`)

- Hero section with "The path of least resistance"
- Feature showcase
- "Start Building" button → navigates to `/build`

### Phase 2: Project Creator (`/build`)

- **User selects**: Experience Level + Project Complexity
- **User enters**: Project description
- **User clicks**: "Start Building"
- → Creates chat in Supabase
- → Navigates to `/build/[chatId]`

### Phase 3: AI Chat (`/build/[chatId]`)

1. **First Message**: Handled by `projectInitializer` agent
   - Suggests 2-3 approaches (Simple/IoT/Advanced)
   - Asks 2-3 critical questions

2. **Subsequent Messages**: Routed by `orchestrator`
   - Intent detection → routes to appropriate specialist
   - Tools are called → drawers auto-open

3. **Artifacts Generated**:
   - Context/MVP/PRD → Context Drawer
   - BOM → BOM Drawer
   - Code → Code Drawer
   - Wiring → Wiring Drawer
   - Budget → Budget Drawer

---

## 🏗️ Project Architecture

### Directory Structure

```
OHM/
├── app/
│   ├── api/agents/
│   │   ├── chat/route.ts      # Main chat endpoint (SSE streaming)
│   │   ├── blueprint/route.ts # BOM generation endpoint
│   │   ├── code/route.ts      # Code generation endpoint
│   │   ├── title/route.ts     # Dynamic title generation
│   │   └── verify/route.ts    # Circuit verification endpoint
│   ├── build/
│   │   └── page.tsx           # Build page with chat ID routing
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx               # Landing page
│
├── components/
│   ├── ai_chat/
│   │   ├── AIAssistantUI.jsx  # Main chat interface
│   │   ├── Message.jsx        # Message rendering with BOM/code
│   │   ├── Sidebar.jsx        # Conversation list
│   │   ├── Header.jsx         # Agent dropdown
│   │   ├── Composer.jsx       # Message input
│   │   └── ChatPane.jsx       # Chat area wrapper
│   │
│   ├── tools/
│   │   ├── BOMDrawer.tsx      # Bill of Materials display
│   │   ├── CodeDrawer.tsx     # Code file browser
│   │   ├── ContextDrawer.tsx  # Context/MVP/PRD display
│   │   ├── WiringDrawer.tsx   # Wiring connections table
│   │   ├── BudgetDrawer.tsx   # Budget optimization
│   │   └── ResizableDrawer.tsx # Base drawer component
│   │
│   ├── text_area/
│   │   └── ProjectCreator.tsx # Initial project setup form
│   │
│   └── ui/                    # Radix-based UI primitives
│
├── lib/
│   ├── agents/
│   │   ├── config.ts          # Agent configurations & prompts
│   │   ├── orchestrator.ts    # Multi-agent orchestration
│   │   ├── tools.ts           # Tool definitions
│   │   ├── tool-executor.ts   # Tool execution & DB persistence
│   │   ├── key-manager.ts     # API key rotation
│   │   └── toast-notifications.ts
│   │
│   ├── db/
│   │   ├── chat.ts            # Chat CRUD operations
│   │   └── artifacts.ts       # Artifact CRUD operations
│   │
│   ├── hooks/
│   │   ├── use-chat.ts        # Chat state & streaming
│   │   └── use-chat-list.ts   # Chat list for sidebar
│   │
│   ├── supabase/
│   │   ├── client.ts          # Supabase client
│   │   └── types.ts           # Generated types
│   │
│   └── parsers.ts             # BOM/Code/Context parsing utilities
│
└── context_docs/              # Documentation
```

---

## 🚀 How to Run

### Prerequisites

- Node.js 18+
- Supabase project (for database)
- BYTEZ API key

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local` with:

```bash
# BYTEZ API Keys (supports multiple for failover)
BYTEZ_API_KEY=your_key_1
BYTEZ_API_KEY_2=your_key_2
BYTEZ_API_KEY_3=your_key_3

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Access the Application

- **Landing**: http://localhost:3000
- **Build**: http://localhost:3000/build

---

## 📊 Agent Model Summary

| Agent | Model | Purpose | Tools |
|-------|-------|---------|-------|
| Orchestrator | `anthropic/claude-sonnet-4-5` | Fast intent routing | None |
| Project Initializer | `anthropic/claude-opus-4-5` | First message handling | `read`, `write`, `open_drawer` |
| Conversational | `anthropic/claude-opus-4-5` | General conversation | `read`, `write`, `open_drawer` |
| BOM Generator | `anthropic/claude-opus-4-5` | Component selection | `read`, `write`, `open_drawer` |
| Code Generator | `anthropic/claude-sonnet-4-5` | Firmware generation | `read`, `write`, `open_drawer` |
| Wiring Specialist | `anthropic/claude-sonnet-4-5` | Connection instructions | `read`, `write`, `open_drawer` |
| Circuit Verifier | `google/gemini-2.5-flash` | Vision analysis | None |
| Datasheet Analyzer | `anthropic/claude-opus-4-5` | Document extraction | None |
| Budget Optimizer | `anthropic/claude-sonnet-4-5` | Cost optimization | `read`, `write`, `open_drawer` |
| Conversation Summarizer | `anthropic/claude-sonnet-4-5` | Summary generation | `read` |

---

## ✅ Summary

### What's Fully Working

- Multi-agent AI system with 10 specialized agents (including Conversation Summarizer)
- Streaming chat with real-time responses
- Tool calling with auto-opening drawers
- Full database persistence (Supabase)
- Context/MVP/PRD generation
- BOM generation with inline display
- Code generation with file tree
- **Wiring diagram generation (SVG + AI breadboard images)**
- Budget optimization display
- Toast notifications (agent changes, tool calls, API key rotation)
- Dynamic chat titles
- User level/complexity customization
- API key failover with automatic rotation
- Realtime artifact updates via Supabase subscriptions
- Incremental conversation summarization

### What Needs Work

- Photo upload for circuit verification
- PDF upload for datasheet analysis
- Project locking mechanism
- Ripple effect engine
- Real supplier pricing integration
- Community marketplace implementation

---

## 💰 BUSINESS MODEL

OHM's revenue strategy combines multiple streams to create a sustainable and scalable business:

### 1. Affiliate Marketing (Primary Revenue)

**How it works:**

- When OHM generates a BOM (Bill of Materials), each component includes a direct purchase link
- Links use affiliate codes from major electronics distributors:
  - DigiKey
  - Mouser Electronics
  - SparkFun
  - Adafruit
  - Amazon
- OHM earns a commission (typically 3-8%) on every component purchased through these links
- **Revenue Share**: Template creators in the Community Marketplace earn 50% of affiliate commissions from their published projects

**Why this works:**

- Users need to buy components anyway - we make it convenient
- No additional cost to users (affiliate commissions are paid by distributors)
- Scales naturally with user growth
- Incentivizes quality templates in the marketplace

### 2. Tiered Model Access (Freemium)

**Free Tier:**

- Access to basic AI models (Claude Sonnet 4.5, Gemini 2.5 Flash)
- Limited to 10 projects per month
- Standard response times
- Access to community templates

**Premium Tier ($19/month or $190/year):**

- Access to best-in-class models (Claude Opus 4.5 for all agents)
- Unlimited projects
- Priority response times (faster API routing)
- Advanced features:
  - Circuit verification with photo upload
  - Datasheet analysis
  - Budget optimization with real-time pricing
  - Private project templates
- Early access to new features
- Premium support

**Enterprise Tier (Custom Pricing):**

- White-label deployment
- Custom model fine-tuning
- Dedicated infrastructure
- Team collaboration features
- API access for integration
- SLA guarantees

### 3. Additional Revenue Streams (Future)

- **Sponsored Components**: Manufacturers pay to feature their products in BOM recommendations
- **Premium Templates**: Expert-created project templates sold in marketplace
- **Educational Partnerships**: Licensing to universities and coding bootcamps
- **Hardware Kits**: Pre-packaged component kits for popular projects
- **API Access**: Developers pay to integrate OHM's AI into their tools

### Revenue Projections (Year 1)

- **Affiliate Marketing**: 60% of revenue
- **Premium Subscriptions**: 35% of revenue
- **Other**: 5% of revenue

**Target Metrics:**

- 10,000 free users → 1,000 premium conversions (10% conversion rate)
- Average affiliate commission per project: $5-15
- Premium subscription: $19/month
- Estimated Year 1 Revenue: $300K-500K

---

*Documentation verified from codebase on January 16, 2026*

**Happy Building with OHM! ⚡🔌**