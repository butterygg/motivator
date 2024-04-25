'use server'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor_slot, audit, auditor } from '@db/schema'
/** Assign an Assessor Slot to an Assessor
 *
 * @param request Will contain an Array of [{assessorSlotID: string}]
 * @param response Send the status of the transaction
 */
export async function isAuditor({ auditorAddr }: { auditorAddr: string }) {
    const isAuditorAuthorized = await db.query.auditor.findFirst({
        where: eq(auditor.address, auditorAddr),
    })
    if (!isAuditorAuthorized) {
        return {
            status: 'ko',
            message: 'Auditor not authorized',
        }
    }
    return {
        status: 'ok',
        message: 'Auditor authorized',
    }
}
