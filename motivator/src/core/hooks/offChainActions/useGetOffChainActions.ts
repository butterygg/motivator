import { useQuery } from '@tanstack/react-query'
import { getOffChainActions } from '@/server/actions/offchainActions/getOffChainActions'
type Props = {
    user_address: string
}

/**
 * This hook is used to fetch the assessor slot of the assessor
 * @param {Props} props
 *
 *
 */
const useGetOffChainActions = ({ user_address }: Props) => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['useGetOffChainActions'],
        queryFn: async () => {
            return getOffChainActions(user_address)
        },
        // enabled: false,
        retry: true,
    })
    return { data, refetch, error, status }
}

export { useGetOffChainActions }
