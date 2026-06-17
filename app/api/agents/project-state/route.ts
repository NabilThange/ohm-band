import { NextRequest, NextResponse } from 'next/server';
import { ProjectStateService } from '@/lib/stages/project-state';

/**
 * GET /api/agents/project-state?chatId=<chatId>
 * Returns the full ProjectState for a chat: stage, artifact metadata, flags.
 */
export async function GET(req: NextRequest) {
  const chatId = req.nextUrl.searchParams.get('chatId');

  if (!chatId) {
    return NextResponse.json({ error: 'chatId is required' }, { status: 400 });
  }

  try {
    const state = await ProjectStateService.loadProjectState(chatId);
    return NextResponse.json(state);
  } catch (error: any) {
    console.error('[project-state API] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
