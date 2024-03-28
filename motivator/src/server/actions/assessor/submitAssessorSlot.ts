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
    assessorAddr,
}: {
    assessorAddr: string
}) {
    // grab an assessor slot that is not done and has no assessor assigned
    // const assessor_Slot = await db.query.assessor_slot.findFirst({
    //     where: and(
    //         eq(assessor_slot.done, false),
    //         isNull(assessor_slot.assessor_ID)
    //     ),
    // })

    const actualWeek = process.env.NEXT_PUBLIC_WEEK_ACTUAL as string

    const assessor_Slot = await db.query.assessor_slot.findFirst({
        where: and(
            eq(assessor_slot.done, false),
            eq(assessor_slot.assessor_ID, assessorAddr)
        ),
    })

    if (assessor_Slot) {
        const assignAssessor = await db
            .update(assessor_slot)
            .set({
                done: true,
                week: Number(actualWeek),
            })
            .where(
                and(
                    eq(assessor_slot.id, assessor_Slot.id),
                    eq(assessor_slot.assessor_ID, assessorAddr)
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
