'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  HandoverWizard,
  type HandoverDraft,
} from '@/components/wizard/HandoverWizard'
import { draftToCreateHandoverPayload } from '@/lib/handover/draftPayload'
import type { UserSummary } from '@/lib/types'

interface RecipientsResponse {
  data: UserSummary[]
}

export default function NewHandoverPage() {
  const router = useRouter()
  const [recipients, setRecipients] = useState<UserSummary[]>([])
  const [recipientsError, setRecipientsError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/v1/users/recipients', {
          headers: { Accept: 'application/json' },
        })
        if (!res.ok) {
          throw new Error(`Failed to load recipients (${res.status})`)
        }
        const body = (await res.json()) as RecipientsResponse
        if (!cancelled) setRecipients(body.data)
      } catch (err) {
        if (!cancelled) {
          setRecipientsError(
            err instanceof Error ? err.message : String(err)
          )
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  async function submitDraft(draft: HandoverDraft) {
    const payload = draftToCreateHandoverPayload(draft)
    const res = await fetch('/api/v1/handovers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Failed to submit handover (${res.status}): ${body}`)
    }
    const created = (await res.json()) as { id: string; referenceId: string }
    router.push(`/handover/${created.id}`)
    return created
  }

  return (
    <>
      {recipientsError && (
        <p className="mb-3 rounded-md border border-danger bg-danger-soft px-3 py-2 text-xs text-danger">
          {recipientsError}
        </p>
      )}
      <HandoverWizard recipients={recipients} submitDraft={submitDraft} />
    </>
  )
}
