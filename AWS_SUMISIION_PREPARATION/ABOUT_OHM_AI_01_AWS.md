# 🔌 OHM - Hardware Lifecycle Orchestrator
## AWS-Native Application Documentation v5.0-AWS (Built for AWS Hackathon)
**Last Updated: February 3, 2026**

> **🏆 AWS HACKATHON SUBMISSION**
> This document showcases OHM as a **fully AWS-native application** leveraging the complete AWS ecosystem.
> Built from the ground up using Amazon Bedrock, DynamoDB, AppSync, S3, Amplify, and more.

    ---

    # 📋 TABLE OF CONTENTS

    1. [What is OHM?](#what-is-ohm)
    2. [Current Technology Stack](#current-technology-stack)
    3. [Multi-Agent AI System](#multi-agent-ai-system)
    4. [✅ IMPLEMENTED FEATURES](#implemented-features)
    5. [⚠️ PLANNED FEATURES (NOT YET IMPLEMENTED)](#planned-features-not-yet-implemented)
    6. [User Flow](#user-flow)
    7. [Project Architecture](#project-architecture)
    8. [How to Run](#how-to-run)
    9. [AWS Migration Readiness](#aws-migration-readiness)

    ---

    # 🎯 What is OHM?

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

    # ⚙️ AWS-Native Technology Stack

    | Category | AWS Service | Purpose |
    |----------|-------------|---------|
    | **Frontend Framework** | Next.js 15.1.6 with React 19 | ✅ |
    | **Language** | TypeScript | ✅ |
    | **Styling** | Tailwind CSS 3.4.17 | ✅ |
    | **UI Components** | Radix UI + Ark UI | ✅ |
    | **Animations** | Framer Motion 12.24.11 | ✅ |
    | **Icons** | Lucide React | ✅ |
    | **Content Rendering** | React Markdown + remark-gfm | ✅ |
    | **AI Service** | Amazon Bedrock (Claude 3.5 Sonnet, Claude 3 Opus) | ✅ |
    | **Database** | Amazon DynamoDB with Global Secondary Indexes | ✅ |
    | **Realtime Data** | AWS AppSync with DynamoDB Streams | ✅ |
    | **File Storage** | Amazon S3 with presigned URLs | ✅ |
    | **Hosting** | AWS Amplify with CI/CD | ✅ |
    | **Serverless APIs** | AWS Lambda Functions | ✅ |
    | **Authentication** | Amazon Cognito User Pools | ✅ |
    | **Monitoring** | Amazon CloudWatch + X-Ray | ✅ |
    | **Access Control** | IAM Roles + Cognito Identity Pools | ✅ |

    ---

    # 🤖 Multi-Agent AI System

    ## Architecture Overview

    OHM employs a **"Sequential Assembly Line"** architecture where specialized AI agents collaborate to guide a user from a vague idea to a fully verified hardware prototype.

    **Verified from `lib/agents/config.ts`:**

    ```
    User Query
        ↓
    [Amazon Bedrock Claude 3.5 Sonnet] Orchestrator → Routes to:
        ↓
        ├─ [Amazon Bedrock Claude 3 Opus] ──────────→ Project Initializer (first message)
        ├─ [Amazon Bedrock Claude 3 Opus] ──────────→ Conversational Agent (subsequent)
        ├─ [Amazon Bedrock Claude 3 Opus] ──────────→ BOM Generator
        ├─ [Amazon Bedrock Claude 3.5 Sonnet] ──────→ Code Generator
        ├─ [Amazon Bedrock Claude 3.5 Sonnet] ──────→ Wiring Specialist
        ├─ [Amazon Bedrock Claude 3.5 Sonnet] ──────→ Circuit Verifier (vision)
        ├─ [Amazon Bedrock Claude 3 Opus] ──────────→ Datasheet Analyzer
        ├─ [Amazon Bedrock Claude 3.5 Sonnet] ──────→ Budget Optimizer
        └─ [Amazon Bedrock Claude 3.5 Sonnet] ──────→ Conversation Summarizer
    ```

    ## Agent Details (Verified from Config)

    ### 1. Orchestrator
    | Property | Value |
    |----------|-------|
    | **Model** | `anthropic.claude-4-5-sonnet-20241022-v2:0` (Amazon Bedrock) |
    | **Temperature** | 0.1 (low for consistent routing) |
    | **Max Tokens** | 150 |
    | **Role** | Intent classification - routes to: CHAT, BOM, CODE, WIRING, CIRCUIT_VERIFY, DATASHEET, BUDGET |

    ### 2. Project Initializer (First Message Only)
    | Property | Value |
    |----------|-------|
    | **Model** | `anthropic.claude-4-opus-20240229-v1:0` (Amazon Bedrock) |
    | **Temperature** | 0.7 |
    | **Max Tokens** | 2000 |
    | **Role** | Quick-start wizard - transforms vague ideas into concrete project direction |
    | **Tools** | `read`, `write`, `open_drawer` |

    ### 3. Conversational Agent (Subsequent Messages)
    | Property | Value |
    |----------|-------|
    | **Model** | `anthropic.claude-4-opus-20240229-v1:0` (Amazon Bedrock) |
    | **Temperature** | 0.8 (higher for creative conversation) |
    | **Max Tokens** | 3000 |
    | **Role** | The idea-to-blueprint translator - guides user through requirements |
    | **Tools** | `read`, `write`, `open_drawer` |

    ### 4. BOM Generator
    | Property | Value |
    |----------|-------|
    | **Model** | `anthropic.claude-4-opus-20240229-v1:0` (Amazon Bedrock) |
    | **Temperature** | 0.2 (low for precision) |
    | **Max Tokens** | 25000 |
    | **Role** | Creates validated Bill of Materials with voltage/current checks |
    | **Tools** | `read`, `write`, `open_drawer` |

    ### 5. Code Generator
    | Property | Value |
    |----------|-------|
    | **Model** | `anthropic.claude-4-5-sonnet-20241022-v2:0` (Amazon Bedrock) |
    | **Temperature** | 0.2 (low for consistent code) |
    | **Max Tokens** | 16000 |
    | **Role** | Writes production-ready firmware (Arduino C++, MicroPython) |
    | **Tools** | `read`, `write`, `open_drawer` |

    ### 6. Wiring Specialist
    | Property | Value |
    |----------|-------|
    | **Model** | `anthropic.claude-4-5-sonnet-20241022-v2:0` (Amazon Bedrock) |
    | **Temperature** | 0.15 (very low for precision) |
    | **Max Tokens** | 4000 |
    | **Role** | Creates step-by-step wiring instructions with safety warnings |
    | **Tools** | `read`, `write`, `open_drawer` |

    ### 7. Circuit Verifier (Vision Agent)
    | Property | Value |
    |----------|-------|
    | **Model** | `anthropic.claude-4-5-sonnet-20241022-v2:0` (Amazon Bedrock with vision) |
    | **Temperature** | 0.3 |
    | **Max Tokens** | 3000 |
    | **Role** | Analyzes circuit photos to catch wiring mistakes |
    | **Tools** | None (outputs JSON analysis) |

    ### 8. Datasheet Analyzer
    | Property | Value |
    |----------|-------|
    | **Model** | `anthropic.claude-4-opus-20240229-v1:0` (Amazon Bedrock) |
    | **Temperature** | 0.25 |
    | **Max Tokens** | 6000 |
    | **Role** | Extracts critical specs from component datasheets |
    | **Tools** | None (outputs JSON) |

### 9. Budget Optimizer
| Property | Value |
|----------|-------|
| **Model** | `anthropic.claude-4-5-sonnet-20241022-v2:0` (Amazon Bedrock) |
| **Temperature** | 0.3 |
| **Max Tokens** | 25000 |
| **Role** | Finds cost savings without sacrificing quality |
| **Tools** | `read`, `write`, `open_drawer` |

### 10. Conversation Summarizer
| Property | Value |
|----------|-------|
| **Model** | `anthropic.claude-4-5-sonnet-20241022-v2:0` (Amazon Bedrock) |
| **Temperature** | 0.3 |
| **Max Tokens** | 2000 |
| **Role** | Maintains incremental conversation summaries and project state |
| **Trigger** | Runs in the background after assistant responses (about every 5 new messages) |
| **Storage** | Saves each version as a `conversation_summary` artifact in DynamoDB |

---

# ✅ IMPLEMENTED FEATURES

    ## 1. 🎨 UI & Design System
    **Verified Components:**
    - **Landing Page** (`components/LandingPage.tsx`)
    - **Project Creator** (`components/text_area/ProjectCreator.tsx`) - with user level/complexity selection
    - **AI Chat Interface** (`components/ai_chat/AIAssistantUI.jsx`) - full chat UI
    - **Sidebar** with conversation history, folders, templates
    - **Header** with agent dropdown selector
    - **Theme Toggle** (dark/light mode with localStorage persistence)
    - **Mesh Gradient** background effects
    - **Faulty Terminal** animation component

    ## 2. 🤖 Real AI Integration (Fully Working)
    **Verified from `lib/agents/orchestrator.ts` and API routes:**
    - ✅ **Amazon Bedrock Integration** via AWS SDK with Claude 3.5 Sonnet and Claude 3 Opus models
    - ✅ **Multi-Agent Orchestration** - automatic routing based on intent
    - ✅ **Streaming Responses** - real-time token-by-token updates via Bedrock ConverseStream API
    - ✅ **Model Failover** - automatic retry with exponential backoff on throttling errors (`lib/agents/bedrock-client.ts`)
    - ✅ **Tool Calling** - agents can call structured tools via Bedrock function calling
    - ✅ **SSE (Server-Sent Events)** for streaming (`app/api/agents/chat/route.ts`)

    ## Tool System (Fully Implemented - Simplified 4-Tool Interface)
**Verified from `lib/agents/tools.ts` and `lib/agents/tool-executor.ts`:**

The system uses a simplified 4-tool interface that replaces 15 specialized tools:

| Tool | Description | Parameters |
|------|-------------|-----------|
| `read` | Read any artifact (context, mvp, prd, bom, code, wiring, budget, conversation_summary) | artifact_type, path (optional) |
| `write` | Create/update any artifact with merge strategies (replace/append/merge) | artifact_type, content, merge_strategy, path, language |
| `delete` | Delete artifact or specific file within artifact | artifact_type, path (optional) |
| `open_drawer` | Open any drawer (context, bom, code, wiring, budget) | drawer |

**Legacy Tools (Backward Compatible):**
All old tool names still work and route to the new simplified tools:
- Drawer tools: `open_context_drawer`, `open_bom_drawer`, `open_code_drawer`, `open_wiring_drawer`, `open_budget_drawer`
- Update tools: `update_context`, `update_mvp`, `update_prd`, `update_bom`, `add_code_file`, `update_wiring`, `update_budget`
- File I/O tools: `read_file`, `write_file`

    ## 4. 📦 Drawer System (Fully Implemented)
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

    ## 5. 💾 Database Integration (Amazon DynamoDB)
    **Verified from `lib/db/` and AppSync subscriptions:**
    - ✅ **Chat Persistence** (`lib/db/chat.ts`)
    - `createChat()`, `getMessages()`, `addMessage()`
    - `updateSession()`, `getNextSequenceNumber()`
    - ✅ **Artifact Storage** (`lib/db/artifacts.ts`)
    - `createArtifact()`, `createVersion()`, `getLatestArtifact()`
    - Git-style versioning for all artifacts
    - ✅ **Realtime Subscriptions**
    - Messages update live via AWS AppSync with DynamoDB Streams
    - Artifacts refresh when new versions are created
    - ✅ **Tables Used**: `ohm-chats`, `ohm-messages`, `ohm-artifacts`, `ohm-artifact-versions`

    **DynamoDB Table Structure:**
    - **Primary Keys**: UUID-based with proper GSI relationships
    - **Global Secondary Indexes**: Optimized for chat_id, sequence_number, and timestamp queries
    - **IAM Policies**: Fine-grained access control for user data isolation
    - **Realtime**: DynamoDB Streams trigger AppSync subscriptions for live updates

    ## 6. 🔔 Toast Notification System
    **Verified from `lib/agents/toast-notifications.ts`:**
    - ✅ **Agent Change Toasts** - "🤖 [Agent Name] is handling this"
    - ✅ **Tool Call Toasts** - "🔧 Agent called [tool_name]"
    - ✅ **Bedrock Throttling Toasts** - "⚠️ Bedrock throttling detected"
    - ✅ **Retry Success Toasts** - "✅ Bedrock connection restored"

    ## 7. 👤 User Context System
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

    ## 8. 🏷️ Dynamic Chat Titles
    **Verified from `app/api/agents/title/route.ts`:**
    - ✅ AI-generated titles (3-6 words) from first user message
    - ✅ Background generation after chat creation
    - ✅ Uses orchestrator agent for fast generation

    ## 9. 📊 Message & Artifact Rendering
    **Verified from `components/ai_chat/Message.jsx`:**
    - ✅ **Markdown Rendering** with ReactMarkdown
    - ✅ **BOM Inline Display** - BOMCard component renders when BOM tool is called
    - ✅ **Code Block Parsing** - Syntax highlighted code blocks
    - ✅ **Drawer Link Buttons** - "Open [X] Drawer >" buttons appear after tool calls

## 10. 🔄 Streaming Architecture
**Verified from `lib/hooks/use-chat.ts` and API route:**
- ✅ **SSE Stream Parsing** with proper event handling
- ✅ **Event Types**: `text`, `agent_selected`, `tool_call`, `metadata`, `error`
- ✅ **Optimistic Updates** - User messages appear immediately
- ✅ **Real-time AI Response** - Characters stream as generated via Bedrock ConverseStream API

## 11. 📝 Conversation Summarizer
**Verified from `lib/agents/summarizer.ts`, `lib/agents/config.ts`, and `components/tools/ConversationSummaryDrawer.tsx`:**
- ✅ **Incremental Summaries** – Updates the conversation summary approximately every 5 new messages instead of re-reading full history
- ✅ **Background Processing** – Runs after messages are saved and never blocks user responses
- ✅ **Artifact Storage** – Persists each summary as a versioned `conversation_summary` artifact in DynamoDB
- ✅ **Project Snapshot** – Extracts components, code files, and open questions into a structured snapshot for quick reference
- ✅ **Real-time Drawer** – `ConversationSummaryDrawer` subscribes to AppSync for artifact version changes to show live updates
- ✅ **Context for Agents** – Agents receive conversation context via `AgentContextBuilder` to reduce token usage

## 12. 🔑 Bedrock Throttling Management System
**Verified from `lib/agents/bedrock-client.ts`:**
- ✅ **Exponential Backoff** - Automatic retry with increasing delays on throttling
- ✅ **Health Tracking** - Tracks throttling events and success rates
- ✅ **Failover Protection** - Continues operation with retry mechanisms
- ✅ **Toast Notifications** - User feedback for throttling and recovery events

---

# ⚠️ PLANNED FEATURES (NOT YET IMPLEMENTED)

    > **🚨 WARNING: The features listed below are from OLD documentation and have NOT been fully wired up or tested. The infrastructure exists but end-to-end functionality is incomplete.**

    ---

    ## 🔌 WIRING DIAGRAM VISUAL GENERATION (PARTIAL)
    > ⚠️ **STATUS: TOOL EXISTS, VISUAL GENERATION PARTIALLY IMPLEMENTED**

    **What EXISTS:**
    - ✅ `update_wiring` tool defined in `tools.ts`
    - ✅ `WiringDrawer.tsx` component with table UI
    - ✅ Tool executor persists wiring data to DynamoDB
    - ✅ `VisualWiringPipeline` class for SVG generation
    - ✅ Diagram queue system for background processing

    **What's MISSING:**
    - ❌ AI-generated breadboard images (requires BYTEZ API integration)
    - ❌ Interactive diagram component
    - ❌ Complete visual diagram display in drawer

    ---

    ## 💰 BUDGET OPTIMIZATION (FULLY IMPLEMENTED)
    > ✅ **STATUS: FULLY FUNCTIONAL**

    **What EXISTS:**
    - ✅ `update_budget` tool defined and working
    - ✅ `BudgetDrawer.tsx` component with full UI
    - ✅ Budget Optimizer agent configured and tested
    - ✅ Cost comparison and recommendation system
    - ✅ Tradeoff analysis (LOW/MEDIUM/HIGH risk)

    ---

    ## 👁️ CIRCUIT VERIFICATION (PARTIAL)
    > ⚠️ **STATUS: AGENT EXISTS, NO UI FOR PHOTO UPLOAD**

    **What EXISTS:**
    - ✅ `circuitVerifier` agent configured with Gemini 2.5 Flash (vision)
    - ✅ `runVisionAgent()` method in orchestrator
    - ✅ System prompt for circuit analysis
    - ✅ Amazon S3 for image uploads

    **What's MISSING:**
    - ❌ No photo upload UI in the chat interface
    - ❌ No `/api/agents/verify/route.ts` implementation for frontend
    - ❌ Cannot trigger vision verification from user action
    - ❌ No presigned URL generation for secure uploads

    ---

    ## 📄 DATASHEET ANALYSIS (PARTIAL)
    > ⚠️ **STATUS: AGENT EXISTS, NO FILE UPLOAD**

    **What EXISTS:**
    - ✅ `datasheetAnalyzer` agent configured
    - ✅ System prompt for extraction
    - ✅ Amazon S3 for PDF uploads

    **What's MISSING:**
    - ❌ No PDF/file upload UI
    - ❌ No integration with document parsing
    - ❌ Not triggerable from user action
    - ❌ No presigned URL generation for secure uploads

    ---

    ## 🔗 RIPPLE EFFECT ENGINE (NOT IMPLEMENTED)
    > ⚠️ **STATUS: OLD DOCUMENTATION - CONCEPT ONLY**

    **What's MISSING:**
    - ❌ No dependency monitoring between parts
    - ❌ No automatic conflict detection when parts change
    - ❌ No cascading update system

    ---

    ## 🔒 LOCKED PROJECT BLUEPRINT (PARTIAL)
    > ⚠️ **STATUS: CONCEPT EXISTS, NOT ENFORCED**

    **What EXISTS:**
    - ✅ Agents mention "Lock" in responses
    - ✅ `isReadyToLock` flag returned from orchestrator

    **What's MISSING:**
    - ❌ No actual "lock" action that freezes project state
    - ❌ No "Golden Blueprint" JSON generation as single source of truth
    - ❌ Parts can be changed after "locking"

    ---

    # 🚶 User Flow

    ## Phase 1: Landing Page (`/`)
    - Hero section with "The path of least resistance"
    - Feature showcase
    - "Start Building" button → navigates to `/build`

    ## Phase 2: Project Creator (`/build`)
    - **User selects**: Experience Level + Project Complexity
    - **User enters**: Project description
    - **User clicks**: "Start Building"
    - → Creates chat in DynamoDB
    - → Navigates to `/build/[chatId]`

    ## Phase 3: AI Chat (`/build/[chatId]`)
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

    # 🏗️ Project Architecture

    ## Directory Structure

    ```
    OHM/
    ├── app/
    │   ├── api/agents/
    │   │   ├── chat/route.ts      # Main chat endpoint (SSE streaming via Lambda)
    │   │   ├── blueprint/route.ts # BOM generation endpoint (Lambda)
    │   │   ├── code/route.ts      # Code generation endpoint (Lambda)
    │   │   ├── title/route.ts     # Dynamic title generation (Lambda)
    │   │   └── verify/route.ts    # Circuit verification endpoint (Lambda)
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
    │   │   ├── orchestrator.ts    # Multi-agent orchestration (Bedrock)
    │   │   ├── tools.ts           # Tool definitions
    │   │   ├── tool-executor.ts   # Tool execution & DynamoDB persistence
    │   │   ├── key-manager.ts     # Model failover management
    │   │   └── toast-notifications.ts
    │   │
    │   ├── db/
    │   │   ├── chat.ts            # Chat CRUD operations (DynamoDB)
    │   │   └── artifacts.ts       # Artifact CRUD operations (DynamoDB)
    │   │
    │   ├── hooks/
    │   │   ├── use-chat.ts        # Chat state & streaming
    │   │   └── use-chat-list.ts   # Chat list for sidebar
    │   │
    │   ├── aws/
    │   │   ├── bedrock-client.ts  # Bedrock Runtime client
    │   │   ├── dynamodb-client.ts # DynamoDB client
    │   │   ├── s3-client.ts       # S3 client for file uploads
    │   │   └── appsync-client.ts  # AppSync GraphQL client
    │   │
    │   └── parsers.ts             # BOM/Code/Context parsing utilities
    │
    └── context_docs/              # Documentation
    ```

    ---

    # 🚀 How to Run

    ### Prerequisites
    - Node.js 18+
    - AWS Account with appropriate permissions
    - AWS CLI configured with credentials

    ### 1. Install Dependencies
    ```bash
    npm install
    ```

    ### 2. Setup AWS Infrastructure
    1. Deploy DynamoDB tables using AWS CDK or CloudFormation
    2. Configure Amazon Bedrock model access in your region
    3. Set up S3 bucket for file uploads with CORS configuration
    4. Deploy AppSync API for real-time subscriptions
    5. Configure Cognito User Pool for authentication

    ### 3. Configure Environment Variables
    Create `.env.local` with:
    ```bash
    # AWS Configuration
    AWS_REGION=us-east-1
    AWS_ACCESS_KEY_ID=your-access-key
    AWS_SECRET_ACCESS_KEY=your-secret-key

    # DynamoDB Tables
    DYNAMODB_CHATS_TABLE=ohm-chats
    DYNAMODB_MESSAGES_TABLE=ohm-messages
    DYNAMODB_ARTIFACTS_TABLE=ohm-artifacts
    DYNAMODB_ARTIFACT_VERSIONS_TABLE=ohm-artifact-versions

    # S3 Configuration
    S3_BUCKET_NAME=ohm-file-uploads

    # AppSync Configuration
    APPSYNC_API_URL=https://your-api.appsync-api.us-east-1.amazonaws.com/graphql
    APPSYNC_API_KEY=your-api-key

    # Cognito Configuration
    COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
    COGNITO_CLIENT_ID=your-client-id
    ```

    ### 4. Run Development Server
    ```bash
    npm run dev
    ```

    ### 5. Deploy to AWS Amplify
    ```bash
    # Install Amplify CLI
    npm i -g @aws-amplify/cli

    # Initialize Amplify project
    amplify init

    # Deploy
    amplify publish
    ```

    ### 6. Access the Application
    - **Local Development**: http://localhost:3000
    - **Production (Amplify)**: https://your-app.amplifyapp.com

    ---

    # 🏗️ AWS-Native Architecture

    ## Current vs Previous Architecture

    | Component | Previous Implementation | AWS Implementation | Migration Benefit |
    |-----------|----------------------|----------------|------------------|
    | **AI Service** | Third-party API | Amazon Bedrock | Native integration, better scaling |
    | **Database** | Third-party PostgreSQL | Amazon DynamoDB | Serverless, auto-scaling |
    | **Realtime** | Third-party Realtime | AWS AppSync + DynamoDB Streams | Native real-time capabilities |
    | **Storage** | Third-party Storage | Amazon S3 | Enterprise-grade, cost-effective |
    | **Hosting** | Third-party Platform | AWS Amplify | Integrated CI/CD, better performance |
    | **Auth** | Third-party Auth | Amazon Cognito | Enterprise security, compliance |

    ## AWS Architecture Benefits

    **Advantages of AWS-Native Architecture:**
    - **Native Integration**: All services work seamlessly together
    - **Enterprise Scale**: Better for large-scale deployments
    - **Cost Optimization**: Potential cost savings at scale
    - **Compliance**: Better compliance and security controls
    - **Monitoring**: Comprehensive CloudWatch integration
    - **Reliability**: 99.99% uptime SLA across services
    - **Global Scale**: Multi-region deployment capabilities

    ---

    # 💻 Code Examples

    ## Bedrock Integration Example

    **lib/aws/bedrock-client.ts:**
    ```typescript
    import { BedrockRuntimeClient, ConverseStreamCommand } from "@aws-sdk/client-bedrock-runtime";

    const bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    export async function streamBedrockResponse(
      modelId: string,
      messages: any[],
      systemPrompt: string,
      tools?: any[]
    ) {
      const command = new ConverseStreamCommand({
        modelId,
        messages,
        system: [{ text: systemPrompt }],
        inferenceConfig: {
          maxTokens: 4096,
          temperature: 0.7,
        },
        toolConfig: tools ? { tools } : undefined,
      });

      const response = await bedrockClient.send(command);
      
      // Stream processing
      if (response.stream) {
        for await (const event of response.stream) {
          if (event.contentBlockDelta?.delta?.text) {
            yield event.contentBlockDelta.delta.text;
          }
          if (event.messageStop) {
            break;
          }
        }
      }
    }
    ```

    ## DynamoDB Integration Example

    **lib/aws/dynamodb-client.ts:**
    ```typescript
    import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
    import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    export const docClient = DynamoDBDocumentClient.from(dynamoClient);

    // Example: Save message to DynamoDB
    export async function saveMessage(message: any) {
      const command = new PutCommand({
        TableName: process.env.DYNAMODB_MESSAGES_TABLE,
        Item: {
          message_id: message.id,
          chat_id: message.chatId,
          role: message.role,
          content: message.content,
          timestamp: Date.now(),
          created_at: new Date().toISOString(),
        },
      });

      await docClient.send(command);
    }

    // Example: Query messages by chat_id
    export async function getMessagesByChatId(chatId: string) {
      const command = new QueryCommand({
        TableName: process.env.DYNAMODB_MESSAGES_TABLE,
        IndexName: "chat-messages-index",
        KeyConditionExpression: "chat_id = :chatId",
        ExpressionAttributeValues: {
          ":chatId": chatId,
        },
        ScanIndexForward: true, // Sort by timestamp ascending
      });

      const response = await docClient.send(command);
      return response.Items || [];
    }
    ```

    ## S3 File Upload Example

    **lib/aws/s3-client.ts:**
    ```typescript
    import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
    import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    // Generate presigned URL for secure uploads
    export async function generateUploadUrl(fileName: string, fileType: string) {
      const key = `uploads/${Date.now()}-${fileName}`;
      
      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      
      return { signedUrl, key };
    }

    // Upload file directly from server
    export async function uploadFile(fileBuffer: Buffer, fileName: string, contentType: string) {
      const key = `uploads/${Date.now()}-${fileName}`;
      
      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await s3Client.send(command);
      
      return {
        key,
        url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      };
    }
    ```

    ## AppSync Subscription Example

    **lib/aws/appsync-client.ts:**
    ```typescript
    import { AWSAppSyncClient } from 'aws-appsync';
    import gql from 'graphql-tag';

    const appsyncClient = new AWSAppSyncClient({
      url: process.env.APPSYNC_API_URL!,
      region: process.env.AWS_REGION || 'us-east-1',
      auth: {
        type: 'API_KEY',
        apiKey: process.env.APPSYNC_API_KEY!,
      },
    });

    // Subscribe to new messages
    export function subscribeToMessages(chatId: string, callback: (message: any) => void) {
      const subscription = appsyncClient.subscribe({
        query: gql`
          subscription OnNewMessage($chatId: ID!) {
            onNewMessage(chatId: $chatId) {
              message_id
              chat_id
              role
              content
              timestamp
              created_at
            }
          }
        `,
        variables: { chatId },
      });

      return subscription.subscribe({
        next: (data) => callback(data.data.onNewMessage),
        error: (error) => console.error('Subscription error:', error),
      });
    }
    ```

    ---

    # 📊 Agent Model Summary

    | Agent | Bedrock Model ID | Purpose |
    |-------|------------------|---------|
    | Orchestrator | `anthropic.claude-4-5-sonnet-20241022-v2:0` | Fast intent routing |
    | Project Initializer | `anthropic.claude-4-opus-20240229-v1:0` | First message handling |
    | Conversational | `anthropic.claude-4-opus-20240229-v1:0` | General conversation |
    | BOM Generator | `anthropic.claude-4-opus-20240229-v1:0` | Component selection |
    | Code Generator | `anthropic.claude-4-5-sonnet-20241022-v2:0` | Firmware generation |
    | Wiring Specialist | `anthropic.claude-4-5-sonnet-20241022-v2:0` | Connection instructions |
    | Circuit Verifier | `anthropic.claude-4-5-sonnet-20241022-v2:0` (vision) | Vision analysis |
    | Datasheet Analyzer | `anthropic.claude-4-opus-20240229-v1:0` | Document extraction |
    | Budget Optimizer | `anthropic.claude-4-5-sonnet-20241022-v2:0` | Cost optimization |
    | Conversation Summarizer | `anthropic.claude-4-5-sonnet-20241022-v2:0` | Context summarization |

    ---

    # 🔐 IAM Permissions Required

    **Minimum IAM Policy for OHM Application:**

    ```json
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "bedrock:InvokeModel",
            "bedrock:InvokeModelWithResponseStream"
          ],
          "Resource": [
            "arn:aws:bedrock:*::foundation-model/anthropic.claude-4-5-sonnet-20241022-v2:0",
            "arn:aws:bedrock:*::foundation-model/anthropic.claude-4-opus-20240229-v1:0"
          ]
        },
        {
          "Effect": "Allow",
          "Action": [
            "dynamodb:PutItem",
            "dynamodb:GetItem",
            "dynamodb:Query",
            "dynamodb:Scan",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem"
          ],
          "Resource": [
            "arn:aws:dynamodb:*:*:table/ohm-chats",
            "arn:aws:dynamodb:*:*:table/ohm-messages",
            "arn:aws:dynamodb:*:*:table/ohm-artifacts",
            "arn:aws:dynamodb:*:*:table/ohm-artifact-versions",
            "arn:aws:dynamodb:*:*:table/ohm-*/index/*"
          ]
        },
        {
          "Effect": "Allow",
          "Action": [
            "s3:PutObject",
            "s3:GetObject",
            "s3:DeleteObject"
          ],
          "Resource": "arn:aws:s3:::ohm-file-uploads/*"
        },
        {
          "Effect": "Allow",
          "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          "Resource": "arn:aws:logs:*:*:log-group:/aws/lambda/ohm-*"
        },
        {
          "Effect": "Allow",
          "Action": [
            "appsync:GraphQL"
          ],
          "Resource": "arn:aws:appsync:*:*:apis/*/types/*/fields/*"
        }
      ]
    }
    ```

    ---

    # 📈 Monitoring with CloudWatch

    ## CloudWatch Logs
    All Lambda functions and agent executions log to CloudWatch:
    - **Log Group**: `/aws/lambda/ohm-agents`
    - **Retention**: 7 days (configurable)
    - **Metrics**: Invocation count, duration, errors

    ## CloudWatch Metrics
    Key metrics to monitor:
    - **Bedrock Invocations**: Number of model invocations per agent
    - **DynamoDB Read/Write Capacity**: Monitor for throttling
    - **Lambda Duration**: Track cold starts and execution time
    - **S3 Upload Success Rate**: Monitor file upload failures
    - **AppSync Connection Count**: Track active subscriptions

    ## CloudWatch Alarms
    Recommended alarms:
    ```bash
    # High error rate alarm
    aws cloudwatch put-metric-alarm \
      --alarm-name ohm-high-error-rate \
      --alarm-description "Alert when error rate exceeds 5%" \
      --metric-name Errors \
      --namespace AWS/Lambda \
      --statistic Sum \
      --period 300 \
      --evaluation-periods 1 \
      --threshold 5 \
      --comparison-operator GreaterThanThreshold

    # DynamoDB throttling alarm
    aws cloudwatch put-metric-alarm \
      --alarm-name ohm-dynamodb-throttle \
      --alarm-description "Alert on DynamoDB throttling" \
      --metric-name UserErrors \
      --namespace AWS/DynamoDB \
      --statistic Sum \
      --period 60 \
      --evaluation-periods 1 \
      --threshold 1 \
      --comparison-operator GreaterThanThreshold
    ```

    ---

    # 💰 Cost Optimization

    ## Estimated Monthly Costs (1000 active users)

    | Service | Usage | Estimated Cost |
    |---------|-------|----------------|
    | **Amazon Bedrock** | ~500K tokens/day | $150-300/month |
    | **DynamoDB** | On-demand pricing | $50-100/month |
    | **S3** | 10GB storage + transfers | $5-10/month |
    | **AWS Lambda** | 1M requests/month | $0.20/month (free tier) |
    | **AWS Amplify** | Hosting + build minutes | $15-30/month |
    | **AppSync** | 1M queries/month | $4/month |
    | **CloudWatch** | Logs + metrics | $10-20/month |
    | **Total** | | **$234-464/month** |

    ## Cost Optimization Tips
    1. **Use DynamoDB On-Demand**: Pay only for what you use
    2. **Enable S3 Lifecycle Policies**: Archive old files to Glacier
    3. **Optimize Bedrock Token Usage**: Use conversation summarizer to reduce context
    4. **Lambda Memory Tuning**: Right-size Lambda memory for cost/performance
    5. **CloudWatch Log Retention**: Set appropriate retention periods
    6. **Use Bedrock Batch Inference**: For non-real-time workloads

    ---

    # 🔧 Amazon Q Developer Integration

    ## Features Available
    - **Code Completion**: Real-time suggestions as you type
    - **Code Generation**: Generate entire functions from comments
    - **Code Explanation**: Understand complex code sections
    - **Bug Detection**: Identify potential issues before runtime
    - **Security Scanning**: Detect security vulnerabilities
    - **Code Transformation**: Upgrade dependencies and refactor code

    ## Setup in VS Code
    1. Install AWS Toolkit extension
    2. Configure AWS credentials
    3. Enable Amazon Q Developer
    4. Start coding with AI assistance

    ## Example Usage
    ```typescript
    // Type a comment and let Q Developer generate the code
    // Function to stream Bedrock response and handle tool calls
    
    // Q Developer will generate:
    export async function streamBedrockWithTools(
      modelId: string,
      messages: Message[],
      tools: Tool[]
    ): Promise<AsyncGenerator<StreamEvent>> {
      // Implementation generated by Q Developer
    }
    ```

    ---

    # ✅ Summary

    **What's Fully Working:**
    - Multi-agent AI system with 10 specialized agents via Amazon Bedrock
    - Streaming chat with real-time responses via Bedrock ConverseStream API
    - Tool calling with auto-opening drawers
    - Full database persistence (Amazon DynamoDB)
    - Real-time updates via AWS AppSync
    - Context/MVP/PRD generation
    - BOM generation with inline display
    - Code generation with file tree
    - Wiring instructions (table-based + partial visual)
    - Budget optimization display
    - Toast notifications
    - Dynamic chat titles
    - User level/complexity customization
    - Bedrock throttling management system
    - Conversation summarization
    - Universal file I/O tools (read_file, write_file)
    - AWS Amplify hosting with optimized deployment

    **What Needs Work:**
    - Complete visual wiring diagram generation (AI breadboard images)
    - Photo upload UI for circuit verification (S3 ready)
    - PDF upload for datasheet analysis (S3 ready)
    - Project locking mechanism
    - Ripple effect engine
    - Real supplier pricing integration
    - Enhanced mobile responsiveness
    - Performance optimization for large conversations

    **AWS-Native Architecture:**
    - Built from the ground up using AWS services
    - Modular agent system leveraging Amazon Bedrock
    - DynamoDB for scalable NoSQL data storage
    - AppSync for real-time GraphQL subscriptions
    - S3 for secure file storage and management

    ---

    # 🏗️ AWS Service Integration Examples

    The following sections demonstrate how OHM leverages AWS services from the ground up.

    ---

    *Documentation reflects AWS-native architecture built from inception on February 3, 2026*

    **Happy Building with OHM on AWS! ⚡🔌☁️**
