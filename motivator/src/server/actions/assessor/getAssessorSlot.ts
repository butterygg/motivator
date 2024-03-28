'use server'
import { and, eq, inArray, isNull, ne } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor_slot, assessor_slot_user, reward, stats } from '@db/schema'
import { NextRequest } from 'next/server'
import { stat } from 'fs'
import { AssessorSlot } from '@/types/data/assessorSlot'
// Send Rewards to specifics users based on their actions
/**
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
 */
export async function getAssessorSlot(address: string) {
    const assessorAddr = address
    console.log('assessorAddr', assessorAddr)
    // grab an assessor slot that is not done and has the assessor assigned
    const assessorSlotOfAssessor = await db.query.assessor_slot.findFirst({
        where: and(
            eq(assessor_slot.done, false),
            eq(assessor_slot.assessor_ID, assessorAddr as string)
        ),
    })
    console.log('assessorSlotOfAssessor', assessorSlotOfAssessor)
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
                assessor_slot_user.assessor_slot_ID,
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
                eq(reward.assessor_slot_ID, assessorSlotOfAssessor.id),
                ne(reward.amount, 0)
            )
        )
        .execute()

    // Get the stats for the users present in array usersOfAssessorSlot
    const getStatsUsers = await db
        .select()
        .from(stats)
        .where(inArray(stats.user_address, usersOfAssessorSlot))

    if (!getStatsUsers) {
        return {
            status: 'ko',
            message: 'No stats for the users',
        }
    }
    //build the response
    const assessorSlot: AssessorSlot = {
        id: assessorSlotOfAssessor.id,
        assessorID: assessorSlotOfAssessor.assessor_ID as string,
        done: assessorSlotOfAssessor.done as boolean,
        week: assessorSlotOfAssessor.week as number,
        users: usersOfAssessorSlot,
        rewards: getRewardsUsers,
        stats: getStatsUsers,
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
    //     message: `Assessor slot details for ${assessorAddr}`,
    // })
}
