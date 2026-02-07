'use client'

import { Splitter } from '@ark-ui/react/splitter'
import { XIcon } from '@/components/ui/animated-icons'
import { useEffect, ReactNode } from 'react'

interface ResizableDrawerProps {
    isOpen: boolean
    onClose: () => void
    title: string
    description?: string
    children: ReactNode
    defaultSize?: number
    minSize?: number
    maxSize?: number
}

export default function ResizableDrawer({
    isOpen,
    onClose,
    title,
    description,
    children,
    defaultSize = 60,
    minSize = 30,
    maxSize = 70
}: ResizableDrawerProps) {
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
            {/* Backdrop - Click to close */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Resizable Drawer using Splitter */}
            <div className="fixed inset-0 z-[70] pointer-events-none">
                <Splitter.Root
                    className="h-full w-full pointer-events-none"
                    panels={[
                        { id: 'main', minSize: 100 - maxSize },
                        { id: 'drawer', minSize, maxSize }
                    ]}
                    defaultSize={[100 - defaultSize, defaultSize]}
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
                                    {title}
                                </h2>
                                {description && (
                                    <p className="text-sm text-muted-foreground">
                                        {description}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <XIcon size={16} />
                                <span className="sr-only">Close</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden">
                            {children}
                        </div>
                    </Splitter.Panel>
                </Splitter.Root>
            </div>
        </>
    )
}
