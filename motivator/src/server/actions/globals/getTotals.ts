'use server'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor_slot, totals, user } from '@db/schema'
import { Address } from 'viem'
// import { v4 as uuid } from 'uuid'
import { sql } from 'drizzle-orm'
/** Set Number Actions and Total Volume for each Users
 *
 * @param response Send the status of the transaction
 */
export async function getTotals() {
    /**
     * Set Number Actions and Total Volume for each Users
     * Use Week to regenerate new Totals if needed
     * Set Total Actions , Total Volume , Total PNL
     */

    const setTotals = async () => {
        // Get all Statistics for every user
        const stats = await db.query.statistics.findMany({
            columns: {
                timestamp: true,
                user_address: true,
                action_count_longs: true,
                action_count_lps: true,
                action_count_shorts: true,
                volume_longs: true,
                volume_lps: true,
                volume_shorts: true,
                pnl_lps: true,
                pnl_shorts: true,
                pnl_longs: true,
            },
        })
        type Stat = {
            user_address: Address

            timestamp: Date
            totalVolume: number
            totalPnl: number
            totalActions: number
        }
        // Set the last stat for each user
        let arrayOfStats: Stat[] = []
        // Extract the last stat for each user
        stats.forEach((element) => {
            let lastStat = {
                user_address: element.user_address as Address,
                timestamp: new Date(0),
                totalVolume: 0,
                totalPnl: 0,
                totalActions: 0,
            }
            // find the last stat for this user
            const previousStat = arrayOfStats.find((stat) => {
                if (stat.user_address === element.user_address) {
                    return stat
                }
            })
            // If the last stat is more recent than the previous one, update the last stat
            if (
                element?.timestamp &&
                lastStat.timestamp < new Date(element.timestamp)
            ) {
                // Update the last stat with new Date
                lastStat.timestamp = new Date(element.timestamp)
                // Sum the total volume
                lastStat.totalVolume =
                    Number(
                        (
                            (element?.volume_longs
                                ? (element?.volume_longs as number)
                                : 0) +
                            (element?.volume_shorts
                                ? (element?.volume_shorts as number)
                                : 0) +
                            (element?.volume_lps
                                ? (element?.volume_lps as number)
                                : 0)
                        ).toFixed(2)
                    ) / 1000
                // Sum the total PNL
                lastStat.totalPnl =
                    Number(
                        (
                            (element?.pnl_longs
                                ? (element?.pnl_longs as number)
                                : 0) +
                            (element?.pnl_shorts
                                ? (element?.pnl_shorts as number)
                                : 0) +
                            (element?.pnl_lps
                                ? (element?.pnl_lps as number)
                                : 0)
                        ).toFixed(2)
                    ) / 1000
                // Sum the total Actions
                lastStat.totalActions = Number(
                    (
                        (element?.action_count_longs
                            ? (element?.action_count_longs as number)
                            : 0) +
                        (element?.action_count_shorts
                            ? (element?.action_count_shorts as number)
                            : 0) +
                        (element?.action_count_lps
                            ? (element?.action_count_lps as number)
                            : 0)
                    ).toFixed(2)
                )
                // Push the new stat
                arrayOfStats.push({
                    ...lastStat,
                })
                // Delete previous Val
                if (previousStat !== undefined) {
                    arrayOfStats.splice(arrayOfStats.indexOf(previousStat), 1)
                }
            }
        })
        const buildValuesForTotal = arrayOfStats.map((stat) => {
            return {
                week: Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL),
                user_address: stat.user_address,
                totalActions: stat.totalActions,
                totalVolume: stat.totalVolume,
                totalPnl: stat.totalPnl,
            }
        })

        const insertTotals = await db
            .insert(totals)
            .values(buildValuesForTotal)
            .returning()

        return insertTotals
    }
    // Check if the Totals are already set for this Week
    const isTotalsAlreadySetup = await db.query.totals.findFirst({
        where: and(
            eq(totals.week, Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL))
        ),
    })
    if (isTotalsAlreadySetup == undefined) {
        return await setTotals()
    }

    return await db.query.totals.findMany({})
}
