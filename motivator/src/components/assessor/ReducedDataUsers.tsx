'use client'
import React, { useEffect, useState } from 'react'
import { User } from '@/types/data/user'
import AddrAvatar from '@/components/globals/AddrAvatar'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useSendReward } from '../../hooks/useSendReward'
import { toast } from 'sonner'

type Props = {
    addressName: string
    id: string
}

const ReducedDataUsers = (props: User) => {
    // ! Initialize with store value if available
    const [points, setPoints] = useState(0)
    const handlePointsUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPoints(parseInt(e.target.value))
    }
    const { data, error, mutate } = useSendReward({
        userAddress: props.id,
        value: points,
        assessorAddress: '0x123',
    })
    const handleSubmit = () => {
        mutate()
    }

    //Todo: verify the type of message
    //replace with sonner
    useEffect(() => {
        if (data) {
            toast.success(data.message)
        }
        if (error) {
            toast.error(error.message)
        }
    }, [data, error])

    return (
        <form className="border w-fit p-4 rounded-md flex flex-col gap-4">
            <AddrAvatar addressName={props.addressName} />
            <div className=" lg:flex-wrap flex lg-max:flex-col lg:flex-row gap-4">
                <Input
                    type="number"
                    className="w-24 lg:w-full"
                    placeholder="Points"
                    onChange={handlePointsUpdate}
                />
                <Button className="w-full" onClick={handleSubmit} type="submit">
                    Update
                </Button>
            </div>
        </form>
    )
}

export default ReducedDataUsers
