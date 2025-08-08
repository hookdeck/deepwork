import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/hookdeck/verify";
import { researchStorage } from "@/lib/storage/research";

const DEBUG = process.env.DEBUG === "true";

// POST /api/webhooks/openai - Handle OpenAI webhook events
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    if (DEBUG) {
      console.log("[Webhook] Received webhook request");
      console.log(
        "[Webhook] Headers:",
        Object.fromEntries(request.headers.entries())
      );
    }

    // Verify webhook signature
    const signature = request.headers.get("x-hookdeck-signature");
    const signature2 = request.headers.get("x-hookdeck-signature-2");
    const signatures = [signature, signature2].filter(Boolean) as string[];
    if (!signatures.length) {
      console.error("[Webhook] Missing webhook signature");
      return NextResponse.json(
        { error: "Missing webhook signature" },
        { status: 401 }
      );
    }

    const signingSecret = process.env.HOOKDECK_SIGNING_SECRET;
    if (!signingSecret) {
      console.error("[Webhook] HOOKDECK_SIGNING_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook verification not configured" },
        { status: 500 }
      );
    }

    const isValid = verifyWebhookSignature(rawBody, signatures, signingSecret);

    if (!isValid) {
      console.error("[Webhook] Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody);

    // Retrieve the response from OpenAI to get the metadata
    const responseResponse = await fetch(
      `https://api.openai.com/v1/responses/${payload.data.id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );
    const response = await responseResponse.json();
    if (DEBUG) {
      console.log("[Webhook] OpenAI Response:", response);
    }
    const researchId = response.metadata?.researchId as string | undefined;

    if (!researchId) {
      console.error(
        "[Webhook] No research ID found in webhook payload",
        payload
      );
      return NextResponse.json(
        { error: "No research ID in payload" },
        { status: 400 }
      );
    }

    if (DEBUG) {
      console.log("[Webhook] Processing webhook for research:", researchId);
      console.log("[Webhook] Payload type:", payload.type || "unknown");
    }

    // Process based on webhook type
    if (payload.type === "response.completed") {
      // Update research record
      await researchStorage.update(researchId, {
        status: "completed",
        result: JSON.stringify(response, null, 2),
        openaiRequestId: response.id,
      });

      console.log(`[Webhook] Research ${researchId} completed successfully`);
    } else if (payload.type === "response.failed") {
      // Handle error case
      await researchStorage.update(researchId, {
        status: "failed",
        error: response.error?.message || "Response failed",
        result: JSON.stringify(response, null, 2),
        openaiRequestId: response.id,
      });

      console.error(`[Webhook] Research ${researchId} failed:`, payload);
    } else if (payload.type === "response.cancelled") {
      await researchStorage.update(researchId, {
        status: "cancelled",
        error: "Response cancelled",
        openaiRequestId: response.id,
      });
      console.log(`[Webhook] Research ${researchId} cancelled`);
    } else if (payload.type === "response.incomplete") {
      await researchStorage.update(researchId, {
        status: "incomplete",
        error: "Response incomplete",
        openaiRequestId: response.id,
      });
      console.log(`[Webhook] Research ${researchId} incomplete`);
    } else {
      console.warn(
        `[Webhook] Unknown payload type for research ${researchId}:`,
        payload
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: DEBUG
          ? error instanceof Error
            ? error.message
            : "Unknown error"
          : undefined,
      },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook URL verification (if needed)
export async function GET(request: NextRequest) {
  // Some webhook providers send a GET request to verify the endpoint
  return NextResponse.json({ status: "ok" });
}
