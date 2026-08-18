import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fsp from "fs/promises";
import fs from "fs";

import os from "os";

export const dynamic = 'force-dynamic';

const WORKSPACE_ROOT = process.env.VERCEL === '1'
    ? path.join(os.tmpdir(), 'workspace')
    : path.join(process.cwd(), 'workspace');
const USER_PROFILE_PATH = path.join(WORKSPACE_ROOT, 'USER_PROFILE.md');

export interface UserHardwareProfile {
    skillLevel: string;
    preferredMicrocontrollers: string[];
    availableTools: string[];
    componentInventory: string;
    powerPreferences: string[];
    programmingLanguage: string;
    workspaceNotes: string;
}

function parseMarkdownProfile(content: string): { profile: UserHardwareProfile; isComplete: boolean } {
    const defaultProfile: UserHardwareProfile = {
        skillLevel: "Intermediate",
        preferredMicrocontrollers: [],
        availableTools: [],
        componentInventory: "",
        powerPreferences: [],
        programmingLanguage: "Arduino / C++",
        workspaceNotes: ""
    };

    if (!content || !content.trim()) {
        return { profile: defaultProfile, isComplete: false };
    }

    const lines = content.split('\n');
    let isComplete = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('- **Skill Level**:')) {
            const val = trimmed.replace('- **Skill Level**:', '').trim();
            if (val && val !== '[Not set]') {
                defaultProfile.skillLevel = val;
                isComplete = true;
            }
        } else if (trimmed.startsWith('- **Preferred Microcontrollers**:')) {
            const val = trimmed.replace('- **Preferred Microcontrollers**:', '').trim();
            if (val && val !== '[Not set]') {
                defaultProfile.preferredMicrocontrollers = val.split(',').map(s => s.trim()).filter(Boolean);
                isComplete = true;
            }
        } else if (trimmed.startsWith('- **Available Tools**:')) {
            const val = trimmed.replace('- **Available Tools**:', '').trim();
            if (val && val !== '[Not set]') {
                defaultProfile.availableTools = val.split(',').map(s => s.trim()).filter(Boolean);
                isComplete = true;
            }
        } else if (trimmed.startsWith('- **Component Inventory**:')) {
            const val = trimmed.replace('- **Component Inventory**:', '').trim();
            if (val && val !== '[Not set]') {
                defaultProfile.componentInventory = val;
                isComplete = true;
            }
        } else if (trimmed.startsWith('- **Power Preferences**:')) {
            const val = trimmed.replace('- **Power Preferences**:', '').trim();
            if (val && val !== '[Not set]') {
                defaultProfile.powerPreferences = val.split(',').map(s => s.trim()).filter(Boolean);
            }
        } else if (trimmed.startsWith('- **Programming Language**:')) {
            const val = trimmed.replace('- **Programming Language**:', '').trim();
            if (val && val !== '[Not set]') {
                defaultProfile.programmingLanguage = val;
            }
        } else if (trimmed.startsWith('- **Workspace Notes**:')) {
            const val = trimmed.replace('- **Workspace Notes**:', '').trim();
            if (val && val !== '[Not set]') {
                defaultProfile.workspaceNotes = val;
            }
        }
    }

    return { profile: defaultProfile, isComplete };
}

function serializeMarkdownProfile(p: UserHardwareProfile): string {
    return `# User Hardware Profile

> OpenCode agents MUST read this profile to tailor component recommendations, pinouts, firmware frameworks, and 3D enclosures to the maker's available gear and preferences.

- **Skill Level**: ${p.skillLevel || 'Intermediate'}
- **Preferred Microcontrollers**: ${p.preferredMicrocontrollers?.length ? p.preferredMicrocontrollers.join(', ') : '[Not set]'}
- **Available Tools**: ${p.availableTools?.length ? p.availableTools.join(', ') : '[Not set]'}
- **Component Inventory**: ${p.componentInventory || '[Not set]'}
- **Power Preferences**: ${p.powerPreferences?.length ? p.powerPreferences.join(', ') : '[Not set]'}
- **Programming Language**: ${p.programmingLanguage || 'Arduino / C++'}
- **Workspace Notes**: ${p.workspaceNotes || '[Not set]'}
`;
}

export async function GET() {
    try {
        await fsp.mkdir(WORKSPACE_ROOT, { recursive: true });

        if (!fs.existsSync(USER_PROFILE_PATH)) {
            return NextResponse.json({
                content: "",
                profile: {
                    skillLevel: "Intermediate",
                    preferredMicrocontrollers: [],
                    availableTools: [],
                    componentInventory: "",
                    powerPreferences: [],
                    programmingLanguage: "Arduino / C++",
                    workspaceNotes: ""
                },
                isComplete: false
            });
        }

        const raw = await fsp.readFile(USER_PROFILE_PATH, 'utf-8');
        const { profile, isComplete } = parseMarkdownProfile(raw);

        return NextResponse.json({
            content: raw,
            profile,
            isComplete
        });
    } catch (err: any) {
        console.error("[User Profile API] GET error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await fsp.mkdir(WORKSPACE_ROOT, { recursive: true });
        const body = await req.json();

        let markdownContent = "";

        if (body.rawMarkdown) {
            markdownContent = body.rawMarkdown;
        } else if (body.profile) {
            markdownContent = serializeMarkdownProfile(body.profile);
        } else {
            return NextResponse.json({ error: "profile object or rawMarkdown is required" }, { status: 400 });
        }

        await fsp.writeFile(USER_PROFILE_PATH, markdownContent, 'utf-8');
        const { profile, isComplete } = parseMarkdownProfile(markdownContent);

        return NextResponse.json({
            success: true,
            content: markdownContent,
            profile,
            isComplete
        });
    } catch (err: any) {
        console.error("[User Profile API] POST error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
