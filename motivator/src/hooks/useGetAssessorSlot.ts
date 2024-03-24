import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { AssessorSlot } from '../types/data/assessorSlot'
import { getAssessorSlot } from '../server/actions/assessor/getAssessorSlot'

type Props = {
    assessorAddress: string
}

/**
 * This hook is used to fetch the assessor slot of the assessor
 * @param {Props} props
 *
 *
 */
const useGetAssessorSlot = ({ assessorAddress }: Props) => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['assessorSlot'],
        queryFn: async () => {
            getAssessorSlot(assessorAddress)
        },
        // enabled: false,
        retry: 1,
    })
    console.log(data, 'data')
    console.log(error, 'error')
    return { data, refetch, error, status }
}

export { useGetAssessorSlot }
