# Chat API Endpoint Documentation

## Overview
The `/api/chat` endpoint provides a server-side proxy to OpenAI's ChatGPT API, handling CORS restrictions and secure API key management for the ChatVRM application.

## Endpoint Details

**URL**: `/api/chat`  
**Method**: `POST`  
**Content-Type**: `application/json`

## Request Format

### Request Body
```json
{
  "apiKey": "sk-...", // Optional: OpenAI API key (falls back to OPEN_AI_KEY env var)
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user", 
      "content": "Hello!"
    }
  ]
}
```

### Message Object Structure
- `role` (string, required): One of "system", "user", or "assistant"
- `content` (string, required): The message content

## Response Format

### Success Response (200 OK)
```json
{
  "message": "Hello! How can I help you today?"
}
```

### Error Responses

#### Missing API Key (400 Bad Request)
```json
{
  "message": "APIキーが間違っているか、設定されていません。"
}
```
Translation: "The API key is incorrect or has not been set."

#### OpenAI API Errors (500 Internal Server Error)
When the OpenAI API returns an error (invalid key, rate limit, etc.), the server will return a 500 error without a specific error message.

## Implementation Details

- **Model**: Uses GPT-3.5-turbo
- **API Key Priority**: Request body `apiKey` > Environment variable `OPEN_AI_KEY`
- **Library**: Uses OpenAI Node.js SDK v3
- **Error Fallback**: Returns "エラーが発生しました" if OpenAI response is empty

## Example Usage

### JavaScript/TypeScript
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    apiKey: 'your-openai-api-key', // Optional if OPEN_AI_KEY is set
    messages: [
      {
        role: 'system',
        content: 'You are a friendly character.'
      },
      {
        role: 'user',
        content: 'Tell me a joke!'
      }
    ]
  })
});

const data = await response.json();
console.log(data.message); // AI response
```

### cURL
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "sk-...",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

## Notes

- This is a non-streaming endpoint. For streaming responses, use the client-side `getChatResponseStream` function
- The endpoint does not handle conversation history - clients must maintain and send the full message array
- No request validation is performed beyond API key checking
- The endpoint acts as a simple proxy and does not modify the OpenAI response

## Security Considerations

- API keys can be passed in the request body or stored as environment variables
- When using environment variables, ensure `OPEN_AI_KEY` is properly secured
- This endpoint should be protected in production environments to prevent unauthorized usage
- Consider implementing rate limiting to prevent abuse