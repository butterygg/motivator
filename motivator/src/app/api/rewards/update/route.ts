// Send Rewards to specifics users based on their actions

import { NextRequest } from 'next/server'
import { db } from '@db/dbRouter'
import { reward, user } from '../../../db/schema'
import { eq } from 'drizzle-orm'

/**
 *
 * @param request Will contain an Array of [{assessorAddress: string, userAddress: string, rewardId: number, value: number}]
 * @param response Send the status of the transaction
 */
export async function POST(request: NextRequest) {
    const body = await request.json()

    const userAddr = body.userAddress
    const value = body.value

    const rewardSent = await db
        .update(reward)
        .set({
            amount: value,
            user_address: userAddr,
            date: new Date().toISOString(),
        })
        .where(eq(reward.id, body.rewardId))

    if (rewardSent) {
        return Response.json({
            status: 'ok',
            message: `Reward of ${value} sent to ${userAddr}`,
        })
    } else {
        return Response.json({
            status: 'ko',
            message: 'Error while sending the reward',
        })
    }
}
