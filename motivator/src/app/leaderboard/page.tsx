import React from 'react'
import { DataTableContainerLeaderboard } from '@protocols/hyperdrive/components/datatables/container/DataTableContainerLeaderboard'

type Props = {}

const AssessorsLeaderBoard = (props: Props) => {
    return (
        <main className="flex lg:flex-row w-full">
            <DataTableContainerLeaderboard />
        </main>
    )
}

export default AssessorsLeaderBoard
