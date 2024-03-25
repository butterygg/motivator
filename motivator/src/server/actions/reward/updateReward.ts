// Send Rewards to specifics users based on their actions

import { NextRequest } from 'next/server'
import { db } from '@db/dbRouter'
import { reward, user } from '@db/schema'
import { eq } from 'drizzle-orm'

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
