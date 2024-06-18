'use server'
// Send Rewards to specifics users based on their actions

import { db } from '@db/dbRouter'
import { assessor_slot, reward } from '@db/schema'
import { and, eq } from 'drizzle-orm'

/**
 *
 * @param request Will contain an Array of [{assessorAddr: string, userAddr: string, value: number}]
 * @param response Send the status of the transaction
 */
export async function addReward({
    userAddr,
    value,
    assessorSlotID,
}: {
    userAddr: string
    value: number
    assessorSlotID: string
}) {
    const isAssessorSlotDone = await db.query.assessor_slot.findFirst({
        where: and(
            eq(assessor_slot.id, assessorSlotID),
            eq(assessor_slot.done, true)
        ),
    })
    if (isAssessorSlotDone) {
        return true
    }
    const isRewardAlreadyAssigned = await db.query.reward.findFirst({
        where: and(
            eq(reward.assessor_slot_id, assessorSlotID),
            eq(reward.user_address, userAddr)
        ),
    })

    if (isRewardAlreadyAssigned) {
        return await db
            .update(reward)
            .set({
                amount: value ? value : 0,
                user_address: userAddr,
                date: new Date().toISOString(),
            })
            .where(eq(reward.id, isRewardAlreadyAssigned.id))
    }

    return await db.insert(reward).values({
        amount: value,
        user_address: userAddr,
        date: new Date().toISOString(),
        assessor_slot_id: assessorSlotID,
    })
}
