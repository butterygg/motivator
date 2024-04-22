import React from 'react'
import { DataTableContainerLeaderboardTestnet } from '@/components/container/DataTableContainerLeaderboardTestnet'

type Props = {}

const TestnetLeaderBoard = (props: Props) => {
    return (
        <main className="flex lg:flex-row w-full">
            <DataTableContainerLeaderboardTestnet />
        </main>
    )
}

export default TestnetLeaderBoard
