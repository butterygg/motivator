// Send Rewards to specifics users based on their actions

import { NextRequest } from 'next/server'
import { db } from '@db/dbRouter'
import { reward, user } from '../../../db/schema'

/**
 *
 * @param request Will contain an Array of [{assessorAddress: string, userAddress: string, value: number}]
 * @param response Send the status of the transaction
 */
export async function POST(request: NextRequest) {
    const body = await request.json()

    const userAddr = body.userAddress
    const value = body.value
    const assessorSlot = body.assessorSlot

    const rewardSent = await db.insert(reward).values({
        amount: value,
        user_address: userAddr,
        date: new Date().toISOString(),
        assessor_slot_ID: assessorSlot,
    })

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
