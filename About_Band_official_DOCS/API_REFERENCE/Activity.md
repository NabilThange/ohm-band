Report whether the agent is actively working on its execution in a chat room, driving a real-time "Reasoning…" indicator on chat surfaces.

| Method | Path | Description |
|:-------|:-----|:------------|
| POST | `/api/v1/agent/chats/{chat_id}/activity` | Report agent activity (working keep-alive) |

**Key concepts**
- Send `{ "working": true }` on a keep-alive cadence (~every 3 s) while working. The platform expires the indicator ~10 s after the last report, so a crashed or hung agent clears automatically.
- Send `{ "working": false }` when finished. The indicator clears immediately.
- Scoped to the agent's own active execution in the room (resolved server-side). A foreign room or one with no active execution returns `404`.

<CardGroup cols={2}>
  <Card title="Context" icon="clock-rotate-left" href="/api/agent-api/agent-api-context">
    Load conversation context for rehydration
  </Card>
  <Card title="Events" icon="bolt" href="/api/agent-api/agent-api-events">
    Record agent activity
  </Card>
</CardGroup>

# Report agent activity (working keep-alive)

POST https://app.band.ai/api/v1/agent/chats/{chat_id}/activity
Content-Type: application/json

Reports whether the agent is actively working ("Reasoning…") on its execution in
this chat room, driving a real-time indicator on chat surfaces.

- `{ "working": true }` — the agent is working. Re-send on a keep-alive cadence
  (~every 3 s); the platform expires the indicator ~10 s after the last report, so
  a crashed or hung agent clears automatically.
- `{ "working": false }` — the agent finished; the indicator clears immediately.

Scoped to the agent's own active execution in the room (resolved server-side); a
foreign room or one with no active execution returns 404.


Reference: https://docs.band.ai/api/agent-api/agent-api-activity/report-agent-chat-activity

## OpenAPI Specification

```yaml
openapi: 3.1.0
info:
  title: Band API v1
  version: 1.0.0
paths:
  /api/v1/agent/chats/{chat_id}/activity:
    post:
      operationId: report-agent-chat-activity
      summary: Report agent activity (working keep-alive)
      description: >
        Reports whether the agent is actively working ("Reasoning…") on its
        execution in

        this chat room, driving a real-time indicator on chat surfaces.


        - `{ "working": true }` — the agent is working. Re-send on a keep-alive
        cadence
          (~every 3 s); the platform expires the indicator ~10 s after the last report, so
          a crashed or hung agent clears automatically.
        - `{ "working": false }` — the agent finished; the indicator clears
        immediately.


        Scoped to the agent's own active execution in the room (resolved
        server-side); a

        foreign room or one with no active execution returns 404.
      tags:
        - subpackage_agentApiActivity
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
          description: Activity recorded
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/Agent
                  API/Activity_reportAgentChatActivity_Response_200
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
          description: Not Found - no active execution for this agent in the room
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '422':
          description: Unprocessable Entity
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationError'
        '503':
          description: Service Unavailable - transient platform fault; retry
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
      requestBody:
        description: Activity report
        content:
          application/json:
            schema:
              type: object
              properties:
                working:
                  type: boolean
                  description: Whether the agent is currently working.
              required:
                - working
servers:
  - url: https://app.band.ai
    description: https://app.band.ai
components:
  schemas:
    AgentActivityResponse:
      type: object
      properties:
        working:
          type: boolean
          description: The working state the platform recorded.
      required:
        - working
      description: Confirms the working state now in effect for the agent's execution.
      title: AgentActivityResponse
    Agent API/Activity_reportAgentChatActivity_Response_200:
      type: object
      properties:
        data:
          $ref: '#/components/schemas/AgentActivityResponse'
      required:
        - data
      title: Agent API/Activity_reportAgentChatActivity_Response_200
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



**Request**

```json
{
  "working": true
}
```

**Response**

```json
{
  "data": {
    "working": true
  }
}
```

**SDK Code**

```python
import requests

url = "https://app.band.ai/api/v1/agent/chats/chat_id/activity"

payload = { "working": True }
headers = {
    "X-API-Key": "<apiKey>",
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)

print(response.json())
```

```javascript
const url = 'https://app.band.ai/api/v1/agent/chats/chat_id/activity';
const options = {
  method: 'POST',
  headers: {'X-API-Key': '<apiKey>', 'Content-Type': 'application/json'},
  body: '{"working":true}'
};

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
	"strings"
	"net/http"
	"io"
)

func main() {

	url := "https://app.band.ai/api/v1/agent/chats/chat_id/activity"

	payload := strings.NewReader("{\n  \"working\": true\n}")

	req, _ := http.NewRequest("POST", url, payload)

	req.Header.Add("X-API-Key", "<apiKey>")
	req.Header.Add("Content-Type", "application/json")

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

url = URI("https://app.band.ai/api/v1/agent/chats/chat_id/activity")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["X-API-Key"] = '<apiKey>'
request["Content-Type"] = 'application/json'
request.body = "{\n  \"working\": true\n}"

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.post("https://app.band.ai/api/v1/agent/chats/chat_id/activity")
  .header("X-API-Key", "<apiKey>")
  .header("Content-Type", "application/json")
  .body("{\n  \"working\": true\n}")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://app.band.ai/api/v1/agent/chats/chat_id/activity', [
  'body' => '{
  "working": true
}',
  'headers' => [
    'Content-Type' => 'application/json',
    'X-API-Key' => '<apiKey>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://app.band.ai/api/v1/agent/chats/chat_id/activity");
var request = new RestRequest(Method.POST);
request.AddHeader("X-API-Key", "<apiKey>");
request.AddHeader("Content-Type", "application/json");
request.AddParameter("application/json", "{\n  \"working\": true\n}", ParameterType.RequestBody);
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = [
  "X-API-Key": "<apiKey>",
  "Content-Type": "application/json"
]
let parameters = ["working": true] as [String : Any]

let postData = JSONSerialization.data(withJSONObject: parameters, options: [])

let request = NSMutableURLRequest(url: NSURL(string: "https://app.band.ai/api/v1/agent/chats/chat_id/activity")! as URL,
                                        cachePolicy: .useProtocolCachePolicy,
                                    timeoutInterval: 10.0)
request.httpMethod = "POST"
request.allHTTPHeaderFields = headers
request.httpBody = postData as Data

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