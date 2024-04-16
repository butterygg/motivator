'use server'
import { and, eq, inArray, isNull, ne } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import {
    assessor_slot,
    assessor_slot_user,
    reward,
    statistics,
    user,
} from '@db/schema'
import { NextRequest } from 'next/server'
import { stat } from 'fs'
import { AssessorSlot } from '@/types/data/assessorSlot'
import { parseEther } from 'viem'
// Send Rewards to specifics users based on their actions
/**
 *
 * @param request Will contain an Array of [{assessorAddr: string}]
 * @param response Send the status of the transaction
 */
export async function getTotalsVolPnlActions({
    userAddr,
}: {
    userAddr: string
}) {
    const Allstats = await db.query.statistics.findMany({
        where: and(eq(statistics.user_address, userAddr)),
        columns: {
            action_count_longs: true,
            action_count_lps: true,
            action_count_shorts: true,
            pnl_longs: true,
            pnl_lps: true,
            pnl_shorts: true,
            volume_longs: true,
            volume_lps: true,
            volume_shorts: true,
            timestamp: true,
        },
    })
    console.log('Allstats', Allstats)
    let lastStat = {
        user_address: userAddr,
        timestamp: new Date(0),
        totalVolume: 0,
        totalPnl: 0,
        totalActions: 0,
    }
    // Pick the newer stat in matter of timestamp
    Allstats.forEach((element) => {
        if (
            element?.timestamp &&
            lastStat.timestamp < new Date(element.timestamp)
        ) {
            lastStat.timestamp = new Date(element.timestamp)
            lastStat.totalVolume = Number(
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

            lastStat.totalPnl = Number(
                (
                    (element?.pnl_longs ? (element?.pnl_longs as number) : 0) +
                    (element?.pnl_shorts
                        ? (element?.pnl_shorts as number)
                        : 0) +
                    (element?.pnl_lps ? (element?.pnl_lps as number) : 0)
                ).toFixed(2)
            )

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
        }
    })
    console.log('lastStat', lastStat)
    // if (lastStat.timestamp.getTime() === new Date(0).getTime()) {
    //     return {}
    // }

    return lastStat
}
