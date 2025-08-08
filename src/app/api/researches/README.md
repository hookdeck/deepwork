# Research Workflow API

This directory contains the API routes for the DeepWork research workflow.

## Endpoints

### POST /api/researches

Submit a new research question.

**Request Body:**

```json
{
  "question": "What is the capital of France?"
}
```

**Response:**

```json
{
  "id": "uuid",
  "question": "What is the capital of France?",
  "status": "pending",
  "createdAt": "2025-01-07T12:00:00Z",
  "updatedAt": "2025-01-07T12:00:00Z",
  "webhookUrl": "https://your-app.com/api/webhooks/openai"
}
```

### GET /api/researches

List all research requests.

**Response:**

```json
{
  "researches": [
    {
      "id": "uuid",
      "question": "What is the capital of France?",
      "status": "completed",
      "result": "The capital of France is Paris.",
      "createdAt": "2025-01-07T12:00:00Z",
      "updatedAt": "2025-01-07T12:00:01Z"
    }
  ]
}
```

### GET /api/researches/[id]

Get details of a specific research request.

**Response:**

```json
{
  "id": "uuid",
  "question": "What is the capital of France?",
  "status": "completed",
  "result": "The capital of France is Paris.",
  "createdAt": "2025-01-07T12:00:00Z",
  "updatedAt": "2025-01-07T12:00:01Z",
  "openaiRequestId": "chatcmpl-xxx"
}
```

## Webhook Handler

### POST /api/webhooks/openai

Handles webhook events from OpenAI (via Hookdeck).

The webhook handler:

1. Verifies the webhook signature
2. Extracts the research ID from the payload
3. Updates the research record with the result or error
4. Returns a success response

## Status Flow

1. `pending` - Initial state when research is created
2. `processing` - When request is sent to Hookdeck queue
3. `completed` - When OpenAI response is received via webhook
4. `failed` - If an error occurs during processing
