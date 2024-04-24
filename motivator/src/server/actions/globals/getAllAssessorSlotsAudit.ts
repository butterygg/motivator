'use server'
import { and, eq, ne } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor_slot, assessor_slot_user, audit, reward } from '@db/schema'
import { AssessorSlot, Statistics, Totals } from '@/types/data/assessorSlot'
import { getTotalsVolPnlActions } from '../statistics/getTotalsVolPnlActions'
import { getPNLAndVolume } from '../statistics/getPNLAndVolume'
import { getTotalsForUser } from './getTotalsForUser'
import { Grade } from '../../../types/enum/grade'
import { Address } from 'viem'
// Send Rewards to specifics users based on their actions
/**
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
 */
export async function getAllAssessorSlotsAudit() {
    // grab an assessor slot that is not done and has the assessor assigned
    const assessorSlots = await db.query.assessor_slot.findMany({
        where: eq(assessor_slot.done, true),
    })

    const buildAssessorSlot = async () => {
        const result = assessorSlots.map(async (assessorSlot) => {
            // Get the rewards for the assessor slot
            const getRewardsUsers = await db
                .select()
                .from(reward)
                .where(
                    and(
                        eq(reward.assessor_slot_id, assessorSlot.id),
                        ne(reward.amount, 0)
                    )
                )
                .execute()
            const getAudit = await db.query.audit.findFirst({
                where: eq(audit.assessor_slot_id, assessorSlot.id),
            })
            const assessor: AssessorSlot = {
                id: assessorSlot.id,
                assessorID: assessorSlot.assessor_ID as string,
                done: assessorSlot.done as boolean,
                week: assessorSlot.week as number,
                users: [],
                rewards: getRewardsUsers,
                totals: [],
                statistics: [],
                audit: {
                    auditGrade: getAudit?.audit_grade
                        ? (getAudit.audit_grade as Grade)
                        : null,
                    auditorAddress: getAudit?.auditor_address
                        ? (getAudit.auditor_address as Address)
                        : null,
                },
            }
            return assessor
        })
        console.log('result', result)
        return result
    }
    const assessorsSlotsFilled = await buildAssessorSlot()
    return await Promise.all(assessorsSlotsFilled)
}
