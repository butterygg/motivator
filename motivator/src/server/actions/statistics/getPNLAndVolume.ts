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

export type PNLAndVolume = {
    pnlShorts: number[]
    pnlLongs: number[]
    volumeLong: number[]
    volumeShort: number[]
    lpVolume: number[]
    blockNumbers: number[]
}

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

    const prepareData = () => {
        const result: PNLAndVolume = {
            pnlShorts: [],
            pnlLongs: [],
            volumeLong: [],
            volumeShort: [],
            lpVolume: [],
            blockNumbers: [],
        }
        stats.forEach((stat) => {
            result.pnlShorts.push(stat.pnl_short ? stat.pnl_short : 0)
            result.pnlLongs.push(stat.pnl_long ? stat.pnl_long : 0)
            result.volumeLong.push(stat.volume_long ? stat.volume_long : 0)
            result.volumeShort.push(stat.volume_short ? stat.volume_short : 0)
            result.lpVolume.push(stat.volume_lp ? stat.volume_lp : 0)
            result.blockNumbers.push(stat.block_number)
        })
        return result
    }
    return prepareData()
}
