'use server'
import { and, eq, inArray, isNull, ne } from 'drizzle-orm'
import { db } from '@db/dbRouter'
import {
    assessor_slot,
    assessor_slot_user,
    reward,
    statistics,
    stats,
    user,
} from '@db/schema'
import { NextRequest } from 'next/server'
import { stat } from 'fs'
import { AssessorSlot } from '@/types/data/assessorSlot'
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

    let lastStat = {
        user_address: userAddr,
        timestamp: new Date(0),
        totalVolume: BigInt(0),
        totalPnl: BigInt(0),
        totalActions: BigInt(0),
    }
    // Pick the newer stat in matter of timestamp
    Allstats.forEach((element) => {
        if (
            element?.timestamp &&
            lastStat.timestamp < new Date(element.timestamp)
        ) {
            lastStat.timestamp = new Date(element.timestamp)
            lastStat.totalVolume = BigInt(
                (BigInt(element?.volume_longs as string)
                    ? BigInt(element?.volume_longs as string)
                    : BigInt(0)) + BigInt(element?.volume_shorts as string)
                    ? BigInt(element?.volume_shorts as string)
                    : BigInt(0) +
                          (BigInt(element?.volume_lps as string)
                              ? BigInt(element?.volume_lps as string)
                              : BigInt(0))
            )
            lastStat.totalPnl = BigInt(
                (BigInt(element?.pnl_longs as string)
                    ? BigInt(element?.pnl_longs as string)
                    : BigInt(0)) + BigInt(element?.pnl_shorts as string)
                    ? BigInt(element?.pnl_shorts as string)
                    : BigInt(0) +
                          (BigInt(element?.pnl_lps as string)
                              ? BigInt(element?.pnl_lps as string)
                              : BigInt(0))
            )

            lastStat.totalActions = BigInt(
                (BigInt(element?.action_count_longs as string)
                    ? BigInt(element?.action_count_longs as string)
                    : BigInt(0)) +
                    BigInt(element?.action_count_shorts as string)
                    ? BigInt(element?.action_count_shorts as string)
                    : BigInt(0) +
                          (BigInt(element?.action_count_lps as string)
                              ? BigInt(element?.action_count_lps as string)
                              : BigInt(0))
            )
        }
    })

    // if (lastStat.timestamp.getTime() === new Date(0).getTime()) {
    //     return {}
    // }

    return lastStat
}
