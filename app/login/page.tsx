'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeftIcon } from "@/components/ui/animated-icons"
import { AlertCircle, Zap } from "lucide-react"
import { useState } from "react"

const Google = ({ ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
        <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 16.42 6.5L19.9 3A11.97 11.97 0 0 0 1.24 6.65z"></path>
        <path fill="#34A853" d="M16.04 18.01A7.4 7.4 0 0 1 12 19.1a7.08 7.08 0 0 1-6.72-4.82l-4.04 3.06A11.96 11.96 0 0 0 12 24a11.4 11.4 0 0 0 7.83-3z"></path>
        <path fill="#4A90E2" d="M19.83 21c2.2-2.05 3.62-5.1 3.62-9 0-.7-.1-1.47-.27-2.18H12v4.63h6.44a5.4 5.4 0 0 1-2.4 3.56l3.8 2.99Z"></path>
        <path fill="#FBBC05" d="M5.28 14.27a7.12 7.12 0 0 1-.01-4.5L1.24 6.64A11.9 11.9 0 0 0 0 12c0 1.92.44 3.73 1.24 5.33z"></path>
    </svg>
)

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [showWarning, setShowWarning] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setShowWarning(true)
    }

    const handleGoogleClick = () => {
        setShowWarning(true)
    }

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-background">
            {/* Left Panel */}
            <div className="relative hidden h-full flex-col p-10 text-white dark:border-r lg:flex overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 hover:scale-105"
                    style={{ backgroundImage: 'url("/img5.png")' }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-black/20" />
                <Link href="/" className="relative z-20 flex items-center gap-2 text-lg font-medium hover:opacity-80 transition">
                    <div className="w-8 h-8 bg-primary rounded flex items-center justify-center font-bold text-lg text-primary-foreground">
                        Ω
                    </div>
                </Link>

                <div className="relative z-20 mt-auto space-y-6">
                    <blockquote className="space-y-3">
                        <p className="text-lg leading-relaxed font-sans text-white/90">
                            "Ohm is transforming how engineers approach hardware design. It's intelligent, intuitive, and built for the future."
                        </p>
                        <footer className="text-sm text-white/60 font-sans">— Hardware Engineering Team</footer>
                    </blockquote>
                </div>
            </div>

            {/* Right Panel */}
            <div className="lg:p-8 w-full">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
                    {/* Back Button */}
                    <Link href="/" className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition w-fit">
                        <ArrowLeftIcon size={16} />
                        Back to home
                    </Link>

                    {/* Header */}
                    <div className="flex flex-col space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                        <p className="text-sm text-foreground/70">
                            Sign in to your account to continue
                        </p>
                    </div>

                    {/* Warning Banner */}
                    {showWarning && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-700 dark:text-blue-600">
                                <p className="font-semibold mb-1">Coming Soon</p>
                                <p>Authentication is currently in development. We're working on bringing you a seamless login experience.</p>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <div className="grid gap-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <label htmlFor="email" className="text-sm font-medium">Email address</label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-10"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full font-semibold"
                                onClick={() => setShowWarning(true)}
                            >
                                Sign In with Email
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        {/* Google Button */}
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleGoogleClick}
                        >
                            <Google className="mr-2 size-5" />
                            Sign In with Google
                        </Button>


                    </div>

                    {/* Disclaimer */}
                    <div className="space-y-4 text-center">
                        <p className="text-xs text-foreground/60">
                            By clicking continue, you agree to our Terms of Service and Privacy Policy.
                        </p>

                        <div className="bg-muted/50 rounded-lg p-4 text-left text-xs space-y-2">
                            <p className="font-semibold text-foreground">Note:</p>
                            <p className="text-foreground/70">
                                This login interface is currently a frontend demonstration. Full authentication will be available soon.
                            </p>
                        </div>
                    </div>

                    {/* CTA */}
                    <Link href="/build">
                        <Button className="w-full" variant="default">
                            Continue to Builder →
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
