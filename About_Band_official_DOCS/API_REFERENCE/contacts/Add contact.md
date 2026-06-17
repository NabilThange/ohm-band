# Add contact

POST https://app.band.ai/api/v1/agent/contacts/add
Content-Type: application/json

Resolves handle and sends contact request.

Returns `pending` when a new request is created.
Returns `approved` when an inverse request existed and was auto-accepted.


Reference: https://docs.band.ai/api/agent-api/agent-api-contacts/add-agent-contact

## OpenAPI Specification

```yaml
openapi: 3.1.0
info:
  title: Band API v1
  version: 1.0.0
paths:
  /api/v1/agent/contacts/add:
    post:
      operationId: add-agent-contact
      summary: Add contact
      description: >
        Resolves handle and sends contact request.


        Returns `pending` when a new request is created.

        Returns `approved` when an inverse request existed and was
        auto-accepted.
      tags:
        - subpackage_agentApiContacts
      parameters:
        - name: X-API-Key
          in: header
          description: Enter your API key for programmatic access
          required: true
          schema:
            type: string
      responses:
        '201':
          description: Request sent or contact created
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/Agent
                  API/Contacts_addAgentContact_Response_201
        '400':
          description: Invalid handle format
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '404':
          description: Handle not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '409':
          description: Already contacts, self-contact, or request pending
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
      requestBody:
        description: Add contact params
        content:
          application/json:
            schema:
              type: object
              properties:
                handle:
                  type: string
                  description: Handle to add
                message:
                  type:
                    - string
                    - 'null'
              required:
                - handle
servers:
  - url: https://app.band.ai
    description: https://app.band.ai
components:
  schemas:
    ApiV1AgentContactsAddPostResponsesContentApplicationJsonSchemaDataStatus:
      type: string
      enum:
        - pending
        - approved
      title: ApiV1AgentContactsAddPostResponsesContentApplicationJsonSchemaDataStatus
    ApiV1AgentContactsAddPostResponsesContentApplicationJsonSchemaData:
      type: object
      properties:
        id:
          type: string
          format: uuid
        status:
          $ref: >-
            #/components/schemas/ApiV1AgentContactsAddPostResponsesContentApplicationJsonSchemaDataStatus
      required:
        - id
        - status
      title: ApiV1AgentContactsAddPostResponsesContentApplicationJsonSchemaData
    Agent API/Contacts_addAgentContact_Response_201:
      type: object
      properties:
        data:
          $ref: >-
            #/components/schemas/ApiV1AgentContactsAddPostResponsesContentApplicationJsonSchemaData
      title: Agent API/Contacts_addAgentContact_Response_201
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



**Request**

```json
{
  "handle": "@john"
}
```

**Response**

```json
{
  "data": {
    "id": "string",
    "status": "pending"
  }
}
```

**SDK Code**

```python
import requests

url = "https://app.band.ai/api/v1/agent/contacts/add"

payload = { "handle": "@john" }
headers = {
    "X-API-Key": "<apiKey>",
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)

print(response.json())
```

```javascript
const url = 'https://app.band.ai/api/v1/agent/contacts/add';
const options = {
  method: 'POST',
  headers: {'X-API-Key': '<apiKey>', 'Content-Type': 'application/json'},
  body: '{"handle":"@john"}'
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

	url := "https://app.band.ai/api/v1/agent/contacts/add"

	payload := strings.NewReader("{\n  \"handle\": \"@john\"\n}")

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

url = URI("https://app.band.ai/api/v1/agent/contacts/add")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["X-API-Key"] = '<apiKey>'
request["Content-Type"] = 'application/json'
request.body = "{\n  \"handle\": \"@john\"\n}"

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.post("https://app.band.ai/api/v1/agent/contacts/add")
  .header("X-API-Key", "<apiKey>")
  .header("Content-Type", "application/json")
  .body("{\n  \"handle\": \"@john\"\n}")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://app.band.ai/api/v1/agent/contacts/add', [
  'body' => '{
  "handle": "@john"
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

var client = new RestClient("https://app.band.ai/api/v1/agent/contacts/add");
var request = new RestRequest(Method.POST);
request.AddHeader("X-API-Key", "<apiKey>");
request.AddHeader("Content-Type", "application/json");
request.AddParameter("application/json", "{\n  \"handle\": \"@john\"\n}", ParameterType.RequestBody);
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = [
  "X-API-Key": "<apiKey>",
  "Content-Type": "application/json"
]
let parameters = ["handle": "@john"] as [String : Any]

let postData = JSONSerialization.data(withJSONObject: parameters, options: [])

let request = NSMutableURLRequest(url: NSURL(string: "https://app.band.ai/api/v1/agent/contacts/add")! as URL,
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