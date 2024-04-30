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

    return await db.query.totals.findMany({})
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
    const previousWeekStats: StatisticsDBVals[] =
        await db.query.statistics.findMany({
            where: and(
                between(
                    statistics.timestamp,
                    TranslateWeekToDate(
                        (
                            Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL) - 1
                        ).toString()
                    ),
                    TranslateWeekToDate(
                        Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL).toString()
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
    // console.log('previousWeekStats', previousWeekStats)
    // console.log('lastStats', lastStats)
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
    const userVolumes: Record<string, PoolValue> = {}
    const userActions: Record<string, PoolStat> = {}
    // User address and pool type, store nb of actions
    const nbActionsUsers: Record<string, PoolValue> = {}
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

        // let previousStat = lastArrayOfStats.find(
        //     (stat) =>
        //         stat.user_address === element.user_address &&
        //         stat.pool_type === element.poolType
        // )

        // Check if the user has already a stat for this pool
        if (!userActions[element.user_address as string]) {
            userActions[element.user_address as string] = {}
        }

        // If the last stat is more recent than the previous one, update the last stat
        // If x < y, then y is more recent than x
        // Or there is no entry for this pool
        if (
            new Date(
                userActions[element.user_address as string][
                    element.poolType as string
                ].timestamp as string
            ) < new Date(element.timestamp as string) ||
            userActions[element.user_address as string][
                element.poolType as string
            ] == undefined
        ) {
            userActions[element.user_address as string][
                element.poolType as string
            ] = element
        }

        // get the previous stat for the user and pool for the previous week to calculate the totalActions
        // This value will be used to substract the previous totalActions to get the totalActions of the week
        const finalStatePreviousWeek = previousWeekStats.find((stat) => {
            const targetDate = new Date(
                TranslateWeekToDate(
                    process.env.NEXT_PUBLIC_WEEK_ACTUAL as string
                )
            ) as Date
            const dayOfTargetDate = targetDate.getDay()
            return (
                stat.user_address == element.user_address &&
                stat.poolType == element.poolType &&
                new Date(stat.timestamp as string) ==
                    new Date(targetDate.setDate(dayOfTargetDate - 1))
            )
        })

        // Sum the total Actions the previous and the current week

        // If we found a previous stat, we can calculate the totalActions

        if (finalStatePreviousWeek !== undefined) {
            // Sum the total Actions
            const lastStatNumbAction = Number(
                (
                    (userActions[element.user_address as string][
                        element.poolType as string
                    ]?.action_count_longs || 0) +
                    (userActions[element.user_address as string][
                        element.poolType as string
                    ]?.action_count_shorts || 0) +
                    (userActions[element.user_address as string][
                        element.poolType as string
                    ]?.action_count_lps || 0)
                ).toFixed(2)
            )
            const totalClosetPreviousStat = Number(
                (
                    (finalStatePreviousWeek?.action_count_longs
                        ? (finalStatePreviousWeek?.action_count_longs as number)
                        : 0) +
                    (finalStatePreviousWeek?.action_count_shorts
                        ? (finalStatePreviousWeek?.action_count_shorts as number)
                        : 0) +
                    (finalStatePreviousWeek?.action_count_lps
                        ? (finalStatePreviousWeek?.action_count_lps as number)
                        : 0)
                ).toFixed(2)
            )
            nbActionsUsers[element.user_address as string][
                element.poolType as string
            ] = lastStatNumbAction - totalClosetPreviousStat
            // We substract the previous totalActions to get the totalActions of the week
            // lastStat.totalActions = lastStatNumbAction - totalClosetPreviousStat
            // // Push the new stat
            // lastArrayOfStats.push({
            //     ...lastStat,
            // })

            //remove the previous stat
            // if (lastArrayOfStats.includes(lastStat))
            //     lastArrayOfStats.splice(lastArrayOfStats.indexOf(lastStat), 1)
        }

        // // get the previous stat for the user and pool
        // const getPreviousStat =
        //     userActions[element.user_address as string][
        //         element.poolType as string
        //     ]

        // If the last stat is more recent than the previous one, update the last stat
        // if (
        //     element?.timestamp &&
        //     lastStat.timestamp < new Date(element.timestamp)
        // ) {
        //     // Update the last stat with new Date
        //     lastStat.timestamp = new Date(element.timestamp)
        //     let closestPreviousStat: StatisticsDBVals | undefined = {
        //         user_address: null,
        //         poolType: null,
        //         timestamp: null,
        //         action_count_longs: null,
        //         action_count_lps: null,
        //         action_count_shorts: null,
        //         volume_longs: null,
        //         volume_lps: null,
        //         volume_shorts: null,
        //     }
        //     closestPreviousStat = previousWeekStats.find((stat) => {
        //         if (
        //             stat.user_address === element.user_address &&
        //             stat.poolType === element.poolType &&
        //             stat.timestamp
        //         ) {
        //             const targetDate = new Date(
        //                 TranslateWeekToDate(
        //                     process.env.NEXT_PUBLIC_WEEK_ACTUAL as string
        //                 )
        //             )
        //             const statDate = new Date(stat.timestamp)
        //             const lastDateDiff = Math.abs(
        //                 statDate.getTime() - targetDate.getTime()
        //             )
        //             if (
        //                 closestPreviousStat?.user_address == null ||
        //                 lastDateDiff <
        //                     Math.abs(
        //                         new Date(
        //                             closestPreviousStat.timestamp as string
        //                         ).getTime() - targetDate.getTime()
        //                     )
        //             ) {
        //                 return stat
        //             }
        //         }
        //     })
        //     console.log('closestPreviousStat', closestPreviousStat)
        //     // If we found a previous stat, we can calculate the totalActions
        //     if (closestPreviousStat !== undefined) {
        //         // Sum the total Actions
        //         lastStat.totalActions = Number(
        //             (
        //                 (element?.action_count_longs
        //                     ? (element?.action_count_longs as number)
        //                     : 0) +
        //                 (element?.action_count_shorts
        //                     ? (element?.action_count_shorts as number)
        //                     : 0) +
        //                 (element?.action_count_lps
        //                     ? (element?.action_count_lps as number)
        //                     : 0)
        //             ).toFixed(2)
        //         )
        //         const totalClosetPreviousStat = Number(
        //             (
        //                 (closestPreviousStat?.action_count_longs
        //                     ? (closestPreviousStat?.action_count_longs as number)
        //                     : 0) +
        //                 (closestPreviousStat?.action_count_shorts
        //                     ? (closestPreviousStat?.action_count_shorts as number)
        //                     : 0) +
        //                 (closestPreviousStat?.action_count_lps
        //                     ? (closestPreviousStat?.action_count_lps as number)
        //                     : 0)
        //             ).toFixed(2)
        //         )
        //         // We substract the previous totalActions to get the totalActions of the week
        //         lastStat.totalActions =
        //             lastStat.totalActions - totalClosetPreviousStat
        //         // Push the new stat
        //         lastArrayOfStats.push({
        //             ...lastStat,
        //         })
        //     }
        // } else {
        //     lastArrayOfStats.push({
        //         ...(previousStat as Stat),
        //     })
        // }
        // // Delete previous Val
        // if (previousStat !== undefined) {
        //     lastArrayOfStats.splice(lastArrayOfStats.indexOf(previousStat), 1)
        // }
    })
    // Sum the totalActions for each user and pool and Delete duplicated values
    const totalsUsersNbActions: Record<string, number> = {}

    const sumPoolsStatsForUsers = () => {
        for (const user in nbActionsUsers) {
            // Sum the totalActions for each user and pool
            // and store the result in totalsUsersNbActions
            if (totalsUsersNbActions[user] === undefined) {
                const stEthActions = (nbActionsUsers[user]['stETH'] =
                    nbActionsUsers[user]['stETH'] || 0)
                const daiActions = (nbActionsUsers[user]['4626'] =
                    nbActionsUsers[user]['4626'] || 0)
                const totalActions = stEthActions + daiActions
                totalsUsersNbActions[user] = totalActions
            }
        }
        // const SumActionsNB = (userAddr: string) => {
        //     const stETHnbAction = lastArrayOfStats.find((stat) => {
        //         stat.pool_type === 'stETH' && stat.user_address === userAddr
        //     })
        //     const daiNbAction = lastArrayOfStats.find((stat) => {
        //         stat.pool_type === '4626' && stat.user_address === userAddr
        //     })
        //     return (
        //         (stETHnbAction?.totalActions || 0) +
        //         (daiNbAction?.totalActions || 0)
        //     )
        // }
        // lastArrayOfStats.forEach((element, index) => {
        //     lastArrayOfStats[index].totalActions = SumActionsNB(
        //         element.user_address as string
        //     )
        //     const valToDel = lastArrayOfStats.findIndex((stat) => {
        //         stat.user_address === element.user_address &&
        //             index !== lastArrayOfStats.indexOf(stat)
        //     })
        //     lastArrayOfStats.splice(valToDel, 1)
        // })
        // Sum Nb Actions for each user and pool for the week
        // using the userActions object
        // For each user
        // For each pool
        // Sum the actions
    }

    // const buildValuesForTotal = lastArrayOfStats.map((stat) => {
    //     return {
    //         week: Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL),
    //         user_address: stat.user_address,
    //         totalActions: stat.totalActions,
    //         totalVolumePoolEth:
    //             userVolumes[stat.user_address as string]['stETH'],
    //         totalVolumePoolDai:
    //             userVolumes[stat.user_address as string]['4626'],
    //         // totalPnl: stat.totalPnl,
    //     }
    // })

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
            resultDB.push({
                week: Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL),
                user_address: user as string,
                totalActions: totalsUsersNbActions[user] as number,
                totalVolumePoolEth: userVolumes[user as string]['stETH'],
                totalVolumePoolDai: userVolumes[user as string]['4626'],
            })
        }
        return resultDB
    }

    const insertTotals = await db
        .insert(totals)
        .values(buildTotals())
        .returning()

    return insertTotals
}
