'use server'
import { and, eq, ne } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor_slot, assessor_slot_user, reward } from '@db/schema'
import {
    AssessorSlot,
    Statistics,
    Totals,
} from '@protocols/hyperdrive/types/data/assessorSlot'
import { getPNLAndVolume } from '@protocols/hyperdrive/server/actions/statistics/getPNLAndVolume'
import { getTotalsForUser } from '@/server/actions/globals/getTotalsForUser'
// Send Rewards to specifics users based on their actions
/**
 *
 * @param request Will contain an Array of [{assessorID: string}]
 * @param response Send the status of the transaction
 */
export async function getAssessorSlotWithID(assessorSlotID: string) {
    // grab an assessor slot that is not done and has the assessor assigned
    const assessorSlotOfAssessor = await db.query.assessor_slot.findFirst({
        where: and(eq(assessor_slot.id, assessorSlotID as string)),
    })
    if (!assessorSlotOfAssessor) {
        return {
            status: 'ko',
            message: 'No assessor slot available',
        }
    }
    // Get the list of users for the assessor slot
    const usersOfAssessorSlot = (
        await db.query.assessor_slot_user.findMany({
            columns: { user_address: true },
            where: eq(
                assessor_slot_user.assessor_slot_id,
                assessorSlotOfAssessor.id
            ),
        })
    ).map((user) => user.user_address as string)

    if (!usersOfAssessorSlot) {
        return {
            status: 'ko',
            message: 'No users for the assessor slot',
        }
    }

    // Get the rewards for the assessor slot
    const getRewardsUsers = await db
        .select()
        .from(reward)
        .where(
            and(
                eq(reward.assessor_slot_id, assessorSlotOfAssessor.id),
                ne(reward.amount, 0)
            )
        )
        .execute()
    const totalsForUsersPromised = async () => {
        const res = usersOfAssessorSlot.map((userAddr) => {
            return getTotalsForUser({ userAddr })
        })
        return await Promise.all(res)
    }
    const userTotals = await totalsForUsersPromised()

    const statisticsPromised = async () => {
        const res = usersOfAssessorSlot.map(async (userAddr) => {
            return (await getPNLAndVolume({ userAddr })).stats
        })
        if (!res) {
            return []
        }
        return await Promise.all(res)
    }
    const statistics = await statisticsPromised()

    //build the response
    const assessorSlot: AssessorSlot = {
        id: assessorSlotOfAssessor.id,
        assessorID: assessorSlotOfAssessor.assessor_ID as string,
        done: assessorSlotOfAssessor.done as boolean,
        week: assessorSlotOfAssessor.week as number,
        users: usersOfAssessorSlot,
        rewards: getRewardsUsers,
        totals: userTotals as Totals[],
        statistics: statistics.flat() as Statistics[],
    }
    if (!assessorSlot) {
        return {
            status: 'ko',
            message: 'No assessor slot available',
        }
    }
    return {
        status: 'ok',
        message: 'Assessor slot available',
        res: assessorSlot,
    }
    // return ({
    //     status: 'ok',
    //     assessorSlot,
    //     message: `Assessor slot details for ${assessorID}`,
    // })
}
