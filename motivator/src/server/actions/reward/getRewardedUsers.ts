import { eq } from 'drizzle-orm'
import { db } from '@/app/db/dbRouter'
import { reward } from '@/app/db/schema'

export const getRewardedUsers = async (assessorSlotId: string) => {
    const rewardedUsers = await db
        .select()
        .from(reward)
        .where(eq(reward.assessor_slot_ID, assessorSlotId))
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
