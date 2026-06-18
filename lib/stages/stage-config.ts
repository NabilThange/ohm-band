import type { AgentType } from '@/lib/agents/config';

// ─────────────────────────────────────────────
// Core Types
// ─────────────────────────────────────────────

export type ProjectStage = 'planning' | 'design' | 'build' | 'fix';

export type ArtifactKey =
  | 'context'
  | 'mvp'
  | 'prd'
  | 'bom'
  | 'budget'
  | 'wiring'
  | 'code'
  | 'enclosure';

export interface StageConfig {
  /** Short description shown in the progress bar */
  description: string;
  /** Longer goal statement used in orchestrator prompt */
  goal: string;
  /** Artifacts that MUST exist before the stage can advance */
  requiredArtifacts: ArtifactKey[];
  /** Agents the orchestrator may route to in this stage */
  eligibleAgents: AgentType[];
  /** Support-only agents (force-selectable by user, not auto-routed) */
  supportAgents?: AgentType[];
  /** Next stage after completion; null = terminal stage */
  nextStage: ProjectStage | null;
}

export interface ProjectState {
  chatId: string;
  projectStage: ProjectStage;
  stageOverride: boolean;
  autoOrchestration: boolean;
  artifacts: Record<ArtifactKey, ArtifactContent | null>;
}

export interface ArtifactContent {
  artifactId: string;
  version: number;
  generatedBy: string;
  createdAt: string;
  /** Set to true when an upstream artifact was updated after this one was generated */
  stale?: boolean;
  staleReason?: string;
}

// ─────────────────────────────────────────────
// Stage Definitions
// ─────────────────────────────────────────────

export const STAGE_CONFIG: Record<ProjectStage, StageConfig> = {
  planning: {
    description: 'Define your project idea, features, and requirements',
    goal: 'Fully understand project requirements and constraints',
    requiredArtifacts: ['context', 'mvp', 'prd'],
    eligibleAgents: ['projectInitializer', 'conversational'],
    nextStage: 'design',
  },

  design: {
    description: 'Choose parts and optimize costs',
    goal: 'Select components and validate the bill of materials',
    requiredArtifacts: ['bom'], // budget is OPTIONAL
    eligibleAgents: ['bomGenerator', 'budgetOptimizer'],
    supportAgents: ['datasheetAnalyzer'], // force-only, not auto-routed
    nextStage: 'build',
  },

  build: {
    description: 'Get connection instructions and working firmware',
    goal: 'Generate wiring diagrams and firmware code',
    requiredArtifacts: ['wiring', 'code'],
    eligibleAgents: ['wiringDiagram', 'codeGenerator', 'enclosureGenerator'],
    nextStage: 'fix',
  },

  fix: {
    description: 'Troubleshoot, verify, and enhance your build',
    goal: 'Debug hardware/software issues and optionally generate enclosures',
    requiredArtifacts: [], // terminal — no gate
    eligibleAgents: ['debugger', 'circuitVerifier', 'enclosureGenerator'],
    nextStage: null,
  },
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Ordered list for UI rendering */
export const STAGE_ORDER: ProjectStage[] = ['planning', 'design', 'build', 'fix'];

export function getStageIndex(stage: ProjectStage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function isStageComplete(
  stage: ProjectStage,
  artifacts: Record<ArtifactKey, ArtifactContent | null>
): boolean {
  return STAGE_CONFIG[stage].requiredArtifacts.every((key) => artifacts[key] !== null);
}
