import { NextRequest, NextResponse } from "next/server";
import { KeyManager } from "@/lib/agents/key-manager";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as Blob | null;

        if (!file) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }

        // Load Groq API key securely
        const keyManager = KeyManager.getInstance();
        const originalProvider = keyManager.getCurrentProvider();
        
        let apiKey = "";
        try {
            // Load groq keys specifically
            keyManager.reloadKeysForProvider("groq");
            apiKey = keyManager.getCurrentKey();
        } catch (err: any) {
            console.error("Failed to load Groq keys from KeyManager:", err.message);
            // Fallback: check environment variable directly if KeyManager fails
            apiKey = process.env.GROQ_API_KEY_1 || process.env.GROQ_API_KEY || "";
        } finally {
            // Restore original provider keys in KeyManager so we don't cause side effects
            if (originalProvider && originalProvider !== "groq") {
                try {
                    keyManager.reloadKeysForProvider(originalProvider);
                } catch (restoreErr) {
                    console.error("Failed to restore original provider keys:", restoreErr);
                }
            }
        }

        if (!apiKey) {
            return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 });
        }

        // Prepare the payload for Groq STT API
        const groqFormData = new FormData();
        // Whisper expects a file with a supported extension (e.g. wav, mp3, m4a, webm)
        groqFormData.append("file", file, "audio.wav");
        groqFormData.append("model", "whisper-large-v3-turbo");
        groqFormData.append("response_format", "json");

        const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
            },
            body: groqFormData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Groq STT API error response:", errorText);
            return NextResponse.json({ error: `Groq STT API error: ${response.statusText}` }, { status: response.status });
        }

        const data = await response.json();
        
        // Record success in KeyManager if we used it
        try {
            if (originalProvider === "groq") {
                keyManager.recordSuccess();
            }
        } catch {}

        return NextResponse.json({ text: data.text });
    } catch (error: any) {
        console.error("Transcription API error:", error);
        return NextResponse.json({ error: error.message || "Failed to transcribe audio" }, { status: 500 });
    }
}
