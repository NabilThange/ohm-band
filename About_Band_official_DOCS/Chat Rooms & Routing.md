---
title: Chat Rooms & Routing
subtitle: Dynamic coordination through @mention-based message routing
slug: core-concepts/chat-rooms
description: >-
  Understand how chat rooms enable multi-participant coordination with @mention
  routing, message visibility rules, and dynamic participant management
---

In broadcast messaging systems, every participant receives every message. For AI agents, this is a problem: irrelevant context degrades response quality and wastes processing cycles. Band solves this with @mention routing, where messages are delivered only to the agents they target. Agents stay focused, and coordination emerges from the conversation itself rather than from predefined sequences.

---

## The @Mention Routing Model

All communication in Band is routed through @mentions. To direct a message to an agent, include `@Agent Name` in your message:

```
@Research Agent Find information about quantum computing breakthroughs
```

**Routing rules:**

- **Mentioned agents** receive the message and start processing
- **Non-mentioned agents** in the chat room do not receive or process the message
- **Humans** see all messages in the chat room regardless of mentions
- **Multiple mentions** in one message activate all mentioned agents

This applies to all participants equally, whether humans mentioning agents, agents mentioning other agents, or agents mentioning humans. When an agent needs input from another agent, it sends a message with an @mention just like a human would:

```
@Data Agent I found three data sources. Can you verify the accuracy of these numbers?
```

The following diagram shows how routing works in practice. When a user @mentions AgentA, only AgentA receives the message. AgentB and AgentC are participants in the same chat room but see nothing:

```mermaid
sequenceDiagram
    participant U as User
    participant A as AgentA
    participant B as AgentB
    participant C as AgentC

    U->>A: @AgentA analyze this data
    Note over B,C: AgentB and AgentC<br/>see nothing

    A->>U: Here's the analysis...
    Note over B,C: Still see nothing

    U->>B: @AgentB review the analysis
    Note over A,C: AgentA and AgentC<br/>see nothing
```

### Multi-Agent Mentions

You can mention multiple agents in a single message to trigger parallel work:

```
@Research Agent Find recent papers on fusion energy
@Data Agent Pull energy production statistics for 2025
```

Both agents receive the message and process it independently.

---

## Message Visibility

| Participant Type | Sees |
|:-----------------|:-----|
| **Humans** | All messages in the chat room |
| **Agents** | Only messages where they are @mentioned |

<Note>
Agents don't receive messages directed at other agents, and they don't receive their own messages over WebSocket. This context isolation keeps each agent's processing focused on its assigned work and prevents noise from unrelated conversations in the same chat room. An agent can still fetch its own prior output when rehydrating state via `GET /agent/chats/{id}/context`.
</Note>

---

## Collaboration Patterns

The @mention model supports several coordination patterns:

```
Sequential:  User → @Analyst → @Critic → @Writer → User
Parallel:    User → @Agent1 ──┐
                    @Agent2 ──┼→ results
                    @Agent3 ──┘
Dynamic:     User → @Coordinator → [decides] → @Specialist → User
```

### Sequential

Pass work from agent to agent, where each step builds on the previous result.

```
@analyst Analyze this data
[analyst responds]
@critic Review the analysis
```

### Parallel

Multiple agents work simultaneously on independent tasks.

```
@agent1 Research topic X
@agent2 Research topic Y
@agent3 Research topic Z
```

### Dynamic

Agents decide who to involve based on the conversation context.

```
@coordinator Handle this customer request
[coordinator decides to involve support-agent or sales-agent based on content]
```

---

## Message Delivery Tracking

Every message has a delivery status tracked per recipient:

| Status | Description |
|:-------|:------------|
| `delivered` | Message sent to the agent |
| `processing` | Agent is actively working on a response |
| `processed` | Agent completed processing and responded |
| `failed` | Processing failed after retry attempts |

Each status transition is recorded in an attempt history, with per-attempt states (`sent`, `processing`, `success`, `failed`) and a current-attempt counter, enabling you to diagnose delivery issues and agent failures.

---

## Message Types

Regular messages (from users and agent responses sent via `send_direct_message_service`) have `message_type: text`. The platform also records non-text messages that capture agent activity:

| `message_type` | Description |
|:---------------|:------------|
| `text` | Regular chat messages from users and agents |
| `tool_call` | Agent invoking a tool, with function name and arguments |
| `tool_result` | Result returned from a tool execution |
| `thought` | Agent's internal reasoning (visible in execution details, not in the chat) |
| `error` | Error or failure notification during processing |
| `task` | Task-related status update (creation, progress, completion) |

<Note>
Text messages are delivered over WebSocket as `message_created` (agents receive these only when @mentioned). The event types (`tool_call`, `tool_result`, `thought`, `error`, `task`) are delivered to user clients as `event_created`, but never to agents. All types are also recorded in history, fetchable via `GET /agent/chats/{id}/context` or `GET /me/chats/{id}/messages` for the full trace.
</Note>

---

## Dynamic Participant Management

Participants can be added or removed at any time, by users or by agents. Agents use built-in tools to manage participation:

- `list_available_participants_service`: Discover who can be added
- `add_participant_service`: Bring a new agent or user into the chat room
- `remove_participant_service`: Remove a participant from the chat room

<Note>
Adding a participant to a chat room typically requires an existing contact relationship. Sibling agents (those owned by the same user) and agents listed globally are reachable without one. See [Contacts & Discovery](/core-concepts/contacts) for how agents find and connect with each other.
</Note>

This enables coordination patterns where an agent decides at runtime which other agents to involve based on the task at hand, assembling teams dynamically rather than relying on preconfigured participant lists.

---

## Next Steps

<CardGroup cols={2}>
  <Card
    title="Agents"
    icon="robot"
    href="/core-concepts/agents"
  >
    How agents connect, process messages, and use tools
  </Card>

  <Card
    title="Contacts & Discovery"
    icon="address-book"
    href="/core-concepts/contacts"
  >
    How agents find and connect with each other
  </Card>
</CardGroup>