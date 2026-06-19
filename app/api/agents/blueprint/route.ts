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
        const { sessionId = "default" } = await req.json();

        const orchestrator = getOrchestrator(sessionId);

        // Generate blueprint using GPT-o1 (elite reasoning)
        console.log("🧠 Generating Blueprint with GPT-o1...");
        const blueprintJson = await orchestrator.generateBlueprint();

        // Parse to validate JSON
        let blueprint;
        try {
            blueprint = JSON.parse(blueprintJson);
        } catch (parseError) {
            console.error("Blueprint is not valid JSON:", blueprintJson);
            // Return raw text if not JSON
            blueprint = { raw: blueprintJson };
        }

        return NextResponse.json({
            blueprint,
            blueprintJson
        });

    } catch (error: any) {
        console.error("Blueprint API error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate blueprint" },
            { status: 500 }
        );
    }
}
