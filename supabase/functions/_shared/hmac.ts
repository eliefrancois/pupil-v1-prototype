/**
 * HMAC-SHA256 signature verification for Daily.co webhooks.
 *
 * Daily.co sends two headers with each webhook POST:
 *   - X-Webhook-Signature: base64-encoded HMAC-SHA256 of `${timestamp}.${rawBody}`
 *   - X-Webhook-Timestamp: epoch seconds when the event was sent
 *
 * The shared `hmac` secret stored on the Daily side is itself base64-encoded;
 * we decode it back to raw bytes before using as the HMAC key.
 *
 * Reference: https://docs.daily.co/reference/rest-api/webhooks
 */

export async function verifyDailySignature(opts: {
  /** The base64-encoded secret shared between Pupil and Daily. */
  secret: string;
  /** Value of the X-Webhook-Signature header. */
  signature: string;
  /** Value of the X-Webhook-Timestamp header. */
  timestamp: string;
  /** Raw POST body (must be unparsed; whitespace matters). */
  body: string;
}): Promise<boolean> {
  if (!opts.signature || !opts.timestamp || !opts.secret) return false;

  const keyBytes = base64Decode(opts.secret);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const data = new TextEncoder().encode(`${opts.timestamp}.${opts.body}`);
  const sigBytes = await crypto.subtle.sign("HMAC", key, data);
  const expected = base64Encode(new Uint8Array(sigBytes));

  return constantTimeEqual(opts.signature, expected);
}

function base64Decode(s: string): Uint8Array {
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64Encode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}
