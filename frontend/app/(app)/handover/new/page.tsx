'use client'

import { useRouter } from 'next/navigation'

import {
  HandoverWizard,
  type HandoverDraft,
} from '@/components/wizard/HandoverWizard'
import type { UserSummary } from '@/lib/types'

const DEMO_RECIPIENTS: UserSummary[] = [
  { id: 'u-2', name: 'Nguyễn Hậu', role: 'SUPERVISOR' },
  { id: 'u-3', name: 'Trần Minh', role: 'MANAGEMENT_VIEWER' },
]

export default function NewHandoverPage() {
  const router = useRouter()

  async function submitDraft(draft: HandoverDraft) {
    const res = await fetch('/api/v1/handovers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
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
    <HandoverWizard recipients={DEMO_RECIPIENTS} submitDraft={submitDraft} />
  )
}
