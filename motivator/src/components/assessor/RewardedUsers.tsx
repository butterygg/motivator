import React, { useEffect, useState } from 'react'
import { User } from '@/types/data/user'
import ReducedDataUsers from './ReducedDataUsers'
import { Button } from '@/components/ui/button'
import { useGetAssessorSlot } from '@/hooks/assessorSlot/useGetAssessorSlot'
import { useGetRewardedUsers } from '@/hooks/reward/useGetRewardedUsers'
import { useAccount } from 'wagmi'

type Props = {
    value: number
}

const RewardedUsers = ({ value }: Props) => {
    const { address } = useAccount()
    const { data: assessorSlot, refetch } = useGetAssessorSlot({
        assessorAddr: address as string,
    })
    console.log(assessorSlot, 'assessorSlot')
    const buildUsers = () => {
        return (
            <div className="flex flex-wrap lg:flex-col gap-4">
                {assessorSlot?.res?.rewards ? (
                    assessorSlot.res.rewards.map((user, index) => (
                        <ReducedDataUsers
                            key={index}
                            userAddr={user.user_address as string}
                            // actions={user.stat.actions}
                            // pnl={user.pnl}
                            // volume={user.stat.volume}
                            reward={user.amount}
                            id={user.id}
                            assessorSlot={assessorSlot?.res?.id as string}
                            handleUpdate={() =>
                                setisRefetchNeeded(!isRefetchNeeded)
                            }
                        />
                    ))
                ) : (
                    <></>
                )}
            </div>
        )
    }
    const [userList, setUserList] = useState(buildUsers())
    const [isRefetchNeeded, setisRefetchNeeded] = useState(false)
    useEffect(() => {
        setUserList(buildUsers())
    }, [assessorSlot])

    useEffect(() => {
        console.log('update')
        if (refetch) refetch()
    }, [isRefetchNeeded])

    // const { data: rewardedUsers } = useGetRewardedUsers({
    //     assessorAddr: assessorSlot?.res?.assessorID as string,
    // })
    // console.log(rewardedUsers, 'rewardedUsers')

    const handleSubmit = () => {
        console.log('submit')
    }
    // hide the component if list empty
    return assessorSlot?.res?.rewards.length == 0 ? (
        <></>
    ) : (
        <section className="p-8 h-full w-full lg:w-fit ">
            <div className="border rounded p-4">
                <div className="flex justify-between rounded py-2">
                    <h1 className="font-bold">Summary</h1>
                    <div className="flex gap-4">
                        <Button
                            onClick={handleSubmit}
                            variant={'submit'}
                            className="lg:hidden"
                        >
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
                {userList}
                <div className="items-center p-4">
                    <Button
                        onClick={handleSubmit}
                        variant={'submit'}
                        className="w-full max-lg:hidden"
                    >
                        Submit
                    </Button>
                </div>
            </div>
        </section>
    )
}

export default RewardedUsers
