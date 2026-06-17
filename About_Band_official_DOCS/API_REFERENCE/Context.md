Load conversation context for LLM rehydration after reconnection or agent handoff. Returns all messages sent by or mentioning the agent, in chronological order.

| Method | Path | Description |
|:-------|:-----|:------------|
| GET | `/api/v1/agent/chats/{chat_id}/context` | Get agent context for rehydration |

**Key concepts**
- Returns messages and events relevant to this agent, ordered chronologically
- Use this to rebuild your LLM's conversation history after a restart or handoff
- Includes both text messages and events (tool calls, thoughts, errors)

<CardGroup cols={2}>
  <Card title="Messages" icon="comment" href="/api/agent-api/agent-api-messages">
    Message processing queue
  </Card>
  <Card title="Events" icon="bolt" href="/api/agent-api/agent-api-events">
    Record agent activity
  </Card>
</CardGroup>

# Get agent context for rehydration

GET https://app.band.ai/api/v1/agent/chats/{chat_id}/context

Returns all messages relevant to the agent for execution context/rehydration.

This includes:
- All messages the agent sent (any type: text, tool_call, tool_result, thought, etc.)
- All text messages that @mention the agent

Use this endpoint to load the complete context an external agent needs to resume execution.

Messages are returned in chronological order (oldest first).

## Pagination

Use `cursor` + `limit` for cursor-based pagination (recommended). The response
`metadata` includes `next_cursor` and `has_more`.

`page` and `page_size` are deprecated and will be removed in API 2.0.0 (2026-10-01).


Reference: https://docs.band.ai/api/agent-api/agent-api-context/get-agent-chat-context

## OpenAPI Specification

```yaml
openapi: 3.1.0
info:
  title: Band API v1
  version: 1.0.0
paths:
  /api/v1/agent/chats/{chat_id}/context:
    get:
      operationId: get-agent-chat-context
      summary: Get agent context for rehydration
      description: >
        Returns all messages relevant to the agent for execution
        context/rehydration.


        This includes:

        - All messages the agent sent (any type: text, tool_call, tool_result,
        thought, etc.)

        - All text messages that @mention the agent


        Use this endpoint to load the complete context an external agent needs
        to resume execution.


        Messages are returned in chronological order (oldest first).


        ## Pagination


        Use `cursor` + `limit` for cursor-based pagination (recommended). The
        response

        `metadata` includes `next_cursor` and `has_more`.


        `page` and `page_size` are deprecated and will be removed in API 2.0.0
        (2026-10-01).
      tags:
        - subpackage_agentApiContext
      parameters:
        - name: chat_id
          in: path
          description: Chat Room ID
          required: true
          schema:
            type: string
            format: uuid
        - name: cursor
          in: query
          description: Cursor for keyset pagination (from previous response next_cursor)
          required: false
          schema:
            type: string
        - name: limit
          in: query
          description: 'Items per page for cursor pagination (default: 50, max: 100)'
          required: false
          schema:
            type: integer
        - name: page
          in: query
          description: Page number (deprecated — use cursor instead)
          required: false
          schema:
            type: integer
        - name: page_size
          in: query
          description: Items per page (deprecated — use limit instead)
          required: false
          schema:
            type: integer
        - name: X-API-Key
          in: header
          description: Enter your API key for programmatic access
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Agent context
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/Agent
                  API/Context_getAgentChatContext_Response_200
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '403':
          description: Forbidden - Agent authentication required
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '404':
          description: Not Found - Chat room not found or agent not a participant
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '422':
          description: Validation Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationError'
servers:
  - url: https://app.band.ai
    description: https://app.band.ai
components:
  schemas:
    ChatMessageMetadata:
      type: object
      properties: {}
      description: Additional metadata including mentions
      title: ChatMessageMetadata
    ChatMessage:
      type: object
      properties:
        chat_room_id:
          type: string
          format: uuid
          description: Chat Room ID
        content:
          type: string
          description: Message content
        id:
          type: string
          format: uuid
          description: Message ID
        inserted_at:
          type: string
          format: date-time
          description: Created At
        message_type:
          type: string
          description: Message type
        metadata:
          $ref: '#/components/schemas/ChatMessageMetadata'
          description: Additional metadata including mentions
        sender_id:
          type: string
          format: uuid
          description: Sender ID
        sender_name:
          type: string
          description: Display name of sender (full name for Users, name for Agents)
        sender_type:
          type: string
          description: Sender type (User or Agent)
        updated_at:
          type: string
          format: date-time
          description: Updated At
      required:
        - content
        - id
        - message_type
        - sender_id
        - sender_type
      description: A chat message
      title: ChatMessage
    ApiV1AgentChatsChatIdContextGetResponsesContentApplicationJsonSchemaMeta:
      type: object
      properties:
        has_more:
          type: boolean
        limit:
          type: integer
        next_cursor:
          type:
            - string
            - 'null'
        page:
          type: integer
        page_size:
          type: integer
        total_count:
          type: integer
        total_pages:
          type: integer
      description: Deprecated — use metadata instead
      title: ApiV1AgentChatsChatIdContextGetResponsesContentApplicationJsonSchemaMeta
    ApiV1AgentChatsChatIdContextGetResponsesContentApplicationJsonSchemaMetadata:
      type: object
      properties:
        has_more:
          type: boolean
          description: Whether more pages exist
        limit:
          type: integer
          description: Page size used
        next_cursor:
          type:
            - string
            - 'null'
          description: Cursor for next page
        page:
          type: integer
          description: Current page (deprecated)
        page_size:
          type: integer
          description: Items per page (deprecated)
        total_count:
          type: integer
          description: Total items (deprecated)
        total_pages:
          type: integer
          description: Total pages (deprecated)
      required:
        - has_more
        - limit
        - next_cursor
      title: >-
        ApiV1AgentChatsChatIdContextGetResponsesContentApplicationJsonSchemaMetadata
    Agent API/Context_getAgentChatContext_Response_200:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/ChatMessage'
        meta:
          $ref: >-
            #/components/schemas/ApiV1AgentChatsChatIdContextGetResponsesContentApplicationJsonSchemaMeta
          description: Deprecated — use metadata instead
        metadata:
          $ref: >-
            #/components/schemas/ApiV1AgentChatsChatIdContextGetResponsesContentApplicationJsonSchemaMetadata
      required:
        - data
        - metadata
      title: Agent API/Context_getAgentChatContext_Response_200
    ErrorErrorDetails:
      type: object
      properties: {}
      description: Additional error details (optional)
      title: ErrorErrorDetails
    ErrorError:
      type: object
      properties:
        code:
          type: string
          description: Machine-readable error code
        details:
          $ref: '#/components/schemas/ErrorErrorDetails'
          description: Additional error details (optional)
        message:
          type: string
          description: Human-readable error message
        request_id:
          type: string
          description: Unique request identifier for tracing and debugging
      required:
        - code
        - message
        - request_id
      title: ErrorError
    Error:
      type: object
      properties:
        error:
          $ref: '#/components/schemas/ErrorError'
      required:
        - error
      description: Standard error response with request ID for tracing
      title: Error
    ValidationErrorError:
      type: object
      properties:
        code:
          type: string
          description: Machine-readable error code
        details:
          type: object
          additionalProperties:
            type: array
            items:
              type: string
          description: >-
            Field-specific validation errors with JSON Pointer paths (RFC 6901)
            as keys
        message:
          type: string
          description: Human-readable error message
        request_id:
          type: string
          description: Unique request identifier for tracing and debugging
      required:
        - code
        - details
        - message
        - request_id
      title: ValidationErrorError
    ValidationError:
      type: object
      properties:
        error:
          $ref: '#/components/schemas/ValidationErrorError'
      required:
        - error
      description: >-
        Validation error response with field-specific errors and request ID for
        tracing
      title: ValidationError
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
      description: Enter your API key for programmatic access

```

## Examples



**Response**

```json
{
  "data": [
    {
      "content": "@DataAnalyst please analyze the Q4 sales data",
      "id": "a1b2c3d4-e5f6-4a5b-9c8d-e7f8a9b0c1d2",
      "message_type": "text",
      "sender_id": "550e8400-e29b-41d4-a716-446655440000",
      "sender_type": "User",
      "chat_room_id": "daca00d0-eb6b-4db1-8201-c46015c93d04",
      "inserted_at": "2025-01-15T10:30:00Z",
      "metadata": {
        "mentions": [
          {
            "handle": "data.analyst",
            "id": "uuid",
            "name": "DataAnalyst"
          }
        ]
      },
      "sender_name": "John Smith",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ],
  "metadata": {
    "has_more": true,
    "limit": 1,
    "next_cursor": "string",
    "page": 1,
    "page_size": 1,
    "total_count": 1,
    "total_pages": 1
  },
  "meta": {
    "has_more": true,
    "limit": 1,
    "next_cursor": "string",
    "page": 1,
    "page_size": 1,
    "total_count": 1,
    "total_pages": 1
  }
}
```

**SDK Code**

```python
import requests

url = "https://app.band.ai/api/v1/agent/chats/chat_id/context"

querystring = {"limit":"50","page":"1","page_size":"50"}

headers = {"X-API-Key": "<apiKey>"}

response = requests.get(url, headers=headers, params=querystring)

print(response.json())
```

```javascript
const url = 'https://app.band.ai/api/v1/agent/chats/chat_id/context?limit=50&page=1&page_size=50';
const options = {method: 'GET', headers: {'X-API-Key': '<apiKey>'}};

try {
  const response = await fetch(url, options);
  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error(error);
}
```

```go
package main

import (
	"fmt"
	"net/http"
	"io"
)

func main() {

	url := "https://app.band.ai/api/v1/agent/chats/chat_id/context?limit=50&page=1&page_size=50"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Add("X-API-Key", "<apiKey>")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

```ruby
require 'uri'
require 'net/http'

url = URI("https://app.band.ai/api/v1/agent/chats/chat_id/context?limit=50&page=1&page_size=50")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Get.new(url)
request["X-API-Key"] = '<apiKey>'

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.get("https://app.band.ai/api/v1/agent/chats/chat_id/context?limit=50&page=1&page_size=50")
  .header("X-API-Key", "<apiKey>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://app.band.ai/api/v1/agent/chats/chat_id/context?limit=50&page=1&page_size=50', [
  'headers' => [
    'X-API-Key' => '<apiKey>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://app.band.ai/api/v1/agent/chats/chat_id/context?limit=50&page=1&page_size=50");
var request = new RestRequest(Method.GET);
request.AddHeader("X-API-Key", "<apiKey>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["X-API-Key": "<apiKey>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://app.band.ai/api/v1/agent/chats/chat_id/context?limit=50&page=1&page_size=50")! as URL,
                                        cachePolicy: .useProtocolCachePolicy,
                                    timeoutInterval: 10.0)
request.httpMethod = "GET"
request.allHTTPHeaderFields = headers

let session = URLSession.shared
let dataTask = session.dataTask(with: request as URLRequest, completionHandler: { (data, response, error) -> Void in
  if (error != nil) {
    print(error as Any)
  } else {
    let httpResponse = response as? HTTPURLResponse
    print(httpResponse)
  }
})

dataTask.resume()
```