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

    return (
        <main className="flex flex-col lg:flex-row w-full">
            <DataTableContainer />
        </main>
    )
}

export default HomeAssessor
