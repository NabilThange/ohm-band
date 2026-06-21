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
import { ChatService } from "@/lib/db/chat"
import { useChat } from "@/lib/hooks/use-chat"
import { extractBOMFromMessage, extractCodeFromMessage, extractContextFromMessage, extractCodeBlocksFromMessage } from "@/lib/parsers"
import { showAgentChangeToast } from "@/lib/agents/toast-notifications"
import { ArtifactService } from "@/lib/db/artifacts"
import { supabase } from "@/lib/supabase/client"
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

    // Realtime subscription: update stage badge when session row changes
    useEffect(() => {
        if (!selectedId) return;

        const stageChannel = supabase
            .channel(`session_stage:${selectedId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'chat_sessions',
                    filter: `chat_id=eq.${selectedId}`,
                },
                (payload) => {
                    const newStage = payload.new?.project_stage;
                    if (newStage && newStage !== projectState?.projectStage) {
                        console.log(`[AIAssistantUI] 🎉 Stage advanced to: ${newStage}`);
                        setProjectState((prev) => prev ? { ...prev, projectStage: newStage } : prev);
                        // Reload full state to get updated artifact metadata
                        fetch(`/api/agents/project-state?chatId=${selectedId}`)
                            .then((res) => res.ok ? res.json() : null)
                            .then((data) => { if (data) setProjectState(data); })
                            .catch(() => {});
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(stageChannel); };
    }, [selectedId, projectState?.projectStage]);

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

    // NEW: Load artifacts from database instead of parsing
    useEffect(() => {
        if (!selectedId) return;

        const loadArtifacts = async () => {
            console.log('[AIAssistantUI] 📦 Loading artifacts from database for chat:', selectedId);

            try {
                const types = ['context', 'mvp', 'prd', 'bom', 'code', 'wiring', 'budget', 'enclosure'];
                const results = await Promise.all(
                    types.map(type => ArtifactService.getLatestArtifact(selectedId, type))
                );

                const newArtifacts = {};
                types.forEach((type, index) => {
                    newArtifacts[type] = results[index];
                });

                setArtifacts(newArtifacts);

                // Set legacy state for backwards compatibility
                if (newArtifacts.bom?.version?.content_json) {
                    // ponytail: Preserve all price fields - let BOMCard's getComponentPrice() handle resolution
                    const bomContent = newArtifacts.bom.version.content_json;
                    const mappedBom = {
                        ...bomContent,
                        components: bomContent.components?.map(c => ({
                            ...c, // Keep ALL fields including unitCost, lineCost, etc.
                            name: c.component || c.name // Support both field names
                            // Don't override price fields
                        })) || []
                    };
                    setBomData(mappedBom);
                }
                if (newArtifacts.code?.version?.content_json) {
                    setCodeData(newArtifacts.code.version.content_json);
                }
                if (newArtifacts.context || newArtifacts.mvp || newArtifacts.prd) {
                    setContextData({
                        context: newArtifacts.context?.version?.content || null,
                        mvp: newArtifacts.mvp?.version?.content || null,
                        prd: newArtifacts.prd?.version?.content || null
                    });
                }

                console.log('[AIAssistantUI] ✅ Artifacts loaded:', {
                    context: !!newArtifacts.context,
                    mvp: !!newArtifacts.mvp,
                    prd: !!newArtifacts.prd,
                    bom: !!newArtifacts.bom,
                    code: !!newArtifacts.code,
                    wiring: !!newArtifacts.wiring,
                    budget: !!newArtifacts.budget,
                    enclosure: !!newArtifacts.enclosure
                });

                // Auto-open drawer if we have NEW artifacts - but respect user's closed state
                // Only open if: 1) drawer not in closed set, 2) no drawer currently active, 3) haven't auto-opened for this artifact yet
                if (newArtifacts.context || newArtifacts.mvp || newArtifacts.prd) {
                    // Get the latest artifact ID to track if we've already opened for it
                    const latestContextArtifact = newArtifacts.context || newArtifacts.mvp || newArtifacts.prd;
                    const artifactId = latestContextArtifact?.artifact_id;

                    const hasAlreadyOpened = artifactId && autoOpenedArtifacts.current.has(artifactId);
                    const shouldAutoOpen = !closedDrawers.has('context') && !activeTool && !hasAlreadyOpened;

                    console.log('[AIAssistantUI] 🔍 Context artifacts exist. Should auto-open?', shouldAutoOpen, {
                        artifactId,
                        inClosedSet: closedDrawers.has('context'),
                        activeToolExists: !!activeTool,
                        alreadyOpened: hasAlreadyOpened
                    });

                    if (shouldAutoOpen && artifactId) {
                        console.log('[AIAssistantUI] ✅ Auto-opening context drawer for artifact:', artifactId);
                        autoOpenedArtifacts.current.add(artifactId);
                        setActiveTool('context');
                        setShowArtifacts(true);
                    }
                }
            } catch (error) {
                console.error('[AIAssistantUI] ❌ Failed to load artifacts:', error);
            }
        };

        loadArtifacts();
    }, [selectedId, messages]); // Reload when messages change (indicates tool calls may have run)

    // NEW: Subscribe to realtime artifact updates via Supabase
    useEffect(() => {
        if (!selectedId) return;

        console.log('[AIAssistantUI] 🔴 Setting up realtime subscription for chat:', selectedId);

        // Subscribe to artifact_versions table changes
        const channel = supabase
            .channel(`artifacts:${selectedId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'artifact_versions'
                },
                async (payload) => {
                    console.log('[AIAssistantUI] 🔔 Realtime artifact update received:', payload);

                    // Get the artifact_id from the new version
                    const artifactId = payload.new.artifact_id;

                    // Find which artifact this belongs to by querying artifacts table
                    const { data: artifact } = await supabase
                        .from('artifacts')
                        .select('type, chat_id')
                        .eq('id', artifactId)
                        .single();

                    if (artifact && artifact.chat_id === selectedId) {
                        console.log(`[AIAssistantUI] ⭐ Refreshing ${artifact.type} artifact`);

                        // Reload just this artifact type
                        const updated = await ArtifactService.getLatestArtifact(selectedId, artifact.type);

                        setArtifacts(prev => ({
                            ...prev,
                            [artifact.type]: updated
                        }));

                        // Update legacy state
                        if (artifact.type === 'bom' && updated?.version?.content_json) {
                            // ponytail: Preserve all price fields - let BOMCard's getComponentPrice() handle resolution
                            const bomContent = updated.version.content_json;
                            const mappedBom = {
                                ...bomContent,
                                components: bomContent.components?.map(c => ({
                                    ...c, // Keep ALL fields including unitCost, lineCost, etc.
                                    name: c.component || c.name // Support both field names
                                    // Don't override price fields
                                })) || []
                            };
                            setBomData(mappedBom);
                        } else if (artifact.type === 'code' && updated?.version?.content_json) {
                            setCodeData(updated.version.content_json);
                        } else if (['context', 'mvp', 'prd'].includes(artifact.type)) {
                            setContextData(prev => ({
                                ...prev,
                                [artifact.type]: updated?.version?.content || null
                            }));
                        }

                        // Auto-open drawer for new artifacts - ONLY if not closed by user
                        // Note: Immediate opening is now handled by stream events in useChat.
                        // This serves as a backup/fallback for artifact updates that didn't trigger stream event
                        console.log(`[AIAssistantUI] 🔓 Checking auto-open for ${artifact.type}`);

                        let drawerToOpen = null;
                        if (artifact.type === 'bom') drawerToOpen = 'bom';
                        else if (artifact.type === 'code') drawerToOpen = 'code';
                        else if (artifact.type === 'wiring') drawerToOpen = 'wiring';
                        else if (artifact.type === 'budget') drawerToOpen = 'budget';
                        else if (['context', 'mvp', 'prd'].includes(artifact.type)) drawerToOpen = 'context';

                        if (drawerToOpen) {
                            const hasAlreadyOpened = artifactId && autoOpenedArtifacts.current.has(artifactId);

                            if (closedDrawers.has(drawerToOpen)) {
                                console.log(`[AIAssistantUI] 🛑 Drawer ${drawerToOpen} is in closed set. Ignoring auto-open.`);
                            } else if (hasAlreadyOpened) {
                                console.log(`[AIAssistantUI] 🛑 Already auto-opened for artifact ${artifactId}. Ignoring.`);
                            } else {
                                console.log(`[AIAssistantUI] ✅ Auto-opening drawer (realtime): ${drawerToOpen} for artifact ${artifactId}`);
                                if (artifactId) {
                                    autoOpenedArtifacts.current.add(artifactId);
                                }
                                setActiveTool(drawerToOpen);
                                setShowArtifacts(true);
                            }
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log('[AIAssistantUI] 🔌 Subscription status:', status);
            });

        return () => {
            console.log('[AIAssistantUI] 🔴 Unsubscribing from realtime');
            supabase.removeChannel(channel);
        };
    }, [selectedId, activeTool, closedDrawers]);

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
            const newChat = await ChatService.createChat(DEFAULT_USER_ID, promptText.slice(0, 30))

            // Update local state immediately so useChat can start loading
            setSelectedId(newChat.id)
            setSidebarOpen(false)

            // Send initial message before navigating, to avoid aborting the fetch
            if (promptText && promptText !== "New Project") {
                console.log('[AIAssistantUI] Sending initial message via streaming API...');
                const res = await fetch('/api/agents/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: promptText,
                        chatId: newChat.id
                    })
                })

                if (!res.ok) {
                    // Try to get error message from non-streaming error response
                    try {
                        const errorData = await res.json();
                        throw new Error(errorData.error || `API error: ${res.status}`);
                    } catch {
                        throw new Error(`API error: ${res.status}`);
                    }
                }

                // Handle SSE stream - parse and handle events for the initial message
                const reader = res.body?.getReader();
                if (reader) {
                    console.log('[AIAssistantUI] Processing stream for initial message...');
                    const decoder = new TextDecoder();

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        // Parse the stream to handle agent notifications, etc.
                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');

                        for (const line of lines) {
                            if (!line.trim() || !line.startsWith('data: ')) continue;

                            try {
                                const data = JSON.parse(line.slice(6));

                                // Handle text chunks (AI response content)
                                if (data.type === 'text' && data.content) {
                                    console.log('[AIAssistantUI] 📝 Received text chunk:', data.content.substring(0, 50), '...');
                                    // Text chunks are being streamed but we don't need to handle them here
                                    // The orchestrator will persist the complete response to the database
                                    // and refreshMessages() will load it
                                }

                                // Handle agent selection for initial message
                                if (data.type === 'agent_selected' && data.agent) {
                                    console.log('[AIAssistantUI] 🚀 Initial message agent:', data.agent.name);
                                    handleAgentChange(data.agent);
                                }

                                // Handle tool calls for initial message
                                if (data.type === 'tool_call') {
                                    const toolName = data.toolCall?.name;
                                    if (toolName) {
                                        // Map tool to drawer and open it
                                        const toolDrawerMap = {
                                            // Legacy tools
                                            'open_context_drawer': 'context',
                                            'update_context': 'context',
                                            'update_mvp': 'context',
                                            'update_prd': 'context',
                                            'update_bom': 'bom',
                                            'open_bom_drawer': 'bom',
                                            'add_code_file': 'code',
                                            'open_code_drawer': 'code',
                                            'update_wiring': 'wiring',
                                            'open_wiring_drawer': 'wiring',
                                            'update_budget': 'budget',
                                            'open_budget_drawer': 'budget',
                                            // New unified tools
                                            'open_drawer': (args) => args?.drawer, // Returns drawer name directly
                                        };
                                        
                                        let drawer = toolDrawerMap[toolName];
                                        
                                        // Handle new 'write' tool - extract artifact_type
                                        if (toolName === 'write') {
                                            const args = toolCall.function?.arguments || toolCall.arguments;
                                            const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
                                            const artifactType = parsedArgs?.artifact_type;
                                            
                                            const artifactDrawerMap = {
                                                'context': 'context',
                                                'mvp': 'context',
                                                'prd': 'context',
                                                'bom': 'bom',
                                                'code': 'code',
                                                'wiring': 'wiring',
                                                'budget': 'budget',
                                                'enclosure': 'enclosure',
                                            };
                                            drawer = artifactDrawerMap[artifactType];
                                        }
                                        
                                        // Handle new 'open_drawer' tool - extract drawer parameter
                                        if (toolName === 'open_drawer') {
                                            const args = toolCall.function?.arguments || toolCall.arguments;
                                            const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
                                            drawer = parsedArgs?.drawer;
                                        }
                                        
                                        if (drawer) {
                                            console.log(`[AIAssistantUI] 🔓 Opening drawer from initial message: ${drawer}`);
                                            window.dispatchEvent(new CustomEvent('open-drawer', { detail: { drawer } }));
                                        }
                                    }
                                }
                            } catch (e) {
                                // Ignore parse errors in partial chunks
                            }
                        }
                    }
                    console.log('[AIAssistantUI] Stream processed successfully');
                }
            }

            // After the message has been accepted, update the URL for deep-linking
            router.push(`/build/${newChat.id}`)

            // CRITICAL: Force message reload AFTER navigation
            // This ensures useChat has initialized and realtime subscription is ready
            // Longer delay needed because:
            // 1. router.push is async and needs to complete
            // 2. useChat hook needs to reinitialize with new chatId
            // 3. Realtime subscription needs to be established
            // 4. Messages need to be inserted into DB
            console.log('[AIAssistantUI] ⏳ Waiting for navigation and subscription setup...');
            console.log('[AIAssistantUI] 📊 Current selectedId:', selectedId, 'New chatId:', newChat.id);
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Reload messages to ensure they're visible
            console.log('[AIAssistantUI] 🔄 Forcing message reload from database...');
            console.log('[AIAssistantUI] 📊 refreshMessages available?', !!refreshMessages);
            if (refreshMessages) {
                try {
                    await refreshMessages();
                    console.log('[AIAssistantUI] ✅ Messages refreshed successfully');
                } catch (err) {
                    console.error('[AIAssistantUI] ❌ Failed to refresh messages:', err);
                }
            } else {
                console.warn('[AIAssistantUI] ⚠️ refreshMessages not available yet');
            }

            // Trigger title generation in background
            if (promptText && promptText !== "New Project") {
                console.log('[AIAssistantUI] 🏷️ Triggering title generation...');
                fetch('/api/agents/title', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chatId: newChat.id,
                        message: promptText
                    })
                }).then(res => res.json())
                    .then(data => {
                        if (data.title) {
                            console.log('[AIAssistantUI] 🏷️ Title generated:', data.title);
                            // Update newChat with generated title for immediate UI feedback
                            newChat.title = data.title;
                            // Note: The realtime subscription in useChatList will also sync this from DB
                        }
                    })
                    .catch(err => console.error('Title generation failed:', err));
            }
        } catch (e) {
            console.error("Failed to create chat or send initial message:", e)
            alert(`Could not create chat: ${e.message}`)
        }
    }

    // NEW: Handle creating chat with a specific chatId (for instant navigation)
    async function handleCreateChatWithId(chatId, promptText) {
        try {
            console.log('[AIAssistantUI] Creating chat session with chatId:', chatId)
            
            // Create chat in database with the provided chatId
            const newChat = await ChatService.createChatWithId(DEFAULT_USER_ID, chatId, promptText.slice(0, 30))

            // Update local state immediately
            setSelectedId(chatId)
            setSidebarOpen(false)

            // Send initial message
            if (promptText) {
                console.log('[AIAssistantUI] Sending initial message...')
                const res = await fetch('/api/agents/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: promptText,
                        chatId: chatId
                    })
                })

                if (!res.ok) {
                    try {
                        const errorData = await res.json()
                        throw new Error(errorData.error || `API error: ${res.status}`)
                    } catch {
                        throw new Error(`API error: ${res.status}`)
                    }
                }

                // Handle SSE stream
                const reader = res.body?.getReader()
                if (reader) {
                    const decoder = new TextDecoder()
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break

                        const chunk = decoder.decode(value)
                        const lines = chunk.split('\n')

                        for (const line of lines) {
                            if (!line.trim() || !line.startsWith('data: ')) continue

                            try {
                                const data = JSON.parse(line.slice(6))

                                if (data.type === 'agent_selected' && data.agent) {
                                    handleAgentChange(data.agent)
                                }

                                if (data.type === 'tool_call') {
                                    const toolName = data.toolCall?.name
                                    if (toolName) {
                                        // Handle tool drawer opening
                                        console.log('[AIAssistantUI] Tool called:', toolName)
                                    }
                                }
                            } catch (e) {
                                // Ignore parse errors
                            }
                        }
                    }
                }
            }

            // Wait for messages to be persisted
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Reload messages
            if (refreshMessages) {
                await refreshMessages()
            }

            // Generate title in background
            if (promptText) {
                fetch('/api/agents/title', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chatId: chatId,
                        message: promptText
                    })
                }).catch(err => console.error('Title generation failed:', err))
            }
        } catch (e) {
            console.error("Failed to create chat with chatId:", e)
            alert(`Could not create chat: ${e.message}`)
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
                            // Pass artifacts for inline components
                            artifacts={artifacts}
                        />

                    </main>
                </div>
            </div>
        </div>
    )
}