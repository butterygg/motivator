'use server'
import { and, eq } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { totals } from '@db/schema'
// import { v4 as uuid } from 'uuid'
import { setTotals } from './getTotals'
/** Test if Totals are present from Week 1 to Week X
 *
 * @param response Send the status of the transaction
 */
export async function getWeekTotalsAvailableForUser({
    userAddr,
}: {
    userAddr: string
}) {
    /**
     * Set Number Actions and Total Volume for each Users
     * Use Week to regenerate new Totals if needed
     * Set Total Actions , Total Volume , Total PNL
     */

    const weekNumberActual = Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL)
    const weekAvailables = []
    for (let index = 1; index <= weekNumberActual; index++) {
        const res = await db.query.totals.findFirst({
            where: and(
                eq(totals.week, index),
                eq(totals.user_address, userAddr)
            ),
        })
        if (res?.week === index) {
            weekAvailables.push(index)
        }
    }
    // console.log('weekAvailables', weekAvailables)
    return weekAvailables
}
