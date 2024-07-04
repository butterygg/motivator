'use client'

import { DataTableContainerAssessor } from '@protocols/hyperdrive/components/datatables/container/DataTableContainerAssessor'
import { useGetAssessorSlot } from '@/hooks/assessorSlot/useGetAssessorSlot'
import { useAccount } from 'wagmi'
import { usePathname } from 'next/navigation'
import { RoundSpinner } from '../ui/spinner'
import { useEffect } from 'react'
import { AssessorSlotHyperdrive } from '../../../protocols/hyperdrive/types/data/assessorSlot'
import { AssessorSlotProtocols } from '@/types/data/assessorSlotsProtocols'

type Props = {
    protocol: string
}
/**
 * This proxy is use to load the component associated with the specified protocol
 * |ImplementProtocol| When you implement a new protocol
 * just add a new case in the switch statement with the name of the protocol and the new component
 * @param protocol name of the protocol
 * @returns DataTableContainer component
 */
const DatatableProxyAssessor = ({ protocol }: Props) => {
    const { address, status: statusAccount } = useAccount()
    const pathname = usePathname()
    // Extract id from the pathname
    // http://localhost:3000/assessor/slot/7677e331-29eb-4c54-8e7a-d44a816fe423
    const slotID = pathname.split('/').slice(2)[1]

    const { data, error, status, refetch } = useGetAssessorSlot({
        assessorSlotID: slotID as string,
    })

    // Refresh the data when the account is connected
    useEffect(() => {
        if (statusAccount === 'connected' && refetch) refetch()
    }, [refetch, statusAccount])

    // Implement Skeletton
    if (
        status != 'success' ||
        (data.res as AssessorSlotProtocols) === undefined
    ) {
        return (
            <div className="mx-auto">
                <RoundSpinner size="triplexl" />
            </div>
        )
    }
    /**
     * Load Datatable Container for each protocol
     * @param protocol
     * @returns Container for the Datatable
     */
    const loadDatatableProtocol = (protocol: string) => {
        switch (protocol) {
            case 'hyperdrive':
                return (
                    <DataTableContainerAssessor
                        data={data.res as AssessorSlotHyperdrive}
                    />
                )
            default:
                return (
                    <DataTableContainerAssessor
                        data={data.res as AssessorSlotHyperdrive}
                    />
                )
        }
    }

    return loadDatatableProtocol(protocol)
}

export default DatatableProxyAssessor
