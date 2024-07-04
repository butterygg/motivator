'use client'
import React, { useEffect } from 'react'
import {
    DataTableAssessor,
    UserDatatable,
} from '@protocols/hyperdrive/components/datatables/table/DataTableAssessor'
import {
    AssessorSlotHyperdrive,
    Statistics,
    Totals,
} from '@protocols/hyperdrive/types/data/assessorSlot'
import { useAccount } from 'wagmi'
import { Status } from '@protocols/hyperdrive/types/enums/status'
import { RoundSpinner } from '@/components/ui/spinner'
import { usePathname } from 'next/navigation'
import { useGetAssessorSlot } from '@/hooks/assessorSlot/useGetAssessorSlot'

type Props = {
    data: AssessorSlotHyperdrive
}

export const DataTableContainerAssessor = ({ data }: Props) => {
    /**
     * This function is used to prepare the data for the table
     * Grab the data in the Assessor Slot and prepare it for the table
     * @param assessorSlot The Assessor Slot
     * @returns The UserDatatable array
     */
    const prepareDataForTable = (assessorSlot: AssessorSlotHyperdrive) => {
        const res: UserDatatable[] = []
        assessorSlot?.users.forEach((element, index) => {
            const reward = assessorSlot.rewards.find(
                (reward) => reward.user_address === element
            )

            const totals = assessorSlot.totals.find(
                (totals) => totals.user_address === element
            ) as Totals
            // Find the statistics for this user
            const statistics = assessorSlot.statistics.filter(
                (stat) => stat.user_address === element
            ) as Statistics[]
            // Filter the statistics for each pool
            const statsPoolETH = statistics.filter(
                (stat) => stat.poolType === 'stETH'
            ) as Statistics[]
            const statsPoolDAI = statistics.filter(
                (stat) => stat.poolType === '4626'
            ) as Statistics[]
            res.push({
                id: {
                    id: index.toString(),
                    assessorSlotId: assessorSlot.assessorSlotCore.id,
                },
                addressName: element,
                pnl: 100,
                stat: {
                    stats: {
                        statsPoolETH: statsPoolETH,
                        statsPoolDAI: statsPoolDAI,
                    },
                    totals: totals,
                },
                reward: {
                    reward: reward ? reward : undefined,
                    status: reward ? Status.Rewarded : Status.Pending,
                },
            })
        })

        // sort the array by number of total actions
        return res.sort((a, b) => {
            return b.stat.totals.totalActions - a.stat.totals.totalActions
        })
    }

    return <DataTableAssessor users={prepareDataForTable(data)} />
}
