# API Key Configuration Guide

## Overview
ChatVRM requires two external API keys to function:
1. **OpenAI API Key** - For ChatGPT conversations
2. **Koeiromap API Key** - For Japanese text-to-speech synthesis

This guide explains how to obtain, configure, and secure these API keys.

## Required API Keys

### OpenAI API Key

**Purpose**: Powers AI conversations using GPT-3.5-turbo model

**How to Obtain**:
1. Visit [platform.openai.com](https://platform.openai.com)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)

**Pricing**: Pay-per-use, approximately $0.002 per 1K tokens

### Koeiromap API Key

**Purpose**: Converts Japanese text to natural speech

**How to Obtain**:
1. Visit [Rinna's Koeiromap](https://api.rinna.co.jp/docs/koeiromap)
2. Register for an account
3. Subscribe to the Koeiromap Free plan
4. Find your subscription key in the dashboard

**Pricing**: Free tier available with usage limits

## Configuration Methods

### Method 1: Environment Variables (Recommended for Production)

Create a `.env.local` file in the project root:

```bash
# .env.local
OPEN_AI_KEY=sk-your-openai-api-key-here
KOEIROMAP_API_KEY=your-koeiromap-key-here
```

**Note**: The OpenAI key uses `OPEN_AI_KEY` (not `OPENAI_API_KEY`)

### Method 2: Runtime Configuration (Development/Testing)

API keys can be provided at runtime through the UI:

```typescript
// OpenAI key provided per request
const response = await fetch('/api/chat', {
  body: JSON.stringify({
    apiKey: 'sk-your-key',
    messages: [...]
  })
});

// Koeiromap key provided per request
const ttsResponse = await fetch('/api/tts', {
  body: JSON.stringify({
    apiKey: 'your-koeiromap-key',
    message: 'こんにちは',
    // ... other params
  })
});
```

### Method 3: Frontend State Management

The application stores API keys in browser localStorage:

```typescript
// Keys are saved in settings
localStorage.setItem('chatvrm-settings', JSON.stringify({
  openAiKey: 'sk-your-key',
  koeiromapKey: 'your-key',
  // ... other settings
}));
```

## Security Best Practices

### DO ✅

1. **Use Environment Variables in Production**
   ```bash
   # Production deployment
   OPEN_AI_KEY=sk-prod-key npm run start
   ```

2. **Validate API Keys**
   ```typescript
   // Basic validation
   if (!apiKey.startsWith('sk-')) {
     throw new Error('Invalid OpenAI key format');
   }
   ```

3. **Implement Rate Limiting**
   ```typescript
   // Prevent API abuse
   const rateLimiter = rateLimit({
     windowMs: 60 * 1000, // 1 minute
     max: 10 // limit each IP to 10 requests
   });
   ```

4. **Use HTTPS in Production**
   - Ensures API keys are encrypted in transit
   - Required for secure localStorage access

### DON'T ❌

1. **Never Commit API Keys**
   ```bash
   # .gitignore
   .env.local
   .env.production
   ```

2. **Don't Expose Keys in Client Code**
   ```typescript
   // BAD - Key visible in browser
   const API_KEY = 'sk-abc123';
   
   // GOOD - Key from server/env
   const apiKey = process.env.OPEN_AI_KEY;
   ```

3. **Avoid Logging Keys**
   ```typescript
   // Never log full keys
   console.log('Using API key:', apiKey); // BAD
   console.log('Using API key:', apiKey.slice(0, 8) + '...'); // BETTER
   ```

## API Key Rotation

### When to Rotate Keys
- Suspected compromise
- Developer departure
- Regular security schedule (quarterly)
- After accidental exposure

### Rotation Process
1. Generate new API key from provider
2. Update environment variables
3. Deploy application
4. Verify functionality
5. Revoke old key from provider dashboard

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "APIキーが間違っているか、設定されていません" | Missing OpenAI key | Add OPEN_AI_KEY to environment |
| 401 Unauthorized | Invalid API key | Verify key is correct and active |
| 429 Too Many Requests | Rate limit hit | Implement backoff, check quota |
| CORS errors | Direct API calls from browser | Use API proxy endpoints |

### Debug Checklist

```bash
# 1. Check environment variables
echo $OPEN_AI_KEY | head -c 10

# 2. Test OpenAI key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPEN_AI_KEY"

# 3. Verify .env.local is loaded
console.log(process.env.OPEN_AI_KEY ? 'Key loaded' : 'Key missing');
```

## Multi-Environment Setup

### Development
```bash
# .env.local
OPEN_AI_KEY=sk-dev-key
KOEIROMAP_API_KEY=dev-koeiromap-key
```

### Staging
```bash
# .env.staging
OPEN_AI_KEY=sk-staging-key
KOEIROMAP_API_KEY=staging-koeiromap-key
```

### Production
```bash
# Set via hosting platform (Vercel, etc.)
# Never store production keys in files
```

## API Key Usage Monitoring

### Track Usage
```typescript
// Log API calls for monitoring
async function trackAPIUsage(endpoint: string, tokens?: number) {
  await fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({
      endpoint,
      tokens,
      timestamp: new Date().toISOString()
    })
  });
}
```

### Set Budget Alerts
- OpenAI: Set up usage limits in dashboard
- Koeiromap: Monitor free tier limits
- Implement client-side usage tracking

## Migration Guide

### From Hardcoded Keys to Environment Variables

1. **Current State** (Insecure):
   ```typescript
   const apiKey = "sk-hardcoded-key";
   ```

2. **Create .env.local**:
   ```bash
   OPEN_AI_KEY=sk-hardcoded-key
   ```

3. **Update Code**:
   ```typescript
   const apiKey = req.body.apiKey || process.env.OPEN_AI_KEY;
   ```

4. **Remove Hardcoded Keys**:
   - Search codebase for "sk-"
   - Replace with environment variables
   - Commit changes (without .env files)

## Quick Start Checklist

- [ ] Obtain OpenAI API key from platform.openai.com
- [ ] Obtain Koeiromap API key from api.rinna.co.jp
- [ ] Create `.env.local` file in project root
- [ ] Add both API keys to environment file
- [ ] Add `.env.local` to `.gitignore`
- [ ] Restart development server
- [ ] Test chat functionality
- [ ] Test voice synthesis
- [ ] Set up production environment variables