import { useQuery } from '@tanstack/react-query'
import { getAssessorSlot } from '@/server/actions/assessor/getAssessorSlot'

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
    const protocol = process.env.NEXT_PUBLIC_PROJECT_NAME as string

    /**
     * When implementing a new protocol, add a case in the switch statement with the name of the protocol and the new function to get the assessor slot
     */
    const { data, refetch, status, error } = useQuery({
        queryKey: ['useGetAssessorSlot'],
        queryFn: async () => {
            switch (protocol) {
                case 'hyperdrive':
                    return await getAssessorSlot({ assessorSlotID })
                default:
                    return await getAssessorSlot({ assessorSlotID })
            }
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
