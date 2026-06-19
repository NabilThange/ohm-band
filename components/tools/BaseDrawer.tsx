'use client'

import { Dialog as Drawer, Splitter } from '@ark-ui/react'
import { X, AlertTriangle } from 'lucide-react'
import { ReactNode } from 'react'

interface BaseDrawerProps {
    isOpen: boolean
    onClose: () => void
    title: string
    description?: string
    icon?: ReactNode
    warning?: {
        message: string
        severity?: 'warning' | 'error' | 'info'
    }
    defaultSize?: number // percentage of screen width, e.g. 60
    minSize?: number
    maxSize?: number
    children: ReactNode
}

export default function BaseDrawer({
    isOpen,
    onClose,
    title,
    description,
    icon,
    warning,
    defaultSize = 60,
    minSize = 30,
    maxSize = 90,
    children
}: BaseDrawerProps) {
    return (
        <Drawer.Root open={isOpen} onOpenChange={(details) => !details.open && onClose()}>
            <Drawer.Backdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <Drawer.Positioner className="fixed inset-0 z-[70] flex justify-end pointer-events-none">
                <Drawer.Content asChild>
                    <div className="h-full w-full pointer-events-auto">
                        <Splitter.Root
                            className="h-full w-full pointer-events-none"
                            panels={[
                                { id: 'main', minSize: 100 - maxSize },
                                { id: 'drawer', minSize, maxSize }
                            ]}
                            defaultSize={[100 - defaultSize, defaultSize]}
                        >
                            {/* Main content area (invisible spacer) */}
                            <Splitter.Panel id="main" className="pointer-events-none" />

                            {/* Resize Trigger */}
                            <Splitter.ResizeTrigger
                                id="main:drawer"
                                className="w-[3px] bg-[#1e1e1e] hover:bg-blue-500 transition-colors cursor-col-resize relative pointer-events-auto z-50 flex items-center justify-center group outline-none focus-visible:bg-blue-500"
                            >
                                <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/20" />
                            </Splitter.ResizeTrigger>

                            {/* Drawer Content Panel */}
                            <Splitter.Panel
                                id="drawer"
                                className="h-full bg-[#1e1e1e] border-l border-border shadow-2xl flex flex-col pointer-events-auto"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted shrink-0">
                                    <div className="flex items-center gap-3">
                                        {icon && (
                                            <div className="p-1.5 bg-blue-500/10 rounded-md">
                                                {icon}
                                            </div>
                                        )}
                                        <div>
                                            <Drawer.Title className="text-base font-semibold text-white leading-none mb-1">
                                                {title}
                                            </Drawer.Title>
                                            {description && (
                                                <Drawer.Description className="text-xs text-zinc-400">
                                                    {description}
                                                </Drawer.Description>
                                            )}
                                        </div>
                                    </div>
                                    <Drawer.CloseTrigger asChild>
                                        <button
                                            onClick={onClose}
                                            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                            <span className="sr-only">Close</span>
                                        </button>
                                    </Drawer.CloseTrigger>
                                </div>

                                {/* Warning Banner */}
                                {warning && (
                                    <div className="p-3 bg-yellow-500/10 border-b border-yellow-500/20 shrink-0">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                            <div className="space-y-1">
                                                <p className="text-xs text-yellow-500/80">
                                                    {warning.message}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Inner Content */}
                                <div className="flex-1 overflow-hidden">
                                    {children}
                                </div>
                            </Splitter.Panel>
                        </Splitter.Root>
                    </div>
                </Drawer.Content>
            </Drawer.Positioner>
        </Drawer.Root>
    )
}
