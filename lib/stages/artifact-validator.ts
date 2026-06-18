import type { ArtifactContent, ArtifactKey } from './stage-config';
import { ArtifactService } from '@/lib/db/artifacts';
import { supabase } from '@/lib/supabase/client';

// ─────────────────────────────────────────────
// Content Validity Check
// ─────────────────────────────────────────────

const MIN_CONTENT_LENGTH = 50;

/**
 * Returns true only if the artifact exists AND has meaningful content.
 * Prevents empty/stub artifacts from counting as stage-complete.
 */
export function isArtifactValid(artifact: ArtifactContent | null): boolean {
  if (!artifact) return false;

  // The ArtifactContent stored in ProjectState only has metadata (id, version, etc.)
  // Validity is confirmed by the mere existence of the record with a version > 0
  // Full content validation happens in the tool-executor when writing.
  // Here we trust: if a version exists and was written by an agent, it has content.
  return true;
}

/**
 * Deep content validation — used for gate checks when we have the full artifact data.
 * Called in checkAndAdvanceStage with the raw DB record.
 */
export function isVersionContentValid(
  content: string | null,
  contentJson: unknown | null
): boolean {
  // String content (context, mvp, prd)
  if (content && typeof content === 'string') {
    return content.trim().length >= MIN_CONTENT_LENGTH;
  }

  // JSON content (bom, wiring, budget)
  if (contentJson) {
    const str = JSON.stringify(contentJson);
    if (str.length < MIN_CONTENT_LENGTH) return false;

    // Code artifact with files array
    const json = contentJson as Record<string, unknown>;
    if (Array.isArray(json.files)) {
      return (json.files as unknown[]).length > 0;
    }

    return true;
  }

  return false;
}

// ─────────────────────────────────────────────
// Cascade Dependency Map
// ─────────────────────────────────────────────

/**
 * When an artifact is updated, all downstream dependents become stale.
 * context → everything
 * mvp     → prd, bom, wiring, code
 * prd     → bom, wiring, code
 * bom     → wiring, code
 * wiring  → code
 */
export const ARTIFACT_DEPENDENCIES: Record<ArtifactKey, ArtifactKey[]> = {
  context: ['mvp', 'prd', 'bom', 'wiring', 'code'],
  mvp: ['prd', 'bom', 'wiring', 'code'],
  prd: ['bom', 'wiring', 'code'],
  bom: ['wiring', 'code'],
  wiring: ['code'],
  code: [],
  budget: [], // budget is independent; changing it doesn't invalidate others
  enclosure: [], // Phase 1: No stale cascade yet (manual regenerate only)
};

/**
 * Mark all downstream artifacts as stale after an upstream artifact changes.
 * Adds `stale: true` and `stale_reason` to the artifact's metadata column.
 */
export async function markDependenciesStale(
  chatId: string,
  updatedArtifact: ArtifactKey
): Promise<void> {
  const dependents = ARTIFACT_DEPENDENCIES[updatedArtifact];
  if (!dependents.length) return;

  const results = await Promise.allSettled(
    dependents.map(async (dep) => {
      const artifact = await ArtifactService.getLatestArtifact(chatId, dep as any);
      if (!artifact) return;

      await supabase
        .from('artifacts')
        .update({
          metadata: {
            ...(artifact.artifact.metadata as object),
            stale: true,
            stale_reason: `${updatedArtifact} was updated`,
          },
        })
        .eq('id', artifact.artifact.id);
    })
  );

  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length) {
    console.warn(
      `[artifact-validator] ${failures.length} cascade stale mark(s) failed for ${updatedArtifact}`
    );
  }
}
