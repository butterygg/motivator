'use server'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor_slot, audit } from '@db/schema'
/** Assign an Assessor Slot to an Assessor
 *
 * @param request Will contain an Array of [{assessorSlotId: string}]
 * @param response Send the status of the transaction
 */
export async function setGrade({
    assessorSlotId,
    grade,
    auditorAddr,
}: {
    assessorSlotId: string
    grade: string
    auditorAddr: string
}) {
    await db
        .update(audit)
        .set({
            audit_grade: grade,
            auditor_address: auditorAddr,
        })
        .where(and(eq(assessor_slot.id, assessorSlotId)))

    return {
        status: 'ko',
        message: 'No assessor slot available',
    }
}
