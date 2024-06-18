'use client'
import React from 'react'

type Props = {}

import { DataTableContainer } from '@protocols/hyperdrive/components/datatable/container/DataTableContainerAssessor'

const HomeAssessor = (props: Props) => {
    return (
        <main className="flex lg:flex-row w-full">
            <DataTableContainer />
        </main>
    )
}

export default HomeAssessor
