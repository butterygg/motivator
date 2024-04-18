'use server'
import { and, eq } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { statistics } from '@db/schema'
/**
 *
 * @param request Will contain {userAddr: string}
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
