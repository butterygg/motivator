import { useQuery } from '@tanstack/react-query'
import { getTotalsVolPnlActions } from '@protocols/hyperdrive/server/actions/statistics/getTotalsVolPnlActions'

type Props = {
    userAddr: string
}

/**
 * This hook is used to fetch the assessor slot of the assessor
 * @param {Props} props
 *
 *
 */
const useGetTotalsVolPnlActions = ({ userAddr }: Props) => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['useGetTotalsVolPnlActions'],
        queryFn: async () => {
            return getTotalsVolPnlActions({ userAddr })
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

export { useGetTotalsVolPnlActions }
