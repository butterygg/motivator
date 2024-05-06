'use client'
import React, { useEffect } from 'react'
import { UserDatatable } from '@/components/assessor/DataTableAssessor'
import { AssessorSlot, Statistics, Totals } from '@/types/data/assessorSlot'
import { useAccount } from 'wagmi'
import { Status } from '@/types/enum/status'
import { RoundSpinner } from '@/components/ui/spinner'
import { useRouter } from 'next/navigation'
import { useGetAssessorSlotWithAddr } from '@/hooks/assessorSlot/useGetAssessorSlotWithAddr'
import {
    DataTableLeaderboard,
    LeaderboardDatatable,
} from '../leaderboard/DataTableLeaderboard'
import { useGetAllLeaderboardRewards } from '@/hooks/reward/useGetAllLeaderboardRewards'
export const DataTableContainerLeaderboard = () => {
    const prepareDataForTable = (users: LeaderboardDatatable[]) => {
        // const res: LeaderboardDatatable[] = []
        // users.forEach((element, index) => {
        //     res.push({
        //         id: {
        //             id: index.toString(),
        //             assessorSlotId: assessorSlot.id,
        //         },
        //         addressName: element,
        //         rewardsReceived: {
        //             audit: 100,
        //             rewards: 100,
        //         },
        //         totals: audit + rewards,
        //         isTestnetMember: false,
        //     })
        // })

        // sort the array by number of total actions
        return users.sort((a, b) => {
            return b.total - a.total
        })
    }

    const { address, status: statusAccount } = useAccount()
    const { data, error, status, refetch } = useGetAssessorSlotWithAddr({
        assessorAddr: address as string,
    })

    const { data: dataRewards } = useGetAllLeaderboardRewards()

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
        <DataTableLeaderboard
            users={prepareDataForTable(
                dataRewards?.res as LeaderboardDatatable[]
            )}
        />
    )
}
