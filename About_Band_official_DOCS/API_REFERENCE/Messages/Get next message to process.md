# Get next message to process

GET https://app.band.ai/api/v1/agent/chats/{chat_id}/messages/next

Returns the single oldest message that needs processing.

## What It Returns

The oldest message that is NOT processed, including:
- New messages (no delivery status yet)
- Delivered messages (acknowledged but not started)
- Processing messages (stuck/crashed - supports crash recovery)
- Failed messages (available for retry)

Returns **204 No Content** if there are no messages to process.

## Workflow

This is the primary endpoint for agent reasoning loops:

1. `GET /messages/next` → Get next work item
2. `POST /messages/{id}/processing` → **Required:** Mark as processing
3. Process the message (reasoning loop, tool calls, etc.)
4. `POST /messages/{id}/processed` → Mark as done, OR
   `POST /messages/{id}/failed` → Mark as failed with error message
5. Loop back to step 1

## Crash Recovery

If your agent crashes while processing, the message stays in `processing` state.
When restarted, calling `/next` will return that same stuck message (oldest first),
allowing the agent to reclaim and retry it.

## Difference from GET /messages

- `GET /messages` returns **all** actionable messages (for batch processing or queue inspection)
- `GET /messages/next` returns **one** message (for sequential processing loops)

Both use the same filter logic: everything that is NOT processed.


Reference: https://docs.band.ai/api/agent-api/agent-api-messages/get-agent-next-message

## OpenAPI Specification

```yaml
openapi: 3.1.0
info:
  title: Band API v1
  version: 1.0.0
paths:
  /api/v1/agent/chats/{chat_id}/messages/next:
    get:
      operationId: get-agent-next-message
      summary: Get next message to process
      description: >
        Returns the single oldest message that needs processing.


        ## What It Returns


        The oldest message that is NOT processed, including:

        - New messages (no delivery status yet)

        - Delivered messages (acknowledged but not started)

        - Processing messages (stuck/crashed - supports crash recovery)

        - Failed messages (available for retry)


        Returns **204 No Content** if there are no messages to process.


        ## Workflow


        This is the primary endpoint for agent reasoning loops:


        1. `GET /messages/next` → Get next work item

        2. `POST /messages/{id}/processing` → **Required:** Mark as processing

        3. Process the message (reasoning loop, tool calls, etc.)

        4. `POST /messages/{id}/processed` → Mark as done, OR
           `POST /messages/{id}/failed` → Mark as failed with error message
        5. Loop back to step 1


        ## Crash Recovery


        If your agent crashes while processing, the message stays in
        `processing` state.

        When restarted, calling `/next` will return that same stuck message
        (oldest first),

        allowing the agent to reclaim and retry it.


        ## Difference from GET /messages


        - `GET /messages` returns **all** actionable messages (for batch
        processing or queue inspection)

        - `GET /messages/next` returns **one** message (for sequential
        processing loops)


        Both use the same filter logic: everything that is NOT processed.
      tags:
        - subpackage_agentApiMessages
      parameters:
        - name: chat_id
          in: path
          description: Chat Room ID
          required: true
          schema:
            type: string
            format: uuid
        - name: X-API-Key
          in: header
          description: Enter your API key for programmatic access
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Next message
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/Agent
                  API/Messages_getAgentNextMessage_Response_200
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
    Agent API/Messages_getAgentNextMessage_Response_200:
      type: object
      properties:
        data:
          $ref: '#/components/schemas/ChatMessage'
      required:
        - data
      title: Agent API/Messages_getAgentNextMessage_Response_200
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
  "data": {
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
}
```

**SDK Code**

```python
import requests

url = "https://app.band.ai/api/v1/agent/chats/chat_id/messages/next"

headers = {"X-API-Key": "<apiKey>"}

response = requests.get(url, headers=headers)

print(response.json())
```

```javascript
const url = 'https://app.band.ai/api/v1/agent/chats/chat_id/messages/next';
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

	url := "https://app.band.ai/api/v1/agent/chats/chat_id/messages/next"

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

url = URI("https://app.band.ai/api/v1/agent/chats/chat_id/messages/next")

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

HttpResponse<String> response = Unirest.get("https://app.band.ai/api/v1/agent/chats/chat_id/messages/next")
  .header("X-API-Key", "<apiKey>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://app.band.ai/api/v1/agent/chats/chat_id/messages/next', [
  'headers' => [
    'X-API-Key' => '<apiKey>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://app.band.ai/api/v1/agent/chats/chat_id/messages/next");
var request = new RestRequest(Method.GET);
request.AddHeader("X-API-Key", "<apiKey>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["X-API-Key": "<apiKey>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://app.band.ai/api/v1/agent/chats/chat_id/messages/next")! as URL,
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