'use client'
import React, { useEffect, useState } from 'react'
import { User } from '@/types/data/user'
import AddrAvatar from '@/components/globals/AddrAvatar'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useSendReward } from '../../hooks/oldAPIToDelete/useSendReward'
import { toast } from 'sonner'
import { useAddRewardUsers } from '../../hooks/reward/useAddRewardUsers'

type Props = {
    userAddr: string
    id: string
    assessorSlot: string
    reward: number | null
}

const ReducedDataUsers = ({ userAddr, reward, assessorSlot }: Props) => {
    const [points, setPoints] = useState(reward)
    const handlePointsUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPoints(parseInt(e.target.value))
    }
    const { data, error, mutate } = useAddRewardUsers({
        assessorSlot: assessorSlot,
        userAddr: userAddr,
        value: points ? points : 0,
    })

    const handleSubmit = () => {
        mutate()
    }

    //Todo: verify the type of message
    //replace with sonner
    useEffect(() => {
        if (data) {
            toast.success("User's reward updated")
        }
        if (error) {
            toast.error(error.message)
        }
    }, [data, error])

    return (
        <form className="border w-fit p-4 rounded-md flex flex-col gap-4">
            <AddrAvatar addressName={userAddr} />
            <div className=" lg:flex-wrap flex lg-max:flex-col lg:flex-row gap-4">
                <Input
                    type="number"
                    className="w-24 lg:w-full"
                    placeholder="Points"
                    onChange={handlePointsUpdate}
                    value={points as number}
                />
                <Button className="w-full" onClick={handleSubmit} type="submit">
                    Update
                </Button>
            </div>
        </form>
    )
}

export default ReducedDataUsers
