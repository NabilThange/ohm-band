import assert from 'assert';
import { getDemoResponse } from '../demo-responses';

// ANSI colors for clean test reporting
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
const failures: { name: string; error: any }[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`${colors.green}✓${colors.reset} ${name}`);
  } catch (error: any) {
    failed++;
    failures.push({ name, error: error.message });
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    console.log(`  ${colors.red}${error.stack || error.message}${colors.reset}`);
  }
}

console.log(`${colors.cyan}===================================================`);
console.log(`  Demo Responses Turn-Based Flow Verification Test`);
console.log(`===================================================${colors.reset}\n`);

// ====================================================
// Test Suite
// ====================================================

test('getDemoResponse is exported as a function', () => {
  assert.strictEqual(typeof getDemoResponse, 'function');
});

test('Turn 1: Initial requirements gathering with questions', () => {
  const msg = 'I want to build a DIY autonomous drone that can patrol my farm, stream video to my phone, and return to its charging station automatically.';
  const response = getDemoResponse(msg, 0);
  
  assert.ok(response, 'Should return a demo response');
  assert.strictEqual(response.agentType, 'conversational');
  assert.strictEqual(response.intent, 'GATHER_REQUIREMENTS');
  
  // Verify the response contains question JSON
  const fullText = response.textChunks.join('');
  assert.ok(fullText.includes('<QUESTIONS>'), 'Should contain QUESTIONS opening tag');
  assert.ok(fullText.includes('</QUESTIONS>'), 'Should contain QUESTIONS closing tag');
  
  // Verify the intro text is present
  assert.ok(fullText.includes('Great idea!'), 'Should contain greeting text');
  assert.ok(fullText.includes('understand your specific requirements'), 'Should explain purpose of questions');
  
  // Parse and validate the questions JSON
  const questionMatch = fullText.match(/<QUESTIONS>\s*([\s\S]*?)\s*<\/QUESTIONS>/);
  assert.ok(questionMatch, 'Should find QUESTIONS block');
  
  const questionsData = JSON.parse(questionMatch[1]);
  assert.ok(questionsData.questions, 'Should have questions array');
  assert.strictEqual(questionsData.questions.length, 3, 'Should have exactly 3 questions');
  
  // Verify question structure
  const q1 = questionsData.questions[0];
  assert.strictEqual(q1.id, 'environment', 'First question should be about environment');
  assert.strictEqual(q1.type, 'single_select', 'Should be single_select type');
  assert.ok(q1.options.length >= 3, 'Should have at least 3 options');
  assert.strictEqual(q1.required, true, 'Should be required');
  
  const q2 = questionsData.questions[1];
  assert.strictEqual(q2.id, 'use_case', 'Second question should be about use case');
  
  const q3 = questionsData.questions[2];
  assert.strictEqual(q3.id, 'budget', 'Third question should be about budget');
  
  // Verify no tool calls for question-only response
  assert.strictEqual(response.toolCalls.length, 0, 'Should have no tool calls for questions');
});

test('Turn 2: Technical preferences gathering with questions', () => {
  const msg = 'Environment: Medium farm (10-50 acres), Use case: Crop health monitoring, Budget: $300-$500';
  const response = getDemoResponse(msg, 1);
  
  assert.ok(response, 'Should return a demo response');
  assert.strictEqual(response.agentType, 'conversational');
  assert.strictEqual(response.intent, 'GATHER_TECHNICAL_PREFS');
  
  // Verify the response contains question JSON
  const fullText = response.textChunks.join('');
  assert.ok(fullText.includes('<QUESTIONS>'), 'Should contain QUESTIONS opening tag');
  assert.ok(fullText.includes('</QUESTIONS>'), 'Should contain QUESTIONS closing tag');
  
  // Verify the intro text is present
  assert.ok(fullText.includes('Perfect!'), 'Should contain acknowledgment text');
  assert.ok(fullText.includes('technical specifications'), 'Should mention technical specs');
  
  // Parse and validate the questions JSON
  const questionMatch = fullText.match(/<QUESTIONS>\s*([\s\S]*?)\s*<\/QUESTIONS>/);
  assert.ok(questionMatch, 'Should find QUESTIONS block');
  
  const questionsData = JSON.parse(questionMatch[1]);
  assert.ok(questionsData.questions, 'Should have questions array');
  assert.strictEqual(questionsData.questions.length, 3, 'Should have exactly 3 questions');
  
  // Verify question structure
  const q1 = questionsData.questions[0];
  assert.strictEqual(q1.id, 'flight_time', 'First question should be about flight time');
  assert.strictEqual(q1.type, 'single_select', 'Should be single_select type');
  assert.ok(q1.options.length >= 3, 'Should have at least 3 options');
  
  const q2 = questionsData.questions[1];
  assert.strictEqual(q2.id, 'video_quality', 'Second question should be about video quality');
  
  const q3 = questionsData.questions[2];
  assert.strictEqual(q3.id, 'experience', 'Third question should be about experience level');
  assert.strictEqual(q3.required, false, 'Experience question should be optional');
  
  // Verify no tool calls for question-only response
  assert.strictEqual(response.toolCalls.length, 0, 'Should have no tool calls for questions');
});

test('Turn 3: MVP and context initialization matches correctly', () => {
  const msg = 'Flight time: 20-30 minutes, Video: 1080p, Experience: Some hobby experience';
  const response = getDemoResponse(msg, 2);
  
  assert.ok(response, 'Should return a demo response');
  assert.strictEqual(response.agentType, 'projectInitializer');
  assert.strictEqual(response.intent, 'PROJECT_INIT');
  
  // Verify no stripping tags exist in textChunks
  const fullText = response.textChunks.join('');
  assert.ok(!fullText.includes('MVP_START'), 'Should not contain MVP_START tag');
  assert.ok(!fullText.includes('MVP_END'), 'Should not contain MVP_END tag');
  
  // Verify the description contents are present
  assert.ok(fullText.includes('fully autonomous agricultural surveillance drone'), 'Should contain MVP descriptive text');
  assert.ok(fullText.includes('Would you like me to proceed with the PRD?'), 'Should ask the next-step question');
  
  // Verify correct tool calls exist
  assert.ok(response.toolCalls.length >= 3, 'Should execute write (mvp, context) and open_drawer tool calls');
  
  const writeMVP = response.toolCalls.find(tc => tc.name === 'write' && tc.arguments.artifact_type === 'mvp');
  assert.ok(writeMVP, 'Should have a write tool call for mvp');
  
  const writeContext = response.toolCalls.find(tc => tc.name === 'write' && tc.arguments.artifact_type === 'context');
  assert.ok(writeContext, 'Should have a write tool call for context');
  
  const openCall = response.toolCalls.find(tc => tc.name === 'open_drawer');
  assert.ok(openCall, 'Should have an open_drawer tool call');
  assert.strictEqual(openCall.arguments.drawer, 'mvp');
});

test('Turn 4: PRD & Architecture generation matches correctly', () => {
  const msg = 'Yes, create the PRD and technical architecture.';
  const response = getDemoResponse(msg, 3);
  
  assert.ok(response, 'Should return a demo response');
  assert.strictEqual(response.agentType, 'productDesigner');
  assert.strictEqual(response.intent, 'PRD_GEN');
  
  // Verify no stripping tags exist in textChunks
  const fullText = response.textChunks.join('');
  assert.ok(!fullText.includes('CONTEXT_START'), 'Should not contain CONTEXT_START tag');
  assert.ok(!fullText.includes('CONTEXT_END'), 'Should not contain CONTEXT_END tag');
  assert.ok(!fullText.includes('PRD_START'), 'Should not contain PRD_START tag');
  assert.ok(!fullText.includes('PRD_END'), 'Should not contain PRD_END tag');
  
  // Verify details are present
  assert.ok(fullText.includes('Technical Architecture'), 'Should contain architecture header');
  assert.ok(fullText.includes('Product Requirements Document'), 'Should contain PRD header');
  assert.ok(fullText.includes('Ready to generate the Bill of Materials?'), 'Should ask the next-step question');
  
  // Verify tool calls
  const writePRD = response.toolCalls.find(tc => tc.name === 'write' && tc.arguments.artifact_type === 'prd');
  assert.ok(writePRD, 'Should write the PRD');
  const writeContext = response.toolCalls.find(tc => tc.name === 'write' && tc.arguments.artifact_type === 'context');
  assert.ok(writeContext, 'Should write the context');
});

test('Turn 5: BOM generation matches correctly', () => {
  const msg = 'Yes, generate the complete BOM with pricing and sourcing.';
  const response = getDemoResponse(msg, 4);
  
  assert.ok(response, 'Should return a demo response');
  assert.strictEqual(response.agentType, 'bomGenerator');
  assert.strictEqual(response.intent, 'BOM_GEN');
  
  const fullText = response.textChunks.join('');
  assert.ok(!fullText.includes('<BOM_CONTAINER>'), 'Should NOT contain BOM_CONTAINER tag - use tool calls only');
  assert.ok(fullText.includes('Bill of Materials'), 'Should mention BOM generation');
  assert.ok(fullText.includes('Ready to generate the wiring diagram?'), 'Should ask the next-step question');
});

test('Turn 6: Wiring diagram matches correctly', () => {
  const msg = 'Perfect! Now generate the wiring diagram.';
  const response = getDemoResponse(msg, 5);
  
  assert.ok(response, 'Should return a demo response');
  assert.strictEqual(response.agentType, 'wiringSpecialist');
  assert.strictEqual(response.intent, 'WIRING_GEN');
  
  const fullText = response.textChunks.join('');
  assert.ok(fullText.includes('wiring guide'), 'Should contain wiring guide text');
  assert.ok(fullText.includes('Ready to generate the firmware code?'), 'Should ask the next-step question');
});

test('Turn 7: Firmware matches correctly', () => {
  const msg = 'Excellent! Generate the firmware for the ESP32 companion computer.';
  const response = getDemoResponse(msg, 6);
  
  assert.ok(response, 'Should return a demo response');
  assert.strictEqual(response.agentType, 'codeGenerator');
  assert.strictEqual(response.intent, 'CODE_GEN');
  
  const fullText = response.textChunks.join('');
  assert.ok(!fullText.includes('<CODE_CONTAINER>'), 'Should NOT contain CODE_CONTAINER tag - use tool calls only');
  assert.ok(fullText.includes('firmware'), 'Should mention firmware generation');
  assert.ok(fullText.includes('Ready to design the 3D'), 'Should ask the next-step question');
  
  // CRITICAL: Verify all 6 code files are present in tool calls
  assert.ok(response.toolCalls.length === 7, `Should have exactly 7 tool calls (1 open_drawer + 6 write), but got ${response.toolCalls.length}`);
  
  const writeCodeCalls = response.toolCalls.filter(tc => tc.name === 'write' && tc.arguments.artifact_type === 'code');
  assert.strictEqual(writeCodeCalls.length, 6, `Should have exactly 6 code file writes, but got ${writeCodeCalls.length}`);
  
  // Verify each expected file is present
  const expectedFiles = [
    'platformio.ini',
    'include/config.h',
    'src/main.cpp',
    'src/mavlink_handler.cpp',
    'src/obstacle_sensor.cpp',
    'src/telemetry_server.cpp'
  ];
  
  expectedFiles.forEach(filename => {
    const fileCall = writeCodeCalls.find(tc => tc.arguments.path === filename);
    assert.ok(fileCall, `Should have a write call for ${filename}`);
    assert.ok(fileCall.arguments.content, `${filename} should have non-empty content`);
    assert.ok(fileCall.arguments.content.length > 50, `${filename} should have substantial content (got ${fileCall.arguments.content.length} chars)`);
  });
});

test('Turn 8: Enclosure design matches correctly', () => {
  const msg = 'Perfect! Now design the 3D printable enclosure and charging dock.';
  const response = getDemoResponse(msg, 7);
  
  assert.ok(response, 'Should return a demo response');
  assert.strictEqual(response.agentType, 'enclosureDesigner');
  assert.strictEqual(response.intent, 'ENCLOSURE_GEN');
  
  const fullText = response.textChunks.join('');
  assert.ok(fullText.includes('OpenSCAD designs'), 'Should contain OpenSCAD text');
  assert.ok(fullText.includes('Your Farm Patrol Drone project is fully designed!'), 'Should contain project completion statement');
  
  // Verify all 5 enclosure files are present
  const writeEnclosureCalls = response.toolCalls.filter(tc => tc.name === 'write' && tc.arguments.artifact_type === 'enclosure');
  assert.strictEqual(writeEnclosureCalls.length, 5, `Should have exactly 5 enclosure file writes, but got ${writeEnclosureCalls.length}`);
  
  const expectedEnclosureFiles = [
    'models/pixhawk_case.scad',
    'models/esp32_camera_nacelle.scad',
    'models/gps_mast_mount.scad',
    'models/landing_leg_set.scad',
    'models/battery_tray.scad'
  ];
  
  expectedEnclosureFiles.forEach(filename => {
    const fileCall = writeEnclosureCalls.find(tc => tc.arguments.path === filename);
    assert.ok(fileCall, `Should have a write call for ${filename}`);
    assert.ok(fileCall.arguments.content, `${filename} should have non-empty content`);
  });
});

test('Fallback: Keyword-based matching works when user count is missing or out of bounds', () => {
  // When no user count, should still match based on keywords but now returns conversational for first message
  const msg1 = 'I want to build a DIY autonomous drone for my farm';
  const response1 = getDemoResponse(msg1);
  assert.ok(response1);
  // Without userMessageCount, keyword matching should still trigger the flow
  // But since it's the first drone-related message, it could return conversational or projectInitializer
  assert.ok(['conversational', 'projectInitializer'].includes(response1.agentType), 
    `Expected conversational or projectInitializer but got ${response1.agentType}`);
  
  const msg4 = 'wiring diagram';
  const response4 = getDemoResponse(msg4);
  assert.ok(response4);
  assert.strictEqual(response4.agentType, 'wiringSpecialist');
});

test('Generic fallback: returns null for non-demo messages', () => {
  const msg = 'How do I build a simple React application?';
  const response = getDemoResponse(msg);
  assert.strictEqual(response, null);
});

// ====================================================
// Summary Report
// ====================================================

console.log(`\n${colors.cyan}===================================================`);
console.log(`  Verification Summary`);
console.log(`===================================================${colors.reset}\n`);

const total = passed + failed;
const passRate = ((passed / total) * 100).toFixed(1);

if (failed === 0) {
  console.log(`${colors.green}✓ All ${total} tests passed!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Pass Rate: ${passRate}%\n`);
  
  console.log(`${colors.red}Failed Tests:${colors.reset}`);
  failures.forEach(({ name, error }) => {
    console.log(`  • ${name}`);
    console.log(`    ${error}`);
  });
  console.log('');
  process.exit(1);
}
