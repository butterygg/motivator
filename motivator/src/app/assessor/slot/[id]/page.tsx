'use client'
import React from 'react'

type Props = {}

import DatatableProxyAssessor from '@/components/datatables/DatatableProxyAssessor'

const HomeAssessor = (props: Props) => {
    const protocol = process.env.NEXT_PUBLIC_PROJECT_NAME as string
    return (
        <main className="flex lg:flex-row w-full">
            <DatatableProxyAssessor protocol={protocol} />
        </main>
    )
}

export default HomeAssessor
