import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

const OPENCODE_URL = process.env.OPENCODE_URL || process.env.OPENCODE_SERVER_URL || "http://127.0.0.1:4096";

export async function GET(req: NextRequest) {
  try {
    const upstream = await fetch(`${OPENCODE_URL}/event`, {
      headers: { Accept: "text/event-stream" },
    });

    if (!upstream.ok || !upstream.body) {
      return new Response(JSON.stringify({ error: "OpenCode daemon is not running on port 4096" }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Failed to connect to OpenCode daemon: " + err.message }), {
      status: 502,
      headers: { "Content-Type": "application/json" }
    });
  }
}
