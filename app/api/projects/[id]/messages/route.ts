import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { ensureProjectDirectory } from "@/lib/workspace/project-fs";

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const projectDir = path.join(process.cwd(), 'workspace', 'projects', id);
        const messagesPath = path.join(projectDir, 'messages.jsonl');

        if (!fs.existsSync(messagesPath)) {
            return NextResponse.json([]);
        }

        const raw = await fsp.readFile(messagesPath, 'utf-8');
        const lines = raw.split('\n').filter(Boolean);
        const messages = lines.map(line => {
            try {
                return JSON.parse(line);
            } catch {
                return null;
            }
        }).filter(Boolean);

        return NextResponse.json(messages);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const projectDir = await ensureProjectDirectory(id);
        const message = await req.json();

        const messagesPath = path.join(projectDir, 'messages.jsonl');
        const line = JSON.stringify(message) + '\n';
        await fsp.appendFile(messagesPath, line, 'utf-8');

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
