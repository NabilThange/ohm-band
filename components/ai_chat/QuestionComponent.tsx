"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Square, CheckSquare } from "lucide-react"

const OTHER_IDX = 999;

export interface Question {
  id: string;
  text: string;
  type: 'single_select' | 'multiple_select' | 'text' | 'textarea';
  options?: string[];
  required?: boolean;
}

export interface QuestionComponentProps {
  questions: Question[];
  onSubmit: (answers: Record<string, { idx: number; text: string }>) => void;
  isSubmitting?: boolean;
  initialAnswers?: Record<string, { idx: number; text: string }> | null;
  messageId?: string;
}

export function QuestionComponent({ questions, onSubmit, isSubmitting = false, initialAnswers = null, messageId }: QuestionComponentProps) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { idx: number; text: string }>>(initialAnswers || {});
  const [submitted, setSubmitted] = useState(!!initialAnswers);

  const q = questions[current] || questions[0];
  const isLast = current === questions.length - 1;
  const ans = q ? answers[q.id] : undefined;
  const isOtherSelected = ans?.idx === OTHER_IDX;

  if (!q) return null;

  const isAnswered = (qId: string) => {
    const a = answers[qId];
    if (!a) return false;
    if (a.idx === OTHER_IDX) return (a.text?.trim().length || 0) > 0;
    return (a.text?.trim().length || 0) > 0;
  };

  const selectOption = (idx: number, text: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: { idx, text } }));
  };

  const handleNext = async () => {
    if (!isAnswered(q.id) && q.required !== false) return;
    if (isLast) {
      setSubmitted(true);
      
      if (messageId) {
        try {
          await fetch(`/api/messages/${messageId}/answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers })
          });
        } catch (error) {
          console.error('Failed to save answers:', error);
        }
      }
      
      onSubmit(answers);
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const handleBack = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  if (submitted || isSubmitting) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card p-6 my-4 animate-in fade-in">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          <h3 className="font-semibold text-lg">{initialAnswers ? "Your Answers" : "Answers Submitted"}</h3>
        </div>
        <div className="space-y-3">
          {questions.map((question) => {
            const answer = answers[question.id];
            return (
              <div key={question.id} className="border-l-2 border-primary pl-3">
                <p className="text-sm font-medium text-muted-foreground">{question.text}</p>
                <p className="text-sm font-semibold">{answer?.text || "—"}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const isMultiple = q.type === 'multiple_select';
  const hasOptions = Array.isArray(q.options) && q.options.length > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card my-4 animate-in fade-in zoom-in-95">
      {/* Progress Bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="p-6">
        {/* Question Counter */}
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Question {current + 1} of {questions.length}
        </p>

        {/* Question Text */}
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          {q.text}
          {q.required !== false && <span className="text-destructive ml-1">*</span>}
        </h3>

        {/* Options / Form Controls */}
        <div className="space-y-2 mb-6">
          {/* 1. Single Select Options */}
          {!isMultiple && hasOptions && q.options?.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectOption(i, opt)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                ans?.idx === i
                  ? "border-primary bg-primary/5 text-foreground font-semibold"
                  : "border-border bg-background hover:border-primary/50 text-foreground"
              )}
            >
              {ans?.idx === i ? (
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{opt}</span>
            </button>
          ))}

          {/* 2. Multiple Select (Checkboxes) */}
          {isMultiple && hasOptions && q.options?.map((opt, i) => {
            const selectedList = (ans?.text?.split(', ') || []).map(s => s.trim()).filter(Boolean);
            const isSelected = selectedList.includes(opt);

            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const currentSelected = (ans?.text?.split(', ') || []).map(s => s.trim()).filter(Boolean);
                  let updated: string[];
                  if (isSelected) {
                    updated = currentSelected.filter(o => o !== opt);
                  } else {
                    updated = [...currentSelected, opt];
                  }
                  selectOption(i, updated.join(', '));
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/5 text-foreground font-semibold"
                    : "border-border bg-background hover:border-primary/50 text-foreground"
                )}
              >
                {isSelected ? (
                  <CheckSquare className="h-5 w-5 text-primary flex-shrink-0" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-sm font-medium">{opt}</span>
              </button>
            );
          })}

          {/* 3. Other Option (Custom Text) for Single or Multiple select */}
          {hasOptions && (
            <div
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer",
                isOtherSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/50"
              )}
              onClick={() => !isOtherSelected && selectOption(OTHER_IDX, "")}
            >
              {isOtherSelected ? (
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              )}
              <input
                type="text"
                placeholder="Other — type your own custom answer…"
                value={isOtherSelected ? (ans?.text || "") : ""}
                onFocus={() => selectOption(OTHER_IDX, ans?.text || "")}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [q.id]: { idx: OTHER_IDX, text: e.target.value },
                  }))
                }
                className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}

          {/* 4. Open-ended Text Field (No options or type === 'text') */}
          {(!hasOptions || q.type === 'text') && q.type !== 'textarea' && (
            <input
              type="text"
              value={ans?.text || ""}
              onChange={(e) => selectOption(0, e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-3 rounded-lg border-2 border-border bg-background focus:border-primary outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
          )}

          {/* 5. Open-ended Textarea (type === 'textarea') */}
          {q.type === 'textarea' && (
            <textarea
              value={ans?.text || ""}
              onChange={(e) => selectOption(0, e.target.value)}
              placeholder="Describe your requirements in detail..."
              rows={4}
              className="w-full p-3 rounded-lg border-2 border-border bg-background focus:border-primary outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none"
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={current === 0}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!isAnswered(q.id) && q.required !== false}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            {isLast ? "Submit Answers ✓" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
