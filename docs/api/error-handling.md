# Error Responses and Status Codes Documentation

## Overview
This document details all error responses and status codes used throughout the ChatVRM API endpoints and client-side implementations.

## HTTP Status Codes

### Success Codes
| Code | Name | Usage |
|------|------|-------|
| 200 | OK | Successful API requests (chat, TTS) |

### Client Error Codes
| Code | Name | Usage |
|------|------|-------|
| 400 | Bad Request | Missing or invalid API key |

### Server Error Codes
| Code | Name | Usage |
|------|------|-------|
| 500 | Internal Server Error | OpenAI/Koeiromap API failures, unhandled exceptions |

## API-Specific Error Responses

### /api/chat Endpoint

#### Missing API Key Error
**Status**: 400 Bad Request
```json
{
  "message": "APIキーが間違っているか、設定されていません。"
}
```
**Translation**: "The API key is incorrect or has not been set."
**Cause**: No API key provided in request body and OPEN_AI_KEY environment variable not set.

#### OpenAI API Failure
**Status**: 500 Internal Server Error
**Response**: Generic Next.js error page (no JSON response)
**Common Causes**:
- Invalid OpenAI API key
- OpenAI service outage
- Rate limit exceeded
- Network timeout

#### Empty Response Fallback
**Status**: 200 OK
```json
{
  "message": "エラーが発生しました"
}
```
**Translation**: "An error has occurred"
**Cause**: OpenAI returned success but with empty message content

### /api/tts Endpoint

#### Koeiromap API Failure
**Status**: 500 Internal Server Error
**Response**: Generic Next.js error page (no JSON response)
**Common Causes**:
- Invalid Koeiromap API key
- Invalid voice parameters (speakerX/Y out of range)
- Service outage
- Text too long
- Unsupported characters

## Client-Side Error Handling

### getChatResponse() Errors

```typescript
// API Key Validation
if (!apiKey) {
  throw new Error("Invalid API Key");
}
```

### getChatResponseStream() Errors

```typescript
// Stream initialization failure
if (res.status !== 200 || !reader) {
  throw new Error("Something went wrong");
}

// Stream processing errors
try {
  // Process chunks
} catch (error) {
  controller.error(error);  // Propagated through stream
}
```

### Common Client-Side Errors

| Error Message | Cause | Resolution |
|---------------|-------|------------|
| "Invalid API Key" | Missing API key | Provide valid OpenAI API key |
| "Something went wrong" | Non-200 response from OpenAI | Check API key, network, quota |
| Stream parsing errors | Malformed SSE data | Retry request |

## Error Flow Examples

### Chat API Error Flow
```
1. User sends message without API key
   ↓
2. /api/chat checks for API key
   ↓
3. Returns 400 with Japanese error message
   ↓
4. Frontend displays error to user
```

### TTS API Error Flow
```
1. Invalid Koeiromap API key provided
   ↓
2. koeiromapFreeV1() makes request
   ↓
3. Koeiromap returns 401 Unauthorized
   ↓
4. Error bubbles up uncaught
   ↓
5. Next.js returns 500 error page
```

## Error Prevention Strategies

### API Key Validation
```typescript
// Frontend validation before API call
if (!apiKey || !apiKey.startsWith('sk-')) {
  showError('Please enter a valid OpenAI API key');
  return;
}
```

### Request Validation
```typescript
// Validate voice parameters
const speakerX = Math.max(-3, Math.min(3, requestedX));
const speakerY = Math.max(-3, Math.min(3, requestedY));
```

### Graceful Degradation
```typescript
// Fallback for TTS failure
try {
  await synthesizeVoice(text);
} catch (error) {
  console.error('TTS failed, showing text only');
  displayTextWithoutVoice(text);
}
```

## Recommended Error Handling Improvements

### 1. Structured Error Responses
```typescript
// Consistent error format
interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  status: number;
}
```

### 2. Comprehensive Try-Catch
```typescript
// Wrap all API operations
export default async function handler(req, res) {
  try {
    // API logic
  } catch (error) {
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key provided'
        }
      });
    }
    // Handle other errors
  }
}
```

### 3. Client-Side Error Boundaries
```typescript
// React error boundary for UI protection
class APIErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    if (error.message.includes('API')) {
      this.setState({ 
        hasError: true, 
        errorMessage: 'API connection failed' 
      });
    }
  }
}
```

## Error Monitoring Checklist

- [ ] Log all API errors with timestamps
- [ ] Monitor 5xx error rates
- [ ] Track API key validation failures  
- [ ] Alert on OpenAI/Koeiromap service outages
- [ ] Monitor streaming connection failures
- [ ] Track client-side error boundaries

## User-Facing Error Messages

| Internal Error | User Message (English) | User Message (Japanese) |
|----------------|------------------------|-------------------------|
| Invalid API Key | "Please check your API key" | "APIキーを確認してください" |
| Network Error | "Connection failed. Please try again" | "接続に失敗しました。再試行してください" |
| Service Unavailable | "Service temporarily unavailable" | "サービスが一時的に利用できません" |
| Rate Limit | "Too many requests. Please wait" | "リクエストが多すぎます。お待ちください" |