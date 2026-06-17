'use client';

import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { STAGE_ORDER, STAGE_CONFIG, type ProjectStage } from '@/lib/stages/stage-config';

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface StageOverrideButtonProps {
  chatId: string;
  currentStage: ProjectStage;
  onStageChanged?: (newStage: ProjectStage) => void;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function StageOverrideButton({
  chatId,
  currentStage,
  onStageChanged,
}: StageOverrideButtonProps) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleStageChange = async (targetStage: ProjectStage) => {
    if (targetStage === currentStage) { setOpen(false); return; }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/agents/stage-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, targetStage }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Request failed');
      }

      onStageChanged?.(targetStage);
      setOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Override project stage"
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Settings2 className="w-3 h-3" />
        <span className="hidden sm:inline">Stage</span>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-semibold text-foreground">Override Stage</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Jump to any stage (bypasses gates)
              </p>
            </div>

            {STAGE_ORDER.map((stage) => {
              const config    = STAGE_CONFIG[stage];
              const isCurrent = stage === currentStage;

              return (
                <button
                  key={stage}
                  disabled={loading || isCurrent}
                  onClick={() => handleStageChange(stage)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2 ${
                    isCurrent ? 'bg-muted text-muted-foreground cursor-default' : ''
                  } disabled:opacity-60`}
                >
                  <span className="text-base leading-none">
                    {{ planning: '📋', design: '📦', build: '⚡', fix: '🐛' }[stage]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="capitalize font-medium text-xs">{stage}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{config.description}</div>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      current
                    </span>
                  )}
                </button>
              );
            })}

            {error && (
              <div className="px-3 py-2 text-[10px] text-destructive border-t border-border">
                ⚠️ {error}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
