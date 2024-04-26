'use server'
import { and, between, eq, gte, isNull } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor_slot, statistics, totals, user } from '@db/schema'
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

interface PoolVolume {
    [poolName: string]: number
}

const HardWeek = (val: string) => {
    switch (val) {
        case '1':
            return '2024-04-9 00:00:00'
        case '2':
            return '2024-04-18 00:00:00'
        case '3':
            return '2024-04-25 00:00:00'
        case '4':
            return '2024-05-02 00:00:00'
        case '5':
            return '2024-05-09 00:00:00'
        default:
            return '2024-04-9 00:00:00'
    }
}

export const setTotals = async () => {
    type totalVolUser = {
        user_address: Address
        totalVolumePoolEth: number
        totalVolumePoolDai: number
    }
    let totalVolUsers: totalVolUser[] = []
    // Get all Statistics for every user
    const lastStats = await db.query.statistics.findMany({
        where: and(
            between(
                statistics.timestamp,
                HardWeek(
                    Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL).toString()
                ),
                HardWeek(
                    (Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL) + 1).toString()
                )
            )
        ),
        columns: {
            poolType: true,
            timestamp: true,
            user_address: true,
            action_count_longs: true,
            action_count_lps: true,
            action_count_shorts: true,
            volume_longs: true,
            volume_lps: true,
            volume_shorts: true,
            // pnl_lps: true,
            // pnl_shorts: true,
            // pnl_longs: true,
        },
    })
    const previousWeekStats = await db.query.statistics.findMany({
        where: and(
            between(
                statistics.timestamp,
                HardWeek(
                    (Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL) - 1).toString()
                ),
                HardWeek(Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL).toString())
            )
        ),
        columns: {
            poolType: true,
            timestamp: true,
            user_address: true,
            action_count_longs: true,
            action_count_lps: true,
            action_count_shorts: true,
            volume_longs: true,
            volume_lps: true,
            volume_shorts: true,
            // pnl_lps: true,
            // pnl_shorts: true,
            // pnl_longs: true,
        },
    })
    type Stat = {
        user_address: Address
        pool_type: string
        timestamp: Date
        totalVolumePoolEth: number
        totalVolumePoolDai: number
        totalActions: number
    }
    // Set the last stat for each user
    let lastArrayOfStats: Stat[] = []
    // Sort the stats by user_address
    lastStats.sort((a, b) => {
        if (a?.user_address === null || b.user_address === null) {
            return 0
        }
        if (a.user_address < b.user_address) {
            return -1
        }
        if (a?.user_address > b.user_address) {
            return 1
        }
        return 0
    })
    const userVolumes: Record<string, PoolVolume> = {}

    // Extract the last stat for each user
    lastStats.forEach((element) => {
        const sumVol = Number(
            (
                (element?.volume_longs
                    ? (element?.volume_longs as number)
                    : 0) +
                (element?.volume_shorts
                    ? (element?.volume_shorts as number)
                    : 0) +
                (element?.volume_lps ? (element?.volume_lps as number) : 0)
            ).toFixed(2)
        )
        if (!userVolumes[element.user_address as string]) {
            userVolumes[element.user_address as string] = {}
        }

        if (
            userVolumes[element.user_address as string][
                element?.poolType as string
            ]
        ) {
            userVolumes[element.user_address as string][
                element?.poolType as string
            ] += sumVol
        } else {
            userVolumes[element.user_address as string][
                element?.poolType as string
            ] = sumVol
        }

        let lastStat = {
            pool_type: element.poolType as string,
            user_address: element.user_address as Address,
            timestamp: new Date(0),
            totalVolumePoolEth: 0,
            totalVolumePoolDai: 0,
            totalActions: 0,
        }

        let previousStat = lastArrayOfStats.find(
            (stat) =>
                stat.user_address === element.user_address &&
                stat.pool_type === element.poolType
        )

        // If the last stat is more recent than the previous one, update the last stat
        if (
            element?.timestamp &&
            lastStat.timestamp < new Date(element.timestamp)
        ) {
            // Update the last stat with new Date
            lastStat.timestamp = new Date(element.timestamp)
            let closestPreviousStat: any
            // Find the previous stat for the user of the last week
            for (const stat of previousWeekStats) {
                if (
                    stat.user_address === element.user_address &&
                    stat.poolType === element.poolType &&
                    stat.timestamp
                ) {
                    const targetDate = new Date(
                        HardWeek(process.env.NEXT_PUBLIC_WEEK_ACTUAL as string)
                    )
                    const statDate = new Date(stat.timestamp)
                    const difference = Math.abs(
                        statDate.getTime() - targetDate.getTime()
                    )
                    if (
                        !closestPreviousStat ||
                        difference <
                            Math.abs(
                                closestPreviousStat.timestamp.getTime() -
                                    targetDate.getTime()
                            )
                    ) {
                        closestPreviousStat = stat
                    }
                }
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
                // We substract the previous totalActions to get the totalActions of the week
                lastStat.totalActions =
                    lastStat.totalActions - closestPreviousStat.totalActions
                // Push the new stat
                lastArrayOfStats.push({
                    ...lastStat,
                })
            }
        } else {
            lastArrayOfStats.push({
                ...(previousStat as Stat),
            })
        }
        // Delete previous Val
        if (previousStat !== undefined) {
            lastArrayOfStats.splice(lastArrayOfStats.indexOf(previousStat), 1)
        }
    })
    const buildValuesForTotal = lastArrayOfStats.map((stat) => {
        return {
            week: Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL),
            user_address: stat.user_address,
            totalActions: stat.totalActions,
            totalVolumePoolEth:
                userVolumes[stat.user_address as string]['stETH'],
            totalVolumePoolDai:
                userVolumes[stat.user_address as string]['4626'],
            // totalPnl: stat.totalPnl,
        }
    })

    const insertTotals = await db
        .insert(totals)
        .values(buildValuesForTotal)
        .returning()

    return insertTotals
}
