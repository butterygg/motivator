'use server'
import { eq } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { audit, auditor } from '@db/schema'
/** Assign an Assessor Slot to an Assessor
 *
 * @param request Will contain an Array of [{assessorSlotID: string}]
 * @param response Send the status of the transaction
 */
export async function setGrade({
    assessorSlotID,
    grade,
    auditorAddr,
}: {
    assessorSlotID: string
    grade: string
    auditorAddr: string
}) {
    const isAuditorAuthorized = await db.query.auditor.findFirst({
        where: eq(auditor.address, auditorAddr),
    })
    if (!isAuditorAuthorized) {
        return {
            status: 'ko',
            message: 'Auditor not authorized',
        }
    }
    // Get the Audit
    const getAudit = await db.query.audit.findFirst({
        where: eq(audit.assessor_slot_id, assessorSlotID),
    })

    if (!getAudit) {
        // Insert if new Value
        const gradeInserted = await db
            .insert(audit)
            .values({
                assessor_slot_id: assessorSlotID,
                audit_grade: grade,
                auditor_address: auditorAddr,
            })
            .execute()

        if (gradeInserted.rowCount > 0) {
            return {
                status: 'ok',
                message: `Audit updated : ${assessorSlotID}`,
            }
        } else {
            return {
                status: 'ko',
                message: 'Fail on Update - Audit',
            }
        }
    }

    // Update if Already exists
    const auditUpdated = await db
        .update(audit)
        .set({
            audit_grade: grade,
            auditor_address: auditorAddr,
        })
        .where(eq(audit.assessor_slot_id, assessorSlotID))
    if (auditUpdated.rowCount > 0) {
        return {
            status: 'ok',
            message: `Audit updated : ${assessorSlotID}`,
        }
    }
    return {
        status: 'ko',
        message: 'Fail on Update - Audit',
    }
}
