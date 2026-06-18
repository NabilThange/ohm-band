import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/messages/[messageId]/answers
 * Save user answers to question in message metadata
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    const body = await request.json();
    const { answers } = body;

    if (!answers) {
      return NextResponse.json(
        { error: 'Answers are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ponytail: Fetch current message metadata
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('metadata')
      .eq('id', messageId)
      .single();

    if (fetchError) {
      console.error('[API] Failed to fetch message:', fetchError);
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // ponytail: Merge answers into metadata, handle null case
    const updatedMetadata = {
      ...(typeof message.metadata === 'object' && message.metadata !== null ? message.metadata : {}),
      answers,
      answeredAt: new Date().toISOString()
    };

    // ponytail: Update message with answers
    const { error: updateError } = await supabase
      .from('messages')
      .update({ metadata: updatedMetadata })
      .eq('id', messageId);

    if (updateError) {
      console.error('[API] Failed to update message:', updateError);
      return NextResponse.json(
        { error: 'Failed to save answers' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API] Error saving answers:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
