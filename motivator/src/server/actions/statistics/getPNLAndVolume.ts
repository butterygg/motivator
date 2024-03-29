'use server'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import {
    assessor,
    assessor_slot,
    assessor_slot_user,
    statistics,
} from '@db/schema'
import { NextRequest } from 'next/server'
/**
 *
 * @param request Will contain an Array of [{userAddr: string}]
 * @param response Send the status of the transaction
 */

export async function getPNLAndVolume({ userAddr }: { userAddr: string }) {
    const stats = await db.query.statistics.findMany({
        where: and(eq(statistics.user_address, userAddr)),
    })

    if (!stats) {
        return {
            status: 'ko',
            message: 'No stats available',
        }
    }

    return {
        status: 'ok',
        message: 'Stats available',
        stats,
    }
}
