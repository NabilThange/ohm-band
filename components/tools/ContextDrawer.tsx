'use client'

import { Splitter } from '@ark-ui/react/splitter'
import { XIcon, ChevronRightIcon, ChevronDownIcon } from '@/components/ui/animated-icons'
import { FileText, Folder } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ProjectContextData } from '@/lib/parsers'
import { LottieLoader } from '@/components/ui/lottie-loader'

interface ContextDrawerProps {
    isOpen: boolean
    onClose: () => void
    contextData: ProjectContextData | null
}

export default function ContextDrawer({ isOpen, onClose, contextData }: ContextDrawerProps) {
    const [expandedFolders, setExpandedFolders] = useState<string[]>(['root'])
    const [selectedFile, setSelectedFile] = useState<string | null>('context')

    // Tree structure - rebuilt when data changes
    const treeData = useMemo(() => ({
        id: 'root',
        name: 'Project Files',
        type: 'folder' as const,
        children: [
            {
                id: 'context',
                name: 'Project Context',
                type: 'file' as const,
                content: contextData?.context || ''
            },
            {
                id: 'mvp',
                name: 'MVP',
                type: 'file' as const,
                content: contextData?.mvp || ''
            },
            {
                id: 'prd',
                name: 'PRD',
                type: 'file' as const,
                content: contextData?.prd || ''
            }
        ]
    }), [contextData])

    const activeContent = useMemo(() => {
        if (!selectedFile) return ''
        const file = treeData.children.find(f => f.id === selectedFile)
        return file?.content || ''
    }, [selectedFile, treeData])

    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev =>
            prev.includes(folderId)
                ? prev.filter(id => id !== folderId)
                : [...prev, folderId]
        )
    }

    const TreeNode = ({ node, level = 0 }: { node: typeof treeData | typeof treeData.children[0], level?: number }) => {
        if (node.type === 'folder' && 'children' in node) {
            const isExpanded = expandedFolders.includes(node.id)
            return (
                <div>
                    <button
                        onClick={() => toggleFolder(node.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-lg transition-colors text-left"
                        style={{ paddingLeft: `${level * 1 + 0.75}rem` }}
                    >
                        {isExpanded ? (
                            <ChevronDownIcon key="expanded" size={16} triggerOn="auto" className="text-muted-foreground flex-shrink-0" />
                        ) : (
                            <ChevronRightIcon key="collapsed" size={16} triggerOn="auto" className="text-muted-foreground flex-shrink-0" />
                        )}
                        <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-medium">{node.name}</span>
                    </button>
                    {isExpanded && node.children && (
                        <div>
                            {node.children.map(child => (
                                <TreeNode key={child.id} node={child} level={level + 1} />
                            ))}
                        </div>
                    )}
                </div>
            )
        }

        // File node
        return (
            <button
                onClick={() => setSelectedFile(node.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-lg transition-colors text-left ${selectedFile === node.id ? 'bg-accent' : ''
                    }`}
                style={{ paddingLeft: `${level * 1 + 2.5}rem` }}
            >
                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">{node.name}</span>
            </button>
        )
    }

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }
        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Resizable Drawer using Splitter */}
            <div className="fixed inset-0 z-[70] pointer-events-none">
                <Splitter.Root
                    className="h-full w-full pointer-events-none"
                    panels={[
                        { id: 'main', minSize: 30 },
                        { id: 'drawer', minSize: 30, maxSize: 70 }
                    ]}
                    defaultSize={[40, 60]}
                >
                    {/* Main content area (invisible, just for spacing) */}
                    <Splitter.Panel id="main" className="pointer-events-none" />

                    {/* Resize Trigger - Left edge of drawer */}
                    <Splitter.ResizeTrigger
                        id="main:drawer"
                        aria-label="Resize drawer"
                        className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize relative pointer-events-auto"
                    >
                        <div className="absolute inset-y-0 -left-2 -right-2" />
                    </Splitter.ResizeTrigger>

                    {/* Drawer Panel */}
                    <Splitter.Panel
                        id="drawer"
                        className="h-full bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 pointer-events-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold leading-none">
                                    Project Context
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Manage your project documentation and specifications
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <XIcon size={16} />
                                <span className="sr-only">Close</span>
                            </button>
                        </div>

                        {/* Nested Splitter for Tree and Content */}
                        <Splitter.Root
                            className="flex-1 flex overflow-hidden"
                            panels={[
                                { id: 'tree', minSize: 15 },
                                { id: 'content', minSize: 40 }
                            ]}
                            defaultSize={[25, 75]}
                        >
                            {/* Tree View Panel */}
                            <Splitter.Panel id="tree" className="overflow-y-auto p-4 bg-muted/10">
                                <div className="text-xs font-semibold text-muted-foreground mb-2 px-3">
                                    FILES
                                </div>
                                <TreeNode node={treeData} />
                            </Splitter.Panel>

                            {/* Resize Trigger between Tree and Content */}
                            <Splitter.ResizeTrigger
                                id="tree:content"
                                aria-label="Resize panels"
                                className="w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize relative group"
                            >
                                <div className="absolute inset-y-0 -left-1 -right-1" />
                            </Splitter.ResizeTrigger>

                            {/* Content Panel */}
                            <Splitter.Panel id="content" className="overflow-y-auto p-6">
                                {selectedFile ? (
                                    <div className="space-y-4 h-full flex flex-col">
                                        <div className="flex items-center gap-2 pb-4 border-b border-border">
                                            <FileText className="w-5 h-5 text-primary" />
                                            <h3 className="text-lg font-semibold">
                                                {treeData.children.find(f => f.id === selectedFile)?.name}
                                            </h3>
                                        </div>
                                        <div className="flex-1 min-h-0 relative overflow-y-auto bg-background rounded-lg border border-border">
                                            <div className="p-6 prose prose-sm dark:prose-invert max-w-none prose-pre:bg-muted prose-pre:text-foreground">
                                                {activeContent && activeContent.trim() ? (
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {activeContent}
                                                    </ReactMarkdown>
                                                ) : (
                                                    <LottieLoader />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-center p-8">
                                        <div className="space-y-3">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent">
                                                <FileText className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold mb-1">No file selected</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Select a file from the tree to view contents
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Splitter.Panel>
                        </Splitter.Root>
                    </Splitter.Panel>
                </Splitter.Root>
            </div>
        </>
    )
}
