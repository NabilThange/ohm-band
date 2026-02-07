'use client'

import ToolDrawer from './ToolDrawer'
import { Clipboard } from '@ark-ui/react'
import { CheckIcon, CopyIcon } from '@/components/ui/animated-icons'
import { Download, Share2, Trash2, AlertTriangle } from 'lucide-react'
import type { BOMData } from '@/lib/parsers'

interface BOMDrawerProps {
    isOpen: boolean
    onClose: () => void
    bomData: BOMData | null
}

export default function BOMDrawer({ isOpen, onClose, bomData }: BOMDrawerProps) {
    const components = bomData?.components || []
    const total = bomData?.totalCost || components.reduce((acc, item) => acc + (item.quantity * (item.estimatedCost || 0)), 0)

    // Format BOM as text for clipboard
    const bomText = components.map(i => `${i.quantity}x ${i.name} - $${((i.quantity * (i.estimatedCost || 0))).toFixed(2)}`).join('\n') + `\n\nTotal: $${total.toFixed(2)}`

    return (
        <ToolDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={bomData?.project_name || "Bill of Materials"}
            description={bomData?.summary || "Review parts list and costs."}
        >
            <div className="space-y-6 h-full flex flex-col">
                {/* Actions */}
                <div className="flex gap-2">
                    <Clipboard.Root value={bomText} timeout={1500} className="w-full">
                        <Clipboard.Control>
                            <Clipboard.Trigger asChild>
                                <button className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors w-full" disabled={!components.length}>
                                    <Clipboard.Indicator copied={<CheckIcon key="copied" size={16} triggerOn="auto" />}>
                                        <CopyIcon size={16} />
                                    </Clipboard.Indicator>
                                    <span>Copy List</span>
                                </button>
                            </Clipboard.Trigger>
                        </Clipboard.Control>
                    </Clipboard.Root>

                    <button className="flex items-center justify-center gap-2 bg-accent text-accent-foreground py-2 px-4 rounded-lg text-sm font-medium hover:bg-accent/80 transition-colors">
                        <Download className="w-4 h-4" />
                    </button>
                </div>

                {/* Table/List */}
                <div className="flex-1 overflow-visible">
                    <div className="rounded-lg border border-border overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium">
                                <tr>
                                    <th className="px-4 py-3">Item</th>
                                    <th className="px-4 py-3 text-center">Qty</th>
                                    <th className="px-4 py-3 text-right">Cost</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-card">
                                {components.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                                <span className="text-muted-foreground text-xs italic">
                                                    BOM will appear here when generated...
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    components.map((item, idx) => (
                                        <tr key={idx} className="group hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-medium">
                                                <div className="truncate max-w-[140px]" title={item.name}>{item.name}</div>
                                                <div className="text-[10px] text-muted-foreground">{item.partNumber}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center bg-muted/20">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right font-mono">${((item.quantity * (item.estimatedCost || 0))).toFixed(2)}</td>
                                            <td className="px-2 text-center text-muted-foreground">
                                                <button className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-1">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot className="bg-muted/50 font-semibold border-t border-border">
                                <tr>
                                    <td className="px-4 py-3">Total</td>
                                    <td className="px-4 py-3 text-center text-muted-foreground">{components.reduce((a, b) => a + b.quantity, 0)}</td>
                                    <td className="px-4 py-3 text-right text-primary">${total.toFixed(2)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Warnings */}
                {bomData?.warnings && bomData.warnings.length > 0 && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-red-500">Warnings</h4>
                                <ul className="text-xs text-red-500/80 list-disc list-inside">
                                    {bomData.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Power Analysis */}
                {bomData?.powerAnalysis && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-blue-500">Power Analysis</h4>
                            <div className="flex justify-between text-xs text-blue-400">
                                <span>Total Current:</span>
                                <span>{bomData.powerAnalysis.totalCurrent}</span>
                            </div>
                            <div className="flex justify-between text-xs text-blue-400">
                                <span>Recommended Supply:</span>
                                <span>{bomData.powerAnalysis.recommendedSupply}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                        <Share2 className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-yellow-500">Procurement Note</h4>
                            <p className="text-xs text-yellow-500/80">
                                Some parts may have long lead times. We recommend ordering from verified distributors.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ToolDrawer>
    )
}
