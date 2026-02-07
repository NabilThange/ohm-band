'use client'

import { useState, useEffect } from 'react'
import ToolDrawer from './ToolDrawer'
import { XIcon } from '@/components/ui/animated-icons'
import { ZoomIn, ZoomOut, Download, RefreshCw, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LottieLoader } from '@/components/ui/lottie-loader'
import { DiagramDisplay } from '@/components/diagrams/DiagramDisplay'

interface WiringDrawerProps {
    isOpen: boolean
    onClose: () => void
    artifactId?: string
    initialUrl?: string
    initialStatus?: string
    wiringData?: {
        connections: Array<{
            from_component: string
            from_pin: string
            to_component: string
            to_pin: string
            wire_color?: string
            notes?: string
        }>
        instructions: string
        warnings?: string[]
        ai_images?: {
            status: 'generating' | 'completed' | 'failed'
            progress: number
            current_step?: string
            error?: string
            breadboard?: {
                url: string
                storage_path: string
                prompt: string
                model: string
                generated_at: string
            }
        }
    } | null
    diagramSvg?: string | null
}

type ViewMode = 'table' | 'svg' | 'breadboard'

export default function WiringDrawer({ isOpen, onClose, artifactId, initialUrl, initialStatus, wiringData, diagramSvg }: WiringDrawerProps) {
    const [view, setView] = useState<ViewMode>('table')
    const [zoom, setZoom] = useState(100)

    // Extract AI image status
    const imageStatus = wiringData?.ai_images?.status
    const isGenerating = imageStatus === 'generating'
    const hasFailed = imageStatus === 'failed'
    const imageUrl = wiringData?.ai_images?.breadboard?.url
    const errorMessage = wiringData?.ai_images?.error
    const progress = wiringData?.ai_images?.progress || 0
    const currentStep = wiringData?.ai_images?.current_step

    // Auto-switch to breadboard when image becomes available
    useEffect(() => {
        if (imageUrl && view === 'table') {
            setView('breadboard')
        }
    }, [imageUrl])

    const handleDownload = (data: string, filename: string, type: 'svg' | 'png') => {
        const link = document.createElement('a')
        if (type === 'svg') {
            const blob = new Blob([data], { type: 'image/svg+xml' })
            link.href = URL.createObjectURL(blob)
        } else {
            link.href = data
        }
        link.download = filename
        link.click()
    }

    if (!wiringData) {
        return (
            <ToolDrawer
                isOpen={isOpen}
                onClose={onClose}
                title="Wiring Diagram"
                description="Interactive connection guide"
            >
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center space-y-2">
                        <p className="text-sm">No wiring diagram generated yet</p>
                        <p className="text-xs">Ask the agent to create wiring instructions</p>
                    </div>
                </div>
            </ToolDrawer>
        )
    }

    return (
        <ToolDrawer
            isOpen={isOpen}
            onClose={onClose}
            title="Wiring Diagram"
            description="Multiple views: Table, SVG Schematic, AI Breadboard"
        >
            <div className="flex flex-col h-full">
                {/* Tab Navigation */}
                <div className="flex gap-2 p-4 border-b bg-background">
                    <Button
                        variant={view === 'table' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setView('table')}
                    >
                        📋 Table
                    </Button>
                    <Button
                        variant={view === 'svg' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setView('svg')}
                        disabled={!diagramSvg}
                    >
                        📐 Schematic
                    </Button>
                    <Button
                        variant={view === 'breadboard' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setView('breadboard')}
                        className="relative"
                    >
                        📸 Breadboard
                        {isGenerating && (
                            <Loader2 className="ml-2 h-3 w-3 animate-spin" />
                        )}
                    </Button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto">
                    {/* TABLE VIEW */}
                    {view === 'table' && (
                        <div className="p-4 space-y-6">
                            {/* Connection Table */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium">🔌 Connections ({wiringData.connections?.length || 0})</h4>
                                <div className="rounded-lg border border-border overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-muted/50 text-muted-foreground font-medium">
                                            <tr>
                                                <th className="px-3 py-2 text-left">From</th>
                                                <th className="px-3 py-2 text-left">To</th>
                                                <th className="px-3 py-2 text-center">Wire</th>
                                                <th className="px-3 py-2 text-left">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border bg-card">
                                            {wiringData.connections?.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                                                        No connections defined
                                                    </td>
                                                </tr>
                                            )}
                                            {wiringData.connections?.map((conn, idx) => (
                                                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-3 py-2">
                                                        <div className="font-medium">{conn.from_component}</div>
                                                        <div className="text-[10px] text-muted-foreground font-mono">{conn.from_pin}</div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="font-medium">{conn.to_component}</div>
                                                        <div className="text-[10px] text-muted-foreground font-mono">{conn.to_pin}</div>
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        {conn.wire_color && (
                                                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium" style={{
                                                                backgroundColor: conn.wire_color.toLowerCase() === 'red' ? '#ef444420' : conn.wire_color.toLowerCase() === 'black' ? '#00000020' : '#3b82f620',
                                                                color: conn.wire_color.toLowerCase() === 'red' ? '#ef4444' : conn.wire_color.toLowerCase() === 'black' ? '#000000' : '#3b82f6'
                                                            }}>
                                                                {conn.wire_color}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-[10px] text-muted-foreground">{conn.notes || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Instructions */}
                            {wiringData.instructions && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">🔧 Instructions</h4>
                                    <div className="p-4 bg-muted/30 border border-border rounded-lg text-sm whitespace-pre-wrap">
                                        {wiringData.instructions}
                                    </div>
                                </div>
                            )}

                            {/* Fritzing-style Breadboard Diagram */}
                            {artifactId && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-medium mb-3">📸 Breadboard Diagram</h4>
                                    <DiagramDisplay
                                        artifactId={artifactId}
                                        initialUrl={initialUrl || wiringData?.ai_images?.breadboard?.url}
                                        initialStatus={initialStatus || (wiringData?.ai_images?.status === 'completed' ? 'complete' : wiringData?.ai_images?.status === 'generating' ? 'generating' : 'pending')}
                                    />
                                </div>
                            )}

                            {/* Warnings */}
                            {wiringData.warnings && wiringData.warnings.length > 0 && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-semibold text-red-500">⚠️ Safety Warnings</h4>
                                            <ul className="text-xs text-red-500/80 list-disc list-inside space-y-1">
                                                {wiringData.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SVG VIEW */}
                    {view === 'svg' && (
                        <div className="p-4">
                            {diagramSvg ? (
                                <>
                                    <div className="flex justify-between mb-4">
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => setZoom(z => Math.min(z + 25, 200))}>
                                                <ZoomIn className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" onClick={() => setZoom(z => Math.max(z - 25, 50))}>
                                                <ZoomOut className="h-4 w-4" />
                                            </Button>
                                            <span className="text-sm text-muted-foreground self-center">{zoom}%</span>
                                        </div>
                                        <Button size="sm" onClick={() => handleDownload(diagramSvg, 'schematic.svg', 'svg')}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download SVG
                                        </Button>
                                    </div>
                                    <div
                                        className="border rounded-lg overflow-auto bg-white p-4"
                                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
                                        dangerouslySetInnerHTML={{ __html: diagramSvg }}
                                    />
                                </>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>SVG schematic is being generated...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* BREADBOARD VIEW */}
                    {view === 'breadboard' && (
                        <div className="p-4">
                            {artifactId ? (
                                <DiagramDisplay
                                    artifactId={artifactId}
                                    initialUrl={initialUrl || wiringData?.ai_images?.breadboard?.url}
                                    initialStatus={initialStatus || (wiringData?.ai_images?.status === 'completed' ? 'complete' : wiringData?.ai_images?.status === 'generating' ? 'generating' : 'pending')}
                                />
                            ) : (
                                <>
                                    {isGenerating && (
                                        <div className="flex flex-col items-center justify-center py-12 gap-4 h-full">
                                            <div className="flex-1 w-full flex items-center justify-center">
                                                <LottieLoader />
                                            </div>
                                            <div className="w-full max-w-md">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 text-center">{progress}%</p>
                                            </div>
                                        </div>
                                    )}

                                    {hasFailed && (
                                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                                            <AlertTriangle className="h-12 w-12 text-red-500" />
                                            <div className="text-center">
                                                <p className="font-medium text-red-500">Image generation failed</p>
                                                <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
                                                <p className="text-xs text-muted-foreground mt-2">Check that BYTEZ_API_KEY is configured</p>
                                            </div>
                                        </div>
                                    )}

                                    {imageUrl && !isGenerating && !hasFailed && (
                                        <>
                                            <div className="flex justify-between mb-4">
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={() => setZoom(z => Math.min(z + 25, 200))}>
                                                        <ZoomIn className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" onClick={() => setZoom(z => Math.max(z - 25, 50))}>
                                                        <ZoomOut className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <Button size="sm" onClick={() => handleDownload(imageUrl, 'breadboard.png', 'png')}>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download
                                                </Button>
                                            </div>
                                            <div className="border rounded-lg overflow-hidden bg-white">
                                                <img
                                                    src={imageUrl}
                                                    alt="Breadboard wiring diagram"
                                                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
                                                    className="w-full"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {!imageUrl && !isGenerating && !hasFailed && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>AI breadboard image will appear here automatically</p>
                                            <p className="text-xs mt-2">Typically takes 10-15 seconds</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ToolDrawer>
    )
}
