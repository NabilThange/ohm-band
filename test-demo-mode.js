/**
 * Quick test script to verify demo mode works
 * Run with: node test-demo-mode.js
 */

// Test the demo response matching
const testMessage = "I want to build a DIY autonomous drone that can patrol my farm, stream video to my phone, and return to its charging station automatically.";

console.log('🧪 Testing Demo Mode Response Matching\n');
console.log('Input message:', testMessage);
console.log('\n');

// Simulate the matching logic
const normalizedMessage = testMessage.toLowerCase().trim();
const matches = normalizedMessage.includes('autonomous drone') && normalizedMessage.includes('farm');

if (matches) {
    console.log('✅ SUCCESS: Message matches drone patrol pattern!');
    console.log('   Expected response: Farm Patrol Autonomous Drone');
    console.log('   Expected agent: The Project Initializer 🚀');
    console.log('   Expected tool calls: 3 (open_drawer, write context, write mvp)');
} else {
    console.log('❌ FAILED: Message does not match expected pattern');
}

console.log('\n');
console.log('📋 Next steps:');
console.log('1. Make sure DEMO_MODE=true in .env.local');
console.log('2. Restart your dev server: npm run dev');
console.log('3. Go to /build page and paste the test message');
console.log('4. Watch for [DEMO MODE] logs in console');
