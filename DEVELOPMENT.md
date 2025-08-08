# DeepWork Local Development Guide

This guide will help you set up and run the DeepWork application locally with real Hookdeck and OpenAI APIs before deployment to Vercel.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Hookdeck CLI Setup](#hookdeck-cli-setup)
4. [Development Procedures](#development-procedures)
5. [Common Issues & Troubleshooting](#common-issues--troubleshooting)
6. [Development Checklist](#development-checklist)

## Prerequisites

Before starting local development, ensure you have:

- [ ] Node.js 18+ installed
- [ ] **A Hookdeck account** ([sign up here](https://hookdeck.com)) - **REQUIRED**
- [ ] **An OpenAI API key** with access to Deep Research API - **REQUIRED**
- [ ] Demo authentication uses simple username/password (default: demo/password)

## Environment Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Quick Setup (Recommended)

Use our setup script for guided configuration:

```bash
npm run setup:dev
```

This will:

- Generate secure secrets
- Prompt for your API keys
- Configure the environment file
- Provide next steps

### 3. Manual Configuration

Alternatively, copy the example environment file and update manually:

```bash
cp .env.local.example .env.local
```

Update `.env.local` with your real values:

```env
# Authentication (NextAuth)
NEXTAUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Demo Authentication
DEMO_USERNAME=demo
DEMO_PASSWORD=password

# Hookdeck Configuration
HOOKDECK_API_KEY=your-hookdeck-api-key
HOOKDECK_SIGNING_SECRET=your-hookdeck-signing-secret

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Feature Flags
USE_MOCK_HOOKDECK=false  # Set to false for real API development
```

### 3. Enable Real API Mode

To switch from mock to real Hookdeck API:

1. Ensure `HOOKDECK_API_KEY` is set to your actual Hookdeck API key
2. Set `USE_MOCK_HOOKDECK=false` in your `.env.local`
3. Restart your development server

## Hookdeck CLI Setup

The Hookdeck CLI is essential for receiving webhooks locally during development. It's included as a dev dependency.

### 1. Login to Hookdeck

```bash
npm run hookdeck:login
```

This will open your browser to authenticate. Once complete, the CLI will be configured.

### 2. Start Webhook Forwarding

To receive OpenAI webhooks locally:

```bash
npm run hookdeck:listen
```

This runs: `hookdeck listen 3000 openai-webhook --path /api/webhooks/openai`

**Important**: The source name `openai-webhook` must match what's configured in the application.

The CLI will display:

- The webhook URL to configure in OpenAI (e.g., `https://hkdk.events/YOUR_SOURCE_URL`)
- Real-time webhook events as they arrive
- Request/response details for debugging

### 4. Update NEXTAUTH_URL for Webhook Development

When developing with webhooks using the CLI, you may need to update `NEXTAUTH_URL`:

```env
# For webhook development with Hookdeck CLI
NEXTAUTH_URL=http://localhost:3000
```

## Development Procedures

The `npm run setup:dev` script will guide you through the entire setup process, including:

1.  Initializing Hookdeck connections.
2.  Prompting you to create an OpenAI webhook with the correct URL.
3.  Updating the Hookdeck source with your OpenAI webhook secret.

After running the setup script, you can proceed with the following steps to test the application.

### Step 3: Develop with Research Workflow

1. Navigate to http://localhost:3000

2. Create a new research request:

   - Enter a research topic
   - Submit the form

3. Monitor the request flow:
   - Check browser console for request logs
   - View Hookdeck Dashboard for event activity
   - Watch Hookdeck CLI output for webhook receipts

### Step 4: Develop with Webhook Reception

You can work with webhooks in two ways:

#### Option A: Using the Dev Webhook Page (Easy)

1. Navigate to http://localhost:3000/test-webhook

2. Click "Create Dev Research" to generate a research ID

3. Modify the payload if needed

4. Click "Send Dev Webhook" to simulate webhook delivery

#### Option B: Using Hookdeck CLI (Realistic)

1. Ensure Hookdeck CLI is running (see setup above)

2. Send a dev webhook using Hookdeck Dashboard:

   - Go to your `openai-webhook` connection
   - Click "Send Test Event"
   - Use this dev payload:

   ```json
   {
     "id": "dev-completion-123",
     "object": "chat.completion",
     "metadata": {
       "researchId": "YOUR_RESEARCH_ID"
     },
     "choices": [
       {
         "message": {
           "content": "This is a development research result"
         }
       }
     ]
   }
   ```

3. Verify:
   - Webhook appears in CLI output
   - Research status updates to "completed"
   - Result appears in the UI

### Step 5: Verify Basic Auth Filter

The DeepWork source uses basic auth to prevent unauthorized requests.

1. Get the auth credentials:

   ```bash
   # Check the dev endpoint response for auth details
   curl http://localhost:3000/api/test/hookdeck-init
   ```

2. Verify with valid auth:

   ```bash
   curl -X POST https://hkdk.events/YOUR_SOURCE_URL \
     -H "Authorization: Basic YOUR_ENCODED_CREDENTIALS" \
     -H "Content-Type: application/json" \
     -d '{"topic": "Dev research"}'
   ```

3. Verify with invalid auth (should be rejected):
   ```bash
   curl -X POST https://hkdk.events/YOUR_SOURCE_URL \
     -H "Authorization: Basic invalid" \
     -H "Content-Type: application/json" \
     -d '{"topic": "Dev research"}'
   ```

## Common Issues & Troubleshooting

### Issue: "HOOKDECK_API_KEY not configured"

**Solution**: Ensure your `.env.local` file contains a valid Hookdeck API key:

```env
HOOKDECK_API_KEY=your-hookdeck-api-key
```

### Issue: Webhooks not received locally

**Solutions**:

1. Verify Hookdeck CLI is running: `npm run hookdeck:listen`
2. Check the source name matches exactly: `openai-webhook`
3. Ensure your local server is running on port 3000
4. Check firewall/proxy settings

### Issue: "Invalid webhook signature"

**Solutions**:

1. Verify `HOOKDECK_SIGNING_SECRET` matches your Hookdeck configuration
2. Check that the webhook payload hasn't been modified
3. For development, temporarily set `NODE_ENV=development` to skip verification

### Issue: Research stuck in "processing"

**Debugging steps**:

1. Check Hookdeck Dashboard for failed events
2. View browser console for API errors
3. Check server logs: `npm run dev`
4. Verify OpenAI API key has correct permissions

### Issue: Mock mode still active

**Solutions**:

1. Ensure `HOOKDECK_API_KEY` is set to your actual API key and `USE_MOCK_HOOKDECK=false`
2. Clear any cached connections:
   ```bash
   curl -X DELETE http://localhost:3000/api/test/hookdeck-init
   ```
3. Restart the development server

## Development Checklist

Run the comprehensive verification to ensure everything is set up correctly:

```bash
curl http://localhost:3000/api/test/complete-workflow \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

This will verify:

- Environment configuration
- Hookdeck setup and connections
- Complete research workflow
- Webhook processing

Before deploying to production, ensure:

- [ ] **Authentication**: Demo credentials login works correctly
- [ ] **Hookdeck Initialization**: Connections created successfully with real API
- [ ] **Basic Auth**: Source filter correctly validates requests
- [ ] **Research Creation**: New research requests are created and sent to queue
- [ ] **Webhook Reception**: OpenAI webhooks received and processed
- [ ] **Status Updates**: Research status transitions work (pending → processing → completed)
- [ ] **Error Handling**: Failed requests show appropriate error messages
- [ ] **Event Correlation**: Hookdeck events linked to research records
- [ ] **UI Updates**: Real-time status updates in the interface
- [ ] **Complete Workflow Verification**: All automated checks pass

## Debugging Tips

### Enable Verbose Logging

Add to your `.env.local`:

```env
DEBUG=true
LOG_LEVEL=verbose
```

### Monitor Network Traffic

Use browser DevTools Network tab to inspect:

- API requests to `/api/researches`
- Webhook payloads
- Response headers and status codes

### Check Hookdeck Events

In Hookdeck Dashboard:

1. Go to Events tab
2. Filter by connection
3. View request/response details
4. Check retry attempts

### Verify Individual Components

Use the provided development endpoints:

- `/api/test/hookdeck-init` - Verify Hookdeck initialization
- `/api/test/research-workflow` - Verify research workflow
- `/test-hookdeck` - UI for connection verification
- `/test-research` - UI for workflow development
- `/test-events` - UI for event correlation development
- `/test-webhook` - UI for webhook development without CLI

## Next Steps

Once local development setup is complete:

1. Document any configuration changes needed for production
2. Update environment variables in Vercel dashboard
3. Verify the webhook URL configuration with production URLs
4. Set up monitoring and alerting for production events

Remember to keep your API keys secure and never commit them to version control!
