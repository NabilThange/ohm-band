'use client'

import { Clipboard } from '@ark-ui/react'
import { Check, Copy, Download } from 'lucide-react'

interface SourceCodeViewProps {
    content: string
    filename: string
    language?: string
}

export default function SourceCodeView({ content, filename, language = 'text' }: SourceCodeViewProps) {
    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="bg-[#1e1e1e] flex flex-col h-full relative min-w-[300px]">
            {/* Header / Actions */}
            <div className="flex items-center justify-between bg-[#1e1e1e] border-b border-white/5 h-9 px-4 select-none shrink-0">
                <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                    <span>{filename}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Clipboard.Root value={content} timeout={1500}>
                        <Clipboard.Control>
                            <Clipboard.Trigger asChild>
                                <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 text-xs text-zinc-400 hover:text-white transition-colors">
                                    <Clipboard.Indicator copied={<Check className="w-3.5 h-3.5 text-green-500" />}>
                                        <Copy className="w-3.5 h-3.5" />
                                    </Clipboard.Indicator>
                                    <span>Copy</span>
                                </button>
                            </Clipboard.Trigger>
                        </Clipboard.Control>
                    </Clipboard.Root>

                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 text-xs text-zinc-400 hover:text-white transition-colors"
                        title="Download file"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                    </button>
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-auto p-0 scrollbar-thin scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-600">
                <div className="flex min-h-full">
                    {/* Line Numbers */}
                    <div className="flex-none w-12 bg-[#1e1e1e] text-zinc-600 text-right pr-3 pt-4 select-none text-xs font-mono border-r border-white/5">
                        {content.split('\n').map((_, i) => (
                            <div key={i} className="leading-6">{i + 1}</div>
                        ))}
                    </div>
                    {/* Code Text */}
                    <div className="flex-1 pt-4 pl-4 overflow-x-auto">
                        <pre className="font-mono text-xs md:text-sm leading-6 text-zinc-300 tab-4">
                            <code>{content}</code>
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    )
}
