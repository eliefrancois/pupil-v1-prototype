'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

// Static import: this whole module is `'use client'` so it never runs on the
// server, and webpack's dynamic-chunk machinery was producing a malformed URL
// (`/_next/undefined`) for `await import('@daily-co/daily-js')` in dev. Static
// gets bundled with the call-room client chunk, which is only fetched after
// the user clicks Join — so SDK weight is still pay-on-use.
import Daily, { type DailyCall } from '@daily-co/daily-js'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface CallRoomProps {
  roomUrl: string
  token: string
  userName: string
  /** Called when the user clicks the leave button or the call ends. */
  onLeave: () => void
}

/**
 * Embeds a Daily.co prebuilt call iframe and wraps it in Pupil chrome.
 *
 * We use the prebuilt UI for V0 (mic/camera/leave/screenshare/participant
 * tiles all handled by Daily.co) but theme it to match Pupil colors and
 * disable in-call chat. Custom UI is a v1 polish pass.
 */
export default function CallRoom({
  roomUrl,
  token,
  userName,
  onLeave,
}: CallRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const callRef = useRef<DailyCall | null>(null)
  // We don't render our own loading state — Daily's prebuilt iframe already
  // shows its own connecting spinner inside the camera preview, plus the
  // prejoin "Are you ready to join?" UI on the right. Layering our overlay
  // on top either blocks Daily's interactive UI (if opaque) or duplicates
  // its loading affordance (if transparent). Only render an error state.
  const [status, setStatus] = useState<'idle' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let active = true
    let call: DailyCall | null = null

    async function init() {
      try {
        // React 18 strict mode double-invokes effects in dev. Daily's SDK is a
        // singleton and throws "Duplicate DailyIframe instances are not allowed"
        // if a previous instance hasn't been destroyed yet. Tear down any
        // pre-existing instance before creating ours, and await so destroy
        // completes before createFrame.
        const existing = Daily.getCallInstance?.()
        if (existing) {
          try {
            await existing.destroy()
          } catch {
            // Best effort; we're about to create a fresh instance anyway.
          }
        }

        if (!active) return

        call = Daily.createFrame(containerRef.current!, {
          showLeaveButton: true,
          showFullscreenButton: true,
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '12px',
          },
          theme: {
            colors: {
              accent: '#7A60E4',
              accentText: '#FFFFFF',
              background: '#0F0F12',
              backgroundAccent: '#1A1A20',
              baseText: '#FFFFFF',
              border: '#2A2A33',
              mainAreaBg: '#0F0F12',
              mainAreaBgAccent: '#1A1A20',
              mainAreaText: '#FFFFFF',
              supportiveText: '#A0A0B0',
            },
          },
        })

        callRef.current = call

        call.on('left-meeting', () => {
          if (!active) return
          onLeave()
        })
        call.on('error', (event) => {
          if (!active) return
          console.error('[CallRoom] Daily error', event)
          setStatus('error')
          setErrorMessage(
            (event as { errorMsg?: string })?.errorMsg ??
              'Something went wrong with the call.'
          )
        })

        await call.join({
          url: roomUrl,
          token,
          userName,
        })
      } catch (err) {
        if (!active) return
        console.error('[CallRoom] init failed', err)
        setStatus('error')
        setErrorMessage(
          err instanceof Error ? err.message : 'Failed to start call.'
        )
      }
    }

    void init()

    return () => {
      active = false
      // Destroy whichever instance this mount created. We don't call leave()
      // first because the iframe may still be navigating (origin not yet
      // matching pupil.daily.co), which produces noisy postMessage warnings.
      // destroy() removes the iframe element and clears the singleton.
      const instance = call ?? callRef.current
      callRef.current = null
      call = null
      if (instance) {
        instance.destroy().catch(() => {
          // No-op; teardown best effort.
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomUrl, token, userName])

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-[var(--radius)] border border-border bg-black">
      <div ref={containerRef} className="absolute inset-0" />

      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-white">
          <Card className="max-w-md bg-surface text-text">
            <CardContent className="space-y-3 p-6 text-center">
              <AlertTriangle className="mx-auto h-7 w-7 text-warning" />
              <p className="text-[15px] font-semibold">Call failed</p>
              <p className="text-[13px] text-text-2">
                {errorMessage ?? 'Please try again or refresh the page.'}
              </p>
              <Button onClick={onLeave} variant="outline">
                Go back
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
