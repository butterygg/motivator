import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { AssessorSlot } from '../../types/data/assessorSlot'
import { getAssessorSlot } from '../../server/actions/assessor/getAssessorSlot'

type Props = {
    assessorAddr: string
}

/**
 * This hook is used to fetch the assessor slot of the assessor
 * @param {Props} props
 *
 *
 */
const useGetAssessorSlot = ({ assessorAddr }: Props) => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['assessorSlot'],
        queryFn: async () => {
            return getAssessorSlot(assessorAddr)
        },
        staleTime: 1000 * 6,
        retry: 5,
        // enabled: false,
    })

    if (status === 'error') {
        console.log(error, 'error')
    }
    if (data) return { data, refetch, error, status }
    return { error, status }
}

export { useGetAssessorSlot }
