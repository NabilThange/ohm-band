'use client'

export const dynamic = 'force-dynamic'

import { ArrowRightIcon } from '@/components/ui/arrow-right'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ShapeShifter from '@/components/mage-ui/hero/shape-shifter'
import OhmFeatures from '@/components/OhmFeatures'
import PricingSection from '@/components/PricingSection'
import { SquigglyArrow } from '@/components/ui/squiggle-arrow'
import { HeroPromptInput } from '@/components/shared/HeroPromptInput'
import TextImageReveal from '@/components/TextImageReveal'

const features = [
    { label: 'Project Planning' },
    { label: 'Component Selection' },
    { label: 'Wiring Diagrams' },
    { label: 'Firmware Code' },
    { label: 'Cost Estimation' },
    { label: 'Build Guide' },
]

const companies = [
    {
        name: 'v0',
        svg: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 7v5l3 2" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>'
    },
    {
        name: 'Vercel',
        svg: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><polygon points="12,2 2,22 22,22" /></svg>'
    },
    {
        name: 'Resend',
        svg: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M2 4h20c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H2c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2"/></svg>'
    },
    {
        name: 'Cursor',
        svg: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M3.5 2.5L13 13l4-11 3.5 9-9 3.5L2 20.5z"/></svg>'
    },
    {
        name: 'Supermemory',
        svg: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>'
    },
    {
        name: 'Next.js',
        svg: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M11.214 5.02c.857-1.289 2.515-1.289 3.372 0l8.102 12.15c.857 1.289.214 2.33-1.429 2.33H4.54c-1.643 0-2.286-.957-1.429-2.33l8.102-12.15zm.536 6.77h1.5v4.286h-1.5V11.79z" fillRule="evenodd"/></svg>'
    },
]

export default function Home() {
    return (
        <div className="min-h-screen bg-background flex justify-center">
            <div className="relative w-full"> {/* Added relative positioning for absolute child */}
                {/* Header */}
                <header className="">
                    <div className="px-6 py-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img src="/omega1.png" alt="Ohm" className="w-8 h-8" />
                        </div>
                        <nav className="hidden md:flex items-center gap-8">
                            <a href="#" className="text-sm font-sans text-foreground hover:opacity-75 transition">
                                Solutions
                            </a>
                            <a href="#" className="text-sm font-sans text-foreground hover:opacity-75 transition">
                                Use Cases
                            </a>
                            <a href="#" className="text-sm font-sans text-foreground hover:opacity-75 transition">
                                Developers
                            </a>
                            <Link href="/marketplace" className="text-sm font-sans text-foreground hover:opacity-75 transition">
                                Marketplace
                            </Link>
                            <Link href="/chats" className="text-sm font-sans text-foreground hover:opacity-75 transition">
                                My Chats
                            </Link>
                            <a href="#" className="text-sm font-sans text-foreground hover:opacity-75 transition">
                                Resources
                            </a>
                            <a href="#" className="text-sm font-sans text-foreground hover:opacity-75 transition">
                                Pricing
                            </a>
                        </nav>
                        <div className="flex items-center gap-4">
                            <Link href="/login" className="text-sm font-sans text-foreground hover:opacity-75 transition">
                                Login
                            </Link>
                            <Link href="/build">
                                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-sans rounded-full px-6 py-2">
                                    Start Building
                                </Button>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="relative flex flex-col items-center justify-center py-8 px-6 min-h-[80vh]">
                    <div className="w-full px-8 py-4 relative mb-8">
                        {/* Badge */}
                        <div className="mb-8 flex items-center gap-3 justify-center">
                            <div className="bg-muted px-3 py-1">
                                <span className="text-sm font-mono text-foreground">Introducing Ohm</span>
                            </div>
                            <button
                                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                className="bg-transparent border border-orange-100 text-orange-80 px-3 py-1 flex items-center gap-2 hover:bg-orange-500/10 transition text-sm font-sans rounded-none"
                            >
                                Explore Ohm  <ArrowRightIcon size={14} />
                            </button>
                        </div>

                        {/* Headlines + ShapeShifter */}
                        <div className="flex flex-col xl:flex-row items-center justify-between w-full max-w-6xl gap-12 mb-12">
                            <div className="flex-1 flex-shrink-0 relative z-10">
                                {/* Headline */}
                                <h1 className="text-5xl md:text-6xl font-bold text-left mb-6 text-pretty font-sans">
                                    Complex circuits?
                                    Meet Ohm.
                                </h1>

                                {/* Subheading */}
                                <p className="text-left text-foreground/70 max-w-2xl mb-12 text-sm md:text-base font-sans">
                                    Your AI hardware engineer that turns prompts into production-ready designs.
                                </p>
                            </div>

                            <div className="flex-1 w-full flex justify-center xl:justify-end xl:min-w-[500px] relative">
                                <ShapeShifter prefix="Automate" suffix="Everything" containerClassName="xl:translate-x-[200px]" />
                            </div>
                        </div>

                        {/* Squiggle Arrow */}
                        <div className="absolute pointer-events-none ml-0 md:ml-8" style={{ top: '370px', left: '-35px' }}>
                            <SquigglyArrow direction="down" variant="bouncy" width={520} height={130} strokeWidth={2.5} className="text-orange-500" roundedEnd={true} rotation={-48} />
                        </div>

                        {/* Textarea - now part of layout flow */}
                        <div className="mb-16">
                            <HeroPromptInput variant="landing" />
                        </div>

                        {/* Feature Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-20 justify-center">
                            {features.map((feature, idx) => (
                                <div
                                    key={idx}
                                    className="border border-border px-4 py-3 flex items-center justify-center text-sm font-mono text-foreground hover:border-foreground/50 transition cursor-default"
                                >
                                    <span className="font-bold text-center">{feature.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Social Proof Section */}
                        <div className="text-center mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 font-sans">
                                Trusted by hardware teams globally
                            </h2>
                        </div>

                        {/* Company Logos */}
                        <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-center text-center">
                            {companies.map((company, idx) => (
                                <div key={idx} className="flex flex-col items-center justify-center gap-2 text-foreground/50 hover:text-foreground/70 transition">
                                    <div className="w-12 h-12" dangerouslySetInnerHTML={{ __html: company.svg }} />
                                    <span className="text-xs font-sans font-bold">{company.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>

                {/* Ohm Features Section */}
                <div id="features">
                    <OhmFeatures />
                </div>

                {/* Text Image Reveal Section */}
                <TextImageReveal />

                {/* Pricing Section */}
                <PricingSection />
            </div>
        </div>
    )
}
