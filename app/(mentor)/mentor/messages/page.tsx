'use client'

import { useState, useRef, useEffect } from 'react'
import { MESSAGES, type Message } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Send, TriangleAlert as AlertTriangle } from 'lucide-react'

/* ---------- Helpers ---------- */

const PHONE_REGEX = /(\+?\d[\d\s\-().]{7,}\d)/
const EMAIL_REGEX = /[\w.+-]+@[\w-]+\.[\w.]+/

function containsContactInfo(text: string): boolean {
  return PHONE_REGEX.test(text) || EMAIL_REGEX.test(text)
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/* ---------- Page ---------- */

export default function MentorMessagesPage() {
  const [messages, setMessages] = useState<Message[]>(MESSAGES)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const text = input.trim()
    if (!text) return

    const newMsg: Message = {
      id: `msg_new_${Date.now()}`,
      from: 'mentor',
      at: new Date().toISOString(),
      text,
    }

    const newMessages = [...messages, newMsg]

    if (containsContactInfo(text)) {
      const warningMsg: Message = {
        id: `msg_sys_${Date.now()}`,
        from: 'system',
        at: new Date().toISOString(),
        text: 'Your message was modified because it contained contact information.',
        systemKind: 'modified',
      }
      newMessages.push(warningMsg)
    }

    setMessages(newMessages)
    setInput('')
  }

  const lastMessage = messages[messages.length - 1]
  const lastMessagePreview = lastMessage
    ? lastMessage.text.length > 40
      ? lastMessage.text.slice(0, 40) + '...'
      : lastMessage.text
    : ''
  const hasUnread = lastMessage?.from === 'student'

  return (
    <div className="flex h-full">
      {/* Left panel - conversation list */}
      <div className="flex w-72 flex-col border-r border-gray-200 bg-gray-50/50">
        <div className="border-b border-gray-200 px-4 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>

        <div className="border-b border-gray-100 bg-white px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar alt="Riley Park" size="default" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  Riley Park
                </p>
                <span className="text-xs text-gray-400">
                  {lastMessage ? formatDate(lastMessage.at) : ''}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-500 truncate">
                {lastMessagePreview}
              </p>
            </div>
            {hasUnread && (
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#7A60E4]" />
            )}
          </div>
        </div>
      </div>

      {/* Right panel - chat */}
      <div className="flex flex-1 flex-col">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-3">
          <Avatar alt="Riley Park" size="default" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Riley Park</p>
            <p className="text-xs text-gray-500">
              West Mesa HS &middot; Grade 11
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mx-auto max-w-2xl space-y-3">
            {messages.map((msg) => {
              if (msg.from === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
                      <span className="text-xs text-yellow-700">{msg.text}</span>
                    </div>
                  </div>
                )
              }

              const isMentor = msg.from === 'mentor'

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMentor ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMentor
                        ? 'bg-[#7A60E4] text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <p
                      className={`mt-1 text-right text-[10px] ${
                        isMentor ? 'text-white/60' : 'text-gray-400'
                      }`}
                    >
                      {formatTime(msg.at)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="border-t border-gray-200 px-6 py-3">
          <div className="mx-auto flex max-w-2xl gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
