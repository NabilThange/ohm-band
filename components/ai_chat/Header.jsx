"use client"
import { ChevronDownIcon } from "@/components/ui/animated-icons"
import { Asterisk, MoreHorizontal, Menu, MessageSquare } from "lucide-react"
import { useState, useEffect } from "react"
import GhostIconButton from "./GhostIconButton"
import { getAllAgentIdentities, getAgentIdentity } from "@/lib/agents/agent-identities"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function Header({
    chatId,
    autoOrchestration,
    onAutoOrchestrationChange,
    createNewChat,
    sidebarCollapsed,
    setSidebarOpen,
    currentAgent,  // Receive from parent
    onAgentChange
}) {
    const router = useRouter()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [manualOverride, setManualOverride] = useState(null)

    // Get all agents from the centralized configuration
    const agents = getAllAgentIdentities()

    // Use currentAgent from props, allow manual override
    const activeAgentId = manualOverride || currentAgent?.type || "projectInitializer"
    const selectedAgentIdentity = getAgentIdentity(activeAgentId)
    const isAutoSelected = !manualOverride && currentAgent?.type

    const handleAgentChange = (agentId) => {
        setManualOverride(agentId)  // Set manual override
        setIsDropdownOpen(false)
        if (onAgentChange) {
            onAgentChange(agentId)
        }
    }

    // Clear manual override when currentAgent changes (auto-selection)
    useEffect(() => {
        if (currentAgent?.intent !== 'MANUAL') {
            setManualOverride(null);
        }
    }, [currentAgent]);

    return (
        <div className="sticky top-0 z-30 flex items-center gap-2 bg-background/80 px-4 py-3 backdrop-blur">
            {sidebarCollapsed && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden inline-flex items-center justify-center rounded-lg p-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Open sidebar"
                >
                    <Menu className="h-5 w-5" />
                </button>
            )}

            <div className="hidden md:flex relative items-center gap-3">
                {/* Auto-Orchestration Toggle */}
                {chatId && (
                    <div className="flex items-center gap-2 border-r border-border pr-3">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            Auto Routing
                        </span>
                        <button
                            role="switch"
                            aria-checked={autoOrchestration}
                            onClick={async () => {
                                const newVal = !autoOrchestration;
                                onAutoOrchestrationChange?.(newVal);
                                await fetch('/api/agents/chat-settings', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ chatId, auto_orchestration: newVal })
                                }).catch(err => console.error(err));
                            }}
                            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                                autoOrchestration ? 'bg-primary' : 'bg-input'
                            }`}
                        >
                            <span
                                className={`pointer-events-none block h-3 w-3 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                                    autoOrchestration ? 'translate-x-3' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                )}

                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    disabled={autoOrchestration}
                    className={`inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        autoOrchestration ? 'opacity-70 cursor-not-allowed' : 'hover:bg-accent'
                    }`}
                    title={autoOrchestration ? "Disable auto routing to select manually" : "Select an agent"}
                >
                    <div className="relative w-5 h-5 flex-shrink-0">
                        <Image
                            src={selectedAgentIdentity.avatar}
                            alt={selectedAgentIdentity.name}
                            width={20}
                            height={20}
                            className="rounded-full"
                            onError={(e) => {
                                // Fallback to emoji if image fails
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                            }}
                        />
                        <span className="hidden text-sm">{selectedAgentIdentity.icon}</span>
                    </div>
                    {selectedAgentIdentity.name}
                    {/* Show indicator for auto-selected agents */}
                    {isAutoSelected && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                            Auto
                        </span>
                    )}
                    {/* Show intent if available */}
                    {currentAgent?.intent && currentAgent.intent !== 'CHAT' && currentAgent.intent !== 'MANUAL' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                            {currentAgent.intent}
                        </span>
                    )}
                    <ChevronDownIcon size={16} />
                </button>

                {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-80 rounded-lg border border-border bg-popover shadow-lg z-50 max-h-96 overflow-y-auto">
                        {agents.map(({ id, identity }) => (
                            <button
                                key={id}
                                onClick={() => handleAgentChange(id)}
                                className={`w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-accent first:rounded-t-lg last:rounded-b-lg transition-colors ${activeAgentId === id ? 'bg-muted' : ''
                                    }`}
                            >
                                <div className="relative w-6 h-6 flex-shrink-0 mt-0.5">
                                    <Image
                                        src={identity.avatar}
                                        alt={identity.name}
                                        width={24}
                                        height={24}
                                        className="rounded-full"
                                        onError={(e) => {
                                            // Fallback to emoji if image fails
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    <span className="hidden items-center justify-center w-6 h-6 text-base">{identity.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold text-sm">{identity.name}</span>
                                        {activeAgentId === id && (
                                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">Active</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">{identity.role}</p>
                                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">{identity.model}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="ml-auto flex items-center gap-2">
                <button
                    onClick={() => router.push('/chats')}
                    className="hidden md:inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-semibold tracking-tight hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                    aria-label="View All Chats"
                >
                    <MessageSquare className="h-4 w-4" />
                    <span>Recent Chats</span>
                </button>
                <GhostIconButton label="More">
                    <MoreHorizontal className="h-4 w-4" />
                </GhostIconButton>
            </div>
        </div>
    )
}
