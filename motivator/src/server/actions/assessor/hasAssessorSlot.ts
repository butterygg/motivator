import { eq, isNull } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor, assessor_slot, assessor_slot_user } from '@db/schema'
import { NextRequest } from 'next/server'
/**
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
 */
export async function hasAssessorSlot({
    assessorAddr,
}: {
    assessorAddr: string
}) {
    const hasAssessorSlot = await db.query.assessor_slot.findFirst({
        where:
            eq(assessor_slot.assessor_ID, assessorAddr) &&
            eq(assessor_slot.done, false),
    })

    if (!hasAssessorSlot) {
        return Response.json({
            status: 'ok',
            message: 'AssessorSlot not assigned to this assessor',
        })
    }

    return Response.json({
        status: 'ok',
        message: 'Assessor already have an Assessor Slot assigned',
    })
}
