import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor, assessor_slot, assessor_slot_user } from '@db/schema'
import { NextRequest } from 'next/server'
/**
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
 */
export async function getAssessorSlotID({
    assessorAddr,
}: {
    assessorAddr: string
}) {
    const assessorSlotID = await db.query.assessor_slot.findFirst({
        columns: { id: true, done: true },
        where: and(
            eq(assessor_slot.assessor_ID, assessorAddr),
            eq(assessor_slot.done, false)
        ),
    })

    if (!assessorSlotID) {
        return {
            status: 'ok',
            message: 'AssessorSlot not assigned to this assessor',
        }
    }

    return {
        status: 'ok',
        message: 'Assessor already have an Assessor Slot assigned',
        res: assessorSlotID,
    }
}
