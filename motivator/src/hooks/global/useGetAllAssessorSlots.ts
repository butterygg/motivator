import { useQuery } from '@tanstack/react-query'
import { getAllAssessorSlotsAudit } from '../../server/actions/globals/getAllAssessorSlotsAudit'

type Props = {
    assessorAddr: string
}

/**
 * This hook is used to fetch the assessor slot of the assessor
 * @param {Props} props
 *
 *
 */
const useGetAllAssessorSlots = () => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['assessorSlot'],
        queryFn: async () => {
            return getAllAssessorSlotsAudit()
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

export { useGetAllAssessorSlots }
