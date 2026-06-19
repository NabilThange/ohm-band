'use client'

import { Search, ChevronDown, ChevronRight, Folder, FolderOpen, FileCode, FileText } from 'lucide-react'
import { useState, useMemo } from 'react'

interface RawFile {
    path?: string
    filename?: string
    content?: string
    language?: string
}

interface FileTreeViewProps {
    files: RawFile[]
    selectedFile: string | null
    onSelectFile: (path: string) => void
    searchQuery: string
    onSearchChange: (query: string) => void
}

const buildFileTree = (files: { path: string }[]) => {
    const root: any = { id: 'root', name: 'Project', type: 'folder', children: [] }

    files.forEach(file => {
        if (!file.path) return
        const parts = file.path.split('/')
        let currentLevel = root.children

        parts.forEach((part, index) => {
            const isFile = index === parts.length - 1
            const existingNode = currentLevel.find((node: any) => node.name === part)

            if (existingNode) {
                if (!isFile) {
                    currentLevel = existingNode.children
                }
            } else {
                const newNode: any = {
                    id: file.path, // Use full path as ID for files
                    name: part,
                    type: isFile ? 'file' : 'folder',
                    children: isFile ? undefined : []
                }
                currentLevel.push(newNode)
                if (!isFile) {
                    currentLevel = newNode.children
                }
            }
        })
    })

    return root
}

export default function FileTreeView({
    files,
    selectedFile,
    onSelectFile,
    searchQuery,
    onSearchChange
}: FileTreeViewProps) {
    const [expandedFolders, setExpandedFolders] = useState<string[]>(['root', 'src'])

    // Normalize both formats: CodeDrawer's `path` and EnclosureDrawer's `filename`
    const normalizedFiles = useMemo(() => {
        return files.map(file => ({
            path: file.path || file.filename || '',
            content: file.content || ''
        }))
    }, [files])

    const fileTree = useMemo(() => {
        if (normalizedFiles.length === 0) return { id: 'root', name: 'Project', type: 'folder', children: [] }
        return buildFileTree(normalizedFiles)
    }, [normalizedFiles])

    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev =>
            prev.includes(folderId)
                ? prev.filter(id => id !== folderId)
                : [...prev, folderId]
        )
    }

    const getFileIcon = (name: string) => {
        if (name.toLowerCase().endsWith('.md')) {
            return FileText
        }
        return FileCode
    }

    const TreeNode = ({ node, level = 0 }: { node: any; level?: number }) => {
        const isFolder = node.type === 'folder'

        // Simple search filter: hide files that don't match, and folders that are empty after filtering
        if (searchQuery && !isFolder && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return null
        }

        if (isFolder) {
            const toggleId = node.id === 'root' ? 'root' : node.name
            const isExpanded = expandedFolders.includes(toggleId)

            // Render children first to see if any match the search query
            const childrenNodes = node.children
                ? node.children.map((child: any, idx: number) => (
                      <TreeNode key={idx} node={child} level={level + 1} />
                  )).filter(Boolean)
                : []

            // If we have a query and none of the children matched, hide the folder
            if (searchQuery && childrenNodes.length === 0) {
                return null
            }

            return (
                <div>
                    <button
                        onClick={() => toggleFolder(toggleId)}
                        className="w-full flex items-center gap-1.5 px-2 py-1 hover:bg-muted/50 rounded-sm transition-colors text-left select-none"
                        style={{ paddingLeft: `${level * 12 + 8}px` }}
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        {isExpanded ? (
                            <FolderOpen className="w-4 h-4 text-blue-400/80 flex-shrink-0" />
                        ) : (
                            <Folder className="w-4 h-4 text-blue-400/80 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-foreground/80 truncate">{node.name}</span>
                    </button>
                    {(isExpanded || node.id === 'root') && childrenNodes.length > 0 && (
                        <div>{childrenNodes}</div>
                    )}
                </div>
            )
        }

        // File node
        const Icon = getFileIcon(node.name)
        return (
            <button
                onClick={() => onSelectFile(node.id)}
                className={`w-full flex items-center gap-2 px-2 py-1 rounded-sm transition-colors text-left group
                            ${selectedFile === node.id ? 'bg-[#37373d] text-white' : 'hover:bg-[#2a2d2e] text-muted-foreground hover:text-foreground'}`}
                style={{ paddingLeft: `${level * 12 + 20}px` }}
            >
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${selectedFile === node.id ? 'text-blue-400' : ''}`} />
                <span className="text-sm truncate">{node.name}</span>
            </button>
        )
    }

    return (
        <div className="bg-muted flex flex-col h-full min-w-[200px] select-none">
            {/* Search Bar */}
            <div className="p-3 border-b border-white/5 shrink-0">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-muted text-foreground text-xs rounded-md pl-8 pr-3 py-1.5 border border-transparent focus:border-primary/50 focus:outline-none placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            {/* Tree Container */}
            <div className="flex-1 overflow-y-auto py-2">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-4 mb-2">Explorer</div>
                {normalizedFiles.length > 0 ? (
                    <TreeNode node={fileTree} />
                ) : (
                    <div className="px-4 py-8 flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                        <span className="text-zinc-500 text-xs italic">
                            Files will appear here...
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
