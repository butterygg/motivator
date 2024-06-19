'use server'
import { eq, ne } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { audit, reward, assessor_slot, user, assessor } from '@db/schema'
import { auditComputation } from '@/utils/utils'
import { Grade } from '@/types/enums/grade'

export const getAllLeaderboardRewards = async () => {
    // Get rewards that are not 0
    const rewards = await db
        .select()
        .from(reward)
        .where(ne(reward.amount, 0))
        .execute()
    // Get users
    const users = await db.select().from(user).execute()
    // Get assessors
    const assessors = await db.select().from(assessor).execute()
    if (!rewards) {
        return {
            status: 'ko',
            message: 'No rewards find',
        }
    }
    // Get the slots that are done
    const assessorSlots = await db
        .select()
        .from(assessor_slot)
        .where(eq(assessor_slot.done, true))
        .execute()

    // Get assessors that are not users
    const assessorNonUsers = assessors.filter((assessor) => {
        return !users.find((user) => user.address === assessor.address)
    })
    // Concat the users and the assessors
    const usersWithAssessors = users.concat(assessorNonUsers)
    // Get the audits
    const audits = await db.select().from(audit).execute()

    // Build the rewards for each user parsing his rewards and potentially his audit
    const buildRewards = async () => {
        const res = usersWithAssessors.map(async (element) => {
            // init global variables
            let totalAudit = 0
            let totalRewards = 0
            let isTestnetMember = false

            // Find the rewards for this user
            const rewardsForUser = rewards.filter(
                (reward) => reward.user_address === element.address
            )
            // Compute rewards for this user
            rewardsForUser.forEach((element) => {
                totalRewards += element.amount as number
            })
            // Parse the slots of the user and find the audit for each slot
            assessorSlots.forEach((slot) => {
                if ((slot.assessor_ID as string) == element.address) {
                    isTestnetMember = true
                    const audit = audits.find(
                        (audit) => audit.assessor_slot_id === slot.id
                    )
                    const res =
                        totalAudit +
                        auditComputation(audit?.audit_grade as Grade)
                    totalAudit = res
                }
            })
            // If the user has no rewards and no audit, do not send values
            if (totalRewards === 0 && totalAudit === 0) return
            return {
                id: element.address,
                addressName: element.address,
                rewardsReceived: {
                    rewards: totalRewards,
                    audit: totalAudit,
                },
                total: totalRewards + totalAudit,
                isTestnetMember: isTestnetMember,
            }
        })
        // Wait for all the promises to resolve and filter the undefined values due to the previous return
        return (await Promise.all(res)).filter((el) => el !== undefined)
    }
    const res = await buildRewards()
    return {
        res: res,
        status: 'ok',
        message: 'Rewards Find',
    }
}
