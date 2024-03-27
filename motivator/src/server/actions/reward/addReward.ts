'use server'
// Send Rewards to specifics users based on their actions

import { NextRequest } from 'next/server'
import { db } from '@db/dbRouter'
import { reward, user } from '@db/schema'
import { and, eq } from 'drizzle-orm'
import { toast } from 'sonner'

/**
 *
 * @param request Will contain an Array of [{assessorAddr: string, userAddr: string, value: number}]
 * @param response Send the status of the transaction
 */
export async function addReward({
    userAddr,
    value,
    assessorSlot,
}: {
    userAddr: string
    value: number
    assessorSlot: string
}) {
    const isRewardAlreadyAssigned = await db.query.reward.findFirst({
        where: and(
            eq(reward.assessor_slot_ID, assessorSlot),
            eq(reward.user_address, userAddr)
        ),
    })

    if (isRewardAlreadyAssigned) {
        const rewardSent = await db
            .update(reward)
            .set({
                amount: value,
                user_address: userAddr,
                date: new Date().toISOString(),
            })
            .where(eq(reward.id, isRewardAlreadyAssigned.id))
        console.log('rewardSent', rewardSent)
        if (rewardSent) {
            toast.success(`Update: Reward of ${value} sent to ${userAddr}`)
            return {
                status: 'ok',
                message: `Reward of ${value} sent to ${userAddr}`,
            }
        }
    }

    const rewardSent = await db.insert(reward).values({
        amount: value,
        user_address: userAddr,
        date: new Date().toISOString(),
        assessor_slot_ID: assessorSlot,
    })

    if (rewardSent) {
        toast.success(`New: Reward of ${value} sent to ${userAddr}`)
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
