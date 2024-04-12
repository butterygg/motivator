'use client'
import React, { useEffect } from 'react'
import { DataTable, UserDatatable } from '@/components/assessor/DataTable'
import { AssessorSlot, Reward, Stat } from '@/types/data/assessorSlot'
import { useGetAssessorSlot } from '@/hooks/assessorSlot/useGetAssessorSlot'
import { useAccount } from 'wagmi'
import { Status } from '@/types/enum/status'
import { RoundSpinner } from '../ui/spinner'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
const DataTableContainer = () => {
    const prepareDataForTable = (assessorSlot: AssessorSlot) => {
        const res: UserDatatable[] = []
        assessorSlot?.users.forEach((element, index) => {
            const reward = assessorSlot.rewards.find(
                (reward) => reward.user_address === element
            )
            const stat = assessorSlot.stats.find(
                (stat) => stat.user_address === element
            ) as Stat
            res.push({
                id: {
                    id: index.toString(),
                    assessorSlotId: assessorSlot.id,
                },
                addressName: element,
                pnl: 100,
                stat: stat,
                reward: {
                    reward: reward ? reward : undefined,
                    status: reward ? Status.Rewarded : Status.Pending,
                },
            })
        })

        return res
    }

    const { address, status: statusAccount } = useAccount()
    const { data, error, status, refetch } = useGetAssessorSlot({
        assessorAddr: address as string,
    })
    const { push } = useRouter()
    // Refresh the data when the account is connected
    useEffect(() => {
        console.log('statusAccount', statusAccount)
        if (statusAccount === 'connected' && refetch) refetch()
    }, [refetch, statusAccount])

    // Redirecting to avoid error
    useEffect(() => {
        console.log('status', status)
        console.log('data', data)
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

    console.log('data', data)
    return <DataTable users={prepareDataForTable(data.res as AssessorSlot)} />
}

export default DataTableContainer
