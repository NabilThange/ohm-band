'use client';

import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STAGE_ORDER, STAGE_CONFIG, type ProjectStage, type ArtifactKey } from '@/lib/stages/stage-config';

// ─────────────────────────────────────────────
// Stage metadata (display-only)
// ─────────────────────────────────────────────

const STAGE_META: Record<ProjectStage, { label: string; icon: string }> = {
  planning: { label: 'Planning', icon: '📋' },
  design:   { label: 'Design',   icon: '📦' },
  build:    { label: 'Build',    icon: '⚡' },
  fix:      { label: 'Fix',      icon: '🐛' },
};

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface StageProgressBarProps {
  currentStage: ProjectStage;
  artifacts: Record<ArtifactKey, unknown | null>;
  className?: string;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function StageProgressBar({ currentStage, artifacts, className }: StageProgressBarProps) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const stageConfig  = STAGE_CONFIG[currentStage];

  // Count how many required artifacts exist for the current stage
  const filled   = stageConfig.requiredArtifacts.filter((k) => artifacts[k] !== null).length;
  const required = stageConfig.requiredArtifacts.length;

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-4 py-2.5 border-b border-border bg-muted/20 backdrop-blur-sm',
        className
      )}
    >
      {STAGE_ORDER.map((stage, idx) => {
        const isComplete = idx < currentIndex;
        const isCurrent  = idx === currentIndex;
        const isFuture   = idx > currentIndex;
        const meta        = STAGE_META[stage];

        return (
          <div key={stage} className="flex items-center">
            {/* Stage pill */}
            <div
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300',
                isCurrent && 'bg-primary/15 border border-primary/40 text-primary shadow-sm',
                isComplete && 'text-muted-foreground/70',
                isFuture && 'text-muted-foreground/40'
              )}
            >
              {/* Status icon */}
              {isComplete ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
              ) : (
                <Circle
                  className={cn(
                    'w-3.5 h-3.5 shrink-0',
                    isCurrent && 'text-primary animate-pulse'
                  )}
                />
              )}

              {/* Emoji + label */}
              <span>{meta.icon}</span>
              <span className={cn('hidden sm:inline', isFuture && 'opacity-60')}>{meta.label}</span>
            </div>

            {/* Connector */}
            {idx < STAGE_ORDER.length - 1 && (
              <ChevronRight
                className={cn(
                  'w-3 h-3 mx-0.5 shrink-0',
                  idx < currentIndex ? 'text-green-500/60' : 'text-muted-foreground/30'
                )}
              />
            )}
          </div>
        );
      })}

      {/* Artifact completion pill */}
      {required > 0 && (
        <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          <span className="font-semibold text-foreground">{filled}/{required}</span>
          <span>artifacts</span>
        </div>
      )}
    </div>
  );
}
