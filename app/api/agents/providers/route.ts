import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        providers: [
            { id: 'opencode', name: 'OpenCode Daemon (Local)', capabilities: { streaming: true, vision: true, tools: true } },
            { id: 'groq', name: 'Groq Cloud (Fast)', capabilities: { streaming: true, vision: false, tools: true } },
        ],
        models: [
            { id: 'opencode-default', name: 'OpenCode Agent Engine', provider: 'opencode', capabilities: { streaming: true, vision: true, tools: true }, contextWindow: 128000, pricing: { free: true } },
            { id: 'groq/llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)', provider: 'groq', capabilities: { streaming: true, vision: false, tools: true }, contextWindow: 128000, pricing: { free: true } },
        ],
        active: 'opencode',
    });
}
