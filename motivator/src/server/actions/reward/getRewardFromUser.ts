'use server'
import { and, eq, ne } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { reward } from '@db/schema'

export const getRewardFromUser = async (userAddr: string) => {
    const rewards = await db
        .select()
        .from(reward)
        .where(and(eq(reward.user_address, userAddr), ne(reward.amount, 0)))
        .execute()

    if (!rewards) {
        return {
            status: 'ko',
            message: 'No rewards for this user',
        }
    }

    return {
        res: rewards,
        status: 'ok',
        message: 'Rewards for this user',
    }
}
