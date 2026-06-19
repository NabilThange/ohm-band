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
        const { blueprintJson, sessionId = "default" } = await req.json();

        if (!blueprintJson) {
            return NextResponse.json(
                { error: "Blueprint JSON is required" },
                { status: 400 }
            );
        }

        const orchestrator = getOrchestrator(sessionId);

        // Generate code using Claude Sonnet 4.5 (SOTA code generation)
        console.log("⚡ Generating firmware with Claude Sonnet 4.5...");
        const code = await orchestrator.generateCode(blueprintJson);

        return NextResponse.json({
            code
        });

    } catch (error: any) {
        console.error("Code generation API error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate code" },
            { status: 500 }
        );
    }
}
