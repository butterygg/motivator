'use server'
import { and, eq, ne } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { audit, reward, assessor_slot, user, assessor } from '@db/schema'
import { auditComputation } from '../../../utils/utils'
import { Grade } from '../../../types/enum/grade'
import { LeaderboardDatatable } from '../../../components/leaderboard/DataTableLeaderboard'

export const getAllLeaderboardRewards = async () => {
    const rewards = await db
        .select()
        .from(reward)
        .where(ne(reward.amount, 0))
        .execute()

    const users = await db.select().from(user).execute()

    console.log('users', users)
    const assessors = await db.select().from(assessor).execute()
    if (!rewards) {
        return {
            status: 'ko',
            message: 'No rewards find',
        }
    }

    const audits = await db.select().from(audit).execute()
    // const users = [{ address: '0x3Eb92eBE3e1f226b14E78Af49646aFEA61Fb016C' }]
    // Build the rewards for each user parsing his rewards and potentially his audit
    const buildRewards = async () => {
        // let res: LeaderboardDatatable[] = []
        const res = users.map(async (element) => {
            // Find the rewards for this user
            const rewardsForUser = rewards.filter(
                (reward) => reward.user_address === element.address
            )
            // Compute rewards for this user
            let totalRewards = 0
            rewardsForUser.forEach((element) => {
                totalRewards += element.amount as number
            })

            const assessor = assessors.find(
                (assessor) => assessor.address === element.address
            )

            // init global variables
            let totalAudit = 0
            let isTestnetMember = false
            // Test if the user is an Assessor or not
            if (assessor) {
                // console.log('Assessor found')
                isTestnetMember = true
                // Then find his slots and if his slots has been audited and
                const assessorSlots = await db
                    .select()
                    .from(assessor_slot)
                    .where(eq(assessor_slot.assessor_ID, element.address))
                    .execute()

                // console.log(assessorSlots)
                // add the rewards converted from grade audit to the total counter for this user
                assessorSlots.forEach((slots) => {
                    const audit = audits.find(
                        (audit) => audit.assessor_slot_id === slots.id
                    )
                    // console.log('audit', audit)
                    // console.log(audit)
                    totalAudit += auditComputation(audit?.audit_grade as Grade)
                })
            }
            if (totalRewards === 0 && totalAudit === 0) return
            // console.log('totals', totalRewards, totalAudit)
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
            // console.log(res)
        })
        // console.log(res)
        return Promise.all(res)
    }
    const res = await buildRewards()
    return {
        res: res,
        status: 'ok',
        message: 'Rewards Find',
    }
}
