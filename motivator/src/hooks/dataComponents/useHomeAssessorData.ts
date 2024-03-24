import { useAccount } from 'wagmi'
import { useGetAssessorSlot } from '../useGetAssessorSlot'

export const useHomeAssessorData = () => {
    console.log('Hook HomeAssessor')
    const { address } = useAccount()
    const { data, error, refetch } = useGetAssessorSlot({
        // assessorAddress: address ? address : '0x0',
        assessorAddress: address ? address : '0x0',
    })

    return { data, refetch, error }
}
