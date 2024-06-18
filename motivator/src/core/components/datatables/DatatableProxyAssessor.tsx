'use client'

import { DataTableContainerAssessor } from '@protocols/hyperdrive/components/datatables/container/DataTableContainerAssessor'
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
    const loadDatatableProtocol = (protocol: string) => {
        switch (protocol) {
            case 'hyperdrive':
                return <DataTableContainerAssessor />
            default:
                return <DataTableContainerAssessor />
        }
    }

    return loadDatatableProtocol(protocol)
}

export default DatatableProxyAssessor
