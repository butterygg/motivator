'use server'
import { eq } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor } from '@db/schema'
import { NextRequest } from 'next/server'
/**
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
 */
export async function isSigned(request: NextRequest) {
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
