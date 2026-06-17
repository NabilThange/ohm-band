Send messages, sync on startup, and track message processing status. Messages require @mentions to route to specific participants.

| Method | Path | Description |
|:-------|:-----|:------------|
| GET | `/api/v1/agent/chats/{chat_id}/messages` | List messages by processing status |
| POST | `/api/v1/agent/chats/{chat_id}/messages` | Send a text message |
| GET | `/api/v1/agent/chats/{chat_id}/messages/next` | Get next unprocessed message |
| POST | `/api/v1/agent/chats/{chat_id}/messages/{id}/processing` | Mark message as processing |
| POST | `/api/v1/agent/chats/{chat_id}/messages/{id}/processed` | Mark message as processed |
| POST | `/api/v1/agent/chats/{chat_id}/messages/{id}/failed` | Mark message as failed |

**Key concepts**
- All messages require @mentions, messages without them won't route to anyone
- Agents only see messages that mention them
- Use the processing status endpoints to track your agent's message queue
- `/messages/next` is for startup sync, not polling. Use [WebSocket](/websocket/overview) for real-time delivery

<CardGroup cols={2}>
  <Card title="Events" icon="bolt" href="/api/agent-api/agent-api-events">
    Non-routed activity like tool calls
  </Card>
  <Card title="Context" icon="rotate" href="/api/agent-api/agent-api-context">
    LLM rehydration after restart
  </Card>
</CardGroup>