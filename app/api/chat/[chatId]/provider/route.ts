import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        provider: "opencode",
        model: "opencode/deepseek-v4-flash-free",
        auto_orchestration: true
    });
}

export async function PATCH() {
    return NextResponse.json({
        success: true,
        provider: "opencode",
        model: "opencode/deepseek-v4-flash-free"
    });
}
