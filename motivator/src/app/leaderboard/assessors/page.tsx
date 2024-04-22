import React from 'react'
import { DataTableContainerLeaderboardAssessor } from '../../../components/container/DataTableContainerAssessor'

type Props = {}

const AssessorsLeaderBoard = (props: Props) => {
    return (
        <main className="flex lg:flex-row w-full">
            <DataTableContainerLeaderboardAssessor />
        </main>
    )
}

export default AssessorsLeaderBoard
