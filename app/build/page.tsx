"use client"

// ponytail: prevent static generation, needs runtime env
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ProjectCreator } from "@/components/text_area/ProjectCreator"
import AIAssistantUI from "@/components/ai_chat/AIAssistantUI"

export default function BuildPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()

    const chatId = params?.chatId as string | undefined
    const urlInitialPrompt = searchParams?.get('initialPrompt') || ""

    const [mode, setMode] = useState(chatId ? "chat" : "input")
    const [initialPrompt, setInitialPrompt] = useState(urlInitialPrompt)

    useEffect(() => {
        if (chatId) setMode("chat")
    }, [chatId])

    useEffect(() => {
        if (urlInitialPrompt && !initialPrompt) {
            setInitialPrompt(urlInitialPrompt)
        }
    }, [urlInitialPrompt, initialPrompt])

    const handleProjectSubmit = async (prompt: string) => {
        try {
            // Fast Groq title & slug generation
            const res = await fetch('/api/agents/title', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: prompt })
            });

            if (res.ok) {
                const data = await res.json();
                const slug = data.slug || data.chatId;
                setInitialPrompt(prompt);
                router.push(`/build/${slug}?initialPrompt=${encodeURIComponent(prompt)}`);
                return;
            }
        } catch (e) {
            console.error("Failed to generate project title:", e);
        }

        setInitialPrompt(prompt);
        setMode("chat");
    }

    if (mode === "input") {
        return <ProjectCreator onSubmit={handleProjectSubmit} />
    }

    // @ts-ignore
    return <AIAssistantUI initialPrompt={initialPrompt || urlInitialPrompt} initialChatId={chatId} />
}
