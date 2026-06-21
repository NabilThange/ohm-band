/**
 * Integration test to verify code files are properly saved to database
 * This test simulates the full demo flow with proper UUID chat IDs
 */

import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { ToolExecutor } from './lib/agents/tool-executor';
import { getDemoResponse } from './lib/agents/demo-responses';
import { ArtifactService } from './lib/db/artifacts';

// Load .env.local
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

async function testCodePersistence() {
    // Generate a proper UUID for this test session
    const chatId = randomUUID();
    console.log('\n🧪 Testing Code Persistence with UUID:', chatId);
    console.log('═══════════════════════════════════════════════════════\n');
    
    // First, create the chat record (artifacts and messages have FK to chats)
    console.log('📦 Creating chat session...\n');
    const { ChatService } = await import('./lib/db/chat');
    
    try {
        // Use a test user ID (or null for anonymous)
        const testUserId = '00000000-0000-0000-0000-000000000000'; // This will be treated as null
        await ChatService.createChatWithId(testUserId, chatId, 'Code Persistence Test');
        console.log('✓ Chat session created\n');
    } catch (error: any) {
        console.error('❌ Failed to create chat:', error.message);
        console.error(error);
        process.exit(1);
    }
    
    // Get the Turn 5 demo response (code generation)
    const msg = 'Excellent! Generate the firmware for the ESP32 companion computer.';
    const demoResponse = getDemoResponse(msg, 4);
    
    if (!demoResponse) {
        console.error('❌ Demo response not found!');
        process.exit(1);
    }
    
    console.log(`✓ Demo response loaded: ${demoResponse.agentType}`);
    console.log(`✓ Tool calls count: ${demoResponse.toolCalls.length}\n`);
    
    // Execute all tool calls
    const executor = new ToolExecutor(chatId);
    
    console.log('📝 Executing tool calls...\n');
    for (let i = 0; i < demoResponse.toolCalls.length; i++) {
        const tc = demoResponse.toolCalls[i];
        const filename = tc.arguments.path || tc.arguments.drawer || '';
        console.log(`  [${i + 1}/${demoResponse.toolCalls.length}] ${tc.name}(${filename})`);
        
        try {
            await executor.executeToolCall(tc);
        } catch (error: any) {
            console.error(`    ❌ FAILED: ${error.message}`);
            process.exit(1);
        }
        
        // Very long delay to completely avoid version conflicts in test
        // In production, the retry logic will handle occasional conflicts
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n✓ All tool calls executed successfully!\n');
    
    // Now verify the artifact was saved correctly
    console.log('🔍 Verifying database storage...\n');
    
    try {
        const artifact = await ArtifactService.getArtifactByChatAndType(chatId, 'code');
        
        if (!artifact) {
            console.error('❌ No code artifact found in database!');
            process.exit(1);
        }
        
        console.log(`✓ Code artifact found: ${artifact.id}`);
        
        const latestVersion = await ArtifactService.getLatestVersion(artifact.id);
        
        if (!latestVersion) {
            console.error('❌ No version found for artifact!');
            process.exit(1);
        }
        
        console.log(`✓ Latest version: v${latestVersion.version_number}`);
        
        const contentJson = latestVersion.content_json as { files?: any[] };
        const files = contentJson?.files || [];
        
        console.log(`✓ Files in database: ${files.length}\n`);
        
        // Verify all 6 expected files are present
        const expectedFiles = [
            'platformio.ini',
            'include/config.h',
            'src/main.cpp',
            'src/mavlink_handler.cpp',
            'src/obstacle_sensor.cpp',
            'src/telemetry_server.cpp'
        ];
        
        console.log('📋 File verification:\n');
        let allFilesPresent = true;
        
        expectedFiles.forEach(filename => {
            const file = files.find((f: any) => f.path === filename);
            if (file) {
                const size = file.content?.length || 0;
                console.log(`  ✓ ${filename} (${size} bytes)`);
            } else {
                console.log(`  ❌ ${filename} - MISSING!`);
                allFilesPresent = false;
            }
        });
        
        console.log('\n═══════════════════════════════════════════════════════');
        
        if (allFilesPresent && files.length === 6) {
            console.log('✅ SUCCESS: All 6 code files are properly saved!\n');
            process.exit(0);
        } else {
            console.log(`❌ FAILURE: Expected 6 files, found ${files.length}\n`);
            process.exit(1);
        }
        
    } catch (error: any) {
        console.error('❌ Database verification failed:', error.message);
        process.exit(1);
    }
}

testCodePersistence().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
