'use client'

import BaseDrawer from './BaseDrawer'
import FileTreeView from './FileTreeView'
import { Splitter, Clipboard } from '@ark-ui/react'
import { Hash, FileCode, Check, Copy } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import type { CodeData } from '@/lib/parsers'

interface CodeDrawerProps {
    isOpen: boolean
    onClose: () => void
    codeData: CodeData | null
}

export default function CodeDrawer({ isOpen, onClose, codeData }: CodeDrawerProps) {
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    const files = codeData?.files || []

    // Select first file by default if none selected
    useEffect(() => {
        if (codeData && codeData.files.length > 0 && !selectedFile) {
            setSelectedFile(codeData.files[0].path)
        }
    }, [codeData, selectedFile])

    const activeFileContent = useMemo(() => {
        if (!codeData || !selectedFile) return '// Select a file to view code'
        const file = codeData.files.find(f => f.path === selectedFile)
        return file ? file.content : '// File not found'
    }, [codeData, selectedFile])

    const activeFileLanguage = useMemo(() => {
        if (!selectedFile) return 'text'
        if (selectedFile.endsWith('.cpp') || selectedFile.endsWith('.h') || selectedFile.endsWith('.ino')) return 'cpp'
        if (selectedFile.endsWith('.json')) return 'json'
        if (selectedFile.endsWith('.md')) return 'markdown'
        return 'text'
    }, [selectedFile])

    return (
        <BaseDrawer
            isOpen={isOpen}
            onClose={onClose}
            title="Code Generation"
            description="Generated firmware and configuration files."
            icon={<Hash className="w-4 h-4 text-blue-400" />}
            defaultSize={70}
        >
            <Splitter.Root
                className="flex h-full overflow-hidden"
                defaultSize={[25, 75]}
                panels={[{ id: 'tree', minSize: 15 }, { id: 'code', minSize: 30 }]}
            >
                <Splitter.Panel id="tree">
                    <FileTreeView
                        files={files}
                        selectedFile={selectedFile}
                        onSelectFile={setSelectedFile}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />
                </Splitter.Panel>

                <Splitter.ResizeTrigger id="tree:code" className="w-[1px] bg-[#1e1e1e] hover:bg-blue-500 transition-colors relative z-10 flex items-center justify-center group outline-none focus-visible:bg-blue-500">
                    <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/20" />
                </Splitter.ResizeTrigger>

                <Splitter.Panel id="code" className="bg-[#1e1e1e] flex flex-col relative min-w-[300px]">
                    {/* Tab Bar */}
                    <div className="flex items-center justify-between bg-[#1e1e1e] border-b border-white/5 h-9 px-4 select-none shrink-0">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <FileCode className="w-4 h-4 text-blue-400" />
                            <span className="text-zinc-100">{selectedFile || 'No file selected'}</span>
                        </div>

                        {selectedFile && (
                            <Clipboard.Root value={activeFileContent} timeout={1500}>
                                <Clipboard.Control>
                                    <Clipboard.Trigger asChild>
                                        <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 text-xs text-zinc-400 hover:text-white transition-colors">
                                            <Clipboard.Indicator copied={<Check className="w-3.5 h-3.5 text-green-500" />}>
                                                <Copy className="w-3.5 h-3.5" />
                                            </Clipboard.Indicator>
                                            <span>Copy Code</span>
                                        </button>
                                    </Clipboard.Trigger>
                                </Clipboard.Control>
                            </Clipboard.Root>
                        )}
                    </div>

                    {/* Editor Content */}
                    <div className="flex-1 overflow-auto p-0 scrollbar-thin scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-600">
                        <div className="flex min-h-full">
                            {/* Line Numbers */}
                            <div className="flex-none w-12 bg-[#1e1e1e] text-zinc-600 text-right pr-3 pt-4 select-none text-xs font-mono border-r border-white/5">
                                {activeFileContent.split('\n').map((_, i) => (
                                    <div key={i} className="leading-6">{i + 1}</div>
                                ))}
                            </div>
                            {/* Code Text */}
                            <div className="flex-1 pt-4 pl-4">
                                <pre className="font-mono text-sm leading-6 text-zinc-300 tab-4">
                                    <code>{activeFileContent}</code>
                                </pre>
                            </div>
                        </div>
                    </div>

                    {/* Status Bar */}
                    <div className="h-6 bg-[#0071e3] text-white flex items-center px-3 text-[10px] gap-4 select-none shrink-0">
                        <div className="flex items-center gap-2">
                            <Check className="w-3 h-3" />
                            <span>Ready</span>
                        </div>
                        <div className="flex-1" />
                        <div>UTF-8</div>
                        <div>{activeFileLanguage.toUpperCase()}</div>
                    </div>
                </Splitter.Panel>
            </Splitter.Root>
        </BaseDrawer>
    )
}
