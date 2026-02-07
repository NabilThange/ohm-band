"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckIcon } from "@/components/ui/animated-icons"
import { Loader2, Lock, Eye, Code, Brain, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AssemblyLineStep = "chat" | "blueprint" | "code" | "verify";

interface AssemblyLineProgressProps {
    currentStep: AssemblyLineStep;
    completedSteps: AssemblyLineStep[];
    isProcessing: boolean;
    onLockDesign?: () => void;
    showLockButton?: boolean;
}

const STEPS = [
    {
        id: "chat" as const,
        name: "The Visionary",
        model: "GPT-4o",
        icon: MessageSquare,
        description: "Refining your idea",
        color: "from-blue-500 to-cyan-500"
    },
    {
        id: "blueprint" as const,
        name: "The Systems Engineer",
        model: "o1-mini",
        icon: Brain,
        description: "Generating blueprint",
        color: "from-purple-500 to-pink-500"
    },
    {
        id: "code" as const,
        name: "The Firmware Developer",
        model: "Claude 3.5 Sonnet",
        icon: Code,
        description: "Writing firmware",
        color: "from-orange-500 to-red-500"
    },
    {
        id: "verify" as const,
        name: "The QA Inspector",
        model: "GPT-4o Vision",
        icon: Eye,
        description: "Verifying circuit",
        color: "from-green-500 to-emerald-500"
    }
];

export function AssemblyLineProgress({
    currentStep,
    completedSteps,
    isProcessing,
    onLockDesign,
    showLockButton = false
}: AssemblyLineProgressProps) {
    const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

    return (
        <div className="w-full bg-background border-b border-border p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-mono font-bold text-foreground">
                            Sequential Assembly Line
                        </h2>
                        <p className="text-sm text-muted-foreground font-mono">
                            One agent at a time • 1 concurrent request
                        </p>
                    </div>

                    {showLockButton && onLockDesign && (
                        <Button
                            onClick={onLockDesign}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-mono"
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            Lock Design & Continue
                        </Button>
                    )}
                </div>

                {/* Progress Steps */}
                <div className="relative">
                    {/* Connection Line */}
                    <div className="absolute top-8 left-0 right-0 h-0.5 bg-border" />
                    <div
                        className="absolute top-8 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                        style={{
                            width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`
                        }}
                    />

                    {/* Steps */}
                    <div className="relative grid grid-cols-4 gap-4">
                        {STEPS.map((step, index) => {
                            const isCompleted = completedSteps.includes(step.id);
                            const isCurrent = currentStep === step.id;
                            const isActive = index <= currentStepIndex;

                            const StepIcon = step.icon;

                            return (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex flex-col items-center"
                                >
                                    {/* Icon Circle */}
                                    <div className="relative mb-3">
                                        <div
                                            className={`
                        w-16 h-16 rounded-full flex items-center justify-center
                        transition-all duration-300 border-2
                        ${isActive
                                                    ? `bg-gradient-to-br ${step.color} border-transparent`
                                                    : "bg-muted border-border"
                                                }
                      `}
                                        >
                                            <AnimatePresence mode="wait">
                                                {isCompleted ? (
                                                    <motion.div
                                                        key="check"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        exit={{ scale: 0 }}
                                                    >
                                                        <CheckIcon key="check" size={32} triggerOn="auto" className="text-white" />
                                                    </motion.div>
                                                ) : isCurrent && isProcessing ? (
                                                    <motion.div
                                                        key="loader"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1, rotate: 360 }}
                                                        exit={{ scale: 0 }}
                                                        transition={{ rotate: { duration: 1, repeat: Infinity, ease: "linear" } }}
                                                    >
                                                        <Loader2 className="w-8 h-8 text-white" />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="icon"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        exit={{ scale: 0 }}
                                                    >
                                                        <StepIcon className={`w-8 h-8 ${isActive ? "text-white" : "text-muted-foreground"}`} />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Pulse Effect for Current Step */}
                                        {isCurrent && isProcessing && (
                                            <motion.div
                                                className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.color} opacity-50`}
                                                animate={{
                                                    scale: [1, 1.3, 1],
                                                    opacity: [0.5, 0, 0.5]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            />
                                        )}
                                    </div>

                                    {/* Step Info */}
                                    <div className="text-center">
                                        <h3 className={`text-sm font-mono font-bold mb-1 ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                                            {step.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-mono mb-1">
                                            {step.model}
                                        </p>
                                        {isCurrent && (
                                            <motion.p
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-xs text-muted-foreground font-mono italic"
                                            >
                                                {step.description}...
                                            </motion.p>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
