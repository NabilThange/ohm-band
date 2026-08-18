import { NextRequest, NextResponse } from "next/server";
import { getProjectArtifact, saveProjectArtifact } from "@/lib/workspace/project-fs";

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string; type: string }> }
) {
    try {
        const { id, type } = await context.params;
        const data = await getProjectArtifact(id, type);
        return NextResponse.json(data || {});
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string; type: string }> }
) {
    try {
        const { id, type } = await context.params;
        const body = await req.json();
        const { content, filename } = body;

        const success = await saveProjectArtifact(id, type, content, filename);
        return NextResponse.json({ success });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
