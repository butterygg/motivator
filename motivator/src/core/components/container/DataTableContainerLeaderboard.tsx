'use client'
import React, { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { RoundSpinner } from '@/components/ui/spinner'
import {
    DataTableLeaderboard,
    LeaderboardDatatable,
} from '../leaderboard/DataTableLeaderboard'
import { useGetAllLeaderboardRewards } from '@/hooks/reward/useGetAllLeaderboardRewards'
export const DataTableContainerLeaderboard = () => {
    const prepareDataForTable = (users: LeaderboardDatatable[]) => {
        // sort the array by number of total actions
        if (users == null) return []
        return users.sort((a, b) => {
            return b.total - a.total
        })
    }

    const { status: statusAccount } = useAccount()

    const { data: dataRewards, status, refetch } = useGetAllLeaderboardRewards()

    // Refresh the data when the account is connected
    useEffect(() => {
        if (statusAccount === 'connected' && refetch) refetch()
    }, [refetch, statusAccount])

    // Implement Skeletton
    if (
        status != 'success' ||
        (dataRewards?.res as LeaderboardDatatable[]) === undefined ||
        dataRewards?.res?.length == 0 ||
        dataRewards?.res === null
    ) {
        return (
            <div className="mx-auto">
                <RoundSpinner size="triplexl" />
            </div>
        )
    }
    if (
        status == 'success' &&
        (dataRewards?.res as LeaderboardDatatable[]).length == 0
    ) {
        return (
            <div className="mx-auto">
                <h1>No Data found</h1>
            </div>
        )
    }

    if (dataRewards?.res?.length ?? 0 > 0) {
        return (
            <DataTableLeaderboard
                users={prepareDataForTable(
                    dataRewards?.res as LeaderboardDatatable[]
                )}
            />
        )
    }
}
