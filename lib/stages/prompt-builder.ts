import { STAGE_CONFIG, type ProjectState } from './stage-config';
import { AGENTS } from '@/lib/agents/config';

// ─────────────────────────────────────────────
// Focused Orchestrator Prompt
// ─────────────────────────────────────────────

/**
 * Builds a laser-focused orchestrator prompt that lists only the 2-3 agents
 * eligible for the current stage. This dramatically reduces routing errors
 * compared to asking the LLM to pick from all 11 agents.
 */
export function buildOrchestratorPrompt(
  userMessage: string,
  projectState: ProjectState
): string {
  const stageConfig = STAGE_CONFIG[projectState.projectStage];

  // Calculate missing artifacts inline (no external service dependency)
  const missingArtifacts = stageConfig.requiredArtifacts.filter(
    (key) => projectState.artifacts[key] === null
  );

  // Build agent descriptions from only the eligible set
  const eligibleAgentDescriptions = stageConfig.eligibleAgents
    .map((agentType) => {
      const agent = AGENTS[agentType];
      if (!agent) return `• ${agentType}: (agent not found)`;
      return `• ${agentType}: ${agent.description}`;
    })
    .join('\n');

  const missingText =
    missingArtifacts.length > 0
      ? missingArtifacts.join(', ')
      : 'None — stage complete, awaiting stage advancement';

  return `You are OHM's traffic controller. Your only job is to pick the best agent.

## Current Project Stage: ${projectState.projectStage.toUpperCase()}
Goal: ${stageConfig.goal}

## What's Still Needed:
Missing artifacts: ${missingText}

## Eligible Agents — PICK ONLY FROM THIS LIST:
${eligibleAgentDescriptions}

## User's Message:
"${userMessage}"

## Rules:
- Return EXACTLY ONE agent type name from the eligible list above
- Base your choice on what the user is asking and what artifacts are missing
- Do NOT pick agents outside the eligible list
- Do NOT explain your reasoning — just output the agent name

Your response (one word):`;
}

// ─────────────────────────────────────────────
// Project Context Summary (for agent system prompts)
// ─────────────────────────────────────────────

/**
 * Builds a one-line summary of which artifacts exist, injected into agent system prompts
 * so agents know what context is available to read.
 */
export function buildProjectContextSummary(state: ProjectState): string {
  const checks: string[] = [];

  if (state.artifacts.context) checks.push('✓ Context defined');
  if (state.artifacts.mvp) checks.push('✓ MVP defined');
  if (state.artifacts.prd) checks.push('✓ PRD documented');
  if (state.artifacts.bom) checks.push('✓ BOM generated');
  if (state.artifacts.budget) checks.push('✓ Budget optimized');
  if (state.artifacts.wiring) checks.push('✓ Wiring diagram created');
  if (state.artifacts.code) checks.push('✓ Code generated');

  return checks.length > 0 ? checks.join(' · ') : 'New project — no artifacts yet';
}

// ─────────────────────────────────────────────
// Stage-Aware Context Block (injected into agent prompts)
// ─────────────────────────────────────────────

/**
 * Generates a stage-context block to prepend to every agent's system prompt.
 * Tells the agent what stage the user is in and what to do if the user's
 * request is premature (e.g. asking for code while BOM doesn't exist yet).
 */
export function buildStageContextBlock(state: ProjectState): string {
  const stageConfig = STAGE_CONFIG[state.projectStage];
  const missingArtifacts = stageConfig.requiredArtifacts
    .filter((key) => state.artifacts[key] === null)
    .join(', ');

  const artifactSummary = buildProjectContextSummary(state);

  return `
---
📍 CURRENT PROJECT STAGE: ${state.projectStage.toUpperCase()}
Stage goal: ${stageConfig.goal}
${missingArtifacts ? `⏳ Still needed to advance: ${missingArtifacts}` : '✅ This stage is complete!'}
Project progress: ${artifactSummary}

If the user asks for something outside the current stage:
1. Acknowledge what they asked for enthusiastically
2. Briefly explain that the current stage needs to be completed first
3. Tell them what's still needed (${missingArtifacts || 'nothing — stage is done!'})
4. Proactively help complete the current stage

Example: "Love that you're thinking ahead to the wiring! Before we get there,
let me finish your BOM so we know exactly what components we're connecting..."
---`.trim();
}
