'use client'

import ToolDrawer from './ToolDrawer'
import { Clipboard } from '@ark-ui/react'
import { CheckIcon, CopyIcon } from '@/components/ui/animated-icons'
import { Download, AlertTriangle, Box } from 'lucide-react'
import { useState } from 'react'

interface EnclosureFile {
    filename: string
    language: string
    content: string
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

export default function EnclosureDrawer({ isOpen, onClose, enclosureData }: EnclosureDrawerProps) {
    const [activeTab, setActiveTab] = useState(0)
    const files = enclosureData?.files || []
    const activeFile = files[activeTab]

    return (
        <ToolDrawer
            isOpen={isOpen}
            onClose={onClose}
            title="3D Enclosure Files"
            description="OpenSCAD files for your 3D-printable enclosure"
        >
            <div className="space-y-4 h-full flex flex-col">
                {/* Stale Warning */}
                {enclosureData?.stale && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-xs font-semibold text-yellow-500">Enclosure Outdated</h4>
                                <p className="text-xs text-yellow-500/80">
                                    {enclosureData.staleReason || 'BOM or wiring has changed. Regenerate enclosure to fit new components.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* File Tabs */}
                {files.length > 0 && (
                    <div className="flex gap-2 border-b border-border overflow-x-auto">
                        {files.map((file, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveTab(idx)}
                                className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                                    activeTab === idx
                                        ? 'border-b-2 border-primary text-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {file.filename}
                            </button>
                        ))}
                    </div>
                )}

                {/* Actions */}
                {activeFile && (
                    <div className="flex gap-2">
                        <Clipboard.Root value={activeFile.content} timeout={1500} className="flex-1">
                            <Clipboard.Control>
                                <Clipboard.Trigger asChild>
                                    <button className="flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors w-full">
                                        <Clipboard.Indicator copied={<CheckIcon key="copied" size={16} triggerOn="auto" />}>
                                            <CopyIcon size={16} />
                                        </Clipboard.Indicator>
                                        <span>Copy {activeFile.filename}</span>
                                    </button>
                                </Clipboard.Trigger>
                            </Clipboard.Control>
                        </Clipboard.Root>

                        <button className="flex items-center justify-center gap-2 bg-accent text-accent-foreground py-2 px-4 rounded-lg text-sm font-medium hover:bg-accent/80 transition-colors">
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* File Content */}
                <div className="flex-1 overflow-auto">
                    {files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                            <Box className="w-12 h-12 opacity-20" />
                            <span className="text-sm italic">
                                Enclosure files will appear here when generated...
                            </span>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
                            <pre className="p-4 text-xs overflow-x-auto">
                                <code className="text-foreground/90 font-mono">
                                    {activeFile?.content || ''}
                                </code>
                            </pre>
                        </div>
                    )}
                </div>

                {/* Print Instructions */}
                {files.some(f => f.filename.toLowerCase().includes('readme')) && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Box className="w-5 h-5 text-blue-500 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-blue-500">Print Instructions</h4>
                                <p className="text-xs text-blue-500/80">
                                    Check README.md tab for detailed print settings and assembly instructions.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ToolDrawer>
    )
}
