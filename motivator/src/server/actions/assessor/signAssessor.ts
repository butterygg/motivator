import { eq, isNull } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor, assessor_slot, assessor_slot_user } from '@db/schema'
import { NextRequest } from 'next/server'
/**
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
 */
export async function signAssessor({ assessorAddr }: { assessorAddr: string }) {
    const userIsSigned = await db.query.assessor.findFirst({
        where: eq(assessor.address, assessorAddr),
    })

    if (!userIsSigned) {
        // verify this assessor doesn't have an assessor slot already in progress
        const hasAssessorSlot = await db.query.assessor_slot.findFirst({
            where:
                eq(assessor_slot.assessor_ID, assessorAddr) &&
                eq(assessor_slot.done, false),
        })

        if (!hasAssessorSlot) {
            const result = await db.insert(assessor).values({
                address: assessorAddr,
            })

            if (result) {
                return Response.json({
                    status: 'ok',
                    message: 'Assessor signed',
                })
            } else {
                return Response.json({
                    status: 'ko',
                    message: 'Error while signing the assessor',
                })
            }
        }

        return Response.json({
            status: 'ko',
            message: 'Assessor already have an Assessor Slot assigned',
        })
    }

    return Response.json({ status: 'ok', message: 'Assessor already signed' })
}
