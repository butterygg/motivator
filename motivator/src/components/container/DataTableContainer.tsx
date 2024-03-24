import React from 'react'
import { DataTable } from '../assessor/DataTable'
import { useHomeAssessorData } from '../../hooks/dataComponents/useHomeAssessorData'
import { AssessorSlot } from '../../types/data/assessorSlot'
import { useGetAssessorSlot } from '../../hooks/useGetAssessorSlot'

type Props = {}

const DataTableContainer = (props: Props) => {
    const { data, error, status } = useGetAssessorSlot({
        assessorAddress: '0x0',
    })

    if (status === 'pending') {
        return <div>Loading...</div>
    }

    if (status === 'error') {
        return <div>Error: {error?.message}</div>
    }

    if (!data) {
        return <div>No data</div>
    }

    return <DataTable assessorSlot={data} />
}

export default DataTableContainer
