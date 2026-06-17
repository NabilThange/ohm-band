Okay, I've read all the key Band docs. Here's everything you need to know clearly laid out.

---

## Band — What It Actually Is

**Band is a communication bus for AI agents.** Think of it as a group chat platform where the participants are AI agents (and optionally humans). The key thing: it's NOT an orchestration framework — it doesn't tell agents what to do or in what order. It's purely a messaging and routing layer.

---

## The 3 Core Concepts

**1. Agents — Two types:**
- **Remote agents** — run on YOUR server, connect to Band via their Python SDK (`band-sdk`, also called `thenvoi`). You control the LLM, the logic, everything. This is what you'll use.
- **Platform agents** — configured and run entirely on Band's servers. Quick to set up but less flexible.

**2. Chat Rooms — The coordination space:**
- Rooms are where agents meet and talk
- Routing is purely `@mention` based — if a message doesn't mention you, you don't receive it
- Humans see ALL messages. Agents only see messages that `@mention` them
- Rooms support sequential, parallel, or dynamic patterns

**3. The @mention system:**
- To pass work from AgentA to AgentB, AgentA sends a message: `"@BOMAgent here's the finalized spec: ..."`
- BOMAgent receives it and processes it
- That's literally the handoff mechanism

---

## The SDK (called `thenvoi`)

Install: `pip install band-sdk[langgraph]` or `[anthropic]` etc.

```python
from thenvoi import Agent
from thenvoi.adapters import LangGraphAdapter

adapter = LangGraphAdapter(llm=YourLLM(), ...)
agent = Agent.create(adapter=adapter, agent_id="...", api_key="...")
await agent.run()  # connects via WebSocket, runs forever
```

**Critical gotcha**: agents MUST use `thenvoi_send_message` tool to communicate. If the LLM just returns text without calling that tool, nobody sees it — it's treated as an internal thought.

---

## Available Adapters (Built-in)

LangGraph, CrewAI, Pydantic AI, Anthropic, OpenAI, Gemini, Google ADK, Claude SDK, and more. Also **custom adapters** — you implement one method: `on_message()`.

---

## Answer to Your Free LLM Question

**YES, you can use Groq, Gemini, OpenRouter — Band doesn't care at all about what LLM you use.**

Band only cares that your agent:
1. Connects via their SDK (WebSocket)
2. Receives messages via `@mention`
3. Sends responses using `thenvoi_send_message` tool

The LLM powering each agent is entirely your business. Here's how each free option maps:

**Groq** — Use the `LangGraphAdapter` with `langchain_groq.ChatGroq`. Or build a custom adapter calling Groq's API (OpenAI-compatible). Works perfectly.

**Gemini** — Band has a built-in `GeminiAdapter`. First-class support, zero hassle. Gemini Flash is free tier, has tool use, big context.

**OpenRouter** — OpenAI-compatible API, so use `OpenAIAdapter` or LangGraph with `ChatOpenAI` pointing at `https://openrouter.ai/api/v1`. Any model on OpenRouter works.

**Best strategy for Ohm:**
- Use **Gemini Flash** (free, big context, has tools, Band has native adapter) for your heavier agents — Orchestrator, BOM Generator, Conversational
- Use **Groq with Llama or Mixtral** (free, very fast) for quick agents — title generation, summarizer
- Use **OpenRouter free models** as fallback

You won't need to pay for a single LLM call.

---

## How Ohm's Agent Flow Maps to Band

Your current Ohm flow (all internal, silent):
```
User → Orchestrator → SpecialistAgent → DB → UI
```

With Band, the same flow becomes visible coordination:
```
User types in Ohm UI
  → Your backend opens/joins a Band room
  → @mentions OrchestratorAgent
  → Orchestrator posts to Band: "@BOMAgent here's the spec: {json}"
  → BOMAgent receives it, generates BOM, posts to Band: "@OhmBackend done: {bom_json}"
  → Your backend receives it, writes to Supabase, triggers drawer open
  → Human sees the Band room activity in Ohm's UI — live agent chat
```

The Band room IS the visible coordination layer judges see. Supabase is still your persistence layer underneath.

---

## Human-in-the-Loop

Yes, fully supported. The pattern is simple: an agent posts a message to the room that `@mentions` the human user (or a dedicated "approval" agent). The workflow simply pauses because no agent is mentioned — nothing happens until the human replies and @mentions the next agent to continue.

For Ohm this means: after the Conversational agent has gathered enough info, it posts something like `"@[username] I've gathered everything I need. Here's the plan: [summary]. Reply with CONFIRM to proceed to BOM generation."` The user confirms, the system @mentions the BOMAgent, work continues.

---

## The One Thing to Know for Your Coding Agent

The SDK package is called `thenvoi` (that's the import name), but the install name is `band-sdk`. Don't get confused by this — it's the same thing. Band rebranded from Thenvoi, hence the legacy naming.

```bash
pip install band-sdk[langgraph]   # install name
from thenvoi import Agent          # import name
```

For Ohm, since your backend is Next.js (TypeScript), note that Band has **TypeScript SDK** support too — same `band-sdk` package, TypeScript adapters for OpenAI, LangGraph, etc. So you can call Band from your existing Next.js API routes directly without spinning up a separate Python service, if you prefer.
