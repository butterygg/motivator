'use server'
import { and, eq } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { totals } from '@db/schema'
// import { v4 as uuid } from 'uuid'
import { setTotals } from './getTotals'
/** Set Number Actions and Total Volume for each Users
 *
 * @param response Send the status of the transaction
 */
export async function getTotalsForUser({ userAddr }: { userAddr: string }) {
    /**
     * Set Number Actions and Total Volume for each Users
     * Use Week to regenerate new Totals if needed
     * Set Total Actions , Total Volume , Total PNL
     */

    // Check if the Totals are already set for this Week
    const isTotalsAlreadySetup = await db.query.totals.findFirst({
        where: and(
            eq(totals.week, Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL))
        ),
    })
    if (isTotalsAlreadySetup == undefined) {
        await setTotals()
    }

    return await db.query.totals.findFirst({
        where: and(
            eq(totals.week, Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL)),
            eq(totals.user_address, userAddr)
        ),
    })
}
