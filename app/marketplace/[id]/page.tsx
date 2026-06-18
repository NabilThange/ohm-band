"use client"

export const dynamic = 'force-dynamic'

import { use } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    Star,
    Download,
    Share2,
    Heart,
    CheckCircle2,
    Code,
    Zap,
    Package
} from "lucide-react"
import { getTemplateById } from "@/lib/marketplace-data"

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default function TemplateDetailPage({ params }: PageProps) {
    const { id } = use(params)
    const router = useRouter()
    const template = getTemplateById(id)

    if (!template) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-2">Template Not Found</h1>
                    <p className="text-muted-foreground mb-6">The template you're looking for doesn't exist.</p>
                    <button
                        onClick={() => router.push('/marketplace')}
                        className="rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium"
                    >
                        Back to Marketplace
                    </button>
                </div>
            </div>
        )
    }

    const totalCost = template.components.reduce((sum: number, comp: any) => {
        const price = parseFloat(comp.price.replace('$', ''))
        return sum + (price * comp.quantity)
    }, 0)

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.push('/marketplace')}
                            className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-accent"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span className="text-sm font-medium">Back to Marketplace</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <button className="rounded-lg p-2 transition-colors hover:bg-accent">
                                <Heart className="h-5 w-5" />
                            </button>
                            <button className="rounded-lg p-2 transition-colors hover:bg-accent">
                                <Share2 className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid gap-12 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Hero Section */}
                        <div>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-6xl">{template.thumbnail}</span>
                                        <div>
                                            <h1 className="text-3xl font-bold text-foreground mb-1">
                                                {template.name}
                                            </h1>
                                            <p className="text-sm text-muted-foreground">
                                                by {template.author}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-lg text-muted-foreground">
                                        {template.description}
                                    </p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap items-center gap-6 py-4 border-y border-border">
                                <div className="flex items-center gap-2">
                                    <Star className="h-5 w-5 fill-primary text-primary" />
                                    <span className="font-semibold text-foreground">{template.rating}</span>
                                    <span className="text-sm text-muted-foreground">({template.reviews} reviews)</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Download className="h-5 w-5" />
                                    <span className="text-sm">{template.downloads.toLocaleString()} downloads</span>
                                </div>
                                <div className={`text-sm font-medium ${template.difficulty === 'Easy' ? 'text-green-600 dark:text-green-400' :
                                    template.difficulty === 'Intermediate' ? 'text-primary' :
                                        'text-secondary'
                                    }`}>
                                    {template.difficulty}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    ⏱️ {template.estimatedTime}
                                </div>
                            </div>
                        </div>

                        {/* About */}
                        <div>
                            <h2 className="text-xl font-semibold text-foreground mb-4">About This Project</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {template.longDescription}
                            </p>
                        </div>

                        {/* Features */}
                        <div>
                            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Zap className="h-5 w-5 text-primary" />
                                Features
                            </h2>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {template.features?.map((feature: string, index: number) => (
                                    <div key={index} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                        <span className="text-sm text-foreground">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* What You'll Learn */}
                        <div>
                            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Code className="h-5 w-5 text-secondary" />
                                What You'll Learn
                            </h2>
                            <div className="space-y-2">
                                {template.whatYouLearn?.map((item: string, index: number) => (
                                    <div key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Components/BOM */}
                        <div>
                            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                Bill of Materials
                            </h2>
                            <div className="rounded-lg border border-border overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Component
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Qty
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Price
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border bg-card">
                                        {template.components.map((component: any, index: number) => (
                                            <tr key={index} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-foreground">
                                                    {component.name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center text-muted-foreground">
                                                    {component.quantity}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                                                    {component.price}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-muted">
                                        <tr>
                                            <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-foreground">
                                                Total Estimated Cost
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-right text-primary">
                                                ${totalCost.toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            {/* CTA Card */}
                            <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
                                <div className="mb-4">
                                    <div className="text-3xl font-bold text-foreground mb-1">
                                        {template.price}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Estimated cost: ${totalCost.toFixed(2)}
                                    </p>
                                </div>

                                <button className="w-full rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors mb-3">
                                    Use This Template
                                </button>

                                <button className="w-full rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium hover:bg-accent transition-colors">
                                    Download Files
                                </button>
                            </div>

                            {/* Tags */}
                            <div className="rounded-xl border border-border bg-card p-6">
                                <h3 className="text-sm font-semibold text-foreground mb-3">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {template.tags.map((tag: string) => (
                                        <span
                                            key={tag}
                                            className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Category */}
                            <div className="rounded-xl border border-border bg-card p-6">
                                <h3 className="text-sm font-semibold text-foreground mb-3">Category</h3>
                                <span className="inline-flex rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                                    {template.category}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
