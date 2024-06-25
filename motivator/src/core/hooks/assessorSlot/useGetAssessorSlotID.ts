import { useQuery } from '@tanstack/react-query'
import { getAssessorSlotID } from '@/server/actions/assessor/getAssessorSlotID'

type Props = {
    assessorAddr: string
}

/**
 * This hook is used to get AssessorSlotID
 */
const useGetAssessorSlotID = ({ assessorAddr }: Props) => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['useGetAssessorSlotID'],
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
