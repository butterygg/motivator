'use client'
import React from 'react'

type Props = {}

import DataTableContainer from '@/components/container/DataTableContainer'

const HomeAssessor = (props: Props) => {
    return (
        <main className="flex lg:flex-row w-full">
            <DataTableContainer />
        </main>
    )
}

export default HomeAssessor
