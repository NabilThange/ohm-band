'use client'

import { useState, useRef, useEffect } from 'react'
import { flushSync } from 'react-dom'
import {
    ArrowLeft,
    Send,
    Loader2,
    CheckCircle2,
    ChevronRight,
    Sparkles
} from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import ToolsSidebar, { ToolType } from './tools/ToolsSidebar'
import BudgetDrawer from './tools/BudgetDrawer'
import ComponentDrawer from './tools/ComponentDrawer'
import BOMDrawer from './tools/BOMDrawer'
import WiringDrawer from './tools/WiringDrawer'
import CodeDrawer from './tools/CodeDrawer'
import ContextDrawer from './tools/ContextDrawer'
import TourGuide from './TourGuide'
import {
    extractBOMFromMessage,
    extractCodeFromMessage,
    extractContextFromMessage,
    type BOMData,
    type CodeData,
    type ProjectContextData
} from '@/lib/parsers'

interface BuildInterfaceProps {
    initialPrompt: string
    projectStyle: string
    onBack: () => void
}

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

type MissionPhase = 'ideation' | 'parts' | 'wiring' | 'code' | 'test' | 'deploy'

const phaseLabels: Record<MissionPhase, string> = {
    ideation: 'Ideation',
    parts: 'Parts',
    wiring: 'Wiring',
    code: 'Code',
    test: 'Test',
    deploy: 'Deploy',
}

// Helper to clean XML tags from chat view
const cleanMessageContent = (content: string) => {
    return content
        .replace(/<BOM_CONTAINER>[\s\S]*?<\/BOM_CONTAINER>/g, '')
        .replace(/<CODE_CONTAINER>[\s\S]*?<\/CODE_CONTAINER>/g, '')
        .trim();
};

export default function BuildInterface({ initialPrompt, projectStyle, onBack }: BuildInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isThinking, setIsThinking] = useState(false)
    const [currentPhase, setCurrentPhase] = useState<MissionPhase>('ideation')
    const [completedPhases, setCompletedPhases] = useState<MissionPhase[]>([])
    // showArtifacts now controls visibility of the Tools Sidebar
    const [showArtifacts, setShowArtifacts] = useState(false)
    const [activeTool, setActiveTool] = useState<ToolType>(null)
    const [isInitializing, setIsInitializing] = useState(true)

    // Data States
    const [bomData, setBomData] = useState<BOMData | null>(null)
    const [codeData, setCodeData] = useState<CodeData | null>(null)
    const [contextData, setContextData] = useState<ProjectContextData | null>(null)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Parse messages for artifacts - scanning logic updated to correctly merge/overwrite state
    useEffect(() => {
        if (messages.length === 0) return;

        console.log(`[Parser STATUS: ON] 🟢 Scanning ${messages.length} messages for artifacts...`);

        let foundBom: BOMData | null = null;
        let foundCode: CodeData | null = null;
        // Start with null or previous state? Better to rebuild from chat history to ensure consistency.
        // If we want to persist manual edits, we'd need a separate state. For now, chat history is source of truth.
        let accumulatedContext: ProjectContextData = { context: null, mvp: null, prd: null };

        // Iterate FORWARDS (Oldest -> Newest) to replay the state evolution
        messages.forEach(msg => {
            if (msg.role === 'assistant') {
                // 1. Check for BOM (Last writer wins)
                const bom = extractBOMFromMessage(msg.content);
                if (bom) foundBom = bom;

                // 2. Check for Code (Last writer wins)
                const code = extractCodeFromMessage(msg.content);
                if (code) foundCode = code;

                // 3. Check for Context (Merge updates)
                const ctx = extractContextFromMessage(msg.content);
                if (ctx.context || ctx.mvp || ctx.prd) {
                    accumulatedContext = {
                        context: ctx.context || accumulatedContext.context,
                        mvp: ctx.mvp || accumulatedContext.mvp,
                        prd: ctx.prd || accumulatedContext.prd
                    };
                }
            }
        });

        // Batch updates
        if (foundBom) {
            console.log("[BuildInterface] Restoring BOM from history");
            setBomData(prev => JSON.stringify(prev) !== JSON.stringify(foundBom) ? foundBom : prev);
        }

        if (foundCode) {
            console.log("[BuildInterface] Restoring Code from history");
            setCodeData(prev => JSON.stringify(prev) !== JSON.stringify(foundCode) ? foundCode : prev);
        }

        if (accumulatedContext.context || accumulatedContext.mvp || accumulatedContext.prd) {
            console.log("[BuildInterface] Restoring Context from history");
            setContextData(prev => {
                const isDifferent = !prev ||
                    prev.context !== accumulatedContext.context ||
                    prev.mvp !== accumulatedContext.mvp ||
                    prev.prd !== accumulatedContext.prd;
                return isDifferent ? accumulatedContext : prev;
            });
        }

    }, [messages]);

    // Fetch artifacts from database on mount (in addition to parsing messages)
    useEffect(() => {
        const fetchArtifacts = async () => {
            if (!messages.length) return;
            
            // Extract chatId from messages (messages are linked to a chat)
            // For now, we'll use a convention: chatId is in metadata or we derive it
            // If your system doesn't store chatId in messages, you'll need to pass it as a prop
            const chatId = (messages[0] as any)?.chat_id || null;
            
            if (!chatId) {
                console.log('[BuildInterface] No chatId found, skipping artifact fetch');
                return;
            }

            console.log('[BuildInterface] Fetching artifacts from database for chat:', chatId);

            try {
                // Fetch code artifact
                const codeRes = await fetch(`/api/artifacts/${chatId}?type=code`);
                if (codeRes.ok) {
                    const codeArtifact = await codeRes.json();
                    if (codeArtifact.data?.files) {
                        console.log(`[BuildInterface] ✅ Loaded ${codeArtifact.data.files.length} code files from database`);
                        setCodeData(codeArtifact.data);
                    }
                }

                // Fetch BOM artifact
                const bomRes = await fetch(`/api/artifacts/${chatId}?type=bom`);
                if (bomRes.ok) {
                    const bomArtifact = await bomRes.json();
                    if (bomArtifact.data) {
                        console.log('[BuildInterface] ✅ Loaded BOM from database');
                        setBomData(bomArtifact.data);
                    }
                }

                // You can add more artifact types here (wiring, enclosure, etc.)

            } catch (error) {
                console.error('[BuildInterface] Failed to fetch artifacts:', error);
            }
        };

        fetchArtifacts();
    }, [messages.length]); // Re-run when messages change (indicates new data might be available)

    // Initial AI greeting
    useEffect(() => {
        const timer = setTimeout(() => {
            setMessages(prev => {
                // Prevent duplicate initialization or overwriting user input if they typed quickly
                if (prev.length > 0) return prev

                return [{
                    id: '1',
                    role: 'assistant',
                    content: `Hey! I'm Ohm, your hardware assistant. I see you want to build: "${initialPrompt}"\n\nLet's start with the discovery phase. I have a few questions to understand your project better:\n\n**1. What's the primary goal?**\n(What specific problem does this solve?)\n\n**2. Where will this be deployed?**\n(Indoor, outdoor, mobile, stationary?)\n\n**3. What's your budget range?**\n(This helps me recommend the right components)`,
                    timestamp: new Date(),
                }]
            })
            setIsInitializing(false)
        }, 800)

        return () => clearTimeout(timer)
    }, [initialPrompt])

    const handleSend = () => {
        if (!input.trim() || isThinking) return

        // Capture input value before clearing
        const currentInput = input.trim()

        // Force immediate synchronous DOM update
        flushSync(() => {
            setInput('')
        })

        // Ensure the textarea DOM element is also cleared (fallback)
        if (inputRef.current) {
            inputRef.current.value = ''
        }

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: currentInput,
            timestamp: new Date(),
        }

        setIsThinking(true)
        setMessages(prev => [...prev, userMessage])

        // Simulate AI response
        setTimeout(() => {
            // MOCK RESPONSE LOGIC FOR DEMO PURPOSES
            let aiContent = "I'm analyzing your request..."
            const lowerInput = currentInput.toLowerCase()

            if (lowerInput.includes("context") || lowerInput.includes("plan") || lowerInput.includes("lock")) {
                aiContent = `Excellent! I've locked the design. Here are the Project Context, MVP definitions, and PRD.

---CONTEXT_START---
# Project Context
## Overview
A smart garden monitoring system that tracks soil moisture and temperature to optimize watering.

## Success Criteria
- Battery life > 1 month
- Reliable WiFi connection
- Accurate moisture readings
---CONTEXT_END---

---MVP_START---
# MVP Definition
## Core Features
1. Real-time moisture data logging
2. Basic dashboard
3. Low battery alert

## Tech Stack
- ESP32
- React Native App
- Supabase
---MVP_END---

---PRD_START---
# Product Requirements Document
## Hardware Requirements
- Waterproof casing (IP67)
- LiPo battery support
- Capacitive sensor (corrosion resistant)

## User Stories
- As a user, I want to see a graph of moisture levels over time.
- As a user, I want to be notified when the plant needs water.
---PRD_END---

I've populated the **Context Drawer** with these documents.`
            } else if (lowerInput.includes("bom") || lowerInput.includes("parts") || lowerInput.includes("components")) {
                aiContent = `Here is the Bill of Materials for your project. I've selected components that fit your budget and requirements.

<BOM_CONTAINER>
{
  "project_name": "Smart Garden Monitor",
  "summary": "IoT based plant monitoring system",
  "components": [
    {
      "name": "ESP32-WROOM-32",
      "partNumber": "ESP32-DEVKIT-V1",
      "quantity": 1,
      "estimatedCost": 6.50,
      "supplier": "Mouser",
      "link": "https://mouser.com/esp32"
    },
    {
      "name": "Capacitive Soil Moisture Sensor",
      "partNumber": "SEN-0193",
      "quantity": 1,
      "estimatedCost": 2.50
    },
    {
      "name": "DHT22 Temp/Hum Sensor",
      "partNumber": "DHT22",
      "quantity": 1,
      "estimatedCost": 4.50
    }
  ],
  "totalCost": 13.50,
  "warnings": ["Ensure 3.3V logic levels"]
}
</BOM_CONTAINER>

Check the **BOM Drawer** to see the full list!`
            } else if (lowerInput.includes("code") || lowerInput.includes("firmware")) {
                aiContent = `I've generated the firmware code for your ESP32. It uses the component pins defined in our previous steps.

<CODE_CONTAINER>
{
  "files": [
    {
      "path": "src/main.cpp",
      "content": "#include <Arduino.h>\\n\\nvoid setup() {\\n  Serial.begin(115200);\\n  Serial.println(\\"Hello World\\");\\n}\\n\\nvoid loop() {\\n  delay(1000);\\n}"
    },
    {
      "path": "platformio.ini",
      "content": "[env:esp32dev]\\nplatform = espressif32\\nboard = esp32dev\\nframework = arduino"
    }
  ]
}
</CODE_CONTAINER>

You can view and copy the files in the **Code Drawer**.`
            } else {
                const responses = [
                    "Great! That gives me a much clearer picture. Let me analyze the requirements...",
                    "Perfect! Based on your inputs, I can already see which components would work best. Let me create a project blueprint...",
                    "Understood! Do you want me to generate the BOM now?",
                ]
                aiContent = responses[Math.floor(Math.random() * responses.length)]
            }


            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: aiContent,
                timestamp: new Date(),
            }

            setMessages(prev => [...prev, aiMessage])
            setIsThinking(false)

            // Show artifacts/tools after a few interactions
            if (messages.length >= 2 && !showArtifacts) {
                setTimeout(() => {
                    setShowArtifacts(true)
                    setCompletedPhases(['ideation'])
                    setCurrentPhase('parts')
                }, 1500)
            }
        }, 2000)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Top Navigation Bar */}
            <div id="build-top-nav" className="border-b border-border px-4 py-3 flex items-center justify-between bg-card/50 backdrop-blur-sm z-20 relative">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden sm:inline">Back</span>
                    </button>

                    <div className="h-6 w-px bg-border" />

                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center shadow-[0_0_10px_rgba(var(--primary),0.3)]">
                            <span className="text-primary-foreground text-xs font-bold">Ω</span>
                        </div>
                        <span className="font-semibold text-sm">New Project</span>
                    </div>
                </div>

                {/* Mission Stepper */}
                <div className="hidden md:flex items-center gap-2">
                    {Object.entries(phaseLabels).map(([phase, label], idx) => (
                        <div key={phase} className="flex items-center">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition ${completedPhases.includes(phase as MissionPhase)
                                ? 'bg-primary/20 text-primary'
                                : currentPhase === phase
                                    ? 'bg-accent/20 text-accent border border-accent/20'
                                    : 'text-muted-foreground'
                                }`}>
                                {completedPhases.includes(phase as MissionPhase) && (
                                    <CheckCircle2 className="w-3 h-3" />
                                )}
                                <span>{label}</span>
                            </div>
                            {idx < Object.keys(phaseLabels).length - 1 && (
                                <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground font-mono hidden sm:block">
                        {projectStyle}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Chat Area */}
                <div className={`flex-1 flex flex-col transition-all duration-500 mr-0 ${showArtifacts ? 'pr-14' : ''}`}>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
                        <div className="max-w-3xl mx-auto space-y-6">
                            {isInitializing ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center space-y-3">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                                        <p className="text-sm text-muted-foreground font-mono">
                                            Initializing Ohm...
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-lg px-4 py-3 shadow-sm ${message.role === 'user'
                                                ? 'bg-primary text-black'
                                                : 'glass border-dashed-tech'
                                                }`}
                                        >
                                            {message.role === 'assistant' && (
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-5 h-5 bg-primary rounded-sm flex items-center justify-center">
                                                        <span className="text-primary-foreground text-xs font-bold">Ω</span>
                                                    </div>
                                                    <span className="text-xs font-semibold">Ohm</span>
                                                </div>
                                            )}
                                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                                {/* Clean content to hide XML tags but preserve whitespace */}
                                                {message.role === 'assistant'
                                                    ? cleanMessageContent(message.content)
                                                    : message.content
                                                }
                                            </div>
                                            {/* Artifact Indicators */}
                                            {message.role === 'assistant' && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {extractBOMFromMessage(message.content) && (
                                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium border border-green-500/20">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            <span>BOM Generated</span>
                                                        </div>
                                                    )}
                                                    {extractCodeFromMessage(message.content) && (
                                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-500/20">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            <span>Code Generated</span>
                                                        </div>
                                                    )}
                                                    {(() => {
                                                        const ctx = extractContextFromMessage(message.content);
                                                        if (ctx.context || ctx.mvp || ctx.prd) {
                                                            return (
                                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium border border-purple-500/20">
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    <span>Context Updated</span>
                                                                </div>
                                                            )
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            )}
                                            <div className="mt-2 text-xs opacity-60">
                                                {message.timestamp.toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            {isThinking && (
                                <div className="flex justify-start">
                                    <div className="glass border-dashed-tech rounded-lg px-4 py-3 max-w-[80%]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-5 h-5 bg-primary rounded-sm flex items-center justify-center">
                                                <span className="text-primary-foreground text-xs font-bold">Ω</span>
                                            </div>
                                            <span className="text-xs font-semibold">Ohm</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            <span className="text-sm text-muted-foreground">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-border p-4 bg-card/50 backdrop-blur-sm z-10">
                        <div className="max-w-3xl mx-auto">
                            <div className="flex gap-3 items-end">
                                <Textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your response..."
                                    rows={2}
                                    className="resize-none flex-1 glass focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all rounded-lg"
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isThinking}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-6 h-[76px] transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 text-center font-mono">
                                Press ⌘+Enter to send
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tools Sidebar & Drawers */}
                {showArtifacts && (
                    <>
                        <div className="fixed top-[57px] right-0 bottom-0 z-30 animate-slide-in-right">
                            <ToolsSidebar activeTool={activeTool} onSelectTool={setActiveTool} />
                        </div>

                        {/* Drawers */}
                        <BudgetDrawer isOpen={activeTool === 'budget'} onClose={() => setActiveTool(null)} />
                        <ComponentDrawer isOpen={activeTool === 'components'} onClose={() => setActiveTool(null)} />
                        <BOMDrawer isOpen={activeTool === 'bom'} onClose={() => setActiveTool(null)} bomData={bomData} />
                        <WiringDrawer isOpen={activeTool === 'wiring'} onClose={() => setActiveTool(null)} />
                        <CodeDrawer isOpen={activeTool === 'code'} onClose={() => setActiveTool(null)} codeData={codeData} />
                        <ContextDrawer isOpen={activeTool === 'context'} onClose={() => setActiveTool(null)} contextData={contextData} />
                    </>
                )}

                {/* Intro Tooltip/Hint when artifacts first appear */}
                {showArtifacts && !activeTool && messages.length < 6 && (
                    <div className="absolute top-20 right-16 bg-popover border border-border text-popover-foreground px-4 py-3 rounded-lg shadow-xl animate-fade-in-up flex items-center gap-3 z-20 max-w-[250px]">
                        <Sparkles className="w-5 h-5 text-yellow-400 shrink-0" />
                        <div className="text-xs">
                            <p className="font-semibold mb-1">Tools Unlocked!</p>
                            <p>Use the sidebar to access Budget, Parts, and more.</p>
                        </div>
                    </div>
                )}

                <TourGuide start={showArtifacts} />
            </div>
        </div >
    )
}
