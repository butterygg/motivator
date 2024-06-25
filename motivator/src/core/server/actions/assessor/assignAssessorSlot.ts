'use server'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor_slot } from '@db/schema'
/** Assign an Assessor Slot to an Assessor
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
 */
export async function assignAssessorSlot({
    assessorAddr,
}: {
    assessorAddr: string
}) {
    // verify this assessor doesn't have an assessor slot already in progress
    const hasAssessorSlot = await db.query.assessor_slot.findFirst({
        where: and(
            eq(assessor_slot.assessor_ID, assessorAddr),
            eq(assessor_slot.done, false)
        ),
    })

    if (hasAssessorSlot) {
        return {
            status: 'ok',
            message: 'Assessor Already have an Assessor Slot assigned',
            res: hasAssessorSlot,
        }
    }

    // grab an assessor slot that is not done and has no assessor assigned
    const assessor_Slot = await db.query.assessor_slot.findFirst({
        where: and(
            eq(assessor_slot.done, false),
            isNull(assessor_slot.assessor_ID)
        ),
    })

    if (assessor_Slot) {
        const assignAssessor = await db
            .update(assessor_slot)
            .set({
                assessor_ID: assessorAddr,
            })
            .where(
                and(
                    eq(assessor_slot.id, assessor_Slot.id),
                    isNull(assessor_slot.assessor_ID)
                )
            )

        if (assignAssessor) {
            return {
                status: 'ok',
                assessor_Slot,
                message: `Assessor slot assigned to ${assessorAddr}`,
            }
        } else {
            return {
                status: 'ko',
                message: 'Assessor slot already assigned',
            }
        }
    }

    return {
        status: 'ko',
        message: 'No assessor slot available',
    }
}
