import { eq, isNull } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor_slot, assessor_slot_user } from '@db/schema'
import { NextRequest } from 'next/server'
// Send Rewards to specifics users based on their actions
/**
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
 */
export async function GET(request: NextRequest) {
    const body = await request.json()

    const assessorAddr = body.assessorAddr

    // grab an assessor slot that is not done and has the assessor assigned
    const assessorSlotOfAssessor = await db.query.assessor_slot.findFirst({
        where:
            eq(assessor_slot.done, false) &&
            eq(assessor_slot.assessor_ID, assessorAddr),
    })
    if (!assessorSlotOfAssessor) {
        return Response.json({
            status: 'ko',
            message: 'No assessor slot available',
        })
    }
    // Get the list of users for the assessor slot
    const usersOfAssessorSlot = await db.query.assessor_slot_user.findMany({
        where: eq(
            assessor_slot_user.assessor_slot_ID,
            assessorSlotOfAssessor.id
        ),
    })

    if (usersOfAssessorSlot) {
        return Response.json({
            status: 'ok',
            usersOfAssessorSlot,
            message: `Users of the assessor slot`,
        })
    } else {
        return Response.json({
            status: 'ko',
            message: 'No users for the assessor slot',
        })
    }
}
