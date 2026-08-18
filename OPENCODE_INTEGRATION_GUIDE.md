# Complete Guide: Using OpenCode as a Headless AI Backend Service

This guide explains how **OpenCode** is integrated into this codebase as the core AI engine, how Server-Sent Events (SSE) streaming works, how OpenCode controls external systems via MCP, and how any developer can replicate this architecture as a background AI service in any project.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Frontend (React / Any Client)                    │
│  - Sends user prompt via HTTP POST to Backend API                       │
│  - Listens to Live SSE Stream for tokens, reasoning & tool executions   │
└───────────────────▲─────────────────────────────────┬───────────────────┘
                    │ (SSE Events)                    │ (POST /chat)
                    │                                 ▼
┌───────────────────┴─────────────────────────────────────────────────────┐
│                       Backend API (Hono / Express / FastAPI)            │
│  - /api/opencode/events  ──(Proxy GET /event)─────────────────┐         │
│  - /api/opencode/chat    ──(POST /session/:id/message)──────┐ │         │
└─────────────────────────────────────────────────────────────┼─┼─────────┘
                                                              │ │
                                                              ▼ ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   OpenCode Server (Headless Daemon on :4096)            │
│  - Command: opencode serve --port 4096 --hostname 127.0.0.1             │
│  - Config: opencode.json (models, permissions, system prompt)           │
│  - Engine: LLM + ReAct Execution Loop                                   │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │ (stdio JSON-RPC)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   Model Context Protocol (MCP) Servers                  │
│  - External tools (e.g. Gmail API, Database, Stripe, GitHub, File I/O) │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. How OpenCode Works Under the Hood

OpenCode is an AI agent runtime that can run in headless server mode (`opencode serve`). When running as a server, it exposes a local HTTP REST and SSE interface:

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/global/health` | `GET` | Server health check (returns status 200 when ready). |
| `/session` | `POST` | Creates an isolated conversation session. Returns `{ id: "session-id" }`. |
| `/session/:id/message` | `POST` | Sends a prompt or system directive to the session. OpenCode runs the LLM ReAct loop (calling tools as needed) and returns the final parts payload. |
| `/event` | `GET` | Server-Sent Events (SSE) stream emitting real-time token deltas, tool calls, and lifecycle events across sessions. |

---

## 3. Configuration: `opencode.json`

OpenCode is configured via an `opencode.json` file located in the working directory from which it is launched:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/deepseek-v4-flash-free",
  "default_agent": "build",
  "agent": {
    "build": {
      "model": "opencode/deepseek-v4-flash-free",
      "prompt": "You are an Executive AI Assistant. You execute actions via MCP tools.",
      "tools": {
        "skill": true,
        "bash": false,
        "write": false,
        "edit": false,
        "glob": false,
        "grep": false,
        "task": false,
        "question": false
      }
    }
  },
  "mcp": {
    "gmail": {
      "type": "local",
      "command": [
        "node",
        "./TheCourier-Gmail-MCP/dist/index.js"
      ],
      "enabled": true
    }
  },
  "permission": {
    "tools": {
      "search_emails": "allow",
      "read_email": "allow",
      "draft_email": "allow",
      "delete_email": "ask",
      "send_email": "ask"
    }
  }
}
```

### Key Configuration Sections:
1. **`model`**: The LLM model identifier (e.g. DeepSeek, Anthropic Claude, OpenAI, or custom endpoint).
2. **`agent.<name>.prompt`**: The base system prompt and behavioral directives.
3. **`agent.<name>.tools`**: Enable or disable built-in developer tools (e.g., turn off terminal `bash` access in production if you only want MCP tools).
4. **`mcp`**: Defines local or remote MCP servers. OpenCode automatically launches these subprocesses via stdio and exposes their tools to the LLM.
5. **`permission.tools`**: Granular security rules:
   - `"allow"`: Automatically permitted.
   - `"ask"`: Requires approval confirmation.
   - `"deny"`: Blocked from invocation.

---

## 4. How Server-Sent Events (SSE) Are Implemented

Real-time streaming is achieved using a dual HTTP mechanism:
1. The client opens an **SSE stream** to receive live token deltas and tool execution updates.
2. The client dispatches user prompts via **HTTP POST**.

### A. The Backend SSE Proxy
The backend proxies OpenCode's `/event` endpoint to the frontend:

```typescript
// Hono / Express Example
app.get("/api/opencode/events", async (c) => {
  const res = await fetch("http://127.0.0.1:4096/event");
  if (!res.ok || !res.body) {
    return c.text("OpenCode SSE unavailable", 502);
  }
  return new Response(res.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
```

### B. OpenCode SSE Event Structure
OpenCode streams JSON events with the following types:

#### 1. `message.part.delta` (Word-by-word streaming)
Emitted as the LLM generates tokens for reasoning or final text:
```json
{
  "type": "message.part.delta",
  "properties": {
    "partID": "part_123",
    "messageID": "msg_456",
    "delta": "Here is the summary"
  }
}
```

#### 2. `message.part.updated` (Tool executions & part metadata)
Emitted when a tool starts running, completes, or reasoning starts:
```json
{
  "type": "message.part.updated",
  "properties": {
    "part": {
      "id": "part_789",
      "type": "tool",
      "tool": "search_emails",
      "state": "completed",
      "args": { "query": "from:support" }
    }
  }
}
```

#### 3. `session.idle` / `session.status` (Turn Completion)
Emitted when the AI has finished its execution loop and is waiting for user input:
```json
{
  "type": "session.idle",
  "properties": {
    "sessionID": "session_abc"
  }
}
```

### C. Frontend SSE Listener (React Hook Example)
```typescript
import { useEffect, useState } from "react";

export function useOpenCodeSSE() {
  const [streamedText, setStreamedText] = useState("");
  const [activeTools, setActiveTools] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const es = new EventSource("/api/opencode/events");

    es.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data);

        // Handle streaming token delta
        if (evt.type === "message.part.delta" && evt.properties?.delta) {
          setStreamedText((prev) => prev + evt.properties.delta);
        }

        // Handle tool calls
        if (evt.type === "message.part.updated" && evt.properties?.part) {
          const part = evt.properties.part;
          if (part.type === "tool" || part.tool) {
            setActiveTools((prev) => [...prev, part]);
          }
        }

        // Handle stream completion
        if (evt.type === "session.idle") {
          setIsStreaming(false);
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    return () => es.close();
  }, []);

  return { streamedText, activeTools, isStreaming, setIsStreaming };
}
```

---

## 5. How OpenCode Controls Things (The ReAct Tool Loop)

When a prompt is sent to OpenCode:
1. **Prompt Ingestion**: OpenCode loads the session history + system prompt from `opencode.json`.
2. **Tool Discovery**: OpenCode queries all registered MCP servers for available tool schemas.
3. **Model Step**: The LLM decides whether to respond directly or invoke a tool.
4. **Execution**: If the model requests a tool call (e.g. `search_emails({ q: "is:unread" })`), OpenCode calls the MCP server subprocess via JSON-RPC.
5. **Observation**: The MCP tool returns JSON/text output. OpenCode feeds this back to the LLM.
6. **Final Output**: The LLM synthesizes the tool results and streams the final answer back to the user.

---

## 6. How to Run OpenCode as a Background Service

### Option A: PM2 (Recommended for Production & VPS)
1. Install PM2:
   ```bash
   npm install -g pm2
   ```
2. Create `ecosystem.config.cjs`:
   ```javascript
   module.exports = {
     apps: [
       {
         name: "opencode-ai-service",
         script: "opencode",
         args: "serve --port 4096 --hostname 127.0.0.1 --log-level WARN",
         env: {
           OPENCODE_DISABLE_CLAUDE_CODE: "true",
         },
         restart_delay: 3000,
         max_restarts: 10,
       },
     ],
   };
   ```
3. Start and save the service:
   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```

---

### Option B: Node.js Child Process (For Dev Servers & Monorepos)
You can spawn OpenCode programmatically when your main backend starts (see `scripts/dev.mjs`):

```javascript
import { spawn } from "node:child_process";

export function startOpenCodeService(port = 4096) {
  const opencode = spawn("opencode", [
    "serve",
    "--port", String(port),
    "--hostname", "127.0.0.1",
    "--log-level", "WARN",
  ], {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      OPENCODE_DISABLE_CLAUDE_CODE: "true",
    },
  });

  process.on("exit", () => opencode.kill());
  return opencode;
}
```

---

### Option C: Systemd Service (Linux Production)
Create `/etc/systemd/system/opencode.service`:
```ini
[Unit]
Description=OpenCode Headless AI Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/my-app
ExecStart=/usr/local/bin/opencode serve --port 4096 --hostname 127.0.0.1 --log-level WARN
Restart=always
RestartSec=5
Environment=OPENCODE_DISABLE_CLAUDE_CODE=true

[Install]
WantedBy=multi-user.target
```
Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now opencode
```

---

### Option D: Docker Container
```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN npm install -g opencode-ai
COPY opencode.json ./
EXPOSE 4096
ENV OPENCODE_DISABLE_CLAUDE_CODE=true
CMD ["opencode", "serve", "--port", "4096", "--hostname", "0.0.0.0", "--log-level", "WARN"]
```

---

## 7. Step-by-Step Template to Add OpenCode to Any Project

### Step 1: Create `opencode.json` in your project root
Define your model, system prompt, and any MCP tools you need.

### Step 2: Start OpenCode Server
```bash
opencode serve --port 4096 --hostname 127.0.0.1
```

### Step 3: Implement the Backend Dispatcher
```typescript
// Express / Hono / Next.js API Route
export async function sendPromptToOpenCode(sessionId: string, promptText: string) {
  // 1. Ensure session exists
  if (!sessionId) {
    const res = await fetch("http://127.0.0.1:4096/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `chat-${Date.now()}` }),
    });
    const data = await res.json();
    sessionId = data.id;
  }

  // 2. Post prompt message
  const messageRes = await fetch(`http://127.0.0.1:4096/session/${sessionId}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      parts: [{ type: "text", text: promptText }],
    }),
  });

  const result = await messageRes.json();
  return { sessionId, result };
}
```

### Step 4: Hook up SSE in the UI
Subscribe to `http://127.0.0.1:4096/event` via `EventSource` to render word-by-word streaming and tool activity in real time.

---

## 8. Summary Checklist for Handing Off to a Developer

- [x] **Runtime**: OpenCode CLI installed and accessible in `PATH`.
- [x] **Config**: `opencode.json` created with desired LLM model and MCP tools.
- [x] **Daemon**: Run via `opencode serve --port 4096` (using PM2 or systemd in production).
- [x] **Session Flow**: Create session via `POST /session`, dispatch prompt via `POST /session/:id/message`.
- [x] **Streaming**: Stream reasoning and token deltas live via `GET /event` (SSE).
