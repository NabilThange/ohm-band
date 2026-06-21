"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { XIcon } from '@/components/ui/x'
import MeshGradient from "./mesh-gradient"
import FaultyTerminal from "../mage-ui/faulty-terminal"
import { AvatarGroup, AvatarGroupTooltip } from "@/components/animate-ui/components/animate/avatar-group"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { MorphingComposer } from "@/components/shared/MorphingComposer"
import { cn as cls } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { MessageSquare } from "lucide-react"

interface ProjectCreatorProps {
    onSubmit: (prompt: string, style: string, userLevel: string, projectComplexity: string) => void
}

const AVATARS = [
    {
        src: "/avatar/Lead_Engineer.svg",
        fallback: "LE",
        tooltip: "I'll lead your build.",
        className: "w-12 h-12 border-2 border-border bg-gradient-to-br from-blue-500 to-cyan-500"
    },
    {
        src: "/avatar/Project_Architect.svg",
        fallback: "PA",
        tooltip: "I'll architect your plan.",
        className: "w-12 h-12 border-2 border-border bg-gradient-to-br from-purple-500 to-pink-500"
    },
    {
        src: "/avatar/Component_Specialist.svg",
        fallback: "CS",
        tooltip: "I'll source your parts.",
        className: "w-12 h-12 border-2 border-border bg-gradient-to-br from-orange-500 to-red-500"
    },
    {
        src: "/avatar/software_engineer.svg",
        fallback: "SE",
        tooltip: "I'll write your code.",
        className: "w-12 h-12 border-2 border-border bg-gradient-to-br from-green-500 to-emerald-500"
    },
    {
        src: "/avatar/circuit_designer.svg",
        fallback: "CD",
        tooltip: "I'll design your circuits.",
        className: "w-12 h-12 border-2 border-border bg-gradient-to-br from-amber-500 to-yellow-500"
    }
]

const COMMANDS = [
    { command: "/update-context", description: "Refresh MVP, PRD, and Context from chat history" },
    { command: "/update-bom", description: "Regenerate the Bill of Materials from current design" },
    { command: "/recheck-wiring", description: "Validate and update wiring connections" },
    { command: "/update-code", description: "Regenerate code based on latest specifications" },
]

export function ProjectCreator({ onSubmit }: ProjectCreatorProps) {
    const router = useRouter()
    const [prompt, setPrompt] = useState("")
    const promptRef = useRef<HTMLTextAreaElement>(null)
    const isSubmittingRef = useRef(false)
    const [showHowItWorks, setShowHowItWorks] = useState(false)
    const [showCommands, setShowCommands] = useState(false)
    const [filteredCommands, setFilteredCommands] = useState<typeof COMMANDS>([])
    const [activeIndex, setActiveIndex] = useState(0)
    const [helpOpen, setHelpOpen] = useState(false)

    useEffect(() => {
        if (promptRef.current) {
            promptRef.current.focus()
        }
    }, [])

    // Handle command filtering
    useEffect(() => {
        const isCommand = prompt.trim().startsWith("/")
        if (isCommand) {
            const filtered = COMMANDS.filter(c =>
                c.command.toLowerCase().startsWith(prompt.trim().toLowerCase())
            )
            setFilteredCommands(filtered)
            setShowCommands(filtered.length > 0)
        } else {
            setShowCommands(false)
        }
        setActiveIndex(0)
    }, [prompt])

    const selectCommand = (cmd: string) => {
        setPrompt(cmd + " ")
        setShowCommands(false)
        promptRef.current?.focus()
    }


    const handleSubmit = () => {
        if (prompt.trim() && !isSubmittingRef.current) {
            isSubmittingRef.current = true;
            onSubmit(prompt, "", "", "");
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showCommands) {
            if (e.key === "ArrowDown") {
                e.preventDefault()
                setActiveIndex(i => (i + 1) % filteredCommands.length)
                return
            }
            if (e.key === "ArrowUp") {
                e.preventDefault()
                setActiveIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length)
                return
            }
            if (e.key === "Tab" || e.key === "Enter") {
                e.preventDefault()
                selectCommand(filteredCommands[activeIndex].command)
                return
            }
            if (e.key === "Escape") {
                e.preventDefault()
                setShowCommands(false)
                return
            }
        }

        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">
            {/* Recent Chats Button - Top Right */}
            <button
                onClick={() => router.push('/chats')}
                className="absolute top-4 right-4 md:top-6 md:right-6 z-20 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur-sm px-4 py-2 text-sm font-semibold tracking-tight hover:bg-card hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200"
                aria-label="View All Chats"
            >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Recent Chats</span>
            </button>

            <div className="absolute inset-0 -z-10 opacity-40 bg-black">
                <FaultyTerminal
                    scale={1.2}
                    brightness={0.4}
                    tint="#ffaa00"
                    curvature={0.4}
                    glitchAmount={0.4}
                    flickerAmount={0.3}
                />
            </div>

            <div className="w-full max-w-3xl mx-auto p-4 md:p-8 relative z-10">
                <div className="text-center space-y-3 md:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="space-y-1">
                        <h1
                            className="text-5xl md:text-[5rem] font-black tracking-tighter text-foreground leading-[0.85] mb-2 font-serif"
                        >
                            OHM
                        </h1>
                        <h2
                            className="text-xl md:text-[2.2rem] font-light italic tracking-wide text-muted-foreground leading-none -mt-2 font-serif"
                        >
                            Hardware Engineer
                        </h2>
                    </div>
                    <div className="flex justify-center items-center gap-3 pt-4">
                        <AvatarGroup>
                            {AVATARS.map((avatar, index) => (
                                <Avatar key={index} className={avatar.className}>
                                    {avatar.src && <AvatarImage src={avatar.src} className="p-2" />}
                                    <AvatarFallback>{avatar.fallback}</AvatarFallback>
                                    <AvatarGroupTooltip>{avatar.tooltip}</AvatarGroupTooltip>
                                </Avatar>
                            ))}
                        </AvatarGroup>
                        <p
                            className="text-xs md:text-sm text-muted-foreground font-light leading-relaxed font-sans"
                        >
                            10 Experts, One Mission: Your Prototype
                        </p>
                    </div>
                </div>

                <div className="space-y-5 md:space-y-6 mt-8 md:mt-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                    <MorphingComposer
                        value={prompt}
                        onChange={setPrompt}
                        onSubmit={handleSubmit}
                        onKeyDown={handleKeyDown}
                        variant="build"
                        placeholderExamples={[
                            "I want to build a smart weather station with ESP32 and e-ink display.",
                            "Build a 4-legged robotic platform with inverse kinematics and ESP32 control.",
                            "Design an IoT-based home greenhouse with soil moisture, temp, and CO2 sensors.",
                            "Create a custom mechanical keyboard with RP2040 and per-key RGB lighting.",
                            "Design a solar-powered weather station that sends data via LoRaWAN.",
                            "Build a gesture-controlled motorized camera slider for time-lapse photography."
                        ]}
                    />

                    <p className="text-xs text-muted-foreground text-center font-light tracking-wide">Press ⌘+Enter to start</p>
                </div>

                <footer className="mt-8 md:mt-12 py-4 text-center text-xs text-muted-foreground space-x-3 md:space-x-4 font-light animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    <button
                        onClick={() => setShowHowItWorks(true)}
                        className="hover:text-foreground transition-colors duration-200 tracking-wide"
                    >
                        how it works
                    </button>
                </footer>
            </div>

            <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
                <DialogContent
                    className="max-w-2xl border-border bg-card/95 backdrop-blur-xl rounded-3xl p-8"
                    showCloseButton={false}
                >
                    <button
                        onClick={() => setShowHowItWorks(false)}
                        className="absolute right-6 top-6 rounded-full p-2 hover:bg-muted transition-colors"
                    >
                        <XIcon className="h-5 w-5 text-muted-foreground" />
                    </button>
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-foreground">How Ohm Works</h2>
                        <div className="space-y-5 text-muted-foreground">
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 text-primary text-sm font-bold">
                                        1
                                    </span>
                                    Describe Your Project
                                </h3>
                                <p className="text-sm leading-relaxed pl-9">
                                    Describe your hardware idea in natural language. Ohm supports robotics, IoT, wearables, and more.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 text-primary text-sm font-bold">
                                        2
                                    </span>
                                    AI Analysis & Architecture
                                </h3>
                                <p className="text-sm leading-relaxed pl-9">
                                    Ohm analyzes your requirements to select the best components, microcontrollers, and architecture for your needs.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 text-primary text-sm font-bold">
                                        3
                                    </span>
                                    BOM & Wiring
                                </h3>
                                <p className="text-sm leading-relaxed pl-9">
                                    Get a complete Bill of Materials (BOM) and interactive wiring diagrams to assemble your project suitable for your expertise level.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 text-primary text-sm font-bold">
                                        4
                                    </span>
                                    Code & Firmware
                                </h3>
                                <p className="text-sm leading-relaxed pl-9">
                                    Ohm generates the necessary firmware code (C++, Python, etc.) to bring your hardware to life.
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
