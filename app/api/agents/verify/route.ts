import { NextRequest, NextResponse } from "next/server";
import { AssemblyLineOrchestrator } from "@/lib/agents/orchestrator";

// Store orchestrators per session
const orchestrators = new Map<string, AssemblyLineOrchestrator>();

function getOrchestrator(sessionId: string): AssemblyLineOrchestrator {
    if (!orchestrators.has(sessionId)) {
        orchestrators.set(sessionId, new AssemblyLineOrchestrator(sessionId));
    }
    return orchestrators.get(sessionId)!;
}

export async function POST(req: NextRequest) {
    try {
        const { imageUrl, blueprintJson, sessionId = "default" } = await req.json();

        if (!imageUrl || !blueprintJson) {
            return NextResponse.json(
                { error: "Image URL and Blueprint JSON are required" },
                { status: 400 }
            );
        }

        const orchestrator = getOrchestrator(sessionId);

        // Verify circuit using Gemini 2.5 Flash (native multimodal vision)
        console.log("👁️ Verifying circuit with Gemini 2.5 Flash...");
        const inspectionResult = await orchestrator.verifyCircuit(imageUrl, blueprintJson);

        // Try to parse as JSON
        let inspection;
        try {
            inspection = JSON.parse(inspectionResult);
        } catch (parseError) {
            // Return raw text if not JSON
            inspection = { raw: inspectionResult };
        }

        return NextResponse.json({
            inspection,
            inspectionResult
        });

    } catch (error: any) {
        console.error("Circuit verification API error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to verify circuit" },
            { status: 500 }
        );
    }
}
