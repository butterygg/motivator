'use client'
import React, { useEffect } from 'react'
import {
    DataTableAssessor,
    UserDatatable,
} from '@/components/assessor/DataTableAssessor'
import { AssessorSlot, Statistics, Totals } from '@/types/data/assessorSlot'
import { useAccount } from 'wagmi'
import { Status } from '@/types/enum/status'
import { RoundSpinner } from '@/components/ui/spinner'
import { useRouter } from 'next/navigation'
import { useGetAssessorSlotWithAddr } from '@/hooks/assessorSlot/useGetAssessorSlotWithAddr'
export const DataTableContainerLeaderboard = () => {
    const prepareDataForTable = (assessorSlot: AssessorSlot) => {
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
                    assessorSlotId: assessorSlot.id,
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

    const { address, status: statusAccount } = useAccount()
    const { data, error, status, refetch } = useGetAssessorSlotWithAddr({
        assessorAddr: address as string,
    })

    const { push } = useRouter()
    // Refresh the data when the account is connected
    useEffect(() => {
        if (statusAccount === 'connected' && refetch) refetch()
    }, [refetch, statusAccount])

    // Redirecting to avoid error
    useEffect(() => {
        if (data?.status == 'ko' || data?.res === undefined) {
            // if (statusAccount === 'connected' && refetch) refetch()

            if ((data?.res as AssessorSlot) === undefined) {
                push(`/`)
            }
        }
    }, [data?.res])

    // Implement Skeletton
    if (status != 'success' || (data.res as AssessorSlot) === undefined) {
        return (
            <div className="mx-auto">
                <RoundSpinner size="triplexl" />
            </div>
        )
    }

    return (
        <DataTableAssessor
            users={prepareDataForTable(data.res as AssessorSlot)}
        />
    )
}
