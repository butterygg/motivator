'use server'
import { and, between, eq, gte, isNull } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import { assessor_slot, statistics, totals, user } from '@db/schema'
import { Address } from 'viem'
// import { v4 as uuid } from 'uuid'
import { sql } from 'drizzle-orm'
import { Record } from '@mynaui/icons-react'
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

    return await db.query.totals.findMany()
}

interface PoolValue {
    [poolName: string]: number
}

interface PoolStat {
    [poolName: string]: StatisticsDBVals
}

const TranslateWeekToDate = (week: string) => {
    switch (week) {
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

type StatisticsDBVals = {
    user_address: string | null
    poolType: string | null
    timestamp: string | null
    action_count_longs: number | null
    action_count_lps: number | null
    action_count_shorts: number | null
    volume_longs: number | null
    volume_lps: number | null
    volume_shorts: number | null
}

export const setTotals = async () => {
    type totalVolUser = {
        user_address: Address
        totalVolumePoolEth: number
        totalVolumePoolDai: number
    }
    let totalVolUsers: totalVolUser[] = []
    // Get all Statistics for every user
    const lastStats: StatisticsDBVals[] = await db.query.statistics.findMany({
        where: and(
            between(
                statistics.timestamp,
                TranslateWeekToDate(
                    Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL).toString()
                ),
                TranslateWeekToDate(
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

    const userVolumes: Record<string, PoolValue> = {}
    const userActions: Record<string, PoolValue> = {}
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

        // Check if the user has already a stat for this pool
        if (!userActions[element.user_address as string]) {
            userActions[element.user_address as string] = {}
        }

        const sumActions = Number(
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

        if (
            userActions[element.user_address as string][
                element?.poolType as string
            ]
        ) {
            userActions[element.user_address as string][
                element?.poolType as string
            ] += sumActions
        } else {
            userActions[element.user_address as string][
                element?.poolType as string
            ] = sumActions
        }
    })
    // Sum the totalActions for each user and pool and Delete duplicated values
    const totalsUsersNbActions: Record<string, number> = {}

    const sumPoolsStatsForUsers = () => {
        // console.log('userActions', userActions)
        // console.log('userVolumes', userVolumes)
        for (const user in userActions) {
            // Sum the totalActions for each user and pool
            // and store the result in totalsUsersNbActions
            if (totalsUsersNbActions[user] === undefined) {
                let stEthActions = 0
                if (userActions[user]['stETH']) {
                    stEthActions = userActions[user]['stETH'] =
                        userActions[user]['stETH'] || 0
                }
                let daiActions = 0
                if (userActions[user]['4626']) {
                    daiActions = userActions[user]['4626'] =
                        userActions[user]['4626'] || 0
                }
                const totalActions = stEthActions + daiActions
                totalsUsersNbActions[user] = totalActions
                // console.log(
                //     'totalsUsersNbActions[user]',
                //     totalsUsersNbActions[user],
                //     '4626',
                //     userActions[user]['4626'],
                //     'stETH',
                //     userActions[user]['stETH']
                // )
            }
        }
    }

    const buildTotals = () => {
        // Sum the totalActions for each user and pool
        sumPoolsStatsForUsers()

        // Build the result for the DB
        const resultDB: {
            week: number | null
            user_address: string | null
            totalActions: number | null
            totalVolumePoolEth: number | null
            totalVolumePoolDai: number | null
        }[] = []
        // For each user, build the result
        for (const user in totalsUsersNbActions) {
            if (!resultDB.find((el) => el.user_address === user)) {
                resultDB.push({
                    week: Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL),
                    user_address: user as string,
                    totalActions: totalsUsersNbActions[user] as number,
                    totalVolumePoolEth: userVolumes[user as string]['stETH'],
                    totalVolumePoolDai: userVolumes[user as string]['4626'],
                })
            }
        }
        return resultDB
    }
    const pushToDB = async () => {
        const insertTotals = await db
            .insert(totals)
            .values(buildTotals())
            .returning()
        return insertTotals
    }
    return await pushToDB()
}
