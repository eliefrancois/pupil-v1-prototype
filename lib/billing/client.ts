export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; code: string; error: string }

export async function startCheckout(returnPath: string): Promise<CheckoutResult> {
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnPath }),
    })
    const data = (await res.json()) as { url?: string; error?: string; code?: string }
    if (res.ok && data.url) return { ok: true, url: data.url }
    return {
      ok: false,
      code: data.code ?? 'unknown',
      error: data.error ?? 'Something went wrong. Please try again.',
    }
  } catch {
    return { ok: false, code: 'network', error: 'Something went wrong. Please try again.' }
  }
}

export async function openBillingPortal(): Promise<CheckoutResult> {
  try {
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = (await res.json()) as { url?: string; error?: string }
    if (res.ok && data.url) return { ok: true, url: data.url }
    return { ok: false, code: 'portal', error: data.error ?? 'Could not open billing.' }
  } catch {
    return { ok: false, code: 'network', error: 'Could not open billing.' }
  }
}
