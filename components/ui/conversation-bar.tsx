"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Square, X, Loader2, RefreshCw } from "lucide-react"
import { cn as cls } from "@/lib/utils"

interface ConversationBarProps {
    onTranscriptionComplete: (text: string) => void
    onClose: () => void
    className?: string
    waveformClassName?: string
}

type RecordingState = "connecting" | "listening" | "transcribing" | "error"

export function ConversationBar({
    onTranscriptionComplete,
    onClose,
    className,
    waveformClassName,
}: ConversationBarProps) {
    const [state, setState] = useState<RecordingState>("connecting")
    const [isMuted, setIsMuted] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")

    // Audio references
    const streamRef = useRef<MediaStream | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const animationRef = useRef<number | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    // Waveform rendering variables
    const numBars = 24
    const barWidth = 3
    const barGap = 4
    const heightsRef = useRef<number[]>(Array(numBars).fill(4))

    // Initialize microphone and audio analysis
    useEffect(() => {
        let active = true

        async function initAudio() {
            try {
                // Request microphone access
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                if (!active) {
                    stream.getTracks().forEach(track => track.stop())
                    return
                }

                streamRef.current = stream

                // Initialize Web Audio API
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
                const audioContext = new AudioContextClass()
                audioContextRef.current = audioContext

                const analyser = audioContext.createAnalyser()
                analyser.fftSize = 64 // 32 frequency bins
                analyser.smoothingTimeConstant = 0.6
                analyserRef.current = analyser

                const source = audioContext.createMediaStreamSource(stream)
                source.connect(analyser)

                // Initialize MediaRecorder
                const mediaRecorder = new MediaRecorder(stream)
                mediaRecorderRef.current = mediaRecorder
                chunksRef.current = []

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) {
                        chunksRef.current.push(e.data)
                    }
                }

                mediaRecorder.onstop = async () => {
                    if (chunksRef.current.length === 0) return
                    
                    setState("transcribing")
                    try {
                        const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" })
                        const formData = new FormData()
                        formData.append("file", audioBlob, "audio.wav")

                        const response = await fetch("/api/transcribe", {
                            method: "POST",
                            body: formData,
                        })

                        if (!response.ok) {
                            throw new Error("Failed to transcribe audio. Please try again.")
                        }

                        const data = await response.json()
                        if (data.error) {
                            throw new Error(data.error)
                        }

                        if (data.text && data.text.trim()) {
                            onTranscriptionComplete(data.text.trim())
                        }
                        
                        cleanup()
                        onClose()
                    } catch (err: any) {
                        console.error("Transcription error:", err)
                        if (active) {
                            setErrorMessage(err.message || "Failed to transcribe audio.")
                            setState("error")
                        }
                    }
                }

                mediaRecorder.start(250) // record in 250ms slices
                setState("listening")
                startWaveformAnimation()
            } catch (err: any) {
                console.error("Microphone access error:", err)
                if (active) {
                    setErrorMessage("Microphone access denied or not available.")
                    setState("error")
                }
            }
        }

        initAudio()

        return () => {
            active = false
            cleanup()
        }
    }, [])

    // Waveform visualizer loop
    const startWaveformAnimation = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const analyser = analyserRef.current
        const bufferLength = analyser ? analyser.frequencyBinCount : 0
        const dataArray = new Uint8Array(bufferLength)

        const draw = () => {
            if (state === "transcribing" || state === "error") return
            animationRef.current = requestAnimationFrame(draw)

            const width = canvas.width
            const height = canvas.height

            // Clear canvas
            ctx.clearRect(0, 0, width, height)

            let targetHeights = Array(numBars).fill(4)

            if (analyser && !isMuted) {
                analyser.getByteFrequencyData(dataArray)

                // Symmetrical mapping: Map active frequencies (first 12 bins) to 24 bars symmetrically
                // Centre of the canvas will have lower frequencies (usually more active in speech)
                for (let i = 0; i < numBars / 2; i++) {
                    const binIndex = Math.min(i, bufferLength - 1)
                    // Scale frequency value (0-255) to height (4px to max canvas height)
                    const amplitude = dataArray[binIndex] || 0
                    const scaledHeight = Math.max(4, (amplitude / 255) * (height - 8))
                    
                    // Symmetrical index
                    targetHeights[numBars / 2 - 1 - i] = scaledHeight
                    targetHeights[numBars / 2 + i] = scaledHeight
                }
            } else {
                // If muted or no analyser, generate a gentle idle sine ripple
                const time = Date.now() * 0.006
                for (let i = 0; i < numBars; i++) {
                    const ripple = Math.sin(time + i * 0.5) * 4 + 6
                    targetHeights[i] = Math.max(4, ripple)
                }
            }

            // Apply interpolation/smoothing
            for (let i = 0; i < numBars; i++) {
                heightsRef.current[i] = heightsRef.current[i] * 0.65 + targetHeights[i] * 0.35
            }

            // Render bars
            const totalWidth = numBars * barWidth + (numBars - 1) * barGap
            const startX = (width - totalWidth) / 2

            // Create gradient for waveform matching ElevenLabs premium styling
            const gradient = ctx.createLinearGradient(startX, 0, startX + totalWidth, 0)
            gradient.addColorStop(0, "#f59e0b") // Amber 500 (Ohm brand color)
            gradient.addColorStop(0.5, "#f97316") // Orange 500
            gradient.addColorStop(1, "#ef4444") // Red 500

            ctx.fillStyle = gradient

            for (let i = 0; i < numBars; i++) {
                const h = heightsRef.current[i]
                const x = startX + i * (barWidth + barGap)
                const y = (height - h) / 2

                ctx.beginPath()
                // Use roundRect if supported, otherwise normal rect
                if (typeof (ctx as any).roundRect === "function") {
                    ;(ctx as any).roundRect(x, y, barWidth, h, barWidth / 2)
                } else {
                    ctx.rect(x, y, barWidth, h)
                }
                ctx.fill()
            }
        }

        draw()
    }

    // Stop recording and trigger transcription
    const handleStop = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop()
        }
    }

    // Toggle mute state
    const handleMuteToggle = () => {
        if (streamRef.current) {
            const audioTracks = streamRef.current.getAudioTracks()
            audioTracks.forEach((track) => {
                track.enabled = !track.enabled
            })
            setIsMuted(!isMuted)
        }
    }

    // Close and clean up everything
    const handleCancel = () => {
        cleanup()
        onClose()
    }

    const cleanup = () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
            animationRef.current = null
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            try {
                mediaRecorderRef.current.stop()
            } catch (e) {}
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => {})
            audioContextRef.current = null
        }
    }

    // Retry initialization in case of error
    const handleRetry = () => {
        setErrorMessage("")
        setState("connecting")
        // Trigger mount effect again by forcing reload state
        const event = new CustomEvent("retry-audio")
        window.dispatchEvent(event)
    }

    return (
        <div className={cls("w-full px-2 py-1", className)}>
            <div className="flex items-center justify-between gap-4 p-3 bg-zinc-950/90 border border-[#3e3e38] rounded-full shadow-xl backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-300">
                
                {/* Left section: Recording indicator */}
                <div className="flex items-center gap-2 pl-3 min-w-[100px]">
                    <AnimatePresence mode="wait">
                        {state === "connecting" && (
                            <motion.div
                                key="connecting"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2 text-xs text-muted-foreground font-medium font-sans"
                            >
                                <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                                <span>Starting...</span>
                            </motion.div>
                        )}
                        {state === "listening" && (
                            <motion.div
                                key="listening"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2 text-xs font-semibold tracking-wider text-amber-500 font-sans uppercase"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                                <span>Listening</span>
                            </motion.div>
                        )}
                        {state === "transcribing" && (
                            <motion.div
                                key="transcribing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2 text-xs text-amber-400 font-medium font-sans"
                            >
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                                <span>Processing...</span>
                            </motion.div>
                        )}
                        {state === "error" && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2 text-xs text-red-500 font-medium font-sans max-w-[200px] truncate"
                                title={errorMessage}
                            >
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span>Error</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Center section: Waveform canvas */}
                <div className="flex-1 flex justify-center h-8 relative">
                    {state !== "error" && (
                        <canvas
                            ref={canvasRef}
                            width={320}
                            height={32}
                            className={cls("w-full max-w-[320px] h-full opacity-90", waveformClassName)}
                        />
                    )}
                    {state === "error" && (
                        <div className="flex items-center justify-center text-xs text-red-400/80 font-sans italic px-2 truncate max-w-[320px]">
                            {errorMessage}
                        </div>
                    )}
                </div>

                {/* Right section: Controls */}
                <div className="flex items-center gap-1.5 pr-1">
                    {state === "error" ? (
                        <>
                            <button
                                onClick={onClose}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full transition-colors duration-200"
                                title="Close"
                            >
                                <X className="w-4.5 h-4.5" />
                            </button>
                        </>
                    ) : (
                        <>
                            {state === "listening" && (
                                <button
                                    onClick={handleMuteToggle}
                                    className={cls(
                                        "p-2 rounded-full transition-colors duration-200",
                                        isMuted
                                            ? "text-red-500 bg-red-500/10 hover:bg-red-500/20"
                                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    )}
                                    title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                                    disabled={state !== "listening"}
                                >
                                    {isMuted ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
                                </button>
                            )}
                            
                            <button
                                onClick={handleStop}
                                className={cls(
                                    "p-2 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-full transition-colors duration-200",
                                    (state !== "listening") && "opacity-50 cursor-not-allowed"
                                )}
                                title="Stop and Send"
                                disabled={state !== "listening"}
                            >
                                <Square className="w-4.5 h-4.5 fill-current" />
                            </button>
                            
                            <button
                                onClick={handleCancel}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full transition-colors duration-200"
                                title="Cancel"
                                disabled={state === "transcribing"}
                            >
                                <X className="w-4.5 h-4.5" />
                            </button>
                        </>
                    )}
                </div>

            </div>
        </div>
    )
}
