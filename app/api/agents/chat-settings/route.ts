import { NextRequest, NextResponse } from 'next/server';
import { ProjectStateService } from '@/lib/stages/project-state';

/**
 * PATCH /api/agents/chat-settings
 * Body: { chatId: string, auto_orchestration?: boolean }
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { chatId, auto_orchestration } = body;

    if (!chatId) {
      return NextResponse.json({ error: 'chatId is required' }, { status: 400 });
    }

    if (auto_orchestration !== undefined) {
      await ProjectStateService.setAutoOrchestration(chatId, auto_orchestration);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[chat-settings API] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
