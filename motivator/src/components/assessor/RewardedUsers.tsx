import React from 'react'
import { User } from '../../types/data/user'
import ReducedDataUsers from './ReducedDataUsers'
import { Button } from '../ui/button'
import { useGetAssessorSlot } from '../../hooks/useGetAssessorSlot'

type Props = {
    value: number
    users: User[]
}

const RewardedUsers = ({ value, users }: Props) => {
    const { data } = useGetAssessorSlot({ assessorAddress: '0x0' })
    const buildUsers = () => {
        return (
            <div className="flex flex-wrap lg:flex-col gap-4">
                {users.map((user, index) => (
                    <ReducedDataUsers
                        key={index}
                        userAddress={user.addressName}
                        // actions={user.stat.actions}
                        // pnl={user.pnl}
                        // volume={user.stat.volume}
                        assessorAddress=""
                        reward={user.reward ? user.reward.amount : 0}
                        id={user.id}
                    />
                ))}
            </div>
        )
    }
    return (
        <section className="p-8 h-full w-fit lg:w-1/4">
            <div className="border rounded p-4">
                <div className="flex justify-between rounded py-2">
                    <h1 className="font-bold">Summary</h1>
                    <div className="flex gap-4">
                        <Button variant={'submit'} className="lg:hidden">
                            Submit
                        </Button>
                        <div>
                            <p className="font-extralight pl-1 text-xs">
                                Points
                            </p>
                            <p className="font-bold text-right">{value}</p>
                        </div>
                    </div>
                </div>
                {buildUsers()}
                <div className="items-center p-4">
                    <Button variant={'submit'} className="w-full max-lg:hidden">
                        Submit
                    </Button>
                </div>
            </div>
        </section>
    )
}

export default RewardedUsers
