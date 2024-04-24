import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { AssessorSlot } from '../../types/data/assessorSlot'
import { getAssessorSlotWithAddr } from '../../server/actions/assessor/getAssessorSlotWithAddr'

type Props = {
    assessorAddr: string
}

/**
 * This hook is used to fetch the assessor slot of the assessor
 * @param {Props} props
 *
 *
 */
const useGetAssessorSlotWithAddr = ({ assessorAddr }: Props) => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['assessorSlot'],
        queryFn: async () => {
            return getAssessorSlotWithAddr(assessorAddr)
        },
        // staleTime: 1000 * 6,
        retry: true,
        // enabled: false,
    })

    if (status === 'error') {
        console.log(error, 'error')
    }
    if (data) return { data, refetch, error, status }
    return { error, status }
}

export { useGetAssessorSlotWithAddr }