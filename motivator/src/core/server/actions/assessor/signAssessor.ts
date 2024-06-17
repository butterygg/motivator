'use server'
import { and, eq } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor, assessor_slot } from '@db/schema'
/**
 *
 * @param request Will contain {assessorAddr: string}
 * @param response Send the status of the transaction
 */
export async function signAssessor({ assessorAddr }: { assessorAddr: string }) {
    const userIsSigned = await db.query.assessor.findFirst({
        where: eq(assessor.address, assessorAddr),
    })

    if (!userIsSigned) {
        // verify this assessor doesn't have an assessor slot already in progress
        const hasAssessorSlot = await db.query.assessor_slot.findFirst({
            where: and(
                eq(assessor_slot.assessor_ID, assessorAddr),
                eq(assessor_slot.done, false)
            ),
        })

        if (!hasAssessorSlot) {
            const result = await db.insert(assessor).values({
                address: assessorAddr,
            })

            if (result) {
                return {
                    status: 'ok',
                    message: 'Assessor signed',
                    res: result,
                }
            } else {
                return {
                    status: 'ko',
                    message: 'Error while signing the assessor',
                }
            }
        }

        return {
            status: 'ko',
            message: 'Assessor already have an Assessor Slot assigned',
            res: hasAssessorSlot,
        }
    }

    return { status: 'ok', message: 'Assessor already signed' }
}
