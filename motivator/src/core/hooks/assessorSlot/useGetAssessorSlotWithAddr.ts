import { useQuery } from '@tanstack/react-query'
import { getAssessorSlotWithAddr } from '@/server/actions/assessor/getAssessorSlotWithAddr'

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
        queryKey: ['useGetAssessorSlotWithAddr'],
        queryFn: async () => {
            // if (!assessorAddr)
            // return { error: 'No address provided', status: 'error' }
            return await getAssessorSlotWithAddr(assessorAddr)
        },
        staleTime: 1,
        retry: true,
        gcTime: 1,
        refetchOnMount: false,
        // enabled: false,
    })

    if (status === 'error') {
        console.log(error, 'error')
    }
    if (data) return { data, refetch, error, status }
    return { error, status }
}

export { useGetAssessorSlotWithAddr }
