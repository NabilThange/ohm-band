const fs = require('fs');

// Parse .env.local manually and set env variables
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    let value = parts.slice(1).join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    process.env[key] = value;
});

const wrapperCode = `
import * as fs from 'fs';
import { ToolExecutor } from './lib/agents/tool-executor';
import { getDemoResponse } from './lib/agents/demo-responses';

// Load .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    let value = parts.slice(1).join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    process.env[key] = value;
});

async function test() {
    const chatId = "e72752b6-5f4d-48b2-8711-2ad220274839";
    console.log('🚀 Simulating Tool Calls for Chat ID:', chatId);
    
    const msg = 'Excellent! Generate the firmware for the ESP32 companion computer.';
    const demoResponse = getDemoResponse(msg, 4);
    
    if (!demoResponse) {
        console.error('Demo response not found!');
        return;
    }
    
    console.log('Number of tool calls in response:', demoResponse.toolCalls.length);
    
    const executor = new ToolExecutor(chatId);
    
    for (let i = 0; i < demoResponse.toolCalls.length; i++) {
        const tc = demoResponse.toolCalls[i];
        console.log(\`\\n[Tool \${i+1}/\${demoResponse.toolCalls.length}] Executing \${tc.name} (\${tc.arguments.path || tc.arguments.drawer || ''})\`);
        try {
            const res = await executor.executeToolCall(tc);
            console.log(\`✅ Tool execution success!\`, JSON.stringify(res));
        } catch (error) {
            console.error(\`❌ Tool execution failed:\`, error);
        }
        // Delay 100ms
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

test().catch(console.error);
`;

fs.writeFileSync('run-sim.ts', wrapperCode);
console.log('run-sim.ts updated.');
