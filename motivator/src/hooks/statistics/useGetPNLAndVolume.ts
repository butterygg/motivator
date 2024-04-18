import { useQuery } from '@tanstack/react-query'
import { getPNLAndVolume } from '@/server/actions/statistics/getPNLAndVolume'

type Props = {
    userAddr: string
}

/**
 * This hook is used to fetch the assessor slot of the assessor
 * @param {Props} props
 *
 *
 */
const useGetPNLAndVolume = ({ userAddr }: Props) => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['assessorSlot'],
        queryFn: async () => {
            return getPNLAndVolume({ userAddr })
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

export { useGetPNLAndVolume }
