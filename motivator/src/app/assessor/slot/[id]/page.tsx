'use client'
import React from 'react'

type Props = {}

import DatatableProxyAssessor from '@/components/datatables/DatatableProxyAssessor'

const HomeAssessor = (props: Props) => {
    const protocol = 'hyperdrive'
    return (
        <main className="flex lg:flex-row w-full">
            {/* Update the hyperdrive value with Global Variable Env or a Selector of Protocol if Multiprotocol on same App */}
            <DatatableProxyAssessor protocol={protocol} />
        </main>
    )
}

export default HomeAssessor
