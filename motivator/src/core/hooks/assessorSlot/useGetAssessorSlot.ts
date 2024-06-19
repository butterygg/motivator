import { useQuery } from '@tanstack/react-query'
import { getAssessorSlot } from '@/server/actions/assessor/getAssessorSlotWithID'

type Props = {
    assessorSlotID?: string
    assessorSlotAddr?: string
}

/**
 * This hook is used to fetch the assessor slot of the assessor
 * @param {Props} props
 *
 *
 */
const useGetAssessorSlot = ({ assessorSlotID }: Props) => {
    const { data, refetch, status, error } = useQuery({
        queryKey: ['useGetAssessorSlot'],
        queryFn: async () => {
            return await getAssessorSlot({ assessorSlotID })
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

export { useGetAssessorSlot }
