"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    Search,
    Star,
    Download,
    TrendingUp,
    Filter,
    ChevronDown,
    Eye
} from "lucide-react"
import { MOCK_TEMPLATES, CATEGORIES, DIFFICULTY_LEVELS } from "@/lib/marketplace-data"

export default function MarketplacePage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [selectedDifficulty, setSelectedDifficulty] = useState("All")
    const [showFilters, setShowFilters] = useState(false)

    const filteredTemplates = MOCK_TEMPLATES.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesCategory = selectedCategory === "All" || template.category === selectedCategory
        const matchesDifficulty = selectedDifficulty === "All" || template.difficulty === selectedDifficulty

        return matchesSearch && matchesCategory && matchesDifficulty
    })

    const handleViewDetails = (templateId: string) => {
        router.push(`/marketplace/${templateId}`)
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/build')}
                                className="rounded-lg p-2 transition-colors hover:bg-accent"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">
                                    Project Marketplace
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Browse and use community templates to kickstart your projects
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                {filteredTemplates.length} templates
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Search and Filters */}
            <div className="border-b border-border bg-card">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>

                        {/* Filter Button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm transition-colors hover:bg-accent"
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Filter Options */}
                    {showFilters && (
                        <div className="mt-6 flex flex-wrap gap-6">
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Category
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${selectedCategory === cat
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'bg-muted text-muted-foreground hover:bg-accent'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Difficulty
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {DIFFICULTY_LEVELS.map(level => (
                                        <button
                                            key={level}
                                            onClick={() => setSelectedDifficulty(level)}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${selectedDifficulty === level
                                                ? 'bg-secondary text-secondary-foreground shadow-sm'
                                                : 'bg-muted text-muted-foreground hover:bg-accent'
                                                }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Featured Section */}
            <div className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">
                            Featured This Week
                        </h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {MOCK_TEMPLATES.slice(0, 3).map(template => (
                            <div
                                key={template.id}
                                onClick={() => handleViewDetails(template.id)}
                                className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:border-primary/50"
                            >
                                <div className="mb-3 text-4xl">{template.thumbnail}</div>
                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {template.name}
                                </h3>
                                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                                    <Download className="h-3 w-3" />
                                    {template.downloads.toLocaleString()} downloads
                                </p>
                                <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                    <Star className="h-3 w-3 fill-current" />
                                    {template.rating}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Templates Grid */}
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-foreground">
                        All Templates
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Discover hardware projects built by the community
                    </p>
                </div>

                {filteredTemplates.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-12 text-center">
                        <p className="text-muted-foreground">
                            No templates found matching your criteria.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {filteredTemplates.map(template => (
                            <div
                                key={template.id}
                                className="group cursor-pointer"
                            >
                                {/* Image Card */}
                                <div
                                    onClick={() => handleViewDetails(template.id)}
                                    className="relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-xl hover:border-primary/50 mb-3"
                                >
                                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                                        <div className="absolute inset-0 flex items-center justify-center text-8xl">
                                            {template.thumbnail}
                                        </div>

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        {/* Price Badge (only if not free) */}
                                        {template.price !== "Free" && (
                                            <div className="absolute top-3 right-3 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold shadow-lg">
                                                {template.price}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Info - Outside card, no background */}
                                <div className="flex items-center justify-between px-1">
                                    {/* Author */}
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-semibold text-primary">
                                                {template.author.charAt(0)}
                                            </span>
                                        </div>
                                        <span className="text-sm font-medium text-foreground truncate">
                                            {template.author}
                                        </span>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-3 text-muted-foreground flex-shrink-0">
                                        {/* Downloads */}
                                        <div className="flex items-center gap-1">
                                            <Download className="h-3.5 w-3.5" />
                                            <span className="text-xs">
                                                {template.downloads > 999
                                                    ? `${(template.downloads / 1000).toFixed(1)}k`
                                                    : template.downloads}
                                            </span>
                                        </div>

                                        {/* Likes (using rating as like count) */}
                                        <div className="flex items-center gap-1">
                                            <Star className="h-3.5 w-3.5 fill-current" />
                                            <span className="text-xs">
                                                {Math.floor(template.rating * 100)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
