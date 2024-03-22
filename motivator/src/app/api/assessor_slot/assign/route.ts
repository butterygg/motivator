import { eq, isNull } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor_slot } from '@db/schema'
import { NextRequest } from 'next/server'
// Send Rewards to specifics users based on their actions
/**
 *
 * @param request Will contain an Array of [{address: string, value: number}]
 * @param response Send the status of the transaction
 */
export async function GET(request: NextRequest) {
    const body = await request.json()

    const assessorAddr = body.address

    // grab an assessor slot that is not done and has no assessor assigned
    const assessor_Slot = await db.query.assessor_slot.findFirst({
        where:
            eq(assessor_slot.done, false) && isNull(assessor_slot.assessor_ID),
    })
    if (assessor_Slot) {
        const assignAssessor = await db
            .update(assessor_slot)
            .set({
                assessor_ID: assessorAddr,
            })
            .where(
                eq(assessor_slot.id, assessor_Slot.id) &&
                    isNull(assessor_slot.assessor_ID)
            )

        if (assignAssessor) {
            return Response.json({
                status: 'ok',
                assessor_Slot,
                message: `Assessor slot assigned to ${assessorAddr}`,
            })
        } else {
            return Response.json({
                status: 'ko',
                message: 'Assessor slot already assigned',
            })
        }
    }

    return Response.json({
        status: 'ko',
        message: 'No assessor slot available',
    })
}
