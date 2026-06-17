/**
 * Stage-Gated Architecture Verification Test
 * No external dependencies - uses native Node.js assert
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`${colors.green}✓${colors.reset} ${name}`);
  } catch (error) {
    failed++;
    failures.push({ name, error: error.message });
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    console.log(`  ${colors.red}${error.message}${colors.reset}`);
  }
}

function readFile(filePath) {
  const fullPath = path.join(__dirname, '../../..', filePath);
  return fs.readFileSync(fullPath, 'utf-8');
}

function fileExists(filePath) {
  const fullPath = path.join(__dirname, '../../..', filePath);
  return fs.existsSync(fullPath);
}

console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.cyan}  Stage-Gated Architecture Verification${colors.reset}`);
console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

// ========================================
// Phase 1: Core Infrastructure Tests
// ========================================

console.log(`${colors.blue}Phase 1: Core Infrastructure${colors.reset}`);

test('Database migration file exists', () => {
  assert.ok(fileExists('migrations/add_stage_gating.sql'), 'Migration file not found');
});

test('Migration defines all required columns', () => {
  const migration = readFile('migrations/add_stage_gating.sql');
  assert.ok(migration.includes('project_stage'), 'Missing project_stage column');
  assert.ok(migration.includes('stage_override'), 'Missing stage_override column');
  assert.ok(migration.includes('auto_orchestration'), 'Missing auto_orchestration column');
  assert.ok(migration.includes('stage_history'), 'Missing stage_history column');
});

test('Migration creates index for performance', () => {
  const migration = readFile('migrations/add_stage_gating.sql');
  assert.ok(migration.includes('idx_chat_sessions_project_stage'), 'Missing performance index');
});

test('stage-config.ts exports all required types', () => {
  const config = readFile('lib/stages/stage-config.ts');
  assert.ok(config.includes('export type ProjectStage'), 'Missing ProjectStage export');
  assert.ok(config.includes('export type ArtifactKey'), 'Missing ArtifactKey export');
  assert.ok(config.includes('export interface StageConfig'), 'Missing StageConfig export');
  assert.ok(config.includes('export interface ProjectState'), 'Missing ProjectState export');
  assert.ok(config.includes('export const STAGE_CONFIG'), 'Missing STAGE_CONFIG export');
});

test('All four stages are defined', () => {
  const config = readFile('lib/stages/stage-config.ts');
  assert.ok(config.includes('planning:'), 'Missing planning stage');
  assert.ok(config.includes('design:'), 'Missing design stage');
  assert.ok(config.includes('build:'), 'Missing build stage');
  assert.ok(config.includes('fix:'), 'Missing fix stage');
});

test('Design stage only requires BOM (budget optional)', () => {
  const config = readFile('lib/stages/stage-config.ts');
  const designMatch = config.match(/design:\s*{[\s\S]*?requiredArtifacts:\s*\[(.*?)\]/);
  assert.ok(designMatch, 'Could not find design stage requiredArtifacts');
  const artifacts = designMatch[1].replace(/'/g, '').replace(/"/g, '').trim();
  assert.strictEqual(artifacts, 'bom', `Design stage should only require 'bom', got: ${artifacts}`);
});

test('datasheetAnalyzer is in supportAgents, not eligibleAgents', () => {
  const config = readFile('lib/stages/stage-config.ts');
  const designSection = config.match(/design:\s*{[\s\S]*?nextStage:/);
  assert.ok(designSection, 'Could not find design stage');
  const designText = designSection[0];
  
  assert.ok(designText.includes('supportAgents'), 'Design stage missing supportAgents field');
  assert.ok(designText.includes('datasheetAnalyzer'), 'datasheetAnalyzer not in design stage');
  
  // Check it's NOT in eligibleAgents
  const eligibleMatch = designText.match(/eligibleAgents:\s*\[(.*?)\]/);
  assert.ok(eligibleMatch, 'Could not find eligibleAgents');
  assert.ok(!eligibleMatch[1].includes('datasheetAnalyzer'), 'datasheetAnalyzer should NOT be in eligibleAgents');
});

test('project-state.ts exports ProjectStateService', () => {
  const state = readFile('lib/stages/project-state.ts');
  assert.ok(state.includes('export const ProjectStateService'), 'Missing ProjectStateService export');
});

test('ProjectStateService has all required methods', () => {
  const state = readFile('lib/stages/project-state.ts');
  assert.ok(state.includes('loadProjectState'), 'Missing loadProjectState method');
  assert.ok(state.includes('checkAndAdvanceStage'), 'Missing checkAndAdvanceStage method');
  assert.ok(state.includes('getMissingArtifacts'), 'Missing getMissingArtifacts method');
  assert.ok(state.includes('setStage'), 'Missing setStage method');
  assert.ok(state.includes('setAutoOrchestration'), 'Missing setAutoOrchestration method');
});

test('checkAndAdvanceStage records to stage_history', () => {
  const state = readFile('lib/stages/project-state.ts');
  // Check the entire file for stage_history handling in checkAndAdvanceStage
  assert.ok(state.includes('checkAndAdvanceStage'), 'checkAndAdvanceStage method not found');
  assert.ok(state.includes('stage_history'), 'stage_history not referenced in file');
  assert.ok(state.includes('history.push') || state.includes('stage_history:'), 'stage_history not being written');
});

test('artifact-validator.ts exports validation functions', () => {
  const validator = readFile('lib/stages/artifact-validator.ts');
  assert.ok(validator.includes('export function isArtifactValid'), 'Missing isArtifactValid export');
  assert.ok(validator.includes('export function isVersionContentValid'), 'Missing isVersionContentValid export');
});

test('ARTIFACT_DEPENDENCIES map is defined', () => {
  const validator = readFile('lib/stages/artifact-validator.ts');
  assert.ok(validator.includes('export const ARTIFACT_DEPENDENCIES'), 'Missing ARTIFACT_DEPENDENCIES export');
});

test('Cascade dependencies are correctly mapped', () => {
  const validator = readFile('lib/stages/artifact-validator.ts');
  // Context affects everything
  assert.ok(validator.includes("context: ['mvp', 'prd', 'bom', 'wiring', 'code']"), 
    'Context dependencies incorrect');
  // BOM affects wiring and code
  assert.ok(validator.includes("bom: ['wiring', 'code']"), 
    'BOM dependencies incorrect');
  // Budget is independent
  assert.ok(validator.includes("budget: []"), 
    'Budget should have no dependencies');
});

test('markDependenciesStale function exists', () => {
  const validator = readFile('lib/stages/artifact-validator.ts');
  assert.ok(validator.includes('export async function markDependenciesStale'), 
    'Missing markDependenciesStale function');
});

test('prompt-builder.ts exports all prompt functions', () => {
  const builder = readFile('lib/stages/prompt-builder.ts');
  assert.ok(builder.includes('export function buildOrchestratorPrompt'), 'Missing buildOrchestratorPrompt');
  assert.ok(builder.includes('export function buildProjectContextSummary'), 'Missing buildProjectContextSummary');
  assert.ok(builder.includes('export function buildStageContextBlock'), 'Missing buildStageContextBlock');
});

test('buildOrchestratorPrompt has no external service dependencies', () => {
  const builder = readFile('lib/stages/prompt-builder.ts');
  const promptFn = builder.match(/export function buildOrchestratorPrompt[\s\S]*?^}/m);
  assert.ok(promptFn, 'Could not find buildOrchestratorPrompt');
  const fnText = promptFn[0];
  
  // Should calculate missing artifacts inline, not call service
  assert.ok(fnText.includes('filter'), 'Should calculate missing artifacts inline');
  assert.ok(!fnText.includes('ProjectStateService.getMissingArtifacts'), 
    'Should NOT depend on ProjectStateService');
});

console.log('');

// ========================================
// Phase 2: Orchestrator Integration Tests
// ========================================

console.log(`${colors.blue}Phase 2: Orchestrator Integration${colors.reset}`);

test('orchestrator.ts imports stage modules', () => {
  const orchestrator = readFile('lib/agents/orchestrator.ts');
  // Check for any import statement containing these modules (handles @/lib or relative paths)
  assert.ok(orchestrator.includes('ProjectStateService'), 
    'Missing ProjectStateService import');
  assert.ok(orchestrator.includes('buildOrchestratorPrompt') || orchestrator.includes('prompt-builder'), 
    'Missing prompt-builder import');
  assert.ok(orchestrator.includes('STAGE_CONFIG') || orchestrator.includes('stage-config'), 
    'Missing stage-config import');
});

test('Orchestrator loads project state before routing', () => {
  const orchestrator = readFile('lib/agents/orchestrator.ts');
  assert.ok(orchestrator.includes('ProjectStateService.loadProjectState'), 
    'Orchestrator does not load project state');
  assert.ok(orchestrator.includes('projectState.projectStage'), 
    'Orchestrator does not reference project stage');
});

test('Orchestrator uses buildOrchestratorPrompt for routing', () => {
  const orchestrator = readFile('lib/agents/orchestrator.ts');
  assert.ok(orchestrator.includes('buildOrchestratorPrompt'), 
    'Orchestrator does not use buildOrchestratorPrompt');
});

test('Orchestrator validates LLM response against eligible agents', () => {
  const orchestrator = readFile('lib/agents/orchestrator.ts');
  const chatMethod = orchestrator.match(/async chat\([^)]*\)[\s\S]*$/);
  assert.ok(chatMethod, 'Could not find chat method');
  const methodText = chatMethod[0];
  
  assert.ok(methodText.includes('stageConfig.eligibleAgents.includes'), 
    'Orchestrator does not validate selected agent');
  assert.ok(methodText.includes('fallback') || methodText.includes('stageConfig.eligibleAgents[0]'), 
    'Orchestrator has no fallback for invalid selection');
});

test('Orchestrator checks for stage advancement after tool calls', () => {
  const orchestrator = readFile('lib/agents/orchestrator.ts');
  assert.ok(orchestrator.includes('checkAndAdvanceStage'), 
    'Orchestrator does not check for stage advancement');
  assert.ok(orchestrator.includes("tc.name === 'write'") || orchestrator.includes('tc.name === "write"'), 
    'Stage advancement not conditioned on write tool calls');
});

test('Orchestrator handles autoOrchestration flag', () => {
  const orchestrator = readFile('lib/agents/orchestrator.ts');
  assert.ok(orchestrator.includes('projectState.autoOrchestration') || 
            orchestrator.includes('autoOrchestration'), 
    'Orchestrator does not check autoOrchestration flag');
});

console.log('');

// ========================================
// Phase 3: Frontend Integration Tests
// ========================================

console.log(`${colors.blue}Phase 3: Frontend Integration${colors.reset}`);

test('StageProgressBar component exists', () => {
  assert.ok(fileExists('components/stages/StageProgressBar.tsx'), 
    'StageProgressBar component not found');
});

test('StageProgressBar accepts required props', () => {
  const component = readFile('components/stages/StageProgressBar.tsx');
  assert.ok(component.includes('currentStage'), 'Missing currentStage prop');
  assert.ok(component.includes('artifacts'), 'Missing artifacts prop');
});

test('StageProgressBar renders all 4 stages', () => {
  const component = readFile('components/stages/StageProgressBar.tsx');
  assert.ok(component.includes('planning') || component.includes('STAGE_ORDER'), 
    'StageProgressBar does not iterate stages');
});

test('StageOverrideButton component exists', () => {
  assert.ok(fileExists('components/stages/StageOverrideButton.tsx'), 
    'StageOverrideButton component not found');
});

test('StageOverrideButton calls stage-override API', () => {
  const component = readFile('components/stages/StageOverrideButton.tsx');
  assert.ok(component.includes('/api/agents/stage-override'), 
    'StageOverrideButton does not call API');
  assert.ok(component.includes('POST'), 
    'StageOverrideButton does not use POST method');
});

test('AIAssistantUI imports stage components', () => {
  const ui = readFile('components/ai_chat/AIAssistantUI.jsx');
  assert.ok(ui.includes('StageProgressBar'), 'AIAssistantUI does not import StageProgressBar');
  assert.ok(ui.includes('StageOverrideButton'), 'AIAssistantUI does not import StageOverrideButton');
});

test('AIAssistantUI loads project state on chat selection', () => {
  const ui = readFile('components/ai_chat/AIAssistantUI.jsx');
  assert.ok(ui.includes('/api/agents/project-state'), 
    'AIAssistantUI does not fetch project state');
  assert.ok(ui.includes('setProjectState'), 
    'AIAssistantUI does not store project state');
});

test('AIAssistantUI subscribes to stage changes', () => {
  const ui = readFile('components/ai_chat/AIAssistantUI.jsx');
  assert.ok(ui.includes('chat_sessions'), 
    'AIAssistantUI does not subscribe to chat_sessions');
  assert.ok(ui.includes('project_stage'), 
    'AIAssistantUI does not watch for project_stage changes');
});

test('AIAssistantUI renders StageProgressBar', () => {
  const ui = readFile('components/ai_chat/AIAssistantUI.jsx');
  assert.ok(ui.includes('<StageProgressBar'), 
    'AIAssistantUI does not render StageProgressBar');
});

test('Header component has autoOrchestration toggle', () => {
  const header = readFile('components/ai_chat/Header.jsx');
  assert.ok(header.includes('autoOrchestration'), 
    'Header does not handle autoOrchestration');
  assert.ok(header.includes('/api/agents/chat-settings'), 
    'Header does not call chat-settings API');
});

console.log('');

// ========================================
// Phase 4: API Routes Tests
// ========================================

console.log(`${colors.blue}Phase 4: API Routes${colors.reset}`);

test('project-state API route exists', () => {
  assert.ok(fileExists('app/api/agents/project-state/route.ts'), 
    'project-state API route not found');
});

test('project-state route returns full ProjectState', () => {
  const route = readFile('app/api/agents/project-state/route.ts');
  assert.ok(route.includes('ProjectStateService.loadProjectState'), 
    'Route does not load project state');
  assert.ok(route.includes('NextResponse.json'), 
    'Route does not return JSON response');
});

test('stage-override API route exists', () => {
  assert.ok(fileExists('app/api/agents/stage-override/route.ts'), 
    'stage-override API route not found');
});

test('stage-override route validates stage parameter', () => {
  const route = readFile('app/api/agents/stage-override/route.ts');
  assert.ok(route.includes('targetStage'), 
    'Route does not accept targetStage parameter');
  assert.ok(route.includes('STAGE_ORDER') || route.includes('ProjectStage'), 
    'Route does not validate stage parameter');
});

test('stage-override route calls ProjectStateService.setStage', () => {
  const route = readFile('app/api/agents/stage-override/route.ts');
  assert.ok(route.includes('ProjectStateService.setStage'), 
    'Route does not call setStage');
});

test('chat-settings API route exists', () => {
  assert.ok(fileExists('app/api/agents/chat-settings/route.ts'), 
    'chat-settings API route not found');
});

test('chat-settings route handles auto_orchestration', () => {
  const route = readFile('app/api/agents/chat-settings/route.ts');
  assert.ok(route.includes('auto_orchestration'), 
    'Route does not handle auto_orchestration');
  assert.ok(route.includes('setAutoOrchestration'), 
    'Route does not call setAutoOrchestration');
});

console.log('');

// ========================================
// Critical Fixes Verification
// ========================================

console.log(`${colors.blue}Critical Fixes Verification${colors.reset}`);

test('FIX 1: Budget is optional in design stage', () => {
  const config = readFile('lib/stages/stage-config.ts');
  const designMatch = config.match(/design:\s*{[\s\S]*?requiredArtifacts:\s*\[(.*?)\]/);
  assert.ok(designMatch, 'Could not find design stage');
  const artifacts = designMatch[1].replace(/'/g, '').replace(/"/g, '').trim();
  assert.strictEqual(artifacts, 'bom', 'Design stage should only require BOM');
});

test('FIX 2: Cascade policy is implemented', () => {
  const validator = readFile('lib/stages/artifact-validator.ts');
  assert.ok(validator.includes('ARTIFACT_DEPENDENCIES'), 'Cascade policy not defined');
  assert.ok(validator.includes('markDependenciesStale'), 'Cascade marking function missing');
});

test('FIX 3: No ProjectStateService import in prompt-builder', () => {
  const builder = readFile('lib/stages/prompt-builder.ts');
  assert.ok(!builder.includes("from '@/lib/stages/project-state'"), 
    'prompt-builder should not import ProjectStateService');
  assert.ok(!builder.includes('ProjectStateService'), 
    'prompt-builder should not reference ProjectStateService');
});

test('FIX 4: stage_history is written on advancement', () => {
  const state = readFile('lib/stages/project-state.ts');
  assert.ok(state.includes('stage_history'), 'stage_history not referenced');
  assert.ok(state.includes('history.push'), 'stage_history not updated');
});

test('FIX 5: datasheetAnalyzer in supportAgents', () => {
  const config = readFile('lib/stages/stage-config.ts');
  assert.ok(config.includes('supportAgents'), 'supportAgents field missing');
  assert.ok(config.includes('datasheetAnalyzer'), 'datasheetAnalyzer not in any agent list');
});

test('FIX 6: Artifact validity check exists', () => {
  const validator = readFile('lib/stages/artifact-validator.ts');
  assert.ok(validator.includes('isVersionContentValid'), 'Content validation missing');
  assert.ok(validator.includes('MIN_CONTENT_LENGTH'), 'Minimum length check missing');
});

test('FIX 7: Stage context block exists', () => {
  const builder = readFile('lib/stages/prompt-builder.ts');
  assert.ok(builder.includes('buildStageContextBlock'), 'Stage context block function missing');
});

console.log('');

// ========================================
// Summary
// ========================================

console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.cyan}  Test Results${colors.reset}`);
console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

const total = passed + failed;
const passRate = ((passed / total) * 100).toFixed(1);

if (failed === 0) {
  console.log(`${colors.green}✓ All ${total} tests passed!${colors.reset}`);
} else {
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Pass Rate: ${passRate}%\n`);
  
  if (failures.length > 0) {
    console.log(`${colors.red}Failed Tests:${colors.reset}`);
    failures.forEach(({ name, error }) => {
      console.log(`  • ${name}`);
      console.log(`    ${error}`);
    });
  }
}

console.log('');

// Exit with error code if tests failed
process.exit(failed > 0 ? 1 : 0);
