'use client'

import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import {
  ExternalLink,
  ImageIcon,
  Linkedin,
  Loader as Loader2,
  Search,
  Upload,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  uploadGhostMentorPhoto,
  updateGhostMentorEmail,
  updateGhostMentorLinkedin,
} from '@/lib/actions/ghost-photo-actions'
import {
  GHOST_PHOTO_ACCEPT,
  isGhostProfileQueueComplete,
  isPlaceholderMentorPhoto,
} from '@/lib/ghost-photos'
import {
  buildLinkedinPeopleSearchUrl,
  normalizeLinkedinUrl,
} from '@/lib/linkedin'
import { cn } from '@/lib/utils'

import { formatGhostMentorLocation } from '@/lib/ghost-mentor-name'

export type GhostPhotoRow = {
  user_id: string
  full_name: string
  email: string
  /** Resolved college name; null when CSV only has status placeholders. */
  school: string | null
  university: string | null
  major: string | null
  grad_year: number | null
  city: string | null
  state: string | null
  photo_url: string | null
  linkedin_url: string | null
  status: string | null
}

function mentorOpsContext(mentor: GhostPhotoRow) {
  const school = mentor.school
  const hometown = formatGhostMentorLocation(mentor.city, mentor.state)
  const extra = [
    mentor.major && mentor.major !== '.' ? mentor.major : null,
    mentor.grad_year != null ? `Class of ${mentor.grad_year}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return { school, hometown, extra }
}

function readImageFile(file: File): Promise<string | null> {
  if (!file.type.startsWith('image/')) return Promise.resolve(null)
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

function PhotoUploadModal({
  mentor,
  open,
  onOpenChange,
  onUploaded,
}: {
  mentor: GhostPhotoRow
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploaded: (photoUrl: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isPending, startTransition] = useTransition()

  const resetModal = useCallback(() => {
    setPreviewUrl(null)
    setPendingFile(null)
    setError('')
    setIsDragging(false)
  }, [])

  const applyFile = useCallback(async (file: File) => {
    setError('')
    const preview = await readImageFile(file)
    if (!preview) {
      setError('Could not read that image. Try JPEG, PNG, or WebP.')
      return
    }
    setPendingFile(file)
    setPreviewUrl(preview)
  }, [])

  const handleClose = (next: boolean) => {
    if (!next) resetModal()
    onOpenChange(next)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) =>
      i.type.startsWith('image/')
    )
    if (!item) return
    e.preventDefault()
    const file = item.getAsFile()
    if (file) void applyFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void applyFile(file)
  }

  const handleSave = () => {
    if (!pendingFile) {
      setError('Add an image first (paste, drop, or choose a file).')
      return
    }
    startTransition(async () => {
      setError('')
      const formData = new FormData()
      formData.set('photo', pendingFile)
      const result = await uploadGhostMentorPhoto(mentor.user_id, formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      handleClose(false)
      onUploaded(result.photoUrl)
    })
  }

  const displayName = mentor.full_name || mentor.email || 'Mentor'
  const { school, hometown, extra } = mentorOpsContext(mentor)
  const contextSubtitle = [
    mentor.email ? `Email: ${mentor.email}` : null,
    school ? `School: ${school}` : null,
    hometown ? `From: ${hometown}` : null,
    extra || null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" onClose={() => handleClose(false)}>
        <DialogHeader>
          <DialogTitle>Update photo</DialogTitle>
          <DialogDescription>
            {displayName}
            {contextSubtitle ? ` — ${contextSubtitle}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div
          role="button"
          tabIndex={0}
          onPaste={handlePaste}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
          }}
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-[var(--radius)] border-2 border-dashed px-6 py-10 transition-colors',
            isDragging
              ? 'border-primary bg-primary-light'
              : 'border-border bg-surface-2 hover:border-border-strong'
          )}
        >
          {previewUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewUrl}
              alt="Preview"
              className="h-28 w-28 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <ImageIcon className="h-10 w-10 text-text-3" />
          )}
          <p className="text-center text-[13px] text-text-2">
            Drop an image, click to browse, or paste from clipboard (Cmd+V)
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            Choose file
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={GHOST_PHOTO_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void applyFile(file)
              e.target.value = ''
            }}
          />
        </div>

        {error && (
          <p className="text-[13px] text-[#B91C1C]" role="alert">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending || !pendingFile}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save photo'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GhostPhotoCard({
  mentor,
  onMentorUpdated,
}: {
  mentor: GhostPhotoRow
  onMentorUpdated: (userId: string, patch: Partial<GhostPhotoRow>) => void
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [linkedinInput, setLinkedinInput] = useState(mentor.linkedin_url ?? '')
  const [emailInput, setEmailInput] = useState(mentor.email ?? '')
  const needsPhoto = isPlaceholderMentorPhoto(mentor.photo_url)
  const needsLinkedin = !mentor.linkedin_url?.trim()
  const [showLinkedin, setShowLinkedin] = useState(needsLinkedin)
  const [showEmail, setShowEmail] = useState(false)
  const [linkedinError, setLinkedinError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [linkedinPending, startLinkedinTransition] = useTransition()
  const [emailPending, startEmailTransition] = useTransition()

  const initials = (mentor.full_name || mentor.email)
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const { school, hometown, extra } = mentorOpsContext(mentor)

  const searchUrl = buildLinkedinPeopleSearchUrl({
    fullName: mentor.full_name || mentor.email,
    university: school,
  })

  const saveLinkedin = () => {
    startLinkedinTransition(async () => {
      setLinkedinError('')
      if (!linkedinInput.trim()) {
        setLinkedinError(
          'LinkedIn URL is required before this mentor leaves the queue.'
        )
        return
      }
      const saved = normalizeLinkedinUrl(linkedinInput)
      if (!saved) {
        setLinkedinError('Enter a valid LinkedIn profile URL.')
        return
      }
      const result = await updateGhostMentorLinkedin({
        mentorUserId: mentor.user_id,
        linkedinInput,
      })
      if (!result.ok) {
        setLinkedinError(result.error)
        return
      }
      setLinkedinInput(saved)
      setShowLinkedin(false)
      onMentorUpdated(mentor.user_id, { linkedin_url: saved })
    })
  }

  const saveEmail = () => {
    startEmailTransition(async () => {
      setEmailError('')
      const result = await updateGhostMentorEmail({
        mentorUserId: mentor.user_id,
        emailInput,
      })
      if (!result.ok) {
        setEmailError(result.error)
        return
      }
      const saved = emailInput.trim().toLowerCase()
      setEmailInput(saved)
      setShowEmail(false)
      onMentorUpdated(mentor.user_id, { email: saved })
    })
  }

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
          {!needsPhoto && mentor.photo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={mentor.photo_url}
              alt=""
              className="h-14 w-14 shrink-0 rounded-[var(--radius)] object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius)] bg-primary-light text-[15px] font-semibold text-primary">
              {initials || '?'}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[15px] font-semibold text-text">
                {mentor.full_name || '(no name)'}
              </p>
              {needsPhoto ? (
                <Badge variant="warning">Photo needed</Badge>
              ) : (
                <Badge variant="success">Photo done</Badge>
              )}
              {needsLinkedin ? (
                <Badge variant="warning">LinkedIn needed</Badge>
              ) : (
                <Badge variant="success">LinkedIn done</Badge>
              )}
            </div>
            <dl className="mt-2 space-y-1 text-[13px] text-text-2">
              <div className="flex gap-2">
                <dt className="shrink-0 font-medium text-text">Email</dt>
                <dd className="break-all">{mentor.email || '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 font-medium text-text">School</dt>
                <dd>{school ?? '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 font-medium text-text">From</dt>
                <dd>{hometown || '—'}</dd>
              </div>
              {extra ? (
                <p className="text-[12px] text-text-3">{extra}</p>
              ) : null}
            </dl>
            {mentor.linkedin_url && (
              <a
                href={mentor.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[13px] text-primary hover:underline"
              >
                <Linkedin className="h-3.5 w-3.5" />
                Saved profile
              </a>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={searchUrl} target="_blank" rel="noopener noreferrer">
                <Search className="mr-1.5 h-4 w-4" />
                Find on LinkedIn
                <ExternalLink className="ml-1 h-3 w-3 opacity-60" />
              </a>
            </Button>
            {needsPhoto ? (
              <Button type="button" size="sm" onClick={() => setModalOpen(true)}>
                Upload photo
              </Button>
            ) : (
              <span className="text-[12px] font-medium text-text-3">
                Photo saved
              </span>
            )}
            <Button
              type="button"
              variant={needsLinkedin ? 'default' : 'ghost'}
              size="sm"
              className={needsLinkedin ? '' : 'text-text-2'}
              onClick={() => setShowLinkedin((v) => !v)}
            >
              {showLinkedin
                ? 'Hide LinkedIn'
                : needsLinkedin
                  ? 'Add LinkedIn URL'
                  : 'Edit LinkedIn URL'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-text-2"
              onClick={() => setShowEmail((v) => !v)}
            >
              {showEmail ? 'Hide email' : 'Update email (optional)'}
            </Button>
            <a
              href={`/mentors/${mentor.user_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-[12px] text-text-3 hover:text-primary hover:underline"
            >
              Preview profile
            </a>
          </div>
        </CardContent>

        {(showLinkedin || needsLinkedin) && (
          <CardContent className="border-t border-border pt-0 pb-5">
            <div className="space-y-2">
              <Label htmlFor={`linkedin-${mentor.user_id}`}>
                LinkedIn profile URL {needsLinkedin ? '(required)' : ''}
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id={`linkedin-${mentor.user_id}`}
                  placeholder="linkedin.com/in/handle"
                  value={linkedinInput}
                  onChange={(e) => setLinkedinInput(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={linkedinPending || !linkedinInput.trim()}
                  onClick={saveLinkedin}
                >
                  {linkedinPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save LinkedIn'
                  )}
                </Button>
              </div>
              {linkedinError && (
                <p className="text-[13px] text-[#B91C1C]">{linkedinError}</p>
              )}
              <p className="text-[12px] text-text-3">
                Required. Paste the profile URL after you find them on LinkedIn.
              </p>
            </div>
          </CardContent>
        )}

        {showEmail && (
          <CardContent className="border-t border-border pt-0 pb-5">
            <div className="space-y-2">
              <Label htmlFor={`email-${mentor.user_id}`}>Email (optional)</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id={`email-${mentor.user_id}`}
                  type="email"
                  placeholder="mentor@school.edu"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={emailPending || !emailInput.trim()}
                  onClick={saveEmail}
                >
                  {emailPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save email'
                  )}
                </Button>
              </div>
              {emailError && (
                <p className="text-[13px] text-[#B91C1C]">{emailError}</p>
              )}
              <p className="text-[12px] text-text-3">
                Only if the address on file is wrong. Claim invites go to this
                email.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      <PhotoUploadModal
        mentor={mentor}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUploaded={(photoUrl) =>
          onMentorUpdated(mentor.user_id, { photo_url: photoUrl })
        }
      />
    </>
  )
}

export default function GhostPhotosClient({
  rows: initialRows,
  totalGhosts,
}: {
  rows: GhostPhotoRow[]
  totalGhosts: number
}) {
  const [rows, setRows] = useState(initialRows)
  const [query, setQuery] = useState('')

  useEffect(() => {
    setRows(initialRows)
  }, [initialRows])

  const inQueue = rows.length
  const doneCount = Math.max(0, totalGhosts - inQueue)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const hay = [
        r.full_name,
        r.email,
        r.school,
        r.university,
        r.major,
        r.city,
        r.state,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [rows, query])

  if (rows.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-[14px] text-text-2">
          {doneCount} of {totalGhosts} ghost mentors complete (photo + LinkedIn)
        </p>
        <Card className="p-12 text-center">
          <CardContent className="space-y-3 p-0">
            <p className="text-[15px] font-semibold text-text">
              You&apos;re all caught up
            </p>
            <p className="text-[14px] text-text-2">
              Every ghost in the queue has a photo and LinkedIn link. Nice work.
            </p>
            <Link
              href="/admin/mentors?status=approved"
              className="text-[14px] font-medium text-primary hover:underline"
            >
              View mentors
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[14px] text-text-2">
          <span className="font-medium text-text">{inQueue}</span> in queue ·{' '}
          <span className="font-medium text-text">{doneCount}</span> of{' '}
          {totalGhosts} complete (photo + LinkedIn)
        </p>
        <p className="mt-2 text-[13px] text-text-3">
          For each mentor: open Find on LinkedIn, upload their headshot, then
          save their profile URL. They leave this list once photo and LinkedIn
          are both saved. Fix a wrong email with Update email (optional).
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
        <Input
          className="pl-9"
          placeholder="Search by name, email, school, city, or major…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-[14px] text-text-2">
          No mentors match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((mentor) => (
            <li key={mentor.user_id}>
              <GhostPhotoCard
                mentor={mentor}
                onMentorUpdated={(userId, patch) =>
                  setRows((prev) => {
                    const next = prev.map((r) =>
                      r.user_id === userId ? { ...r, ...patch } : r
                    )
                    const updated = next.find((r) => r.user_id === userId)
                    if (
                      updated &&
                      isGhostProfileQueueComplete(
                        updated.photo_url,
                        updated.linkedin_url
                      )
                    ) {
                      return next.filter((r) => r.user_id !== userId)
                    }
                    return next
                  })
                }
              />
            </li>
          ))}
        </ul>
      )}

      <p className="text-[12px] text-text-3">
        Showing {filtered.length} of {rows.length} in queue
      </p>
    </div>
  )
}
