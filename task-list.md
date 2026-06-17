# Detailed Task List: Bytez to Multi-Provider Migration

This task list tracks the step-by-step execution of the Bytez to Multi-Provider LLM migration for OHM.

## Phase 1: Core Abstraction Layer
- [x] Create `lib/agents/provider-config.ts` with configurations for `openrouter`, `groq`, and `aiml`
- [x] Update `lib/agents/key-manager.ts`
  - [x] Make key loading provider-aware based on `LLM_PROVIDER` environment variable
  - [x] Support provider-specific environment variables (`OPENROUTER_API_KEY`, `GROQ_API_KEY`, `AIML_API_KEY`)
  - [x] Support sequential numbering (e.g. `OPENROUTER_API_KEY_1`, `2`, `3`...)
  - [x] Support comma-separated list (`OPENROUTER_API_KEYS`) and single fallback (`OPENROUTER_API_KEY`)
  - [x] Update error messages to refer to the current provider
- [x] Refactor `BytezClient` to `ProviderClient` in `lib/agents/orchestrator.ts`
  - [x] Rename the class to `ProviderClient`
  - [x] Update `getInstance()` to dynamically set `baseURL` and `apiKey` from provider configuration
  - [x] Ensure thread-safety and refresh triggers remain intact
- [x] Update Agent Model Mappings in `lib/agents/config.ts`
  - [x] Modify `AgentConfig` interface to use `modelRole` instead of hardcoded `model`
  - [x] Add `getModelForAgent(agentType: AgentType)` helper to dynamically resolve model name
  - [x] Map all agents (`orchestrator`, `projectInitializer`, `conversational`, `bomGenerator`, `codeGenerator`, `wiringDiagram`, `debugger`, `datasheetAnalyzer`, `budgetOptimizer`, `conversationSummarizer`) to their respective model roles (`fast`, `reasoning`, `code`, `vision`)

## Phase 2: Core Integration Points
- [x] Update `AgentRunner.runAgent()` in `lib/agents/orchestrator.ts`
  - [x] Dynamic model resolution using `getModelForAgent(agentType)`
  - [x] Pass the resolved model to the runner execution functions
- [x] Update Agent Execution Signatures in `lib/agents/orchestrator.ts`
  - [x] Add `model: string` parameter to `runNonStreamingAgentWithTools()`
  - [x] Add `model: string` parameter to `runStreamingAgentWithTools()`
  - [x] Add `model: string` parameter to `runVisionAgent()`
  - [x] Replace `agent.model` reference with the dynamic `model` parameter inside these functions
- [x] Update Quota & Error Handling in `lib/agents/orchestrator.ts`
  - [x] Update `isQuotaError()` to include generic status checks (429, 402) and provider-agnostic keywords
  - [x] Make error messages in failover logic provider-aware (retrieve current provider from config)

## Phase 3: Environment Configuration
- [x] Update `.env.example`
  - [x] Remove Bytez environment variables
  - [x] Add full config block and examples for OpenRouter, Groq, and AIML API
- [x] Update local development environment (`.env.local`)
  - [x] Add `LLM_PROVIDER=openrouter` (or the active provider)
  - [x] Set appropriate provider API keys

## Phase 4: Handle Image Generation
- [x] Update `lib/diagram/image-generator.ts`
  - [x] Modify `callBytezAPI` -> `callProviderAPI` and throw a graceful error stating image generation is unsupported by the current provider config
  - [x] Modify `isConfigured()` to return `false` so the background visual pipeline checks bypass execution
- [x] Update `lib/services/diagram-generator.ts`
  - [x] Update `callBytezImageAPI` to throw a graceful error
- [x] Check other files for Bytez image generation dependencies (e.g. `lib/diagram/visual-wiring-pipeline.ts`, `lib/agents/tool-executor.ts` etc.) and ensure they fail gracefully or skip call

## Phase 5: Documentation Updates
- [x] Update project documentation references to reflect the multi-provider system:
  - [x] `README.md`
  - [x] `WARP.md`
  - [x] `QUICK_START.md`
- [x] Delete/archive obsolete Bytez-specific files:
  - [x] `OLD_context_docs/BYTEZ_INTEGRATION_SUMMARY.md`
  - [x] `OLD_context_docs/BYTEZ_ALL_DOCS_PASTED.txt`

## Phase 6: Testing & Validation
- [x] Create a standalone test script `scratch/test-migration.ts` to verify:
  - [x] KeyManager loads keys correctly for different providers
  - [x] ProviderClient initializes with proper dynamic `baseURL`
  - [x] Dynamic model mapping resolves correct models
  - [x] Perform a test chat completion call for OpenRouter, Groq, and AIML API (mocking or real calls if keys are provided)
- [x] Verify TypeScript compilation (`npx tsc --noEmit` or `npm run build`)
- [x] Verify image generation fallback returns a graceful error

## Phase 7: Final Execution & Delivery
- [x] Run checklist and verification scripts
- [x] Create walkthrough artifact `walkthrough.md` summarizing the changes and verification results
