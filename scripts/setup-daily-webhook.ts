#!/usr/bin/env -S npx tsx
/**
 * One-time setup: register a Daily.co webhook against a public URL.
 *
 * Usage:
 *   npx tsx scripts/setup-daily-webhook.ts <public_url>
 *
 * Examples:
 *   npx tsx scripts/setup-daily-webhook.ts \
 *     https://abc123.ngrok-free.app/functions/v1/daily-webhook
 *   npx tsx scripts/setup-daily-webhook.ts \
 *     https://wkifwlvpqqvbvcteeuzf.supabase.co/functions/v1/daily-webhook
 *
 * What it does:
 *   1. Reads DAILY_API_KEY from .env.local (or env).
 *   2. Generates a 32-byte base64 HMAC secret.
 *   3. POSTs to https://api.daily.co/v1/webhooks with eventTypes set to the
 *      events the daily-webhook function knows how to handle.
 *   4. Prints the webhook UUID + the secret + copy-paste env commands.
 *
 * After running, paste the secret into `.env.local` (and / or
 * `supabase secrets set DAILY_WEBHOOK_SECRET=...` for prod) and restart
 * `supabase functions serve` so the new value is picked up.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { randomBytes } from "node:crypto";

type Args = { url: string; secret?: string };

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  let secret: string | undefined;

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--secret") {
      secret = argv[++i];
    } else if (a.startsWith("--secret=")) {
      secret = a.slice("--secret=".length);
    } else {
      positional.push(a);
    }
  }

  const url = positional[0];
  if (!url) {
    console.error(
      "Usage: npx tsx scripts/setup-daily-webhook.ts <public_url> [--secret <base64>]",
    );
    console.error(
      "  --secret  Reuse an existing base64 hmac instead of generating one.",
    );
    console.error(
      "            Pass this when the secret is already configured on the",
    );
    console.error(
      "            target deployment (so the verification ping passes).",
    );
    process.exit(1);
  }
  if (!/^https:\/\//.test(url)) {
    console.error(
      `Public URL must start with https:// (got: ${url}). Daily.co rejects http.`,
    );
    process.exit(1);
  }
  return { url, secret };
}

/**
 * Tiny .env.local parser (avoids dotenv dep). Mutates process.env.
 *
 * Behavior matches dotenv conventions:
 *   - Pre-existing process.env values from the shell take precedence.
 *   - Within the file, later definitions override earlier ones (so appending
 *     a fresh `KEY=val` line at the bottom does what you'd expect).
 *   - Empty values in the file are ignored (let later non-empty definitions
 *     win, and don't blank out a real shell-provided value).
 */
function loadEnvLocal() {
  const file = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");

  const shellKeys = new Set(
    Object.keys(process.env).filter((k) => process.env[k] !== undefined),
  );
  const fromFile: Record<string, string> = {};

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (v === "") continue;
    fromFile[k] = v;
  }

  for (const [k, v] of Object.entries(fromFile)) {
    if (shellKeys.has(k)) continue;
    process.env[k] = v;
  }
}

const EVENT_TYPES = [
  "meeting.ended",
  "recording.ready-to-download",
  "transcript.ready-to-download",
] as const;

async function main() {
  const { url, secret: providedSecret } = parseArgs(process.argv);
  loadEnvLocal();

  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    console.error(
      "DAILY_API_KEY is not set (checked process.env and .env.local).",
    );
    process.exit(1);
  }

  // 32 random bytes → base64. Daily docs require the secret to be base64-
  // encoded; passing the encoded form here also avoids a race during the
  // webhook-creation verification ping.
  //
  // If --secret was passed, reuse that value instead — useful when the
  // target deployment already has DAILY_WEBHOOK_SECRET configured and we
  // need Daily's verification ping to be signed with that exact key.
  const secret = providedSecret ?? randomBytes(32).toString("base64");
  const isReusedSecret = Boolean(providedSecret);

  const body = {
    url,
    eventTypes: EVENT_TYPES,
    hmac: secret,
    // exponential keeps a flaky ngrok tunnel from permanently FAILing the
    // webhook. Default circuit-breaker stops delivery after 3 consecutive
    // failures, which is harsh in dev.
    retryType: "exponential" as const,
  };

  console.log(`POST https://api.daily.co/v1/webhooks`);
  console.log(`  url: ${url}`);
  console.log(`  events: ${EVENT_TYPES.join(", ")}`);
  console.log(`  retryType: exponential`);
  console.log(``);

  const res = await fetch("https://api.daily.co/v1/webhooks", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }

  if (!res.ok) {
    console.error(`FAILED (${res.status}):`);
    console.error(parsed);
    if (res.status === 400) {
      console.error(
        "\nCommon causes:",
        "\n  - The public URL didn't return 200 to Daily's verification ping.",
        "\n    Make sure `supabase functions serve daily-webhook --no-verify-jwt --env-file .env.local`",
        "\n    is running and your ngrok tunnel forwards to that port (default 54321).",
        "\n  - URL must be https:// (not http://) and publicly reachable.",
      );
    }
    if (res.status === 402 || res.status === 403) {
      console.error(
        "\nYou may need to add a credit card to your Daily.co account",
        "\nto unlock webhook access.",
      );
    }
    process.exit(1);
  }

  const result = parsed as {
    uuid: string;
    url: string;
    eventTypes: string[];
    state: string;
  };

  console.log("Created webhook successfully:");
  console.log(JSON.stringify(result, null, 2));
  console.log("");
  console.log("=".repeat(72));
  if (isReusedSecret) {
    console.log(
      "Used the secret you passed via --secret. The deployed function should",
    );
    console.log("already have it; no further action needed.");
  } else {
    console.log("Save this secret — it won't be shown again:");
    console.log("");
    console.log(`  DAILY_WEBHOOK_SECRET=${secret}`);
    console.log("");
    console.log(
      "Local dev (paste into .env.local, then restart functions serve):",
    );
    console.log(`  echo 'DAILY_WEBHOOK_SECRET=${secret}' >> .env.local`);
    console.log("");
    console.log("Supabase prod (sets the secret on the deployed function):");
    console.log(`  supabase secrets set DAILY_WEBHOOK_SECRET=${secret}`);
    console.log("");
  }
  console.log("Webhook UUID (for future updates / deletes):");
  console.log(`  ${result.uuid}`);
  console.log("");
  console.log("To delete this webhook later:");
  console.log(
    `  curl -X DELETE -H "Authorization: Bearer $DAILY_API_KEY" \\`,
  );
  console.log(`    https://api.daily.co/v1/webhooks/${result.uuid}`);
  console.log("=".repeat(72));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
