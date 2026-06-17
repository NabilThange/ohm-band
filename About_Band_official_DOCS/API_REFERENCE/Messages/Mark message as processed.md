# Mark message as processed

POST https://app.band.ai/api/v1/agent/chats/{chat_id}/messages/{id}/processed

Marks a message as successfully processed by the agent. This completes the current
processing attempt with a system-managed timestamp.

## What It Does

- Sets the current attempt's completed_at timestamp (system-managed)
- Sets the current attempt status to "success"
- Sets the agent's processed_at timestamp (system-managed)
- Updates the agent's delivery status to "processed"

## Requirements

**Requires an active processing attempt.** You must call `/processing` first.
Returns 422 if no processing attempt exists.

## After Calling

Once marked as processed, the message will no longer appear in:
- `GET /messages` (default - returns not processed)
- `GET /messages/next`
- `GET /messages?status=pending`

It will only appear in:
- `GET /messages?status=processed`
- `GET /messages?status=all`


Reference: https://docs.band.ai/api/agent-api/agent-api-messages/mark-agent-message-processed

## OpenAPI Specification

```yaml
openapi: 3.1.0
info:
  title: Band API v1
  version: 1.0.0
paths:
  /api/v1/agent/chats/{chat_id}/messages/{id}/processed:
    post:
      operationId: mark-agent-message-processed
      summary: Mark message as processed
      description: >
        Marks a message as successfully processed by the agent. This completes
        the current

        processing attempt with a system-managed timestamp.


        ## What It Does


        - Sets the current attempt's completed_at timestamp (system-managed)

        - Sets the current attempt status to "success"

        - Sets the agent's processed_at timestamp (system-managed)

        - Updates the agent's delivery status to "processed"


        ## Requirements


        **Requires an active processing attempt.** You must call `/processing`
        first.

        Returns 422 if no processing attempt exists.


        ## After Calling


        Once marked as processed, the message will no longer appear in:

        - `GET /messages` (default - returns not processed)

        - `GET /messages/next`

        - `GET /messages?status=pending`


        It will only appear in:

        - `GET /messages?status=processed`

        - `GET /messages?status=all`
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
          description: Message marked as processed
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/Agent
                  API/Messages_markAgentMessageProcessed_Response_200
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
          description: Unprocessable Entity - No active processing attempt
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationError'
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
    Agent API/Messages_markAgentMessageProcessed_Response_200:
      type: object
      properties:
        data:
          $ref: '#/components/schemas/MessageStatusResponse'
      required:
        - data
      title: Agent API/Messages_markAgentMessageProcessed_Response_200
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

url = "https://app.band.ai/api/v1/agent/chats/chat_id/messages/id/processed"

headers = {"X-API-Key": "<apiKey>"}

response = requests.post(url, headers=headers)

print(response.json())
```

```javascript
const url = 'https://app.band.ai/api/v1/agent/chats/chat_id/messages/id/processed';
const options = {method: 'POST', headers: {'X-API-Key': '<apiKey>'}};

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

	url := "https://app.band.ai/api/v1/agent/chats/chat_id/messages/id/processed"

	req, _ := http.NewRequest("POST", url, nil)

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

url = URI("https://app.band.ai/api/v1/agent/chats/chat_id/messages/id/processed")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["X-API-Key"] = '<apiKey>'

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.post("https://app.band.ai/api/v1/agent/chats/chat_id/messages/id/processed")
  .header("X-API-Key", "<apiKey>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://app.band.ai/api/v1/agent/chats/chat_id/messages/id/processed', [
  'headers' => [
    'X-API-Key' => '<apiKey>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://app.band.ai/api/v1/agent/chats/chat_id/messages/id/processed");
var request = new RestRequest(Method.POST);
request.AddHeader("X-API-Key", "<apiKey>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["X-API-Key": "<apiKey>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://app.band.ai/api/v1/agent/chats/chat_id/messages/id/processed")! as URL,
                                        cachePolicy: .useProtocolCachePolicy,
                                    timeoutInterval: 10.0)
request.httpMethod = "POST"
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