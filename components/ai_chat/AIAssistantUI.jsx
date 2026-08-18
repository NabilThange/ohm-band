"use client"

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Calendar, LayoutGrid, MoreHorizontal, FileText, Cpu, Code } from "lucide-react"
import Sidebar from "./Sidebar"
import Header from "./Header"
import ChatPane from "./ChatPane"
import GhostIconButton from "./GhostIconButton"
import ThemeToggle from "./ThemeToggle"
import { INITIAL_TEMPLATES, INITIAL_FOLDERS } from "./mockData"
import { useChatList } from "@/lib/hooks/use-chat-list"
import { useChat } from "@/lib/hooks/use-chat"
import { showAgentChangeToast, showMakerProfileToast } from "@/lib/agents/toast-notifications"
import { StageProgressBar } from "@/components/stages/StageProgressBar"
import { StageOverrideButton } from "@/components/stages/StageOverrideButton"

// Import Drawers
import BOMDrawer from "@/components/tools/BOMDrawer"
import CodeDrawer from "@/components/tools/CodeDrawer"
import ContextDrawer from "@/components/tools/ContextDrawer"
import { ProviderSelector } from "./ProviderSelector"

// Default/System user ID for MVP
const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000"

export default function AIAssistantUI({ initialPrompt, initialChatId, userContext = undefined }) {
    const router = useRouter()

    // Theme Management - Default to 'dark' for consistent experience
    const [theme, setTheme] = useState("dark")

    // Initialize theme on client side only - load saved preference or keep dark default
    useEffect(() => {
        const saved = localStorage.getItem("theme")
        if (saved && saved !== theme) {
            setTheme(saved)
        } else {
            // Ensure dark class is applied by default
            document.documentElement.classList.add("dark")
        }
    }, [])

    useEffect(() => {
        if (!theme) return // Wait for theme to be initialized

        try {
            if (theme === "dark") document.documentElement.classList.add("dark")
            else document.documentElement.classList.remove("dark")
            document.documentElement.setAttribute("data-theme", theme)
            document.documentElement.style.colorScheme = theme
            localStorage.setItem("theme", theme)
        } catch { }
    }, [theme])

    // Prompt user if Maker Profile is unconfigured
    useEffect(() => {
        const hasPrompted = sessionStorage.getItem("ohm-profile-prompted");
        if (hasPrompted) return;

        fetch('/api/user-profile')
            .then(res => (res.ok ? res.json() : null))
            .then(data => {
                if (data && !data.isComplete) {
                    sessionStorage.setItem("ohm-profile-prompted", "true");
                    setTimeout(() => {
                        showMakerProfileToast();
                    }, 1200);
                }
            })
            .catch(() => {});
    }, []);

    // Sidebar State
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [collapsed, setCollapsed] = useState(() => {
        try {
            const raw = localStorage.getItem("sidebar-collapsed")
            return raw ? JSON.parse(raw) : { pinned: true, recent: false, folders: true, templates: true }
        } catch {
            return { pinned: true, recent: false, folders: true, templates: true }
        }
    })
    useEffect(() => {
        try {
            localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed))
        } catch { }
    }, [collapsed])

    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        try {
            const saved = localStorage.getItem("sidebar-collapsed-state")
            return saved ? JSON.parse(saved) : false
        } catch {
            return false
        }
    })
    useEffect(() => {
        try {
            localStorage.setItem("sidebar-collapsed-state", JSON.stringify(sidebarCollapsed))
        } catch { }
    }, [sidebarCollapsed])

    // Chat Data
    const { chats: dbChats, isLoading: chatsLoading } = useChatList(DEFAULT_USER_ID)
    const [selectedId, setSelectedId] = useState(initialChatId || null)
    const [templates, setTemplates] = useState(INITIAL_TEMPLATES)
    const [folders, setFolders] = useState(INITIAL_FOLDERS)
    const [query, setQuery] = useState("")
    const searchRef = useRef(null)

    // Current Agent State - Default to Project Initializer for new chats
    const [currentAgent, setCurrentAgent] = useState({
        type: 'projectInitializer',
        name: 'Project Initializer',
        icon: '🚀',
        intent: 'INIT'
    });

    // Provider selection state
    const [providerChanged, setProviderChanged] = useState(false);

    // ── Project Stage State ────────────────────────────────────────────
    const [projectState, setProjectState] = useState(null);

    // Load project state when a chat is selected
    useEffect(() => {
        if (!selectedId) { setProjectState(null); return; }

        fetch(`/api/agents/project-state?chatId=${selectedId}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => { if (data) setProjectState(data); })
            .catch((err) => console.error('[AIAssistantUI] Failed to load project state:', err));
    }, [selectedId]);

    // Reload project stage state when artifact changes occur
    useEffect(() => {
        if (!selectedId) return;

        const reloadStage = () => {
            fetch(`/api/agents/project-state?chatId=${selectedId}`)
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => { if (data) setProjectState(data); })
                .catch(() => {});
        };

        window.addEventListener('ohm-artifact-updated', reloadStage);
        return () => window.removeEventListener('ohm-artifact-updated', reloadStage);
    }, [selectedId]);

    // Callback for agent changes - IMMEDIATELY called when orchestrator detects intent
    const handleAgentChange = useCallback((agent) => {
        console.log('[AIAssistantUI] ⚡ Agent change callback triggered:', {
            newAgent: agent?.name,
            newAgentType: agent?.type,
            previousAgent: currentAgent?.name,
            previousAgentType: currentAgent?.type,
            intent: agent?.intent
        });

        // Show toast for ANY agent notification (not just when switching)
        if (agent && agent.name) {
            console.log('[AIAssistantUI] 🔔 Showing agent change toast NOW...');
            showAgentChangeToast(agent.id || agent.type);
        }

        // Update state - this triggers Header dropdown update
        console.log('[AIAssistantUI] 📝 Updating currentAgent state...');
        setCurrentAgent(agent);
        console.log('[AIAssistantUI] ✅ Agent change complete');
    }, [currentAgent?.type]);

    // Lifted useChat Hook - pass agent change callback
    const { messages, isLoading: chatLoading, sendMessage, setForceAgent, refreshMessages } = useChat(
        selectedId,
        handleAgentChange
    )

    // Artifact State - now loaded from database instead of parsing
    const [artifacts, setArtifacts] = useState({
        context: null,
        mvp: null,
        prd: null,
        bom: null,
        code: null,
        wiring: null,
        budget: null
    })
    const [showArtifacts, setShowArtifacts] = useState(false)
    const [activeTool, setActiveTool] = useState(null) // 'context', 'bom', 'code', 'wiring', 'budget'

    // NEW: Track user-closed drawers to prevent auto-reopening
    const [closedDrawers, setClosedDrawers] = useState(new Set());

    // Track which artifact IDs have already triggered auto-open to prevent repeated opening
    const autoOpenedArtifacts = useRef(new Set());

    // Reset closed drawers and auto-opened tracking when switching chats
    useEffect(() => {
        setClosedDrawers(new Set());
        autoOpenedArtifacts.current = new Set();
    }, [selectedId]);

    // Legacy parsed data for backwards compatibility (keep for now)
    const [bomData, setBomData] = useState(null)
    const [codeData, setCodeData] = useState(null)
    const [contextData, setContextData] = useState(null)

    // Event Listener for "View All Files" from Chat
    useEffect(() => {
        const handleOpenCodeDrawer = (event) => {
            const extracted = event.detail;
            if (extracted && extracted.files) {
                // Adapt to CodeData format
                const adaptedData = {
                    files: extracted.files.map(f => ({
                        path: f.filename,
                        content: f.content
                    }))
                };
                console.log('[AIAssistantUI] 📨 Received open-code-drawer event', adaptedData);
                setCodeData(adaptedData);
            }
        };

        // Event listener for drawer link buttons in AI messages (and new tool call events)
        const handleOpenDrawer = (event) => {
            const eventReceivedTime = performance.now();
            const { drawer } = event.detail || {};
            console.log('[AIAssistantUI] 📨 Received open-drawer event at', eventReceivedTime.toFixed(2), 'ms:', drawer);

            if (drawer) {
                // If opening via tool/button, remove from closed set if present (force open)
                if (closedDrawers.has(drawer)) {
                    console.log(`[AIAssistantUI] 🔓 Removing ${drawer} from closed set (forced open)`);
                    setClosedDrawers(prev => {
                        const next = new Set(prev);
                        next.delete(drawer);
                        return next;
                    });
                }

                const stateUpdateStartTime = performance.now();
                console.log('[AIAssistantUI] ✅ OPTIMISTIC OPENING: Setting drawer state to open:', drawer);
                setActiveTool(drawer);
                setShowArtifacts(true);
                const stateUpdateEndTime = performance.now();

                console.log(`[AIAssistantUI] 📊 Event received → State updated: ${(stateUpdateEndTime - eventReceivedTime).toFixed(2)}ms`);
                console.log(`[AIAssistantUI] 🎯 Drawer ${drawer} should now be visible with loading state`);
            } else {
                console.error('[AIAssistantUI] ❌ No drawer specified in event');
            }
        };

        window.addEventListener('open-code-drawer', handleOpenCodeDrawer);
        window.addEventListener('open-drawer', handleOpenDrawer);

        console.log('[AIAssistantUI] 🎯 Event listeners registered');

        return () => {
            window.removeEventListener('open-code-drawer', handleOpenCodeDrawer);
            window.removeEventListener('open-drawer', handleOpenDrawer);
        };
    }, [closedDrawers]); // Depend on closedDrawers to access latest state

    // Load artifacts from local filesystem endpoints
    useEffect(() => {
        if (!selectedId) return;

        const loadArtifacts = async () => {
            console.log('[AIAssistantUI] 📦 Loading artifacts from local disk for chat:', selectedId);

            try {
                const types = ['context', 'bom', 'code', 'wiring', 'budget', 'enclosure'];
                const results = await Promise.all(
                    types.map(async (type) => {
                        const res = await fetch(`/api/projects/${selectedId}/artifacts/${type}`);
                        return res.ok ? await res.json() : null;
                    })
                );

                const newArtifacts = {};
                types.forEach((type, index) => {
                    newArtifacts[type] = results[index];
                });

                setArtifacts(newArtifacts);

                // Set legacy drawer state
                if (newArtifacts.bom?.components) {
                    const bomContent = newArtifacts.bom;
                    const mappedBom = {
                        ...bomContent,
                        components: bomContent.components?.map(c => ({
                            ...c,
                            name: c.component || c.name,
                            estimatedCost: c.unit_price ?? c.estimatedCost ?? 0,
                            partNumber: c.partNumber || ''
                        })) || []
                    };
                    setBomData(mappedBom);
                }
                if (newArtifacts.code?.files) {
                    setCodeData(newArtifacts.code);
                }
                if (newArtifacts.context) {
                    setContextData({
                        context: newArtifacts.context.context || null,
                        mvp: newArtifacts.context.mvp || null,
                        prd: newArtifacts.context.prd || null
                    });
                }

                console.log('[AIAssistantUI] ✅ Local disk artifacts loaded:', {
                    context: !!newArtifacts.context,
                    bom: !!newArtifacts.bom,
                    code: !!newArtifacts.code,
                    wiring: !!newArtifacts.wiring,
                    budget: !!newArtifacts.budget,
                    enclosure: !!newArtifacts.enclosure
                });
            } catch (error) {
                console.error('[AIAssistantUI] ❌ Failed to load artifacts from disk:', error);
            }
        };

        loadArtifacts();

        // Listen for live artifact updates emitted by OpenCode SSE
        const handleArtifactUpdate = (e) => {
            const detail = e.detail;
            console.log('[AIAssistantUI] 🔔 Live artifact update event received:', detail);
            loadArtifacts();

            // Auto-open corresponding drawer if not in closed set
            if (detail?.type) {
                const drawer = detail.type;
                if (!closedDrawers.has(drawer)) {
                    setActiveTool(drawer);
                    setShowArtifacts(true);
                }
            }
        };

        window.addEventListener('ohm-artifact-updated', handleArtifactUpdate);
        return () => window.removeEventListener('ohm-artifact-updated', handleArtifactUpdate);
    }, [selectedId, closedDrawers]);

    useEffect(() => {
        if (initialChatId) setSelectedId(initialChatId)
    }, [initialChatId])

    // Derived conversations for Sidebar display
    const conversations = useMemo(() => {
        return dbChats.map(c => ({
            id: c.id,
            title: c.title || "Untitled Project",
            updatedAt: c.last_message_at || c.created_at,
            messageCount: 0,
            preview: "View conversation...",
            pinned: false,
            folder: "Work Projects",
            messages: []
        }))
    }, [dbChats])

    // Initial Prompt Handling
    const hasInitializedPrompt = useRef(false)
    useEffect(() => {
        // Case 1: initialPrompt with initialChatId (from instant navigation)
        // Need to create the chat session in DB with this specific chatId
        if (initialPrompt && initialChatId && !hasInitializedPrompt.current) {
            hasInitializedPrompt.current = true
            console.log('[AIAssistantUI] Creating chat with provided chatId:', initialChatId)
            handleCreateChatWithId(initialChatId, initialPrompt)
        }
        // Case 2: initialPrompt without chatId (old flow)
        else if (initialPrompt && !hasInitializedPrompt.current && !initialChatId && !selectedId) {
            hasInitializedPrompt.current = true
            // Create chat immediately on mount with initialPrompt
            handleCreateNewChat(initialPrompt)
        }
    }, [initialPrompt, initialChatId, selectedId])

    useEffect(() => {
        if (initialPrompt || initialChatId) return
        if (!selectedId && conversations.length > 0) {
            // Optional auto-select logic
        }
    }, [conversations, selectedId, initialPrompt, initialChatId])

    // Filter Logic
    const filtered = useMemo(() => {
        if (!query.trim()) return conversations
        const q = query.toLowerCase()
        return conversations.filter((c) => c.title.toLowerCase().includes(q))
    }, [conversations, query])

    const pinned = filtered.filter((c) => c.pinned).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    const recent = filtered
        .filter((c) => !c.pinned)
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .slice(0, 10)

    const folderCounts = React.useMemo(() => {
        const map = Object.fromEntries(folders.map((f) => [f.name, 0]))
        for (const c of conversations) if (map[c.folder] != null) map[c.folder] += 1
        return map
    }, [conversations, folders])

    // Actions
    async function handleCreateNewChat(promptText = "New Project") {
        try {
            const newChatId = crypto.randomUUID();
            const title = promptText.slice(0, 30) || "New Hardware Project";

            // Create local filesystem project
            await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId: newChatId, title })
            });

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('ohm-project-created'));
            }

            setSelectedId(newChatId);
            setSidebarOpen(false);

            // Send initial message to OpenCode
            if (promptText && promptText !== "New Project") {
                console.log('[AIAssistantUI] Sending initial message to OpenCode...');
                fetch('/api/agents/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: promptText,
                        chatId: newChatId
                    })
                }).catch(err => console.error('[AIAssistantUI] Error dispatching initial message:', err));
            }

            router.push(`/build/${newChatId}`);
        } catch (e) {
            console.error("Failed to create chat:", e);
            alert(`Could not create project: ${e.message}`);
        }
    }

    async function handleCreateChatWithId(chatId, promptText) {
        try {
            console.log('[AIAssistantUI] Creating project with specific chatId:', chatId);
            const title = promptText.slice(0, 30) || "New Hardware Project";

            await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId, title })
            });

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('ohm-project-created'));
            }

            setSelectedId(chatId);
            setSidebarOpen(false);

            if (promptText) {
                console.log('[AIAssistantUI] Sending initial message via sendMessage:', promptText);
                // Call useChat sendMessage directly to display user message and start live response stream
                sendMessage(promptText);
            }
        } catch (e) {
            console.error("Failed to create chat with chatId:", e);
            alert(`Could not create project: ${e.message}`);
        }
    }

    function handleSelectChat(id) {
        setSelectedId(id)
        router.push(`/build/${id}`)
        setSidebarOpen(false)
    }

    function createFolder() {
        const name = prompt("Folder name")
        if (!name) return
        if (folders.some((f) => f.name.toLowerCase() === name.toLowerCase())) return alert("Folder already exists.")
        setFolders((prev) => [...prev, { id: Math.random().toString(36).slice(2), name }])
    }

    function togglePin(id) {
        // TODO: Implement DB update
        console.log("Pin toggle not implemented in DB yet")
    }

    const composerRef = useRef(null)
    const selectedChat = conversations.find((c) => c.id === selectedId) || null

    return (
        <div className="relative h-screen w-full bg-background text-foreground flex"> {/* ponytail: removed overflow-hidden to allow scrolling */}

            {/* Artifact Drawers - Absolute positioned or side-by-side? 
                Let's make them sit on the right side if open, shrinking ChatPane? 
                Or overlay? BuildInterface had them as siblings. 
            */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative z-0">
                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 z-40 flex items-center gap-2 border-b border-border bg-background/80 px-3 py-2 backdrop-blur">
                    <div className="ml-1 flex items-center gap-2 text-sm font-semibold tracking-tight">
                        <span className="inline-flex h-4 w-4 items-center justify-center">Ω</span> Ohm Assistant
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <ThemeToggle theme={theme} setTheme={setTheme} />
                    </div>
                </div>

                <div className="mx-auto flex h-full w-full">
                    <Sidebar
                        open={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        theme={theme}
                        setTheme={setTheme}
                        collapsed={collapsed}
                        setCollapsed={setCollapsed}
                        sidebarCollapsed={sidebarCollapsed}
                        setSidebarCollapsed={setSidebarCollapsed}
                        conversations={conversations}
                        pinned={pinned}
                        recent={recent}
                        folders={folders}
                        folderCounts={folderCounts}
                        selectedId={selectedId}
                        onSelect={handleSelectChat}
                        togglePin={togglePin}
                        query={query}
                        setQuery={setQuery}
                        searchRef={searchRef}
                        createFolder={createFolder}
                        createNewChat={() => router.push('/build')}
                        templates={templates}
                        setTemplates={setTemplates}
                        onUseTemplate={(t) => composerRef.current?.insertTemplate(t.content)}
                        // Pass Artifact Data (legacy format for backwards compat)
                        contextData={contextData}
                        bomData={bomData}
                        codeData={codeData}
                        // NEW: Pass full artifacts object
                        artifacts={artifacts}
                        // Pass controlled tool state
                        activeTool={activeTool}
                        setActiveTool={(tool) => {
                            if (tool === null && activeTool) {
                                // User is closing the drawer
                                console.log(`[AIAssistantUI] 🔒 User closed drawer: ${activeTool}`);
                                setClosedDrawers(prev => new Set(prev).add(activeTool));
                            }
                            setActiveTool(tool);
                        }}
                    />

                    <main className="relative flex min-w-0 flex-1 flex-col h-full">
                        <Header
                            chatId={selectedId}
                            autoOrchestration={projectState?.autoOrchestration ?? true}
                            onAutoOrchestrationChange={(enabled) => {
                                setProjectState((prev) => prev ? { ...prev, autoOrchestration: enabled } : prev);
                            }}
                            createNewChat={() => router.push('/build')}
                            sidebarCollapsed={sidebarCollapsed}
                            setSidebarOpen={setSidebarOpen}
                            currentAgent={currentAgent}
                            onAgentChange={(agentId) => {
                                // Manual agent selection
                                setForceAgent(agentId);
                                // Find agent data from agents list
                                const agents = [
                                    { id: "projectInitializer", name: "Project Initializer", icon: "🚀" },
                                    { id: "conversational", name: "Conversational Agent", icon: "💡" },
                                    { id: "orchestrator", name: "Orchestrator", icon: "🎯" },
                                    { id: "bomGenerator", name: "BOM Generator", icon: "📦" },
                                    { id: "codeGenerator", name: "Code Generator", icon: "⚡" },
                                    { id: "wiringDiagram", name: "Wiring Specialist", icon: "🔌" },
                                    { id: "debugger", name: "Hardware Debugger", icon: "🐛" },
                                    { id: "datasheetAnalyzer", name: "Datasheet Analyst", icon: "📄" },
                                    { id: "budgetOptimizer", name: "Budget Optimizer", icon: "💰" }
                                ];
                                const agentData = agents.find(a => a.id === agentId);
                                if (agentData) {
                                    setCurrentAgent({
                                        type: agentId,
                                        name: agentData.name,
                                        icon: agentData.icon,
                                        intent: 'MANUAL'
                                    });
                                    // Show toast for manual selection
                                    showAgentChangeToast(agentId);
                                }
                            }}
                        />

                        {/* Stage Progress Bar — shown when a chat is active */}
                        {projectState && selectedId && (
                            <div className="flex items-center gap-2">
                                <StageProgressBar
                                    currentStage={projectState.projectStage}
                                    artifacts={projectState.artifacts}
                                />
                                <div className="pr-3 shrink-0">
                                    <StageOverrideButton
                                        chatId={selectedId}
                                        currentStage={projectState.projectStage}
                                        onStageChanged={(newStage) =>
                                            setProjectState((prev) =>
                                                prev ? { ...prev, projectStage: newStage, stageOverride: true } : prev
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        {/* Always render ChatPane; internal logic handles empty state */}
                        <ChatPane
                            ref={composerRef}
                            chatId={selectedId}
                            onChatCreated={handleSelectChat}
                            initialPrompt={initialPrompt}
                            chat={selectedChat}
                            // Pass messages explicitly
                            messages={messages}
                            isLoading={chatLoading}
                            sendMessage={sendMessage}
                        />

                    </main>
                </div>
            </div>
        </div>
    )
}