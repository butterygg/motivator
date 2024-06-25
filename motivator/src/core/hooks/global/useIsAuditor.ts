import { useQuery } from '@tanstack/react-query'
import { isAuditor } from '@/server/actions/audit/isAuditor'

type Props = {
    assessorAddr: string
}

/**
 * This hook is used to verify the auditor address
 * @param {Props} props
 *
 *
 */
const useIsAuditor = (auditorAddr: string) => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['useIsAuditor'],
        queryFn: async () => {
            return isAuditor({ auditorAddr: auditorAddr })
        },
        // staleTime: 1000 * 6,
        retry: true,
        // enabled: false,
    })

    if (status === 'error') {
        console.log(error, 'error')
    }
    if (data) return { data, refetch, error, status }
    return { error, status }
}

export { useIsAuditor }
