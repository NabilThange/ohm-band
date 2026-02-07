'use client'

import { useState } from 'react'
import { ChevronDownIcon } from '@/components/ui/animated-icons'

interface Feature {
    title: string
    description: string
    image: string
}

const features: Feature[] = [
    {
        title: 'Create with Ohm',
        description: 'Draft and iterate on hardware designs, schematics, and code alongside your chat with Ohm.',
        image: '/img1.png'
    },
    {
        title: 'Bring your knowledge',
        description: 'Share your project requirements, constraints, and expertise to get personalized recommendations.',
        image: '/img2.png'
    },
    {
        title: 'Share and collaborate',
        description: 'Work together with your team in real-time, sharing designs and iterating on solutions.',
        image: '/img3.png'
    }
]

export default function OhmFeatures() {
    const [activeIndex, setActiveIndex] = useState(0)

    return (
        <section className="w-full bg-background py-20 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 font-sans">
                        Meet Ohm
                    </h2>
                    <p className="text-lg text-foreground/70 max-w-2xl mx-auto font-sans">
                        Ohm is an autonomous hardware engineer built to help you design, plan, and build electronics projects with intelligence and precision.
                    </p>
                </div>

                {/* Content Grid */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Left: Image */}
                    <div className="flex justify-center">
                        <div className="w-full max-w-md aspect-square bg-muted rounded-lg overflow-hidden border border-border flex items-center justify-center">
                            <img
                                src={features[activeIndex].image}
                                alt={features[activeIndex].title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Right: Accordions */}
                    <div className="space-y-4">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="border border-border rounded-lg overflow-hidden transition-all duration-300"
                            >
                                <button
                                    onClick={() => setActiveIndex(index)}
                                    className={`w-full px-6 py-4 flex items-center justify-between transition-all duration-300 ${activeIndex === index
                                        ? 'bg-primary/10 border-b border-border'
                                        : 'bg-background hover:bg-muted/50'
                                        }`}
                                >
                                    <h3 className="text-lg font-semibold text-foreground text-left font-sans">
                                        {feature.title}
                                    </h3>
                                    <ChevronDownIcon
                                        size={20}
                                        className={`text-foreground/70 transition-transform duration-300 flex-shrink-0 ${activeIndex === index ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>

                                {activeIndex === index && (
                                    <div className="px-6 py-4 bg-background border-t border-border/50">
                                        <p className="text-foreground/70 font-sans">
                                            {feature.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
