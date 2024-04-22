'use client'
import React from 'react'

type Props = {}

import { DataTableContainerLeaderboardAssessor } from '@/components/container/DataTableContainerAssessor'

const HomeAssessor = (props: Props) => {
    return (
        <main className="flex lg:flex-row w-full">
            <DataTableContainerLeaderboardAssessor />
        </main>
    )
}

export default HomeAssessor
