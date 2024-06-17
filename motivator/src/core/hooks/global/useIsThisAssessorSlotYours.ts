import { useQuery } from '@tanstack/react-query'
import { isThisAssessorSlotYours } from '@/server/actions/assessor/isThisAssessorSlotYours'

type Props = {
    assessorAddr: string
    assessorSlotID: string
}

/**
 * This hook is used to verify the proprietary of Assessor Slot
 * @param {Props} props
 *
 *
 */
const useIsThisAssessorSlotYours = ({
    assessorAddr,
    assessorSlotID,
}: Props) => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['useIsThisAssessorSlotYours'],
        queryFn: async () => {
            return isThisAssessorSlotYours({
                assessorAddr: assessorAddr,
                assessorSlotID: assessorSlotID,
            })
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

export { useIsThisAssessorSlotYours }
