import React, { useEffect } from 'react'
import { DataTable, UserDatatable } from '@/components/assessor/DataTable'
import { AssessorSlot, Stat } from '@/types/data/assessorSlot'
import { useGetAssessorSlot } from '@/hooks/assessorSlot/useGetAssessorSlot'
import { useAccount } from 'wagmi'
import { Status } from '@/types/enum/status'

const DataTableContainer = () => {
    const prepareDataForTable = (assessorSlot: AssessorSlot) => {
        const res: UserDatatable[] = []
        assessorSlot.users.forEach((element, index) => {
            res.push({
                id: {
                    id: index.toString(),
                    assessorid: assessorSlot.assessorID,
                },
                addressName: element,
                pnl: 100,
                stat: assessorSlot.stats.find(
                    (stat) => stat.user_address === element
                ) as Stat,
                status: assessorSlot.rewards.find(
                    (reward) => reward.user_address === element
                )
                    ? Status.Rewarded
                    : Status.Pending,
            })
        })

        return res
    }
    const dummyAssessorSlot: AssessorSlot = {
        id: '1',
        assessorID: '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
        rewards: [
            {
                date: '2021-09-10',
                user_address: '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
                id: '1',
                amount: 100,
                assessor_slot_ID: '1',
            },
        ],
        users: [
            '0x8753DE1914c4AB01F845b05b7BC146Bc898850A2',
            '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
            '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
        ],
        done: false,
        week: 0,
        stats: [
            {
                user_address: '0x8753DE1914c4AB01F845b05b7BC146Bc898850A2',
                actions: 40,
                volume: 500,
            },
            {
                user_address: '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
                actions: 40,
                volume: 500,
            },
            {
                user_address: '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
                actions: 40,
                volume: 500,
            },
        ],
    }
    const { address, status: statusAccount } = useAccount()
    const { data, error, status, refetch } = useGetAssessorSlot({
        assessorAddr: address as string,
    })

    // Refresh the data when the account is connected
    useEffect(() => {
        console.log('statusAccount', statusAccount)
        if (statusAccount === 'connected' && refetch) refetch()
    }, [statusAccount])

    if (status === 'pending') {
        return <div>Loading...</div>
    }
    // Implement Skeletton
    if (status === 'error') {
        return <DataTable users={prepareDataForTable(dummyAssessorSlot)} />
    }

    if (!data?.status || data.status === 'ko') {
        return (
            <>
                <p>No data</p>
                <DataTable users={prepareDataForTable(dummyAssessorSlot)} />
            </>
        )
    }
    console.log('data', data)
    return <DataTable users={prepareDataForTable(data.res as AssessorSlot)} />
}

export default DataTableContainer
