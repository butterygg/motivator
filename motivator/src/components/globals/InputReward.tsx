/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import { Input } from '../ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import { useAddRewardUsers } from '../../hooks/reward/useAddRewardUsers'
import { Label } from '../ui/label'
import { useGlobalState } from '../../store/globalStore'
import { useAccount } from 'wagmi'
import { useIsThisAssessorSlotYours } from '../../hooks/global/useIsThisAssessorSlotYours'
import { toast } from 'sonner'
import { cn } from '../../utils/utils'

type Props = {
    val: number
    userAddr: string
    assessorSlotID: string
}

const InputReward = ({ val, assessorSlotID, userAddr }: Props) => {
    const { refreshPoints, refreshPointsNeeded } = useGlobalState()
    // to avoid unessesary mutate we need to define an initial value on mount
    const initialVal = val ? val : 0
    const [value, setValue] = useState(initialVal)
    const debouncedValue = useDebounce(value, 200)
    const {
        mutateAsync,
        status,
        data: isRewarded,
    } = useAddRewardUsers({
        assessorSlotID: assessorSlotID,
        userAddr: userAddr,
        value: debouncedValue,
    })
    const rewarded = isRewarded ? isRewarded : false
    const { address } = useAccount()

    const { data, status: statusISYoursAssessorSlots } =
        useIsThisAssessorSlotYours({
            assessorAddr: address as string,
            assessorSlotID: assessorSlotID,
        })
    const isAuthorized =
        statusISYoursAssessorSlots === 'success' && data?.status === 'ok'
            ? true
            : false

    useEffect(() => {
        // updateValue into DB
        if (debouncedValue != initialVal) mutateAsync()
    }, [debouncedValue])

    useEffect(() => {
        refreshPoints(true)
    }, [status])

    return (
        <div className="align-top flex flex-col gap-2 w-fit">
            <Label className="font-extralight text-center text-xs">
                Rewards
            </Label>
            <Input
                placeholder="pts"
                type="number"
                className={cn(
                    isAuthorized ? 'cursor-pointer' : 'cursor-not-allowed',
                    'w-20 text-center'
                )}
                min={0}
                onChange={(e) => {
                    isAuthorized
                        ? setValue(parseInt(e.target.value))
                        : toast.error(
                              'You are not authorized to reward this user'
                          )
                }}
                disabled={!isAuthorized}
                value={value}
                step={5}
            />
            {/* <Button onClick={() => handleSubmit()}>Reward</Button> */}
        </div>
    )
}

export default InputReward
