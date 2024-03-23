import { eq, isNull } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor, assessor_slot, assessor_slot_user } from '@db/schema'
import { NextRequest } from 'next/server'
/**
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
 */
export async function GET(request: NextRequest) {
    const body = await request.json()

    const assessorAddr = body.assessorAddr

    const isSigned = await db.query.assessor.findFirst({
        where: eq(assessor.address, assessorAddr),
    })

    if (!isSigned) {
        return Response.json({
            status: 'ko',
            message: 'Assessor not signed',
        })
    }

    return Response.json({ status: 'ok', message: 'Assessor signed' })
}
