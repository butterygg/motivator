'use server'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor_slot } from '@db/schema'
/** Assign an Assessor Slot to an Assessor
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
 */
export async function submitAssessorSlot({
    assessorSlotID,
    assessorAddr,
}: {
    assessorSlotID: string
    assessorAddr: string
}) {
    const actualWeek = process.env.NEXT_PUBLIC_WEEK_ACTUAL as string

    const submitAssessorSlot = await db
        .update(assessor_slot)
        .set({
            done: true,
            week: Number(actualWeek),
        })
        .where(
            and(
                eq(assessor_slot.id, assessorSlotID),
                eq(assessor_slot.assessor_ID, assessorAddr),
                eq(assessor_slot.done, false)
            )
        )
    if (submitAssessorSlot.rowCount > 0) {
        return {
            status: 'ok',
            message: `Motivator slot updated : ${assessorSlotID}`,
        }
    } else {
        return {
            status: 'ko',
            message: 'Fail on Update - Motivator Slot',
        }
    }
}
