'use server'
// Send Rewards to specifics users based on their actions

import { db } from '@db/dbRouter'
import { reward } from '@db/schema'
import { eq } from 'drizzle-orm'
import { toast } from 'sonner'

/**
 *
 * @param request Will contain an Array of [{assessorAddr: string, userAddr: string, value: number}]
 * @param response Send the status of the transaction
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
