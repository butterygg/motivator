import { useQuery } from '@tanstack/react-query'
import { getNumberAssessorSlotAvailable } from '@/server/actions/globals/getNumberAssessorSlotAvailable'
import { getAssessorSlotID } from '@/server/actions/assessor/getAssessorSlotID'

type Props = {
    assessorAddr: string
}

/**
 * This hook is used to return the number of assessor slot available
 *
 *
 */
const useGetAssessorSlotID = ({ assessorAddr }: Props) => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['assessorSlot'],
        queryFn: async () => {
            return await getAssessorSlotID({ assessorAddr: assessorAddr })
        },
        // enabled: false,
        retry: 1,
    })
    if (status === 'error') {
        console.log(error, 'error')
    }
    if (data) return { data, refetch, error, status }
    return { error, status }
}

export { useGetAssessorSlotID }
