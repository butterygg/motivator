import { useQuery } from '@tanstack/react-query'
import { getPNLAndVolume } from '@/server/actions/statistics/getPNLAndVolume'
import { getTotalsForUser } from '../../../server/actions/globals/getTotalsForUser'

type Props = {
    userAddr: string
    weekNumber: number
}

/**
 * This hook is used to fetch the assessor slot of the assessor
 * @param {Props} props
 *
 *
 */
const useGetTotalsForUserAndWeek = ({ userAddr, weekNumber }: Props) => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['useGetTotalsForUserAndWeek'],
        queryFn: async () => {
            return getTotalsForUser({ userAddr, weekNumber })
        },
        // staleTime: 1000 * 6,
        retry: 5,
        // enabled: false,
    })

    if (status === 'error') {
        console.log(error, 'error')
    }
    if (data) return { data, refetch, error, status }
    return { error, status }
}

export { useGetTotalsForUserAndWeek }
