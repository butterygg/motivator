import React from 'react'
import { DataTable } from '@/components/assessor/DataTable'
import RewardedUsers from '@/components/assessor/RewardedUsers'
import { User } from '@/types/data/user'
import { Status } from '../../types/enum/status'

type Props = {}

const HomeAssessor = (props: Props) => {
    const users: User[] = [
        {
            id: '1',
            addressName: '0x8753DE1914c4AB01F845b05b7BC146Bc898850A6',
            volume: 100,
            pnl: 100,
            actions: 100,
            status: Status.Pending,
        },
        {
            id: '2',
            addressName: '0x8773DE1914c4AB01F845b05b7BC146Bc898850A6',
            volume: 100,
            pnl: 100,
            actions: 100,
            status: Status.Rewarded,
        },
        {
            id: '3',
            addressName: '0xmazout.eth',
            volume: 100,
            pnl: 100,
            actions: 100,
            status: Status.Pending,
        },
    ]
    return (
        <main className="flex flex-col lg:flex-row">
            <DataTable />
            <RewardedUsers value={0} users={users} />
        </main>
    )
}

export default HomeAssessor
