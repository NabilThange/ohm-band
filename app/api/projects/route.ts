import { NextResponse } from "next/server";
import { listAllProjects, ensureProjectDirectory } from "@/lib/workspace/project-fs";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const projects = await listAllProjects();
        return NextResponse.json(projects);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const chatId = body.chatId || crypto.randomUUID();
        const title = body.title || "New Hardware Project";

        await ensureProjectDirectory(chatId, title);
        return NextResponse.json({ id: chatId, title, success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
