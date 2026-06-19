import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import { isValidProviderModel, type ProviderType } from '@/lib/agents/provider-config';

/**
 * GET /api/chat/[chatId]/provider
 * 
 * Get the current provider and model selection for a chat session
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const { chatId } = await params;
        const supabase = getSupabaseClient();
        
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('selected_provider, selected_model')
            .eq('chat_id', chatId)
            .maybeSingle();  // ponytail: Returns null instead of throwing on 0 rows

        if (error) {
            console.error('[GET /api/chat/[chatId]/provider] Error:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to fetch provider settings' }, 
                { status: 500 }
            );
        }

        // ponytail: Return defaults for new chats without a session row (default is empty string representing AUTO)
        return NextResponse.json({ 
            provider: data ? (data.selected_provider ?? '') : '',
            model: data ? (data.selected_model ?? '') : ''
        });

    } catch (error: any) {
        console.error('[GET /api/chat/[chatId]/provider] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch provider settings' }, 
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/chat/[chatId]/provider
 * 
 * Update the provider and model selection for a chat session
 * Validates the provider/model combination before saving
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const { chatId } = await params;
        const { provider, model } = await req.json();

        // Validation
        if (provider !== '' && (!provider || !['openrouter', 'groq', 'aiml'].includes(provider))) {
            return NextResponse.json(
                { error: 'Invalid provider. Must be one of: openrouter, groq, aiml, or empty string' }, 
                { status: 400 }
            );
        }

        // Validate model if provided and provider is not empty
        if (provider !== '' && model && !isValidProviderModel(provider as ProviderType, model)) {
            return NextResponse.json({ 
                error: `Invalid model for selected provider: ${model} is not available for ${provider}` 
            }, { status: 400 });
        }

        // Update chat_sessions
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('chat_sessions')
            .update({ 
                selected_provider: provider,
                selected_model: provider === '' ? '' : (model || '')
            })
            .eq('chat_id', chatId)
            .select()
            .single();

        if (error) {
            console.error('[PATCH /api/chat/[chatId]/provider] Error:', error);
            throw error;
        }

        console.log(`✅ [PATCH /api/chat/[chatId]/provider] Updated session ${chatId}: ${provider}${model ? ` / ${model}` : ''}`);

        return NextResponse.json({ 
            success: true, 
            session: data 
        });

    } catch (error: any) {
        console.error('[PATCH /api/chat/[chatId]/provider] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update provider settings' }, 
            { status: 500 }
        );
    }
}
