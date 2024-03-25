'use server'
import { and, eq, inArray, isNull } from 'drizzle-orm'
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
export async function getNumberAssessorSlotAvailable() {
    // grab an assessor slot that is not done and has the assessor assigned
    const assessorSlotOfAssessor = await db.query.assessor_slot.findMany({
        columns: { id: true },
        where: and(
            eq(assessor_slot.done, false),
            isNull(assessor_slot.assessor_ID)
        ),
    })
    console.log('assessorSlotOfAssessor', assessorSlotOfAssessor)
    if (!assessorSlotOfAssessor) {
        return {
            status: 'ok',
            message: 'No assessor slot available',
        }
    }

    return {
        status: 'ok',
        message: 'Assessor slot available',
        res: assessorSlotOfAssessor.length,
    }
}
