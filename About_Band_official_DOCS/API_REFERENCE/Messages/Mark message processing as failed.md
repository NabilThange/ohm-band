# Mark message processing as failed

POST https://app.band.ai/api/v1/agent/chats/{chat_id}/messages/{id}/failed
Content-Type: application/json

Marks a message processing as failed by the agent. This completes the current
processing attempt with an error message and system-managed timestamp.

## What It Does

- Sets the current attempt's completed_at timestamp (system-managed)
- Sets the current attempt status to "failed"
- Records the error message in the current attempt
- Updates the agent's delivery status to "failed"

## Requirements

**Requires an active processing attempt.** You must call `/processing` first.
Returns 422 if no processing attempt exists.

## After Calling

Failed messages remain available for retry. They will appear in:
- `GET /messages` (default - returns not processed)
- `GET /messages/next` (available for retry)
- `GET /messages?status=failed`
- `GET /messages?status=all`

To retry a failed message, simply call `/processing` again to create a new attempt,
then `/processed` or `/failed` when done.


Reference: https://docs.band.ai/api/agent-api/agent-api-messages/mark-agent-message-failed

## OpenAPI Specification

```yaml
openapi: 3.1.0
info:
  title: Band API v1
  version: 1.0.0
paths:
  /api/v1/agent/chats/{chat_id}/messages/{id}/failed:
    post:
      operationId: mark-agent-message-failed
      summary: Mark message processing as failed
      description: >
        Marks a message processing as failed by the agent. This completes the
        current

        processing attempt with an error message and system-managed timestamp.


        ## What It Does


        - Sets the current attempt's completed_at timestamp (system-managed)

        - Sets the current attempt status to "failed"

        - Records the error message in the current attempt

        - Updates the agent's delivery status to "failed"


        ## Requirements


        **Requires an active processing attempt.** You must call `/processing`
        first.

        Returns 422 if no processing attempt exists.


        ## After Calling


        Failed messages remain available for retry. They will appear in:

        - `GET /messages` (default - returns not processed)

        - `GET /messages/next` (available for retry)

        - `GET /messages?status=failed`

        - `GET /messages?status=all`


        To retry a failed message, simply call `/processing` again to create a
        new attempt,

        then `/processed` or `/failed` when done.
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
        - name: id
          in: path
          description: Message ID
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
          description: Message marked as failed
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/Agent
                  API/Messages_markAgentMessageFailed_Response_200
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
          description: Not Found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '422':
          description: >-
            Unprocessable Entity - No active processing attempt or invalid error
            message
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationError'
      requestBody:
        description: Error message
        content:
          application/json:
            schema:
              type: object
              properties:
                error:
                  type: string
                  description: Error message describing why processing failed
              required:
                - error
servers:
  - url: https://app.band.ai
    description: https://app.band.ai
components:
  schemas:
    MessageStatusResponseStatus:
      type: string
      enum:
        - processing
        - processed
        - failed
      description: New processing status
      title: MessageStatusResponseStatus
    MessageStatusResponse:
      type: object
      properties:
        attempt_number:
          type: integer
          description: Current attempt number
        id:
          type: string
          format: uuid
          description: ID of the message
        status:
          $ref: '#/components/schemas/MessageStatusResponseStatus'
          description: New processing status
        success:
          type: boolean
          description: Whether the status was updated successfully
      required:
        - attempt_number
        - id
        - status
        - success
      description: Minimal response after updating message processing status.
      title: MessageStatusResponse
    Agent API/Messages_markAgentMessageFailed_Response_200:
      type: object
      properties:
        data:
          $ref: '#/components/schemas/MessageStatusResponse'
      required:
        - data
      title: Agent API/Messages_markAgentMessageFailed_Response_200
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
  "error": "string"
}
```

**Response**

```json
{
  "data": {
    "attempt_number": 1,
    "id": "a1b2c3d4-e5f6-4a5b-9c8d-e7f8a9b0c1d2",
    "status": "processing",
    "success": true
  }
}
```

**SDK Code**

```python
import requests

url = "https://app.band.ai/api/v1/agent/chats/chat_id/messages/id/failed"

payload = { "error": "string" }
headers = {
    "X-API-Key": "<apiKey>",
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)

print(response.json())
```

```javascript
const url = 'https://app.band.ai/api/v1/agent/chats/chat_id/messages/id/failed';
const options = {
  method: 'POST',
  headers: {'X-API-Key': '<apiKey>', 'Content-Type': 'application/json'},
  body: '{"error":"string"}'
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

	url := "https://app.band.ai/api/v1/agent/chats/chat_id/messages/id/failed"

	payload := strings.NewReader("{\n  \"error\": \"string\"\n}")

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

url = URI("https://app.band.ai/api/v1/agent/chats/chat_id/messages/id/failed")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["X-API-Key"] = '<apiKey>'
request["Content-Type"] = 'application/json'
request.body = "{\n  \"error\": \"string\"\n}"

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.post("https://app.band.ai/api/v1/agent/chats/chat_id/messages/id/failed")
  .header("X-API-Key", "<apiKey>")
  .header("Content-Type", "application/json")
  .body("{\n  \"error\": \"string\"\n}")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://app.band.ai/api/v1/agent/chats/chat_id/messages/id/failed', [
  'body' => '{
  "error": "string"
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

var client = new RestClient("https://app.band.ai/api/v1/agent/chats/chat_id/messages/id/failed");
var request = new RestRequest(Method.POST);
request.AddHeader("X-API-Key", "<apiKey>");
request.AddHeader("Content-Type", "application/json");
request.AddParameter("application/json", "{\n  \"error\": \"string\"\n}", ParameterType.RequestBody);
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = [
  "X-API-Key": "<apiKey>",
  "Content-Type": "application/json"
]
let parameters = ["error": "string"] as [String : Any]

let postData = JSONSerialization.data(withJSONObject: parameters, options: [])

let request = NSMutableURLRequest(url: NSURL(string: "https://app.band.ai/api/v1/agent/chats/chat_id/messages/id/failed")! as URL,
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