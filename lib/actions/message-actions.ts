'use server'

import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

export type SendMessageResult =
  | { ok: true; messageId: string }
  | { ok: true; messageId: string; violation: { tier: number; reason: string; strikes: number } }
  | { ok: false; error: string }

/* ------------------------------------------------------------------ */
/*  Regex pre-filters                                                 */
/* ------------------------------------------------------------------ */

const PHONE_REGEX = /(\+?\d[\d\s\-().]{7,}\d)/
const EMAIL_REGEX = /[\w.+-]+@[\w-]+\.[\w.]+/
const SOCIAL_REGEX =
  /(?:@[a-zA-Z0-9_.]{2,30})|(?:(?:instagram|tiktok|snapchat|twitter|x)\.com\/[@]?[a-zA-Z0-9_.]+)/i

// Catches conversational asks to move off-platform even when no handle is
// shared. Examples: "what's your insta", "ur tiktok?", "send me your snap",
// "DM me", "add me on tiktok", "hmu on snap", "my whatsapp is...",
// "let's switch to discord", "wats yur whatsapp".
// Recognizes both "your" and the text-speak variants "ur", "yur", "yor".
// Intentionally does NOT match casual platform references like
// "I saw that on tiktok" — Claude handles the ambiguous middle ground.
const SOCIAL_SOLICITATION_REGEX =
  /\b(?:wha?t'?s?\s+(?:your|ur|yur|yor)|send\s+me\s+(?:your|ur)|gimme\s+(?:your|ur)|give\s+me\s+(?:your|ur)|dm\s+me|add\s+me\s+on|follow\s+me\s+on|message\s+me\s+on|find\s+me\s+on|hit\s+me\s+up\s+on|hmu\s+on|let'?s?\s+(?:switch|move|chat|talk)\s+(?:to|on)|my\s+(?:ig|insta|instagram|snap|snapchat|tiktok|tikkers|twitter|whatsapp|telegram|discord|kik|fb|facebook|messenger|signal|number|phone|cell)\s+is|(?:your|ur|yur|yor)\s+(?:ig|insta|instagram|snap|snapchat|tiktok|tikkers|twitter|whatsapp|telegram|discord|kik|fb|facebook|messenger|signal|number|phone|cell))\b/i

function detectContactInfo(text: string): boolean {
  return (
    PHONE_REGEX.test(text) ||
    EMAIL_REGEX.test(text) ||
    SOCIAL_REGEX.test(text) ||
    SOCIAL_SOLICITATION_REGEX.test(text)
  )
}

function redactContactInfo(text: string): string {
  return text
    .replace(PHONE_REGEX, '[phone removed]')
    .replace(EMAIL_REGEX, '[email removed]')
    .replace(SOCIAL_REGEX, '[handle removed]')
    .replace(SOCIAL_SOLICITATION_REGEX, '[off-platform contact attempt]')
}

/* ------------------------------------------------------------------ */
/*  ProfanityAPI                                                      */
/* ------------------------------------------------------------------ */

async function checkProfanity(text: string): Promise<boolean> {
  if (text.length < 4) return false
  try {
    const res = await fetch('https://vector.profanity.dev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    })
    if (!res.ok) return false
    const data = await res.json()
    return data.isProfanity === true
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ */
/*  Unified Claude Haiku classifier                                   */
/*  Single call: confirms contact info AND classifies severity tier   */
/* ------------------------------------------------------------------ */

type ClassificationResult = {
  is_contact_info: boolean
  redacted_text: string
  tier: 1 | 2 | 3 | null
  tier_reason: string | null
}

async function classifyMessage(
  text: string,
  hasContactRegex: boolean
): Promise<ClassificationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      is_contact_info: hasContactRegex,
      redacted_text: hasContactRegex ? redactContactInfo(text) : text,
      tier: hasContactRegex ? 2 : null,
      tier_reason: hasContactRegex ? 'external_contact' : null,
    }
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `You are a content moderation classifier for a youth mentoring platform where mentors are college students and mentees are high schoolers. Classify this message into the HIGHEST applicable tier.

Tier 1 — Mild profanity only: casual swearing like "damn", "hell", "crap", "ass", "bullshit". Crude but not hateful.

Tier 2 — Bigotry OR external contact:
- ANY slur or hate speech: racial slurs, homophobic slurs (e.g. "faggot", "dyke"), sexist slurs, ableist slurs, ethnic slurs. These are ALWAYS Tier 2 even if they also count as profanity. A slur is never Tier 1.
- Attempts to share OR REQUEST personal contact info (phone, email, social media handles) to move communication off-platform. This includes conversational asks even without a handle attached, text-speak variants ("ur", "yur"), and short fragments that read as exchange requests. Examples that ARE Tier 2: "what's your insta", "ur tiktok?", "tiktok?", "snap?", "what's your snap", "send me your number", "DM me", "add me on tiktok", "my whatsapp is 555-1234", "find me on discord", "let's switch to instagram", "hmu on snap". Examples that are NOT Tier 2: "I saw that on tiktok", "I learned this from an instagram reel", "they post on tiktok" — casual references to content seen on a platform with no exchange intent are fine.

Tier 3 — Sexual content: sexually explicit language, suggestive messages, grooming patterns, requests for photos/meetups.

IMPORTANT: If a word is BOTH profanity AND a slur targeting a group (race, sexuality, gender, disability, ethnicity), it is Tier 2, NOT Tier 1. Tier 1 is exclusively for mild, non-hateful swearing.

Set is_contact_info=true if the message is an off-platform contact attempt: contains real contact info OR requests it OR references off-platform apps in an exchange context OR is a single-word/short fragment that reads as a solicitation (e.g. "tiktok?", "snap", "insta?"). Do NOT flag casual references to content seen on a platform ("I saw that on tiktok", "from an instagram reel") when there is no exchange intent. False positives to ignore: example numbers like "(555) 555-5555", area code mentions in didactic contexts.

The regex pre-filter ${hasContactRegex ? 'DID' : 'did NOT'} flag potential contact info.

Message: "${text}"

Respond with JSON only, no markdown:
{"is_contact_info": boolean, "redacted_text": "message with any contact info replaced by [removed]", "tier": 1|2|3|null, "tier_reason": "profanity"|"bigotry"|"external_contact"|"sexual_content"|null}

If clean, set tier and tier_reason to null.`,
          },
        ],
      }),
    })

    if (!res.ok) {
      return {
        is_contact_info: hasContactRegex,
        redacted_text: hasContactRegex ? redactContactInfo(text) : text,
        tier: hasContactRegex ? 2 : null,
        tier_reason: hasContactRegex ? 'external_contact' : null,
      }
    }

    const data = await res.json()
    const content = data.content?.[0]?.text ?? ''
    const parsed = JSON.parse(content)
    return {
      is_contact_info: parsed.is_contact_info === true,
      redacted_text: parsed.redacted_text ?? (hasContactRegex ? redactContactInfo(text) : text),
      tier: [1, 2, 3].includes(parsed.tier) ? parsed.tier : null,
      tier_reason: parsed.tier_reason ?? null,
    }
  } catch {
    return {
      is_contact_info: hasContactRegex,
      redacted_text: hasContactRegex ? redactContactInfo(text) : text,
      tier: hasContactRegex ? 2 : null,
      tier_reason: hasContactRegex ? 'external_contact' : null,
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Admin notification: user crossed the 3-strike threshold           */
/*  TODO: full design — auto-suspend? auto-unmatch? require admin     */
/*  release before user can message again? For now we set             */
/*  moderation_status='under_review' (passive label) and send this    */
/*  heads-up email so an admin actively triages.                      */
/* ------------------------------------------------------------------ */

async function notifyAdminOfStrikeThreshold(params: {
  senderName: string
  senderEmail: string | null
  senderId: string
  strikes: number
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[moderation] RESEND_API_KEY not set; skipping strike threshold notification.')
    return
  }

  const resend = new Resend(apiKey)
  const fromAddress = process.env.RESEND_FROM_ADDRESS ?? 'Pupil <hello@getpupil.com>'
  const adminEmail = 'admin@getpupil.com'

  try {
    await resend.emails.send({
      from: fromAddress,
      to: adminEmail,
      subject: `URGENT: ${params.senderName} hit ${params.strikes} safety strikes`,
      html: `<!doctype html>
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e; padding: 24px; max-width: 560px;">
    <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #B91C1C;">3-STRIKE THRESHOLD CROSSED</p>
    <p style="margin: 0 0 16px; font-size: 13px; color: #6b6b80;">User <strong>${params.senderName}</strong>${params.senderEmail ? ` (${params.senderEmail})` : ''} now has <strong>${params.strikes} strikes</strong>.</p>
    <p style="margin: 0 0 16px; font-size: 13px; line-height: 1.55;">Their account has been flagged as <strong>under_review</strong>. They can still send messages until an admin takes action. Review their flagged messages and decide whether to release, confirm, or escalate (suspend) in the <a href="https://getpupil.com/admin/flags" style="color: #7A60E4;">Trust &amp; Safety dashboard</a>.</p>
    <p style="margin: 0 0 16px; font-size: 12px; color: #6b6b80;">User ID: <code style="font-family: ui-monospace, monospace; font-size: 11px;">${params.senderId}</code></p>
    <p style="margin: 24px 0 0; color: #6b6b80; font-size: 12px;">— Pupil Safety System</p>
  </body>
</html>`,
    })
  } catch (err) {
    console.error('[moderation] Failed to send strike threshold notification:', err)
  }
}

/* ------------------------------------------------------------------ */
/*  Admin notification for Tier 2-3                                   */
/* ------------------------------------------------------------------ */

async function notifyAdminIfSevere(params: {
  tier: number
  tierReason: string | null
  senderName: string
  content: string
}) {
  if (params.tier < 2) return

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[moderation] RESEND_API_KEY not set; skipping admin notification.')
    return
  }

  const resend = new Resend(apiKey)
  const fromAddress = process.env.RESEND_FROM_ADDRESS ?? 'Pupil <hello@getpupil.com>'
  const adminEmail = 'admin@getpupil.com'

  const tierLabel = params.tier === 3 ? 'TIER 3 (Sexual Content)' : 'TIER 2 (Bigotry / External Contact)'
  const urgency = params.tier === 3 ? 'URGENT: ' : ''

  try {
    await resend.emails.send({
      from: fromAddress,
      to: adminEmail,
      subject: `${urgency}Safety Flag — ${tierLabel}`,
      html: `<!doctype html>
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e; padding: 24px; max-width: 560px;">
    <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: ${params.tier === 3 ? '#B91C1C' : '#92400E'};">${tierLabel}</p>
    <p style="margin: 0 0 16px; font-size: 13px; color: #6b6b80;">Sent by <strong>${params.senderName}</strong></p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; margin: 0 0 16px;">
      <p style="margin: 0; font-size: 13px; line-height: 1.55; color: #374151;">${params.content}</p>
    </div>
    <p style="margin: 0 0 16px; font-size: 13px; line-height: 1.55;">Reason: <strong>${params.tierReason ?? 'unknown'}</strong>. The message was blocked from delivery. Review it in the <a href="https://getpupil.com/admin/flags" style="color: #7A60E4;">Safety Flags dashboard</a>.</p>
    <p style="margin: 24px 0 0; color: #6b6b80; font-size: 12px;">— Pupil Safety System</p>
  </body>
</html>`,
    })
  } catch (err) {
    console.error('[moderation] Failed to send admin notification:', err)
  }
}

/* ------------------------------------------------------------------ */
/*  Hardcoded slur escalation                                         */
/*  AI is unreliable at distinguishing slurs from mild profanity.     */
/*  For a youth platform this must be deterministic.                  */
/* ------------------------------------------------------------------ */

const SLUR_PATTERNS = [
  /\bf+a+g+(?:o+t+|s*)?\b/i,
  /\bn+i+g+(?:g+[ae]r?|a+h?)s?\b/i,
  /\bd+y+k+e+s?\b/i,
  /\bk+i+k+e+s?\b/i,
  /\bs+p+i+c+s?\b/i,
  /\bc+h+i+n+k+s?\b/i,
  /\bw+e+t+b+a+c+k+s?\b/i,
  /\bt+r+a+n+n+(?:y|ie)s?\b/i,
  /\bre+t+a+r+d+(?:ed|s)?\b/i,
]

function containsSlur(text: string): boolean {
  return SLUR_PATTERNS.some((pattern) => pattern.test(text))
}

/* ------------------------------------------------------------------ */
/*  Full moderation pipeline                                          */
/*  1. Regex pre-scan for contact info                                */
/*  2. Hardcoded slur check (deterministic, always Tier 2)            */
/*  3. Claude Haiku: confirm contact + classify tier (parallel w/ 4)  */
/*  4. ProfanityAPI scan                                              */
/*  5. Merge results → highest tier wins                              */
/* ------------------------------------------------------------------ */

type ModerationResult = {
  content: string
  is_flagged: boolean
  is_modified: boolean
  flag_reason: string | null
  flag_tier: 1 | 2 | 3 | null
}

async function moderateMessage(originalContent: string): Promise<ModerationResult> {
  const hasContactRegex = detectContactInfo(originalContent)
  const hasSlur = containsSlur(originalContent)

  const [classification, isProfane] = await Promise.all([
    classifyMessage(originalContent, hasContactRegex),
    checkProfanity(originalContent),
  ])

  let tier = classification.tier
  let reason = classification.tier_reason
  let content = originalContent
  let isModified = false

  // Slur escalation: deterministic override, always at least Tier 2
  if (hasSlur && (tier === null || tier < 2)) {
    tier = 2
    reason = 'bigotry'
  }

  // ProfanityAPI catch: if Haiku missed profanity but ProfanityAPI caught it,
  // set tier 1 as a floor (only if not already higher from slur/AI)
  if (isProfane && (tier === null || tier < 1)) {
    tier = 1
    reason = 'profanity'
  }

  // Contact info: redact content and ensure at least tier 2
  if (classification.is_contact_info) {
    content = classification.redacted_text
    isModified = true
    if (tier === null || tier < 2) {
      tier = 2
      reason = 'external_contact'
    }
  }

  if (tier === null) {
    return { content, is_flagged: false, is_modified: false, flag_reason: null, flag_tier: null }
  }

  return {
    content,
    is_flagged: true,
    is_modified: isModified,
    flag_reason: reason,
    flag_tier: tier as 1 | 2 | 3,
  }
}

/* ------------------------------------------------------------------ */
/*  sendMessage — server action                                       */
/* ------------------------------------------------------------------ */

export async function sendMessage(input: {
  conversationId: string
  content: string
}): Promise<SendMessageResult> {
  const content = input.content.trim()
  if (!content) return { ok: false, error: 'Message cannot be empty.' }
  if (content.length > 2000) return { ok: false, error: 'Message too long (max 2000 chars).' }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  // Verify user is a participant
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, participant_ids')
    .eq('id', input.conversationId)
    .maybeSingle<{ id: string; participant_ids: string[] }>()

  if (!conv) return { ok: false, error: 'Conversation not found.' }
  if (!conv.participant_ids.includes(user.id)) {
    return { ok: false, error: 'You are not a participant in this conversation.' }
  }

  // Run moderation
  const moderation = await moderateMessage(content)

  // All flagged messages: store original, replace with policy notice,
  // auto-block so recipient never sees it. All tiers block delivery.
  const isViolation = moderation.is_flagged
  const isSevere = moderation.flag_tier !== null && moderation.flag_tier >= 2
  const insertContent = isViolation
    ? '[This message was removed for violating community guidelines.]'
    : moderation.content

  const { data: msg, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: input.conversationId,
      sender_id: user.id,
      content: insertContent,
      original_content: isViolation ? content : null,
      is_flagged: moderation.is_flagged,
      is_modified: isViolation,
      flag_reason: moderation.flag_reason,
      flag_tier: moderation.flag_tier,
      admin_action: isViolation ? 'blocked' : null,
    })
    .select('id')
    .single<{ id: string }>()

  if (error) {
    console.error('[messaging] sendMessage insert error:', error)
    return { ok: false, error: 'Failed to send message.' }
  }

  // Increment strikes + check threshold for any flagged message
  let currentStrikes = 0
  let crossedThreshold = false
  if (moderation.is_flagged) {
    const { data: updated } = await supabase.rpc('increment_moderation_strikes', {
      target_user_id: user.id,
    })
    currentStrikes = updated ?? 0

    // 3+ strikes → flag account for review and email admin once at crossing.
    if (currentStrikes >= 3) {
      const { data: previousStatus } = await supabase
        .from('users')
        .select('moderation_status')
        .eq('id', user.id)
        .single<{ moderation_status: string | null }>()

      // We only treat it as "crossing" if the user wasn't already flagged.
      // Avoids spamming admins on every additional violation past 3.
      crossedThreshold = (previousStatus?.moderation_status ?? 'active') === 'active'

      if (crossedThreshold) {
        await supabase
          .from('users')
          .update({ moderation_status: 'under_review' })
          .eq('id', user.id)
      }
    }
  }

  // Admin email for Tier 2-3 + strike-threshold heads-up.
  if (isSevere || crossedThreshold) {
    const { data: sender } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single<{ full_name: string | null; email: string | null }>()

    if (isSevere) {
      notifyAdminIfSevere({
        tier: moderation.flag_tier!,
        tierReason: moderation.flag_reason,
        senderName: sender?.full_name ?? 'Unknown user',
        content,
      }).catch((err) => console.error('[moderation] notification error:', err))
    }

    if (crossedThreshold) {
      notifyAdminOfStrikeThreshold({
        senderName: sender?.full_name ?? 'Unknown user',
        senderEmail: sender?.email ?? null,
        senderId: user.id,
        strikes: currentStrikes,
      }).catch((err) =>
        console.error('[moderation] strike threshold notification error:', err)
      )
    }
  }

  // Return violation info so the client can show the appropriate UI
  if (moderation.is_flagged) {
    return {
      ok: true,
      messageId: msg.id,
      violation: {
        tier: moderation.flag_tier ?? 1,
        reason: moderation.flag_reason ?? 'policy_violation',
        strikes: currentStrikes,
      },
    }
  }

  return { ok: true, messageId: msg.id }
}
