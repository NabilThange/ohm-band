import { supabase } from '@/lib/supabase/client';
import { ArtifactService } from '@/lib/db/artifacts';
import {
  STAGE_CONFIG,
  type ProjectState,
  type ArtifactKey,
  type ProjectStage,
} from './stage-config';
import { isArtifactValid, isVersionContentValid } from './artifact-validator';

const ARTIFACT_TYPES: ArtifactKey[] = [
  'context',
  'mvp',
  'prd',
  'bom',
  'budget',
  'wiring',
  'code',
];

export const ProjectStateService = {
  // ─────────────────────────────────────────────────────────
  // Load full project state (stage + all artifact metadata)
  // ─────────────────────────────────────────────────────────

  async loadProjectState(chatId: string): Promise<ProjectState> {
    // 1. Load stage info from chat_sessions
    const { data: session, error } = await supabase
      .from('chat_sessions')
      .select('project_stage, stage_override, auto_orchestration')
      .eq('chat_id', chatId)
      .maybeSingle();

    if (error) {
      console.error('[ProjectStateService] Failed to load session:', error.message);
    }

    // 2. Load all artifact metadata in parallel
    const artifacts: Record<ArtifactKey, any> = {} as any;

    await Promise.all(
      ARTIFACT_TYPES.map(async (type) => {
        try {
          const result = await ArtifactService.getLatestArtifact(chatId, type as any);
          if (result) {
            const meta = result.artifact.metadata as Record<string, unknown> | null;
            artifacts[type] = {
              artifactId: result.artifact.id,
              version: result.artifact.current_version ?? 1,
              generatedBy: result.version?.created_by_message_id ?? 'unknown',
              createdAt: result.artifact.created_at,
              stale: (meta?.stale as boolean) ?? false,
              staleReason: (meta?.stale_reason as string) ?? undefined,
            };
          } else {
            artifacts[type] = null;
          }
        } catch {
          artifacts[type] = null;
        }
      })
    );

    return {
      chatId,
      projectStage: (session?.project_stage as ProjectStage) ?? 'planning',
      stageOverride: session?.stage_override ?? false,
      autoOrchestration: session?.auto_orchestration !== false, // default true
      artifacts,
    };
  },

  // ─────────────────────────────────────────────────────────
  // Check whether stage requirements are met and advance
  // ─────────────────────────────────────────────────────────

  async checkAndAdvanceStage(chatId: string): Promise<boolean> {
    const state = await this.loadProjectState(chatId);
    const stageConfig = STAGE_CONFIG[state.projectStage];

    // Terminal stage never advances
    if (!stageConfig.nextStage) return false;

    // Short-circuit: check metadata first (cheap)
    const metaAllFilled = stageConfig.requiredArtifacts.every(
      (key) => isArtifactValid(state.artifacts[key])
    );
    if (!metaAllFilled) return false;

    // Deep validation: verify actual content exists
    const deepValid = await Promise.all(
      stageConfig.requiredArtifacts.map(async (key) => {
        const result = await ArtifactService.getLatestArtifact(chatId, key as any);
        if (!result) return false;
        return isVersionContentValid(
          result.version?.content ?? null,
          result.version?.content_json ?? null
        );
      })
    );

    if (!deepValid.every(Boolean)) return false;

    // All checks passed — advance stage
    const { data: sessionRow } = await supabase
      .from('chat_sessions')
      .select('stage_history')
      .eq('chat_id', chatId)
      .maybeSingle();

    const history = (sessionRow?.stage_history as any[]) ?? [];
    history.push({
      from: state.projectStage,
      to: stageConfig.nextStage,
      timestamp: new Date().toISOString(),
      completedArtifacts: stageConfig.requiredArtifacts,
    });

    const { error } = await supabase
      .from('chat_sessions')
      .update({
        project_stage: stageConfig.nextStage,
        stage_override: false, // clear override on natural advance
        stage_history: history,
      })
      .eq('chat_id', chatId);

    if (error) {
      console.error('[ProjectStateService] Failed to advance stage:', error.message);
      return false;
    }

    console.log(
      `✅ [ProjectStateService] Advanced ${chatId}: ${state.projectStage} → ${stageConfig.nextStage}`
    );
    return true;
  },

  // ─────────────────────────────────────────────────────────
  // Get list of missing artifacts for the current stage
  // ─────────────────────────────────────────────────────────

  getMissingArtifacts(state: ProjectState): ArtifactKey[] {
    const stageConfig = STAGE_CONFIG[state.projectStage];
    return stageConfig.requiredArtifacts.filter((key) => state.artifacts[key] === null);
  },

  // ─────────────────────────────────────────────────────────
  // Manual stage override (power-user escape hatch)
  // ─────────────────────────────────────────────────────────

  async setStage(chatId: string, targetStage: ProjectStage): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .update({
        project_stage: targetStage,
        stage_override: true,
      })
      .eq('chat_id', chatId);

    if (error) {
      throw new Error(`[ProjectStateService] setStage failed: ${error.message}`);
    }

    console.log(`🔧 [ProjectStateService] Manual override: ${chatId} → ${targetStage}`);
  },

  // ─────────────────────────────────────────────────────────
  // Toggle auto-orchestration for a chat session
  // ─────────────────────────────────────────────────────────

  async setAutoOrchestration(chatId: string, enabled: boolean): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ auto_orchestration: enabled })
      .eq('chat_id', chatId);

    if (error) {
      throw new Error(
        `[ProjectStateService] setAutoOrchestration failed: ${error.message}`
      );
    }
  },
};
