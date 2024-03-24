import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { AssessorSlot } from '../types/data/assessorSlot'

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
    const { data, refetch, error } = useQuery({
        queryKey: ['assessorSlot'],
        queryFn: async () => {
            const res = await fetch('/api/assessor_slot/get', {
                body: JSON.stringify({
                    assessorAddr: assessorAddress,
                }),
                method: 'GET',
            })
            return (await res.json()) as AssessorSlot
        },
    })
    return { data, refetch, error }
}

export { useGetAssessorSlot }
