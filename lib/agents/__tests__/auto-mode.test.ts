/**
 * LLM AUTO Mode Resolution Unit Test
 * Runs in Node.js environment via tsx
 */

import assert from 'assert';
import { getModelForAgent } from '../config';
import { getAgentAutoConfig } from '../provider-config';

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let passed = 0;
let failed = 0;
const failures: { name: string; error: string }[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`${colors.green}✓${colors.reset} ${name}`);
  } catch (error: any) {
    failed++;
    failures.push({ name, error: error.message });
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    console.log(`  ${colors.red}${error.message}${colors.reset}`);
  }
}

console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.cyan}  LLM AUTO Mode Dynamic Resolution Unit Tests${colors.reset}`);
console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

// Test Agent Configuration Registry mappings
test('getAgentAutoConfig maps orchestrator correctly', () => {
  const config = getAgentAutoConfig('orchestrator');
  assert.strictEqual(config.primary.provider, 'groq');
  assert.strictEqual(config.primary.model, 'openai/gpt-oss-120b');
  assert.strictEqual(config.fallback.provider, 'aiml');
  assert.strictEqual(config.fallback.model, 'deepseek/deepseek-non-reasoner-v3.1-terminus');
});

test('getAgentAutoConfig maps conversational correctly', () => {
  const config = getAgentAutoConfig('conversational');
  assert.strictEqual(config.primary.provider, 'aiml');
  assert.strictEqual(config.primary.model, 'deepseek/deepseek-reasoner-v3.1-terminus');
  assert.strictEqual(config.fallback.provider, 'aiml');
  assert.strictEqual(config.fallback.model, 'zhipu/glm-4.6');
});

// Test dynamic resolution using getModelForAgent
test('getModelForAgent resolves AUTO mode when overrides are empty (orchestrator)', () => {
  const res = getModelForAgent('orchestrator', '', '');
  assert.strictEqual(res.provider, 'groq');
  assert.strictEqual(res.model, 'openai/gpt-oss-120b');
  assert.strictEqual(res.isAuto, true);
});

test('getModelForAgent resolves AUTO mode when overrides are empty (conversational)', () => {
  const res = getModelForAgent('conversational', '', '');
  assert.strictEqual(res.provider, 'aiml');
  assert.strictEqual(res.model, 'deepseek/deepseek-reasoner-v3.1-terminus');
  assert.strictEqual(res.isAuto, true);
});

test('getModelForAgent respects explicit manual provider and model overrides', () => {
  const res = getModelForAgent('conversational', 'aiml', 'zhipu/glm-4.6');
  assert.strictEqual(res.provider, 'aiml');
  assert.strictEqual(res.model, 'zhipu/glm-4.6');
  assert.strictEqual(res.isAuto, false);
});

test('getModelForAgent resolves agent role mapping when provider-only override is set (conversational on groq)', () => {
  const res = getModelForAgent('conversational', 'groq', '');
  assert.strictEqual(res.provider, 'groq');
  assert.strictEqual(res.model, 'llama-3.3-70b-versatile'); // Groq reasoning model
  assert.strictEqual(res.isAuto, false);
});

test('getModelForAgent resolves agent role mapping when provider-only override is set (conversational on aiml)', () => {
  const res = getModelForAgent('conversational', 'aiml', '');
  assert.strictEqual(res.provider, 'aiml');
  assert.strictEqual(res.model, 'deepseek/deepseek-v4-flash'); // AIML reasoning model
  assert.strictEqual(res.isAuto, false);
});

console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.cyan}  Test Summary${colors.reset}`);
console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

const total = passed + failed;
if (failed === 0) {
  console.log(`${colors.green}✓ All ${total} tests passed!${colors.reset}`);
} else {
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  if (failures.length > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    failures.forEach(({ name, error }) => {
      console.log(`  • ${name}`);
      console.log(`    ${error}`);
    });
  }
}

process.exit(failed > 0 ? 1 : 0);
