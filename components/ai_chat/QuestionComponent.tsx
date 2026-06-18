"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, Circle } from "lucide-react"

const OTHER_IDX = 999;

interface Question {
  id: string;
  text: string;
  type: 'single_select' | 'multiple_select' | 'text' | 'textarea';
  options?: string[];
  required?: boolean;
}

interface QuestionComponentProps {
  questions: Question[];
  onSubmit: (answers: Record<string, { idx: number; text: string }>) => void;
  isSubmitting?: boolean;
  initialAnswers?: Record<string, { idx: number; text: string }> | null;
  messageId?: string;
}

export function QuestionComponent({ questions, onSubmit, isSubmitting = false, initialAnswers = null, messageId }: QuestionComponentProps) {
  // ponytail: If initialAnswers provided, start in read-only submitted state
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { idx: number; text: string }>>(initialAnswers || {});
  const [submitted, setSubmitted] = useState(!!initialAnswers);

  const q = questions[current];
  const isLast = current === questions.length - 1;
  const ans = answers[q.id];
  const isOtherSelected = ans?.idx === OTHER_IDX;

  const isAnswered = (qId: string) => {
    const a = answers[qId];
    if (!a) return false;
    if (a.idx === OTHER_IDX) return a.text?.trim().length > 0;
    return true;
  };

  const selectOption = (idx: number, text: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: { idx, text } }));
  };

  const handleNext = async () => {
    if (!isAnswered(q.id)) return;
    if (isLast) {
      setSubmitted(true);
      
      // ponytail: Save answers to message metadata
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
          {q.required && <span className="text-destructive ml-1">*</span>}
        </h3>

        {/* Options */}
        <div className="space-y-2 mb-6">
          {q.type === 'single_select' && q.options?.map((opt, i) => (
            <button
              key={i}
              onClick={() => selectOption(i, opt)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                ans?.idx === i
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/50"
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

          {/* Other Option (Free Text) */}
          {q.type === 'single_select' && (
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
                placeholder="Other — type your own answer…"
                value={isOtherSelected ? (ans?.text || "") : ""}
                onFocus={() => selectOption(OTHER_IDX, ans?.text || "")}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [q.id]: { idx: OTHER_IDX, text: e.target.value },
                  }))
                }
                className="flex-1 bg-transparent border-none outline-none text-sm"
              />
            </div>
          )}

          {/* Multiple Select */}
          {q.type === 'multiple_select' && q.options?.map((opt, i) => {
            const selectedOptions = ans?.text?.split(', ') || [];
            const isSelected = selectedOptions.includes(opt);
            
            return (
              <button
                key={i}
                onClick={() => {
                  const current = ans?.text?.split(', ').filter(Boolean) || [];
                  let updated: string[];
                  
                  if (isSelected) {
                    updated = current.filter(o => o !== opt);
                  } else {
                    updated = [...current, opt];
                  }
                  
                  selectOption(i, updated.join(', '));
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/50"
                )}
              >
                {isSelected ? (
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-sm font-medium">{opt}</span>
              </button>
            );
          })}

          {/* Text Input */}
          {q.type === 'text' && (
            <input
              type="text"
              value={ans?.text || ""}
              onChange={(e) => selectOption(0, e.target.value)}
              placeholder="Type your answer..."
              className="w-full p-3 rounded-lg border-2 border-border bg-background focus:border-primary outline-none text-sm"
            />
          )}

          {/* Textarea Input */}
          {q.type === 'textarea' && (
            <textarea
              value={ans?.text || ""}
              onChange={(e) => selectOption(0, e.target.value)}
              placeholder="Type your answer..."
              rows={4}
              className="w-full p-3 rounded-lg border-2 border-border bg-background focus:border-primary outline-none text-sm resize-none"
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-3">
          <button
            onClick={handleBack}
            disabled={current === 0}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleNext}
            disabled={!isAnswered(q.id)}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            {isLast ? "Submit ✓" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
