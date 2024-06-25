import { useQuery } from '@tanstack/react-query'
import { getWeekTotalsAvailableForUser } from '@/server/actions/globals/getWeekTotalsAvailableForUser'

type Props = {
    assessorAddr: string
}

/**
 * This hook is used to fetch the assessor slot of the assessor
 * @param {Props} props
 *
 *
 */
const useGetWeekTotalsAvailableForUser = (userAddr: string) => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['usegetWeekTotalsAvailableForUser'],
        queryFn: async () => {
            return await getWeekTotalsAvailableForUser({ userAddr })
        },
        // staleTime: 1000 * 6,
        retry: true,
        // enabled: false,
    })

    if (status === 'error') {
        console.log(error, 'error')
    }
    // console.log(data, 'data')
    if (data) return { data, refetch, error, status }
    return { error, status }
}

export { useGetWeekTotalsAvailableForUser }
