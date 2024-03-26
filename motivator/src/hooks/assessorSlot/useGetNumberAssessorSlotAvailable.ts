import { useQuery } from '@tanstack/react-query'
import { getNumberAssessorSlotAvailable } from '@/server/actions/globals/getNumberAssessorSlotAvailable'

type Props = {
    assessorAddr: string
}

/**
 * This hook is used to return the number of assessor slot available
 *
 *
 */
const useGetNumberAssessorSlotAvailable = () => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['assessorSlot'],
        queryFn: async () => {
            return getNumberAssessorSlotAvailable()
        },
        // enabled: false,
        retry: 1,
    })
    console.log(data, 'data')
    console.log(error, 'error')
    if (status === 'error') {
        console.log(error, 'error')
    }
    if (data) return { data, refetch, error, status }
    return { error, status }
}

export { useGetNumberAssessorSlotAvailable }
