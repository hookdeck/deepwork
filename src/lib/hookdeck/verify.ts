import crypto from 'crypto';

/**
 * Verifies that a webhook payload came from Hookdeck using HMAC signature verification
 * @param payload - The raw request body as a string
 * @param signature - The signature from the x-hookdeck-signature header
 * @param secret - The webhook secret key configured in Hookdeck
 * @returns true if the signature is valid, false otherwise
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | string[],
  secret: string
): boolean {
  if (!payload || !signature || !secret) {
    return false;
  }

  const signatures = Array.isArray(signature) ? signature : [signature];

  try {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64');
    
    // Use timing-safe comparison to prevent timing attacks
    for (const sig of signatures) {
      if (crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(sig))) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}