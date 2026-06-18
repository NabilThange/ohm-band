"use client"
import { motion, AnimatePresence } from "framer-motion"
import {
    PanelLeftClose,
    PanelLeftOpen,
    SearchIcon,
    Plus,
    Star,
    Clock,
    FolderIcon,
    FileText,
    Settings,
    Asterisk,
    Wallet,
    Cpu,
    ScrollText,
    Cable,
    Code2,
    FileStack,
    Box,
} from "lucide-react"
import BudgetDrawer from "../tools/BudgetDrawer"
import ComponentDrawer from "../tools/ComponentDrawer"
import BOMDrawer from "../tools/BOMDrawer"
import WiringDrawer from "../tools/WiringDrawer"
import CodeDrawer from "../tools/CodeDrawer"
import ContextDrawer from "../tools/ContextDrawer"
import EnclosureDrawer from "../tools/EnclosureDrawer"
import SidebarSection from "./SidebarSection"
import ConversationRow from "./ConversationRow"
import FolderRow from "./FolderRow"
import TemplateRow from "./TemplateRow"
import ThemeToggle from "./ThemeToggle"
import CreateFolderModal from "./CreateFolderModal"
import CreateTemplateModal from "./CreateTemplateModal"
import SearchModal from "./SearchModal"
import SettingsPopover from "./SettingsPopover"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { cn as cls } from "@/lib/utils"
import { useState, useEffect } from "react"

export default function Sidebar({
    open,
    onClose,
    theme,
    setTheme,
    collapsed,
    setCollapsed,
    conversations,
    pinned,
    recent,
    folders,
    folderCounts,
    selectedId,
    onSelect,
    togglePin,
    query,
    setQuery,
    searchRef,
    createFolder,
    createNewChat,
    templates = [],
    setTemplates = () => { },
    onUseTemplate = () => { },
    sidebarCollapsed = false,
    setSidebarCollapsed = () => { },
    // Artifact Data Props
    contextData = null,
    bomData = null,
    codeData = null,
    // NEW: Full artifacts object from database
    artifacts = null,
    // Controlled state for tools
    activeTool = null,
    setActiveTool = () => { },
}) {
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
    const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState(null)
    const [showSearchModal, setShowSearchModal] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    // Prevent hydration mismatch by deferring animation until after mount
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Ensure drawers are closed by default, but listen for global open events
    useEffect(() => {
        const handleOpenCodeDrawer = (event) => {
            console.log('[Sidebar] Global open-code-drawer event received');
            setActiveTool('code');
        };

        window.addEventListener('open-code-drawer', handleOpenCodeDrawer);

        // Initial state - NO, controlled by parent now
        // if (!activeTool) setActiveTool(null);

        return () => window.removeEventListener('open-code-drawer', handleOpenCodeDrawer);
    }, [setActiveTool]);

    const handleSearchClick = () => {
        setShowSearchModal(true)
    }

    const handleNewChatClick = () => {
        createNewChat()
    }

    const handleFoldersClick = () => {
        // Expand sidebar and open folders section
        setSidebarCollapsed(false)
        setCollapsed((s) => ({ ...s, folders: false }))
    }

    const getConversationsByFolder = (folderName) => {
        return conversations.filter((conv) => conv.folder === folderName)
    }

    const handleCreateFolder = (folderName) => {
        createFolder(folderName)
    }

    const handleDeleteFolder = (folderName) => {
        const updatedConversations = conversations.map((conv) =>
            conv.folder === folderName ? { ...conv, folder: null } : conv,
        )
        console.log("Delete folder:", folderName, "Updated conversations:", updatedConversations)
    }

    const handleRenameFolder = (oldName, newName) => {
        const updatedConversations = conversations.map((conv) =>
            conv.folder === oldName ? { ...conv, folder: newName } : conv,
        )
        console.log("Rename folder:", oldName, "to", newName, "Updated conversations:", updatedConversations)
    }

    const handleCreateTemplate = (templateData) => {
        if (editingTemplate) {
            const updatedTemplates = templates.map((t) =>
                t.id === editingTemplate.id ? { ...templateData, id: editingTemplate.id } : t,
            )
            setTemplates(updatedTemplates)
            setEditingTemplate(null)
        } else {
            const newTemplate = {
                ...templateData,
                id: Date.now().toString(),
            }
            setTemplates([...templates, newTemplate])
        }
        setShowCreateTemplateModal(false)
    }

    const handleEditTemplate = (template) => {
        setEditingTemplate(template)
        setShowCreateTemplateModal(true)
    }

    const handleRenameTemplate = (templateId, newName) => {
        const updatedTemplates = templates.map((t) =>
            t.id === templateId ? { ...t, name: newName, updatedAt: new Date().toISOString() } : t,
        )
        setTemplates(updatedTemplates)
    }

    const handleDeleteTemplate = (templateId) => {
        const updatedTemplates = templates.filter((t) => t.id !== templateId)
        setTemplates(updatedTemplates)
    }

    const handleUseTemplate = (template) => {
        onUseTemplate(template)
    }


    if (sidebarCollapsed) {
        return (
            <>
                {isMounted ? (
                    <motion.aside
                        initial={{ width: 320 }}
                        animate={{ width: 64 }}
                        transition={{ type: "spring", stiffness: 260, damping: 28 }}
                        className="z-50 flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar"
                    >
                        <div className="flex items-center justify-center px-3 py-3">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setSidebarCollapsed(false)}
                                    className="rounded-xl p-2 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    aria-label="Open sidebar"
                                >
                                    <PanelLeftOpen className="h-5 w-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>Open sidebar</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="flex flex-1 flex-col items-center gap-2 pt-4">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={handleNewChatClick}
                                    className="rounded-xl p-2.5 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                                >
                                    <Plus className="h-5 w-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>New Chat</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => window.location.href = '/marketplace'}
                                    className="rounded-xl p-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                                >
                                    <FileText className="h-5 w-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>Marketplace</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={handleSearchClick}
                                    className="rounded-xl p-2.5 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                                >
                                    <SearchIcon className="h-5 w-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>Search chats</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={handleFoldersClick}
                                    className="rounded-xl p-2.5 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                                >
                                    <FolderIcon className="h-5 w-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>Folders</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* Project Tools Section */}
                    <div className="flex flex-col items-center gap-2 border-t border-sidebar-border pt-4">
                        <div className="mb-1 text-[10px] font-semibold text-muted-foreground">TOOLS</div>
                        {[
                            { id: 'budget', icon: Wallet, label: 'Budget' },
                            { id: 'components', icon: Cpu, label: 'Parts' },
                            { id: 'bom', icon: ScrollText, label: 'BOM' },
                            { id: 'wiring', icon: Cable, label: 'Wiring' },
                            { id: 'code', icon: Code2, label: 'Code' },
                            { id: 'enclosure', icon: Box, label: 'Enclosure' },
                            { id: 'context', icon: FileStack, label: 'Context' },
                        ].map((tool) => (
                            <Tooltip key={tool.id}>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
                                        className={cls(
                                            "rounded-xl p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                            activeTool === tool.id
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "hover:bg-sidebar-accent"
                                        )}
                                    >
                                        <tool.icon className="h-5 w-5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p>{tool.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>


                    <div className="mt-4 flex flex-col items-center gap-2 pb-4">
                        <SettingsPopover>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        className="rounded-xl p-2.5 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                                    >
                                        <Settings className="h-5 w-5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p>Settings</p>
                                </TooltipContent>
                            </Tooltip>
                        </SettingsPopover>
                    </div>
                </motion.aside>
                ) : (
                    <aside className="z-50 flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar" style={{ width: '64px' }}>
                        {/* Placeholder for SSR - prevents hydration mismatch */}
                    </aside>
                )}

                <SearchModal
                    isOpen={showSearchModal}
                    onClose={() => setShowSearchModal(false)}
                    conversations={conversations}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    togglePin={togglePin}
                    createNewChat={createNewChat}
                />

                {/* Drawer components - always rendered regardless of sidebar state */}
                {activeTool === 'budget' && <BudgetDrawer isOpen={true} onClose={() => setActiveTool(null)} />}
                {activeTool === 'components' && <ComponentDrawer isOpen={true} onClose={() => setActiveTool(null)} />}
                {activeTool === 'bom' && <BOMDrawer isOpen={true} onClose={() => setActiveTool(null)} bomData={bomData} />}
                {activeTool === 'wiring' && (
                    <WiringDrawer
                        isOpen={true}
                        onClose={() => setActiveTool(null)}
                        artifactId={artifacts?.wiring?.version?.id}
                        initialUrl={artifacts?.wiring?.version?.fritzing_url}
                        initialStatus={artifacts?.wiring?.version?.diagram_status}
                        wiringData={artifacts?.wiring?.version?.content_json}
                        diagramSvg={artifacts?.wiring?.version?.diagram_svg}
                    />
                )}
                {activeTool === 'code' && <CodeDrawer isOpen={true} onClose={() => setActiveTool(null)} codeData={codeData} />}
                {activeTool === 'enclosure' && <EnclosureDrawer isOpen={true} onClose={() => setActiveTool(null)} enclosureData={artifacts?.enclosure?.version?.content_json} />}
                {activeTool === 'context' && <ContextDrawer isOpen={true} onClose={() => setActiveTool(null)} contextData={contextData} />}
            </>
        )
    }

    return (
        <>
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-foreground/60 md:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isMounted && (open || typeof window !== "undefined") && (
                    <motion.aside
                        key="sidebar"
                        initial={{ x: -340 }}
                        animate={{ x: open ? 0 : 0 }}
                        exit={{ x: -340 }}
                        transition={{ type: "spring", stiffness: 260, damping: 28 }}
                        className={cls(
                            "z-50 flex h-full w-80 shrink-0 flex-col border-r border-sidebar-border bg-sidebar",
                            "fixed inset-y-0 left-0 md:static md:translate-x-0",
                        )}
                    >
                        <div className="flex items-center gap-2 border-b border-sidebar-border px-3 py-3">
                            <div className="flex items-center gap-2">
                                <img src="/omega1.png" alt="Ohm" className="h-8 w-8" />
                                <div className="text-sm font-semibold tracking-tight">Ohm</div>
                            </div>
                            <div className="ml-auto flex items-center gap-1">
                                <button
                                    onClick={() => setSidebarCollapsed(true)}
                                    className="hidden md:block rounded-xl p-2 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    aria-label="Close sidebar"
                                    title="Close sidebar"
                                >
                                    <PanelLeftClose className="h-5 w-5" />
                                </button>

                                <button
                                    onClick={onClose}
                                    className="md:hidden rounded-xl p-2 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    aria-label="Close sidebar"
                                >
                                    <PanelLeftClose className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="px-3 pt-3">
                            <label htmlFor="search" className="sr-only">
                                Search conversations
                            </label>
                            <div className="relative">
                                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    id="search"
                                    ref={searchRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search…"
                                    onClick={() => setShowSearchModal(true)}
                                    onFocus={() => setShowSearchModal(true)}
                                    className="w-full rounded-full border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>

                        <div className="px-3 pt-3 space-y-2">
                            <button
                                onClick={createNewChat}
                                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                title="New Chat (⌘N)"
                            >
                                <Plus className="h-4 w-4" /> Start New Chat
                            </button>
                            <button
                                onClick={() => window.location.href = '/marketplace'}
                                className="flex w-full items-center justify-center gap-2 rounded-full bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                title="Browse Marketplace"
                            >
                                <FileText className="h-4 w-4" /> Marketplace
                            </button>
                        </div>

                        <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 pb-4">
                            <div className="px-2">
                                <div className="mb-2 text-xs font-semibold text-muted-foreground">PROJECT TOOLS</div>
                                <div className="grid grid-cols-5 gap-2">
                                    {[
                                        { id: 'budget', icon: Wallet, label: 'Budget' },
                                        { id: 'components', icon: Cpu, label: 'Parts' },
                                        { id: 'bom', icon: ScrollText, label: 'BOM' },
                                        { id: 'wiring', icon: Cable, label: 'Wiring' },
                                        { id: 'code', icon: Code2, label: 'Code' },
                                        { id: 'enclosure', icon: Box, label: 'Enclosure' },
                                        { id: 'context', icon: FileStack, label: 'Context' },
                                    ].map((tool) => (
                                        <Tooltip key={tool.id}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
                                                    className={cls(
                                                        "flex items-center justify-center rounded-lg p-2 transition-colors",
                                                        activeTool === tool.id
                                                            ? "bg-primary text-primary-foreground shadow-sm"
                                                            : "bg-muted text-muted-foreground hover:bg-accent"
                                                    )}
                                                >
                                                    <tool.icon className="h-4 w-4" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{tool.label}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </div>
                            </div>
                            <SidebarSection
                                icon={<Star className="h-4 w-4" />}
                                title="PINNED CHATS"
                                collapsed={collapsed.pinned}
                                onToggle={() => setCollapsed((s) => ({ ...s, pinned: !s.pinned }))}
                            >
                                {pinned.length === 0 ? (
                                    <div className="select-none rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
                                        Pin important threads for quick access.
                                    </div>
                                ) : (
                                    pinned.map((c) => (
                                        <ConversationRow
                                            key={c.id}
                                            data={c}
                                            active={c.id === selectedId}
                                            onSelect={() => onSelect(c.id)}
                                            onTogglePin={() => togglePin(c.id)}
                                        />
                                    ))
                                )}
                            </SidebarSection>

                            <SidebarSection
                                icon={<Clock className="h-4 w-4" />}
                                title="RECENT"
                                collapsed={collapsed.recent}
                                onToggle={() => setCollapsed((s) => ({ ...s, recent: !s.recent }))}
                            >
                                {recent.length === 0 ? (
                                    <div className="select-none rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
                                        No conversations yet. Start a new one!
                                    </div>
                                ) : (
                                    recent.map((c) => (
                                        <ConversationRow
                                            key={c.id}
                                            data={c}
                                            active={c.id === selectedId}
                                            onSelect={() => onSelect(c.id)}
                                            onTogglePin={() => togglePin(c.id)}
                                            showMeta
                                        />
                                    ))
                                )}
                            </SidebarSection>

                            <SidebarSection
                                icon={<FolderIcon className="h-4 w-4" />}
                                title="FOLDERS"
                                collapsed={collapsed.folders}
                                onToggle={() => setCollapsed((s) => ({ ...s, folders: !s.folders }))}
                            >
                                <div className="-mx-1">
                                    <button
                                        onClick={() => setShowCreateFolderModal(true)}
                                        className="mb-2 inline-flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-muted-foreground hover:bg-accent"
                                    >
                                        <Plus className="h-4 w-4" /> Create folder
                                    </button>

                                    {folders.map((f) => (
                                        <FolderRow
                                            key={f.id}
                                            name={f.name}
                                            count={folderCounts[f.name] || 0}
                                            conversations={getConversationsByFolder(f.name)}
                                            selectedId={selectedId}
                                            onSelect={onSelect}
                                            togglePin={togglePin}
                                            onDeleteFolder={handleDeleteFolder}
                                            onRenameFolder={handleRenameFolder}
                                        />
                                    ))}
                                </div>
                            </SidebarSection>

                            <SidebarSection
                                icon={<FileText className="h-4 w-4" />}
                                title="TEMPLATES"
                                collapsed={collapsed.templates}
                                onToggle={() => setCollapsed((s) => ({ ...s, templates: !s.templates }))}
                            >
                                <div className="-mx-1">
                                    <button
                                        onClick={() => setShowCreateTemplateModal(true)}
                                        className="mb-2 inline-flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-foreground hover:bg-accent"
                                    >
                                        <Plus className="h-4 w-4" /> Create template
                                    </button>

                                    {(Array.isArray(templates) ? templates : []).map((template) => (
                                        <TemplateRow
                                            key={template.id}
                                            template={template}
                                            onUseTemplate={handleUseTemplate}
                                            onEditTemplate={handleEditTemplate}
                                            onRenameTemplate={handleRenameTemplate}
                                            onDeleteTemplate={handleDeleteTemplate}
                                        />
                                    ))}

                                    {(!templates || templates.length === 0) && (
                                        <div className="select-none rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
                                            No templates yet. Create your first prompt template.
                                        </div>
                                    )}
                                </div>
                            </SidebarSection>
                        </nav>

                        <div className="mt-auto border-t border-sidebar-border px-3 py-3">
                            <div className="flex items-center gap-2">
                                <SettingsPopover>
                                    <button className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                        <Settings className="h-4 w-4" /> Settings
                                    </button>
                                </SettingsPopover>
                                <div className="ml-auto">
                                    <ThemeToggle theme={theme} setTheme={setTheme} />
                                </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2 rounded-xl bg-muted p-2">
                                <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                    U
                                </div>
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-medium">Create User</div>
                                    <div className="truncate text-xs text-muted-foreground">Pro workspace</div>
                                </div>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            <CreateFolderModal
                isOpen={showCreateFolderModal}
                onClose={() => setShowCreateFolderModal(false)}
                onCreateFolder={handleCreateFolder}
            />

            <CreateTemplateModal
                isOpen={showCreateTemplateModal}
                onClose={() => {
                    setShowCreateTemplateModal(false)
                    setEditingTemplate(null)
                }}
                onCreateTemplate={handleCreateTemplate}
                editingTemplate={editingTemplate}
            />

            <SearchModal
                isOpen={showSearchModal}
                onClose={() => setShowSearchModal(false)}
                conversations={conversations}
                selectedId={selectedId}
                onSelect={onSelect}
                togglePin={togglePin}
                createNewChat={createNewChat}
            />

            {activeTool === 'budget' && <BudgetDrawer isOpen={true} onClose={() => setActiveTool(null)} budgetData={artifacts?.budget?.version?.content_json} />}
            {activeTool === 'components' && <ComponentDrawer isOpen={true} onClose={() => setActiveTool(null)} />}
            {activeTool === 'bom' && <BOMDrawer isOpen={true} onClose={() => setActiveTool(null)} bomData={artifacts?.bom?.version?.content_json || bomData} />}
            {activeTool === 'wiring' && (
                <WiringDrawer
                    isOpen={true}
                    onClose={() => setActiveTool(null)}
                    artifactId={artifacts?.wiring?.version?.id}
                    initialUrl={artifacts?.wiring?.version?.fritzing_url}
                    initialStatus={artifacts?.wiring?.version?.diagram_status}
                    wiringData={artifacts?.wiring?.version?.content_json}
                    diagramSvg={artifacts?.wiring?.version?.diagram_svg}
                />
            )}
            {activeTool === 'code' && <CodeDrawer isOpen={true} onClose={() => setActiveTool(null)} codeData={artifacts?.code?.version?.content_json || codeData} />}
            {activeTool === 'enclosure' && <EnclosureDrawer isOpen={true} onClose={() => setActiveTool(null)} enclosureData={artifacts?.enclosure?.version?.content_json} />}
            {activeTool === 'context' && <ContextDrawer isOpen={true} onClose={() => setActiveTool(null)} contextData={contextData || { context: artifacts?.context?.version?.content, mvp: artifacts?.mvp?.version?.content, prd: artifacts?.prd?.version?.content }} />}
            {activeTool === 'context' && <ContextDrawer isOpen={true} onClose={() => setActiveTool(null)} contextData={contextData || { context: artifacts?.context?.version?.content, mvp: artifacts?.mvp?.version?.content, prd: artifacts?.prd?.version?.content }} />}
        </>
    )
}
