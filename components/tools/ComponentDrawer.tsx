'use client'

import ToolDrawer from './ToolDrawer'
import { CheckIcon, PlusIcon } from '@/components/ui/animated-icons'
import { Search, Info } from 'lucide-react'
import { useState } from 'react'

interface ComponentDrawerProps {
    isOpen: boolean
    onClose: () => void
}

const MOCK_COMPONENTS = [
    { id: '1', name: 'ESP32-WROOM', price: 6.50, category: 'MCU', image: 'chip' },
    { id: '2', name: 'DHT22 Sensor', price: 4.20, category: 'Sensor', image: 'sensor' },
    { id: '3', name: 'OLED Display', price: 8.90, category: 'Display', image: 'screen' },
    { id: '4', name: 'LiPo Battery', price: 12.00, category: 'Power', image: 'battery' },
    { id: '5', name: 'Servo Motor', price: 3.50, category: 'Actuator', image: 'motor' },
]

export default function ComponentDrawer({ isOpen, onClose }: ComponentDrawerProps) {
    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState<string[]>([])

    const filteredComponents = MOCK_COMPONENTS.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.category.toLowerCase().includes(search.toLowerCase())
    )

    const toggleSelection = (id: string) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    return (
        <ToolDrawer
            isOpen={isOpen}
            onClose={onClose}
            title="Component Selection"
            description="Browse and add components to your project."
        >
            <div className="space-y-6">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search components..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-accent/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>

                {/* Categories (Mock) */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {['All', 'MCU', 'Sensors', 'Power', 'Display'].map(cat => (
                        <button key={cat} className="px-3 py-1 bg-muted rounded-full text-xs font-medium hover:bg-primary/20 hover:text-primary transition-colors whitespace-nowrap">
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {filteredComponents.map(comp => {
                        const isSelected = selected.includes(comp.id)
                        return (
                            <div
                                key={comp.id}
                                className={`group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden
                            ${isSelected
                                        ? 'bg-primary/10 border-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]'
                                        : 'bg-card border-border hover:border-primary/50 hover:shadow-md'
                                    }`}
                                onClick={() => toggleSelection(comp.id)}
                            >
                                {/* Status Icon */}
                                <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all
                            ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'}`}>
                                    {isSelected ? <CheckIcon key="selected" size={12} triggerOn="auto" /> : <PlusIcon size={12} />}
                                </div>

                                {/* Content */}
                                <div className="pt-4 space-y-2">
                                    <div className="w-full h-20 bg-accent/50 rounded-lg flex items-center justify-center mb-2">
                                        {/* Placeholder visual */}
                                        <div className="w-8 h-8 rounded bg-muted-foreground/20" />
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-sm truncate">{comp.name}</h4>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-xs text-muted-foreground">{comp.category}</span>
                                            <span className="text-xs font-mono font-medium">${comp.price.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Hover */}
                                <button
                                    className="absolute bottom-2 right-2 p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); /* Show info */ }}
                                >
                                    <Info className="w-4 h-4" />
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        </ToolDrawer>
    )
}
