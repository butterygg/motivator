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
    const rewardSent = await db
        .update(reward)
        .set({
            amount: value,
            user_address: userAddr,
            date: new Date().toISOString(),
        })
        .where(eq(reward.id, rewardId))

    if (rewardSent) {
        toast.success(`Reward of ${value} sent to ${userAddr}`)
        return {
            status: 'ok',
            message: `Reward of ${value} sent to ${userAddr}`,
        }
    } else {
        return {
            status: 'ko',
            message: 'Error while sending the reward',
        }
    }
}
