'use server'
import { and, eq } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor_slot } from '@db/schema'
/**
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
 */

type Props = {
    assessorAddr: string
    assessorSlotID: string
}
export async function isThisAssessorSlotYours({
    assessorAddr,
    assessorSlotID,
}: Props) {
    const isThisYours = await db.query.assessor_slot.findFirst({
        where: and(
            eq(assessor_slot.id, assessorSlotID),
            eq(assessor_slot.assessor_ID, assessorAddr)
        ),
    })

    if (isThisYours) {
        return {
            status: 'ok',
            message: `It is your AssessorSlot : ${assessorSlotID}`,
        }
    } else {
        return {
            status: 'ko',
            message: 'You re not authorized',
        }
    }
}
