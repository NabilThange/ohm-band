import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import {
  STAGE_CONFIG,
  type ProjectState,
  type ArtifactKey,
  type ProjectStage,
} from './stage-config';
import {
  ensureProjectDirectory,
  recalculateProjectStage,
  getProjectArtifact,
} from '@/lib/workspace/project-fs';

const ARTIFACT_TYPES: ArtifactKey[] = [
  'context',
  'mvp',
  'prd',
  'bom',
  'budget',
  'wiring',
  'code',
  'enclosure',
];

export const ProjectStateService = {
  /**
   * Load full project state (stage + all artifact metadata) from local disk
   */
  async loadProjectState(chatId: string): Promise<ProjectState> {
    const projectDir = await ensureProjectDirectory(chatId);
    const stagePath = path.join(projectDir, 'stage.json');

    let stageMeta: any = {
      id: chatId,
      title: 'Hardware Project',
      stage: 'planning',
      stage_override: false,
      auto_orchestration: true,
    };

    if (fs.existsSync(stagePath)) {
      try {
        const raw = await fsp.readFile(stagePath, 'utf-8');
        stageMeta = JSON.parse(raw);
      } catch { }
    }

    // Check all artifacts on disk
    const artifacts: Record<ArtifactKey, any> = {} as any;

    await Promise.all(
      ARTIFACT_TYPES.map(async (type) => {
        try {
          const content = await getProjectArtifact(chatId, type);
          if (content) {
            artifacts[type] = {
              artifactId: `${chatId}-${type}`,
              version: 1,
              generatedBy: 'opencode',
              createdAt: new Date().toISOString(),
              stale: false,
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
      projectStage: stageMeta.stage || 'planning',
      stageOverride: stageMeta.stage_override ?? false,
      autoOrchestration: stageMeta.auto_orchestration ?? true,
      artifacts,
    };
  },

  /**
   * Set stage explicitly (manual override or recalculation)
   */
  async setStage(chatId: string, stage: ProjectStage, override = true): Promise<void> {
    const projectDir = await ensureProjectDirectory(chatId);
    const stagePath = path.join(projectDir, 'stage.json');

    let stageMeta: any = {
      id: chatId,
      title: 'Hardware Project',
      stage,
      stage_override: override,
      updatedAt: new Date().toISOString(),
    };

    if (fs.existsSync(stagePath)) {
      try {
        stageMeta = JSON.parse(await fsp.readFile(stagePath, 'utf-8'));
      } catch { }
    }

    stageMeta.stage = stage;
    stageMeta.stage_override = override;
    stageMeta.updatedAt = new Date().toISOString();

    await fsp.writeFile(stagePath, JSON.stringify(stageMeta, null, 2), 'utf-8');
  },

  /**
   * Recalculate stage dynamically based on artifacts present on disk
   */
  async reevaluateStage(chatId: string): Promise<ProjectStage> {
    return recalculateProjectStage(chatId);
  },

  /**
   * Toggle auto orchestration flag in stage.json
   */
  async setAutoOrchestration(chatId: string, auto: boolean): Promise<void> {
    const projectDir = await ensureProjectDirectory(chatId);
    const stagePath = path.join(projectDir, 'stage.json');

    let stageMeta: any = {
      id: chatId,
      title: 'Hardware Project',
      stage: 'planning',
      stage_override: false,
      auto_orchestration: auto,
      updatedAt: new Date().toISOString(),
    };

    if (fs.existsSync(stagePath)) {
      try {
        stageMeta = JSON.parse(await fsp.readFile(stagePath, 'utf-8'));
      } catch { }
    }

    stageMeta.auto_orchestration = auto;
    stageMeta.updatedAt = new Date().toISOString();

    await fsp.writeFile(stagePath, JSON.stringify(stageMeta, null, 2), 'utf-8');
  },
};
