'use client'

import { CheckIcon } from "@/components/ui/animated-icons"
import { Zap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
    "Unlimited projects",
    "AI-powered hardware design",
    "Unlimited BOM generation",
    "Wiring diagrams & schematics",
    "Code generation (Arduino & MicroPython)",
    "Component compatibility checks",
    "Real-time collaboration",
    "All future updates",
]

export default function PricingSection() {
    return (
        <section className="py-20 md:py-32 px-6 bg-background">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center space-y-4 pb-16 mx-auto max-w-4xl">
                    <div className="inline-block">
                        <span className="text-xs font-mono text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                            PRICING
                        </span>
                    </div>
                    <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground font-sans">
                        Simple, transparent pricing
                    </h2>
                    <p className="text-xl text-foreground/70 pt-2 font-sans">
                        Everything you need to design and build hardware projects. No hidden fees, no surprises.
                    </p>
                </div>

                {/* Pricing Card */}
                <div className="max-w-2xl mx-auto">
                    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-lg">
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 md:p-12 border-b border-border">
                            {/* Badge */}
                            <div className="inline-block mb-6">
                                <span className="text-xs font-bold uppercase tracking-widest bg-primary text-primary-foreground px-3 py-1 rounded-full">
                                    FOREVER FREE
                                </span>
                            </div>

                            {/* Price */}
                            <div className="mb-6">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-6xl md:text-7xl font-bold text-foreground">$0</span>
                                    <span className="text-lg text-foreground/60 font-sans">/forever</span>
                                </div>
                                <p className="mt-3 text-lg text-foreground/70 font-sans">
                                    Free access to all features. Forever.
                                </p>
                            </div>

                            {/* CTA Button */}
                            <Button className="w-full py-6 text-base font-bold group bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                                Start Building
                                <ArrowRight className="h-5 w-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                            </Button>

                            {/* Guarantee */}
                            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-foreground/70">
                                <Zap className="h-4 w-4 text-primary" />
                                <span className="font-sans">No credit card required</span>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="p-8 md:p-12">
                            <h3 className="text-2xl font-bold mb-8 text-foreground font-sans">
                                What's included:
                            </h3>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {features.map((feature, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckIcon size={12} triggerOn="auto" />
                                        </div>
                                        <span className="text-foreground/80 font-sans">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Bottom note */}
                            <div className="mt-8 pt-8 border-t border-border/50">
                                <p className="text-sm text-foreground/60 text-center font-sans">
                                    All features are included in the free plan. No upgrades or premium tiers.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Additional note */}
                    <div className="text-center mt-8">
                        <p className="text-foreground/60 font-sans">
                            Questions? Check out our documentation or contact our support team.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
