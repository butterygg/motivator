'use server'
import { and, eq, ne } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { reward } from '@db/schema'

/**
 * Get the rewarded users for an assessor slot
 * @param assessorSlotId The assessor slot id
 * @returns {status: string, message: string, res: any}
 * */
export const getRewardedUsers = async (assessorSlotId: string) => {
    const rewardedUsers = await db
        .select()
        .from(reward)
        .where(
            and(
                eq(reward.assessor_slot_id, assessorSlotId),
                ne(reward.amount, 0)
            )
        )
        .execute()

    if (!rewardedUsers) {
        return {
            status: 'ko',
            message: 'No rewards for the assessor slot',
        }
    }

    return {
        res: rewardedUsers,
        status: 'ok',
        message: 'Rewarded users for the assessor slot',
    }
}
