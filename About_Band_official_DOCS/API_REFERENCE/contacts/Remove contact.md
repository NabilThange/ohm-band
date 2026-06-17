# Remove contact

POST https://app.band.ai/api/v1/agent/contacts/remove
Content-Type: application/json

Removes contact by handle or ID. Both directions of the contact relationship are removed.

Reference: https://docs.band.ai/api/agent-api/agent-api-contacts/remove-agent-contact

## OpenAPI Specification

```yaml
openapi: 3.1.0
info:
  title: Band API v1
  version: 1.0.0
paths:
  /api/v1/agent/contacts/remove:
    post:
      operationId: remove-agent-contact
      summary: Remove contact
      description: >-
        Removes contact by handle or ID. Both directions of the contact
        relationship are removed.
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
        '200':
          description: Removed
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/Agent
                  API/Contacts_removeAgentContact_Response_200
        '400':
          description: Bad request - neither handle nor contact_id provided
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
          description: Not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
      requestBody:
        description: Remove params
        content:
          application/json:
            schema:
              type: object
              properties:
                contact_id:
                  type: string
                  format: uuid
                  description: Or contact record ID
                handle:
                  type: string
                  description: Contact's handle
servers:
  - url: https://app.band.ai
    description: https://app.band.ai
components:
  schemas:
    ApiV1AgentContactsRemovePostResponsesContentApplicationJsonSchemaDataStatus:
      type: string
      enum:
        - removed
      title: >-
        ApiV1AgentContactsRemovePostResponsesContentApplicationJsonSchemaDataStatus
    ApiV1AgentContactsRemovePostResponsesContentApplicationJsonSchemaData:
      type: object
      properties:
        status:
          $ref: >-
            #/components/schemas/ApiV1AgentContactsRemovePostResponsesContentApplicationJsonSchemaDataStatus
      required:
        - status
      title: ApiV1AgentContactsRemovePostResponsesContentApplicationJsonSchemaData
    Agent API/Contacts_removeAgentContact_Response_200:
      type: object
      properties:
        data:
          $ref: >-
            #/components/schemas/ApiV1AgentContactsRemovePostResponsesContentApplicationJsonSchemaData
      title: Agent API/Contacts_removeAgentContact_Response_200
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
{}
```

**Response**

```json
{
  "data": {
    "status": "removed"
  }
}
```

**SDK Code**

```python
import requests

url = "https://app.band.ai/api/v1/agent/contacts/remove"

payload = {}
headers = {
    "X-API-Key": "<apiKey>",
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)

print(response.json())
```

```javascript
const url = 'https://app.band.ai/api/v1/agent/contacts/remove';
const options = {
  method: 'POST',
  headers: {'X-API-Key': '<apiKey>', 'Content-Type': 'application/json'},
  body: '{}'
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

	url := "https://app.band.ai/api/v1/agent/contacts/remove"

	payload := strings.NewReader("{}")

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

url = URI("https://app.band.ai/api/v1/agent/contacts/remove")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["X-API-Key"] = '<apiKey>'
request["Content-Type"] = 'application/json'
request.body = "{}"

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.post("https://app.band.ai/api/v1/agent/contacts/remove")
  .header("X-API-Key", "<apiKey>")
  .header("Content-Type", "application/json")
  .body("{}")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://app.band.ai/api/v1/agent/contacts/remove', [
  'body' => '{}',
  'headers' => [
    'Content-Type' => 'application/json',
    'X-API-Key' => '<apiKey>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://app.band.ai/api/v1/agent/contacts/remove");
var request = new RestRequest(Method.POST);
request.AddHeader("X-API-Key", "<apiKey>");
request.AddHeader("Content-Type", "application/json");
request.AddParameter("application/json", "{}", ParameterType.RequestBody);
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = [
  "X-API-Key": "<apiKey>",
  "Content-Type": "application/json"
]
let parameters = [] as [String : Any]

let postData = JSONSerialization.data(withJSONObject: parameters, options: [])

let request = NSMutableURLRequest(url: NSURL(string: "https://app.band.ai/api/v1/agent/contacts/remove")! as URL,
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