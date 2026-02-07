"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ProjectCreator } from "@/components/text_area/ProjectCreator"
import AIAssistantUI from "@/components/ai_chat/AIAssistantUI"

export default function BuildPage() {
    const params = useParams()
    const chatId = params?.chatId as string | undefined


    const [mode, setMode] = useState(chatId ? "chat" : "input")
    const [initialPrompt, setInitialPrompt] = useState("")

    useEffect(() => {
        if (chatId) setMode("chat")
    }, [chatId])

    const handleProjectSubmit = (prompt: string, style: string, userLevel: string, projectComplexity: string) => {

        setInitialPrompt(prompt)
        setMode("chat")
    }

    if (mode === "input") {
        return <ProjectCreator onSubmit={handleProjectSubmit} />
    }

    // @ts-ignore
    return <AIAssistantUI initialPrompt={initialPrompt} initialChatId={chatId} />
}
