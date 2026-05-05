import { notFound } from 'next/navigation'

import { auth } from '@/auth'
import { AcknowledgeButton } from '@/components/handover/AcknowledgeButton'
import { AuditTrail } from '@/components/handover/AuditTrail'
import { CarryForwardLink } from '@/components/handover/CarryForwardLink'
import {
  CategorySection,
  toItemView,
} from '@/components/handover/CategorySection'
import { HandoverHeader } from '@/components/handover/HandoverHeader'
import { backendFetch, BackendApiError } from '@/lib/server/api-client'
import type { CategoryCode, HandoverDetail } from '@/lib/types'

const CATEGORY_TUPLES: ReadonlyArray<[CategoryCode, keyof HandoverDetail]> = [
  ['aircraft', 'aircraftItems'],
  ['airport', 'airportItems'],
  ['flightSchedule', 'flightScheduleItems'],
  ['crew', 'crewItems'],
  ['weather', 'weatherItems'],
  ['system', 'systemItems'],
  ['abnormal', 'abnormalEvents'],
]

export default async function HandoverDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session?.user) notFound()

  let handover: HandoverDetail
  try {
    handover = await backendFetch<HandoverDetail>(
      `/api/v1/handovers/${params.id}`
    )
  } catch (err) {
    if (err instanceof BackendApiError && err.status === 404) notFound()
    throw err
  }

  const ownHandover = handover.preparedBy.id === session.user.id
  const acknowledgeAction = async () => {
    'use server'
    return { acknowledgedAt: new Date().toISOString(), referenceId: handover.referenceId }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-4">
        <HandoverHeader
          handover={handover}
          rightSlot={
            <AcknowledgeButton
              acknowledge={acknowledgeAction}
              disabled={ownHandover}
              alreadyAcknowledged={Boolean(handover.acknowledgedAt)}
            />
          }
        />
        {handover.carriedFromId && handover.carriedFromReference && (
          <CarryForwardLink
            sourceId={handover.carriedFromId}
            sourceReference={handover.carriedFromReference}
          />
        )}
        {CATEGORY_TUPLES.map(([code, key]) => {
          const items = handover[key] as Array<
            Parameters<typeof toItemView>[0]
          >
          return (
            <CategorySection
              key={code}
              category={code}
              items={items.map((it) => toItemView(it, code))}
            />
          )
        })}
      </div>
      <AuditTrail entries={[]} />
    </div>
  )
}
