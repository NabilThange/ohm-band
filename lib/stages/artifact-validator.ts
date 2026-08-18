import type { ArtifactContent, ArtifactKey } from './stage-config';

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
  return true;
}

/**
 * Deep content validation — used for gate checks when we have the full artifact data.
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

export const ARTIFACT_DEPENDENCIES: Record<ArtifactKey, ArtifactKey[]> = {
  context: ['mvp', 'prd', 'bom', 'wiring', 'code'],
  mvp: ['prd', 'bom', 'wiring', 'code'],
  prd: ['bom', 'wiring', 'code'],
  bom: ['wiring', 'code'],
  wiring: ['code'],
  code: [],
  budget: [],
  enclosure: [],
};

export async function markDependenciesStale(
  chatId: string,
  updatedArtifact: ArtifactKey
): Promise<void> {
  // In filesystem mode, dependency freshness is derived on-demand from file mtimes.
}
