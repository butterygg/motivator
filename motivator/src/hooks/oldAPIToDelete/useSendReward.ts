import { useMutation, useQuery } from '@tanstack/react-query'
import React from 'react'

type Props = {
    assessorAddress: string
    userAddress: string
    value: number
}

// This hook is used to send rewards to users
/**
 * @param {Props} props
 *
 *
 * This hook will use React Query to send rewards to users via the API
 */
const useSendReward = (props: Props) => {
    // ! Use React Query to send rewards
    // ! Use the POST method to send the rewards
    // ! The body will contain the user address , the reward and the assessor address

    const { data, mutate, error } = useMutation({
        mutationKey: ['sendReward'],
        mutationFn: async () => {
            const res = await fetch('/api/rewards/add', {
                body: JSON.stringify({
                    userAddress: props.userAddress,
                    value: props.value,
                    assessorSlot: props.assessorAddress,
                }),
                method: 'POST',
            })
            return res.json()
        },
    })
    return { data, mutate, error }
}

export { useSendReward }
