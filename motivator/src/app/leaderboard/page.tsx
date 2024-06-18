import React from 'react'
import { DataTableContainerLeaderboard } from '@protocols/hyperdrive/components/datatable/container/DataTableContainerLeaderboard'

type Props = {}

const AssessorsLeaderBoard = (props: Props) => {
    return (
        <main className="flex lg:flex-row w-full">
            <DataTableContainerLeaderboard />
        </main>
    )
}

export default AssessorsLeaderBoard
