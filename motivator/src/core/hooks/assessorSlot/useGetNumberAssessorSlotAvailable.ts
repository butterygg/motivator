import { useQuery } from '@tanstack/react-query'
import { getNumberAssessorSlotAvailable } from '@/server/actions/globals/getNumberAssessorSlotAvailable'

type Props = {
    assessorAddr: string
}

/**
 * This hook is used to return the number of assessor slot available
 */
const useGetNumberAssessorSlotAvailable = () => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['useGetNumberAssessorSlotAvailable'],
        queryFn: async () => {
            return getNumberAssessorSlotAvailable()
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

export { useGetNumberAssessorSlotAvailable }
