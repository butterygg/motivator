'use client'
import React, { useEffect, useState } from 'react'
import { DataTable } from '@/components/assessor/DataTable'
import RewardedUsers from '@/components/assessor/RewardedUsers'
import { User } from '@/types/data/user'
import { Status } from '../../types/enum/status'
import { useGetAssessorSlot } from '../../hooks/assessorSlot/useGetAssessorSlot'
import { useSession } from 'next-auth/react'
import { useAccount } from 'wagmi'
import { Address } from 'viem'
import { AssessorSlot } from '../../types/data/assessorSlot'

type Props = {}
import { getAccount } from '@wagmi/core'
// import { config } from './config'
import { config } from '../../utils/Web3Provider'
import { useHomeAssessorData } from '../../hooks/dataComponents/useHomeAssessorData'
import DataTableContainer from '../../components/container/DataTableContainer'

const HomeAssessor = (props: Props) => {
    console.log('HomeAssessor')
    // const { address } = getAccount(config)
    // TODO : Mock of Data replace with API call using react query

    // ! My Problem is clearly when we use The UseAccount hook from wagmi or Get Account , we are in an infinite loop
    // const { address } = useAccount()
    // TODO : Ive to find a way to unblock this part and get the address of the user

    // const { data } = useHomeAssessorData()

    // const [assessorSlot, setAssessorSlot] = useState<AssessorSlot>(
    //     data as AssessorSlot
    // )

    // useEffect(() => {
    //     setAssessorSlot(data)
    // }, [data, error, refetch])

    const users: User[] = [
        {
            id: '1',
            addressName: '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
            stat: {
                volume: 500,
                actions: 40,
                user_address: '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
            },
            pnl: 100,
            status: Status.Pending,
        },
        {
            id: '2',
            addressName: '0x8773DE1914c4AB01F845b05b7BC146Bc898850A6',
            stat: {
                volume: 500,
                actions: 40,
                user_address: '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
            },
            pnl: 100,
            status: Status.Rewarded,
        },
        {
            id: '3',
            addressName: '0xmazout.eth',
            stat: {
                volume: 500,
                actions: 40,
                user_address: '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
            },
            pnl: 100,
            status: Status.Pending,
        },
    ]

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

    return (
        <main className="flex flex-col lg:flex-row w-full">
            <DataTableContainer />
            <RewardedUsers value={0} users={users} />
        </main>
    )
}

export default HomeAssessor
