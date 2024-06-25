'use server'

import { Address } from 'viem'
import { db } from '@db/dbRouter'
import { assessor_slot, assessor_slot_user } from '@db/schema'
import { signAssessor } from '@/server/actions/assessor/signAssessor'
/** handle Payment coming from front end
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
 */
export async function generateAssessorSlot({
    assessorAddr,
    userList,
}: {
    assessorAddr: string
    userList: Address[]
}) {
    await signAssessor({ assessorAddr })

    const registerAssessorSlot = await db
        .insert(assessor_slot)
        .values({
            assessor_ID: assessorAddr,
            done: false,
            week: process.env.NEXT_PUBLIC_WEEK_ACTUAL
                ? Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL)
                : 1,
        })
        .returning({ id: assessor_slot.id })
    // Build the values for the assessor_slot_user table
    const values = () => {
        const result: {
            user_address: `0x${string}`
            assessor_slot_id: string
        }[] = []
        userList.forEach((element) => {
            result.push({
                user_address: element,
                assessor_slot_id: registerAssessorSlot[0].id as string,
            })
        })
        return result
    }
    // Insert the values in the assessor_slot_user table
    const assignUsersToAssessorslot = await db
        .insert(assessor_slot_user)
        .values(values())

    if (registerAssessorSlot && assignUsersToAssessorslot) {
        return {
            status: 'ok',
            message: `Assessor slot assigned to ${assessorAddr}`,
            assessorSlot: registerAssessorSlot[0],
        }
    }
    return {
        status: 'ko',
        message: `Assessor slot assignation failed`,
    }
}
