'use server'

import { db } from '@db/dbRouter'
import { reward } from '@db/schema'
import { eq } from 'drizzle-orm'

/**
 * Update the reward for a user
 * @param request will contain an object of [{userAddr: string, value: number, rewardId: string}]
 */
export async function updateReward({
    userAddr,
    value,
    rewardId,
}: {
    userAddr: string
    value: number
    rewardId: string
}) {
    await db
        .update(reward)
        .set({
            amount: value,
            user_address: userAddr,
            date: new Date().toISOString(),
        })
        .where(eq(reward.id, rewardId))
}
