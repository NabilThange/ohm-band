# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

OHM is a Next.js-based "hardware lifecycle orchestrator" that turns vague hardware ideas into production-ready prototypes through a sequential multi-agent AI pipeline. The root app (this package) hosts the live experience at `/` (marketing) and `/build` (multi-agent build interface), backed by Multi-Provider LLM APIs (OpenRouter, Groq, AIML API) and Supabase for chat and artifact persistence.

High-level pieces:
- **Next.js app (root)**: User-facing landing page, prompt intake, and multi-step build interface.
- **Multi-agent orchestration layer** (`lib/agents`): Encapsulates all LLM provider configuration and the sequential "assembly line" flow across agents.
- **Persistence layer** (`lib/db`, `lib/supabase`): Supabase-backed services for chats, messages, artifacts, components, and connections.
- **Reference/legacy apps** (`Landing page/`, `ai_chat/`): Earlier standalone Next.js apps and UI prototypes; useful for design or component reuse but not the primary entry point.
- **Context docs** (`context_docs/`): High-signal documentation for architecture, model wiring, database schema, and setup.

## Common commands

### Root app (primary Next.js application)

From the repo root (`OHM/`):

- **Install dependencies**
  - `npm install`
- **Run dev server (default port 3000)**
  - `npm run dev`
- **Build for production**
  - `npm run build`
- **Start production build**
  - `npm start`
- **Lint (Next.js + ESLint)**
  - `npm run lint`

> As of this snapshot there is no dedicated test runner script (no `test` script in `package.json`). When a test framework is added, update this section with how to run the full suite and a single test.

### Reference Next apps

These two folders each contain their own isolated Next.js apps and package.json; they are mainly for reference/experimentation:

- **Marketing landing page prototype** (`Landing page/`)
  - `cd "Landing page"`
  - `npm install`
  - `npm run dev` / `npm run build` / `npm run lint`

- **Standalone AI chat prototype** (`ai_chat/`)
  - `cd ai_chat`
  - `npm install`
  - `npm run dev` / `npm run build` / `npm run lint`

## Environment & configuration

All environment variables are expected to be set via `.env.local` in the project root (not committed to VCS).

### Multi-Provider LLM Configuration

Used for all model inference via OpenAI-compatible endpoints with provider configs defined in `lib/agents/provider-config.ts`.
- **LLM_PROVIDER**: Environment variable that selects the active provider (`openrouter`, `groq`, or `aiml`).
- **Required env vars**:
  - `OPENROUTER_API_KEY_1`, `OPENROUTER_API_KEY_2`, etc. for OpenRouter.
  - `GROQ_API_KEY_1`, `GROQ_API_KEY_2`, etc. for Groq.
  - `AIML_API_KEY_1`, `AIML_API_KEY_2`, etc. for AIML API.
  - Supports sequentially numbered fallback and comma-separated lists.

### Supabase

Supabase is the system of record for chats, messages, artifacts, and related entities.

Key environment variables (see `context_docs/SUPABASE_SETUP.md` and `lib/supabase/client.ts`):
- `NEXT_PUBLIC_SUPABASE_URL` – project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – public anon key used by the browser and server utilities.
- `SUPABASE_SERVICE_ROLE_KEY` – service role key for privileged operations (must stay server-side and out of Git).

Supabase client usage:
- `lib/supabase/client.ts` exposes `getSupabaseClient()` and a default `supabase` instance, both using the `NEXT_PUBLIC_*` env vars.
- Database typings live in `lib/supabase/types.ts`; higher-level services (below) consume these types.

## Architecture: frontend flow

### Routes and layouts

- `app/layout.tsx`
  - Sets global metadata (title/description) and theme (`<html lang="en" className="dark">`).
  - Loads Inter + JetBrains Mono from Google Fonts and applies base typography.

- `app/page.tsx`
  - Marketing/landing page.
  - Hero section that introduces Ohm and routes users to `/build` via the **Start Building** CTA.
  - Uses animated hero components from `components/mage-ui/hero/*` plus a custom `TypingEffect` inline component.

- `app/build/page.tsx`
  - Core application route for the multi-agent flow.
  - Reads `chatId` from `useParams()`; when present, the page starts directly in chat mode bound to that chat record.
  - Maintains a local `mode` state: `"input"` (project creation form) or `"chat"` (assistant interface).
  - Renders:
    - `ProjectCreator` (`components/text_area/ProjectCreator.tsx`) for initial project description and style selection.
    - `AIAssistantUI` (`components/ai_chat/AIAssistantUI.jsx`) for the full-featured multi-pane chat/assembly interface.
  - On project submit, builds an English prompt from the user text + style and passes it as `initialPrompt` to `AIAssistantUI`.

### UI composition

Primary UI directories under `components/`:

- `components/ai_chat/`
  - Chat UI layer reused from the `ai_chat/` reference app.
  - Includes `AIAssistantUI` plus message list, sidebar, header, composer, templates, folders, etc.
  - Responsible for calling the backend agent APIs, handling streaming/updates, and wiring Supabase-driven state hooks.

- `components/agents/`
  - High-level container components for the multi-agent build experience (e.g., `AgentChatInterface`, `AssemblyLineProgress`).
  - Visualizes which stage of the assembly line the conversation is in.

- `components/tools/`
  - Side drawers for artifacts like BOM, code, wiring, budget, etc. (e.g., `BOMDrawer`, `CodeDrawer`, `ToolsSidebar`).
  - These map to artifacts generated by different agents and stored via Supabase.

- `components/text_area/`
  - `ProjectCreator` and visual/animation helpers (e.g., `mesh-gradient`, `smoke-ring-background`) used on the prompt entry screen.

- `components/mage-ui/` and `components/ui/`
  - Design system primitives: buttons, motion components, hero animations, container layouts.
  - Mostly stateless and safe to reuse across new pages.

## Architecture: multi-agent orchestration

### Agent configuration (`lib/agents/config.ts`)

`AGENTS` defines all logical agents in the system and maps them to model roles (fast, reasoning, code, vision), which are then mapped to provider-specific models via `getModelForAgent()` in `provider-config.ts`:

- **orchestrator** (`openai/gpt-4o`)
  - Lightweight classifier that turns a user message into an intent: `CHAT`, `BOM`, `CODE`, `WIRING`, `CIRCUIT_VERIFY`, `DATASHEET`, or `BUDGET`.
  - Returns *only* the intent name.

- **conversational** (`anthropic/claude-opus-4-5`)
  - High-level product architect that runs the discovery dialogue.
  - Produces rich Markdown responses and, once the design is "locked", emits three documents (Context, MVP, PRD) in clearly delimited blocks.

- **bomGenerator** (`openai/o1`)
  - Reasoning-heavy agent that synthesizes the Bill of Materials and power analysis.
  - Returns a JSON object wrapped in `<BOM_CONTAINER>` tags with parts, alternatives, cost, and warnings.

- **codeGenerator** (`anthropic/claude-sonnet-4-5`)
  - Firmware generator for Arduino/ESP32 C++.
  - Emits a `<CODE_CONTAINER>` JSON structure containing file paths and full contents (e.g., `src/main.cpp`, `platformio.ini`).

- **wiringDiagram** (`openai/gpt-4o`)
  - Produces step-by-step wiring instructions in Markdown, using consistent formatting (headers, lists, warnings, and tables for wire colors).

- **circuitVerifier** (`google/gemini-2.5-flash`)
  - Vision agent used for image-based circuit verification against a provided blueprint JSON.

Additional roles (e.g., datasheet analyzer, budget optimizer) are also defined with dedicated prompts but are wired similarly.

### Agent execution and BYTEZ client (`lib/agents/orchestrator.ts`)

Core responsibilities:

- **`BytezClient` singleton**
  - Wraps the OpenAI SDK configured against the BYTEZ endpoint.
  - Reads `BYTEZ_API_KEY` or `NEXT_PUBLIC_BYTEZ_API_KEY` and sets `baseURL` to the BYTEZ OpenAI-compatible path.
  - This ensures all downstream agent calls share a single client instance.

- **`AgentRunner`**
  - Thin abstraction over the OpenAI chat API.
  - Preprends each agent’s `systemPrompt` to the provided message history.
  - Provides:
    - `runAgent(agentType, messages, { stream?, onStream? })` for regular or streaming text agents.
    - `runVisionAgent(agentType, imageUrl, blueprintJson)` for multimodal circuit verification.
  - Explicitly avoids sending `max_completion_tokens` to satisfy BYTEZ’s expectation for `max_tokens` only; the `max_tokens` wiring is present but currently commented out to avoid API rejections.

- **`AssemblyLineOrchestrator`**
  - High-level orchestration class that coordinates the multi-step flow and persists state to the database.
  - Key behaviors:
    - Binds to a specific `chatId` (UUID) when constructed.
    - On `chat(userMessage)`, persists the user message via `ChatService`, fetches prior history, and runs the conversational agent.
    - Determines when the design is ready to "lock" and returns an `isReadyToLock` flag.
    - Additional methods (not fully shown above but present in the file) handle generating the BOM blueprint, firmware code, and circuit verification in sequence using `ArtifactService` and `ComponentService`.

When extending the system (e.g., adding a new "Simulation" agent), follow this pattern:
1. Add a new entry in `AGENTS` with model + prompt.
2. Add a branch in `AssemblyLineOrchestrator` that calls `AgentRunner` with the new agent.
3. Optionally extend `ChatService`/`ArtifactService` to persist new artifact types.

## Architecture: API surface

All multi-agent actions are exposed via Next.js route handlers under `app/api/agents/*`:

- **`app/api/agents/chat/route.ts`**
  - `POST` with `{ message, chatId }`.
  - Instantiates `AssemblyLineOrchestrator` with `chatId` (or a fallback ephemeral ID) and calls `orchestrator.chat(message)`.
  - Response: `{ response, isReadyToLock }` – the latest assistant message and whether the system believes it has enough context to generate full documentation.

- **`app/api/agents/blueprint/route.ts`**
  - `POST` with `{ sessionId }` (separate from `chatId`; maintained in-memory here).
  - Uses an in-memory `Map<string, AssemblyLineOrchestrator>` keyed by `sessionId`.
  - Calls `generateBlueprint()` on the orchestrator and attempts to `JSON.parse` the result; falls back to `{ raw: blueprintJson }` if parsing fails.

- **`app/api/agents/code/route.ts`**
  - `POST` with `{ blueprintJson, sessionId }`.
  - Uses the same `sessionId`-based orchestrator map.
  - Calls `generateCode(blueprintJson)` and returns `{ code }` (the raw `<CODE_CONTAINER>` payload).

- **`app/api/agents/verify/route.ts`**
  - `POST` with `{ imageUrl, blueprintJson, sessionId }`.
  - Calls `verifyCircuit(imageUrl, blueprintJson)` using the vision agent and tries to parse the result as JSON; otherwise wraps the raw text.
  - Response: `{ inspection, inspectionResult }`.

These routes are the main integration points for the frontend chat UI; when adding new steps or agents, mirror the existing pattern.

## Architecture: database & persistence

The database is PostgreSQL via Supabase and follows the design described in `context_docs/DATABASE_ARCHITECTURE.md`.

### Service layers (`lib/db/*`)

- **`lib/db/chat.ts`**
  - Manages chat sessions and messages:
    - `createChat()` to create a new chat row with a UUID used in URLs (`/build/[chatId]`).
    - `getMessages(chatId)` and `getNextSequenceNumber(chatId)` to drive ordered message history.
    - `addMessage(...)` to persist user/assistant messages with metadata (role, agent, intent, token counts, etc.).

- **`lib/db/artifacts.ts`**
  - Handles creation and versioning of artifacts such as context docs, MVP, PRD, BOM, wiring, code, budget, etc.
  - Artifacts are versioned via a separate `artifact_versions` table to maintain a git-like history per artifact.

- **`lib/db/components.ts`**
  - Represents BOM components, wiring connections, and related domain entities.
  - Links BOM items and connections back to chats/projects as described in `DATABASE_ARCHITECTURE.md` (e.g., `parts`, `connections`, `projects`).

These services should be the default abstraction layer for any new database-backed feature; do not call Supabase directly from UI components unless you are following an existing pattern.

### URL and entity model

- Each **chat** has a UUID primary key used directly in URLs, e.g. `/build/[chatId]`.
- All **messages** reference `chat_id` plus a `sequence_number` for stable ordering.
- **Artifacts** and **artifact_versions** tie generated documents (context, BOM, wiring, code, etc.) back to specific chats and messages.
- Projects are modeled as higher-level hardware specifications that can be associated with one or more chats.

Refer to `context_docs/DATABASE_ARCHITECTURE.md` for the full table breakdown and relationships when altering schema or writing complex queries.

## Reference apps and context docs

### `Landing page/` and `ai_chat/`

- Both directories are full Next.js apps used to prototype the marketing site and chat UI, respectively.
- They share a similar component structure (`components/ui`, `components/theme-provider`, etc.).
- When introducing new UI patterns, consider whether an existing component already exists in these folders before re-implementing.

### `context_docs/`

High-value documents that future Warp agents should consult when making non-trivial changes:

- `OHM_SYSTEM_DOCUMENTATION.md`
  - End-to-end description of the multi-agent system, including model choices, agent responsibilities, and the "Golden Blueprint" JSON format.
- `PROVIDER_MIGRATION.md`
  - Documentation of the multi-provider LLM architecture migration from Bytez to OpenRouter/Groq/AIML API.
- `DATABASE_ARCHITECTURE.md` / `DATABASE_*`
  - Canonical source of truth for database tables, relationships, and intended query patterns.
- `SETUP_GUIDE.md` / `SUPABASE_SETUP.md`
  - Step-by-step environment and database setup; align new tooling or scripts with these docs instead of diverging.

When making architectural or schema changes, update the relevant document in `context_docs/` and, if the change affects development workflows, also update this `WARP.md` accordingly.
