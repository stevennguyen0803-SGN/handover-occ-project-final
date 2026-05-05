import { notFound } from 'next/navigation'

import { auth } from '@/auth'
import { AcknowledgeButton } from '@/components/handover/AcknowledgeButton'
import { AuditTrail } from '@/components/handover/AuditTrail'
import { CarryForwardLink } from '@/components/handover/CarryForwardLink'
import { CategorySection } from '@/components/handover/CategorySection'
import { ExportPdfButton } from '@/components/handover/ExportPdfButton'
import { HandoverHeader } from '@/components/handover/HandoverHeader'
import { toItemView } from '@/lib/handover/toItemView'
import { backendFetch, BackendApiError } from '@/lib/server/api-client'
import type { CategoryCode, HandoverDetail } from '@/lib/types'

interface BackendHandoverDetail
  extends Omit<
    HandoverDetail,
    | 'aircraftItems'
    | 'airportItems'
    | 'flightScheduleItems'
    | 'crewItems'
    | 'weatherItems'
    | 'systemItems'
    | 'abnormalEvents'
    | 'createdAt'
    | 'updatedAt'
  > {
  categories?: Partial<{
    aircraft: HandoverDetail['aircraftItems']
    airport: HandoverDetail['airportItems']
    flightSchedule: HandoverDetail['flightScheduleItems']
    crew: HandoverDetail['crewItems']
    weather: HandoverDetail['weatherItems']
    system: HandoverDetail['systemItems']
    abnormalEvents: HandoverDetail['abnormalEvents']
  }>
  createdAt?: string
  updatedAt?: string
}

const CATEGORY_TUPLES: ReadonlyArray<
  [CategoryCode, keyof NonNullable<BackendHandoverDetail['categories']>]
> = [
  ['aircraft', 'aircraft'],
  ['airport', 'airport'],
  ['flightSchedule', 'flightSchedule'],
  ['crew', 'crew'],
  ['weather', 'weather'],
  ['system', 'system'],
  ['abnormal', 'abnormalEvents'],
]

export default async function HandoverDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session?.user) notFound()

  let handover: BackendHandoverDetail
  try {
    handover = await backendFetch<BackendHandoverDetail>(
      `/api/v1/handovers/${params.id}`
    )
  } catch (err) {
    if (err instanceof BackendApiError && err.status === 404) notFound()
    throw err
  }

  const ownHandover = handover.preparedBy.id === session.user.id
  const handoverId = handover.id
  const referenceId = handover.referenceId
  const acknowledgeAction = async () => {
    'use server'
    const result = await backendFetch<{ acknowledgedAt: string }>(
      `/api/v1/handovers/${handoverId}/acknowledge`,
      { method: 'POST', body: {} }
    )
    return { acknowledgedAt: result.acknowledgedAt, referenceId }
  }

  // The page renders both legacy flat-shape and current categorized shape.
  const headerHandover: HandoverDetail = {
    ...handover,
    aircraftItems: handover.categories?.aircraft ?? [],
    airportItems: handover.categories?.airport ?? [],
    flightScheduleItems: handover.categories?.flightSchedule ?? [],
    crewItems: handover.categories?.crew ?? [],
    weatherItems: handover.categories?.weather ?? [],
    systemItems: handover.categories?.system ?? [],
    abnormalEvents: handover.categories?.abnormalEvents ?? [],
    createdAt: handover.createdAt ?? new Date().toISOString(),
    updatedAt: handover.updatedAt ?? new Date().toISOString(),
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-4">
        <HandoverHeader
          handover={headerHandover}
          rightSlot={
            <>
              <ExportPdfButton handoverId={handover.id} />
              <AcknowledgeButton
                acknowledge={acknowledgeAction}
                disabled={ownHandover}
                alreadyAcknowledged={Boolean(handover.acknowledgedAt)}
              />
            </>
          }
        />
        {handover.carriedFromId && handover.carriedFromReference && (
          <CarryForwardLink
            sourceId={handover.carriedFromId}
            sourceReference={handover.carriedFromReference}
          />
        )}
        {CATEGORY_TUPLES.map(([code, key]) => {
          const items = handover.categories?.[key] ?? []
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
