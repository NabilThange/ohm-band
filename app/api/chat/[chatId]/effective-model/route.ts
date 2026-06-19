import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getModelForAgent } from '@/lib/agents/config';
import { getProviderConfig, type ProviderType } from '@/lib/agents/provider-config';
import { type AgentType } from '@/lib/agents/config';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const { chatId } = await params;
        const { searchParams } = new URL(req.url);
        const agentType = searchParams.get('agent') as AgentType;

        if (!agentType) {
            return NextResponse.json({ error: 'agent parameter is required' }, { status: 400 });
        }

        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('selected_provider, selected_model')
            .eq('chat_id', chatId)
            .maybeSingle();

        if (error) {
            console.error('[GET /api/chat/[chatId]/effective-model] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const providerOverride = data?.selected_provider as ProviderType | '';
        const modelOverride = data?.selected_model || '';

        const modelConfig = getModelForAgent(agentType, providerOverride, modelOverride);

        return NextResponse.json({
            agentType,
            provider: modelConfig.provider,
            model: modelConfig.model,
            isAuto: modelConfig.isAuto
        });
    } catch (error: any) {
        console.error('[GET /api/chat/[chatId]/effective-model] Exception:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
