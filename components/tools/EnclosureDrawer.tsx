'use client'

import BaseDrawer from './BaseDrawer'
import FileTreeView from './FileTreeView'
import OpenSCADPreview from './viewers/OpenSCADPreview'
import SourceCodeView from './viewers/SourceCodeView'
import { Splitter } from '@ark-ui/react'
import { Box, Check, Loader2 } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { getScadContent } from '@/lib/scad-content-loader'

interface EnclosureFile {
    filename?: string  // Old format
    path?: string      // New format (from database)
    language: string
    content?: string   // Optional: loaded on-demand
    description?: string
    lazy?: boolean     // If true, content loaded via scad-content-loader
}

interface EnclosureData {
    files: EnclosureFile[]
    version?: number
    stale?: boolean
    staleReason?: string
}

interface EnclosureDrawerProps {
    isOpen: boolean
    onClose: () => void
    enclosureData: EnclosureData | null
}

export default function EnclosureDrawer({
    isOpen,
    onClose,
    enclosureData
}: EnclosureDrawerProps) {
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [isMobile, setIsMobile] = useState(false)
    const [mobileTab, setMobileTab] = useState<'files' | 'preview' | 'source'>('files')
    const [loadedContent, setLoadedContent] = useState<Map<string, string>>(new Map())
    const [loadingFile, setLoadingFile] = useState<string | null>(null)

    // Normalize files: convert 'path' to 'filename' for compatibility
    const files = useMemo(() => {
        return (enclosureData?.files || []).map(file => ({
            ...file,
            filename: file.filename || file.path || 'unknown',
            path: file.path || file.filename || 'unknown'
        }))
    }, [enclosureData])

    // Detect mobile viewport
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Auto-select first .scad file or fallback to first file
    useEffect(() => {
        if (files.length > 0 && !selectedFile) {
            const firstScad = files.find(f => f.filename.endsWith('.scad'))
            const defaultFile = firstScad || files[0]
            setSelectedFile(defaultFile.filename)
        }
    }, [files, selectedFile])

    const activeFile = useMemo(() => {
        const file = files.find(f => f.filename === selectedFile)
        if (!file) return null

        // If file is lazy and not loaded yet, return placeholder
        if (file.lazy && !loadedContent.has(file.filename)) {
            return {
                ...file,
                content: '' // Empty content until loaded
            }
        }

        // If lazy and loaded, use loaded content
        if (file.lazy && loadedContent.has(file.filename)) {
            return {
                ...file,
                content: loadedContent.get(file.filename)!
            }
        }

        // Otherwise use direct content
        return file
    }, [files, selectedFile, loadedContent])

    // Load file content on-demand
    useEffect(() => {
        if (!activeFile || !activeFile.lazy) return
        if (loadedContent.has(activeFile.filename)) return // Already loaded
        
        const filePath = activeFile.path || activeFile.filename
        setLoadingFile(filePath)

        // Simulate async loading (in real app, this would be an API call)
        const content = getScadContent(filePath)
        
        if (content) {
            setLoadedContent(prev => {
                const next = new Map(prev)
                next.set(activeFile.filename, content)
                return next
            })
        }
        
        setLoadingFile(null)
    }, [activeFile, loadedContent])

    const isScadFile = activeFile?.filename.endsWith('.scad') || false
    const hasReadme = useMemo(() => {
        return files.some(f => f.filename.toLowerCase().includes('readme'))
    }, [files])

    const handleSelectFile = (path: string) => {
        setSelectedFile(path)
        if (isMobile) {
            if (path.endsWith('.scad')) {
                setMobileTab('preview')
            } else {
                setMobileTab('source')
            }
        }
    }

    if (files.length === 0) {
        return (
            <BaseDrawer
                isOpen={isOpen}
                onClose={onClose}
                title="3D Enclosure Files"
                description="OpenSCAD files for your 3D-printable enclosure"
                icon={<Box className="w-4 h-4 text-blue-400" />}
                warning={enclosureData?.stale ? {
                    message: enclosureData.staleReason || 'BOM or wiring has changed. Regenerate enclosure.',
                    severity: 'warning'
                } : undefined}
            >
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground bg-[#1e1e1e] p-6">
                    <Box className="w-12 h-12 opacity-20" />
                    <span className="text-sm italic">
                        Enclosure files will appear here when generated...
                    </span>
                </div>
            </BaseDrawer>
        )
    }

    return (
        <BaseDrawer
            isOpen={isOpen}
            onClose={onClose}
            title="3D Enclosure Files"
            description="OpenSCAD files for your 3D-printable enclosure"
            icon={<Box className="w-4 h-4 text-blue-400" />}
            warning={enclosureData?.stale ? {
                message: enclosureData.staleReason || 'BOM or wiring has changed. Regenerate enclosure to fit new components.',
                severity: 'warning'
            } : undefined}
            defaultSize={75}
        >
            {isMobile ? (
                /* Mobile Layout: Stacked Tabs */
                <div className="flex flex-col h-full bg-[#1e1e1e] overflow-hidden">
                    {/* Simple Custom Tab Bar */}
                    <div className="flex border-b border-white/5 bg-[#121214] shrink-0">
                        <button
                            onClick={() => setMobileTab('files')}
                            className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition-colors ${
                                mobileTab === 'files'
                                    ? 'border-blue-500 text-white'
                                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            Files
                        </button>
                        {isScadFile && (
                            <button
                                onClick={() => setMobileTab('preview')}
                                className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition-colors ${
                                    mobileTab === 'preview'
                                        ? 'border-blue-500 text-white'
                                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                                }`}
                            >
                                3D View
                            </button>
                        )}
                        <button
                            onClick={() => setMobileTab('source')}
                            className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition-colors ${
                                mobileTab === 'source'
                                    ? 'border-blue-500 text-white'
                                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            Source
                        </button>
                    </div>

                    {/* Mobile Panels */}
                    <div className="flex-1 overflow-hidden">
                        {mobileTab === 'files' && (
                            <div className="h-full flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto">
                                    <FileTreeView
                                        files={files}
                                        selectedFile={selectedFile}
                                        onSelectFile={handleSelectFile}
                                        searchQuery={searchQuery}
                                        onSearchChange={setSearchQuery}
                                    />
                                </div>
                                {hasReadme && (
                                    <div className="p-3 bg-blue-500/5 border-t border-white/5 shrink-0">
                                        <div className="flex items-start gap-2">
                                            <Box className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                            <div className="space-y-0.5">
                                                <h4 className="text-xs font-semibold text-blue-400 leading-none">Print Instructions</h4>
                                                <p className="text-[10px] text-blue-300/70 leading-relaxed">
                                                    Check README.md for print settings and assembly.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {mobileTab === 'preview' && isScadFile && activeFile && (
                            <div className="h-full">
                                {loadingFile ? (
                                    <div className="flex items-center justify-center h-full bg-slate-900">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                                            <span className="text-xs text-slate-400">Loading file...</span>
                                        </div>
                                    </div>
                                ) : activeFile.content ? (
                                    <OpenSCADPreview 
                                        scadContent={activeFile.content} 
                                        filename={activeFile.filename}
                                        lazy={true}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-slate-900 text-zinc-500 text-sm">
                                        No content available
                                    </div>
                                )}
                            </div>
                        )}
                        {mobileTab === 'source' && activeFile && (
                            <div className="h-full">
                                {loadingFile ? (
                                    <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                                            <span className="text-xs text-slate-400">Loading file...</span>
                                        </div>
                                    </div>
                                ) : activeFile.content ? (
                                    <SourceCodeView
                                        content={activeFile.content}
                                        filename={activeFile.filename}
                                        language={activeFile.language}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-zinc-500 text-sm">
                                        No content available
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Desktop Layout: Splitter Tree + Right Panel Content Split */
                <Splitter.Root
                    className="flex h-full overflow-hidden bg-[#1e1e1e]"
                    defaultSize={[25, 75]}
                    panels={[{ id: 'tree', minSize: 15 }, { id: 'content', minSize: 30 }]}
                >
                    {/* Left File Tree Sidebar */}
                    <Splitter.Panel id="tree" className="flex flex-col h-full bg-[#121214] border-r border-white/5 shrink-0">
                        <div className="flex-1 overflow-y-auto">
                            <FileTreeView
                                files={files}
                                selectedFile={selectedFile}
                                onSelectFile={handleSelectFile}
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                            />
                        </div>
                        {hasReadme && (
                            <div className="p-3 bg-blue-500/5 border-t border-white/5 shrink-0">
                                <div className="flex items-start gap-2">
                                    <Box className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                    <div className="space-y-0.5">
                                        <h4 className="text-xs font-semibold text-blue-400 leading-none">Print Instructions</h4>
                                        <p className="text-[10px] text-blue-300/70 leading-relaxed">
                                            Check README.md for print settings and assembly.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Splitter.Panel>

                    <Splitter.ResizeTrigger id="tree:content" className="w-[1px] bg-[#1e1e1e] hover:bg-blue-500 transition-colors relative z-10 flex items-center justify-center group outline-none focus-visible:bg-blue-500">
                        <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/20" />
                    </Splitter.ResizeTrigger>

                    {/* Right Content Panel */}
                    <Splitter.Panel id="content" className="flex-1 flex flex-col h-full overflow-hidden bg-[#1e1e1e]">
                        {activeFile ? (
                            isScadFile ? (
                                /* Splitter: 3D Preview on Top, Code on Bottom */
                                <Splitter.Root
                                    className="flex-1 flex flex-col h-full overflow-hidden"
                                    orientation="vertical"
                                    defaultSize={[60, 40]}
                                    panels={[{ id: 'preview', minSize: 20 }, { id: 'code', minSize: 20 }]}
                                >
                                    <Splitter.Panel id="preview" className="relative flex-1 overflow-hidden min-h-[150px]">
                                        {loadingFile ? (
                                            <div className="flex items-center justify-center h-full bg-slate-900">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                                                    <span className="text-xs text-slate-400">Loading file...</span>
                                                </div>
                                            </div>
                                        ) : activeFile.content ? (
                                            <OpenSCADPreview 
                                                scadContent={activeFile.content} 
                                                filename={activeFile.filename}
                                                lazy={true}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full bg-slate-900 text-zinc-500 text-sm">
                                                No content available
                                            </div>
                                        )}
                                    </Splitter.Panel>

                                    <Splitter.ResizeTrigger id="preview:code" className="h-[2px] bg-[#121214] hover:bg-blue-500 transition-colors relative z-10 flex items-center justify-center group outline-none focus-visible:bg-blue-500 cursor-row-resize">
                                        <div className="absolute inset-x-0 -top-1.5 -bottom-1.5 group-hover:bg-blue-500/20" />
                                    </Splitter.ResizeTrigger>

                                    <Splitter.Panel id="code" className="relative flex-1 overflow-hidden min-h-[150px]">
                                        {loadingFile ? (
                                            <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                                                    <span className="text-xs text-slate-400">Loading file...</span>
                                                </div>
                                            </div>
                                        ) : activeFile.content ? (
                                            <SourceCodeView
                                                content={activeFile.content}
                                                filename={activeFile.filename}
                                                language={activeFile.language}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-zinc-500 text-sm">
                                                No content available
                                            </div>
                                        )}
                                    </Splitter.Panel>
                                </Splitter.Root>
                            ) : (
                                /* Standard Full Panel Code View */
                                loadingFile ? (
                                    <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                                            <span className="text-xs text-slate-400">Loading file...</span>
                                        </div>
                                    </div>
                                ) : activeFile.content ? (
                                    <SourceCodeView
                                        content={activeFile.content}
                                        filename={activeFile.filename}
                                        language={activeFile.language}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-zinc-500 text-sm">
                                        No content available
                                    </div>
                                )
                            )
                        ) : (
                            <div className="flex items-center justify-center h-full text-zinc-500 italic text-sm">
                                Select a file from the explorer to view.
                            </div>
                        )}
                    </Splitter.Panel>
                </Splitter.Root>
            )}
        </BaseDrawer>
    )
}
