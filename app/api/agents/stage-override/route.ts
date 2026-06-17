import { NextRequest, NextResponse } from 'next/server';
import { ProjectStateService } from '@/lib/stages/project-state';
import { STAGE_ORDER, type ProjectStage } from '@/lib/stages/stage-config';

/**
 * POST /api/agents/stage-override
 * Body: { chatId: string, targetStage: ProjectStage }
 * Allows power users to manually jump to any stage (sets stage_override = true).
 */
export async function POST(req: NextRequest) {
  try {
    const { chatId, targetStage } = await req.json();

    if (!chatId || !targetStage) {
      return NextResponse.json(
        { error: 'chatId and targetStage are required' },
        { status: 400 }
      );
    }

    if (!STAGE_ORDER.includes(targetStage as ProjectStage)) {
      return NextResponse.json(
        { error: `Invalid stage. Must be one of: ${STAGE_ORDER.join(', ')}` },
        { status: 400 }
      );
    }

    await ProjectStateService.setStage(chatId, targetStage as ProjectStage);

    return NextResponse.json({
      success: true,
      chatId,
      newStage: targetStage,
      message: `Stage manually set to '${targetStage}'`,
    });
  } catch (error: any) {
    console.error('[stage-override API] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
