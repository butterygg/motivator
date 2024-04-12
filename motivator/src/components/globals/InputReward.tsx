/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import { Input } from '../ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import { useAddRewardUsers } from '../../hooks/reward/useAddRewardUsers'
import { Label } from '../ui/label'
import { useGlobalState } from '../../store/globalStore'

type Props = {
    val: number
    userAddr: string
    assessorSlot: string
}

const InputReward = ({ val, assessorSlot, userAddr }: Props) => {
    const { refreshPoints, refreshPointsNeeded } = useGlobalState()
    // to avoid unessesary mutate we need to define an initial value on mount
    const initialVal = val ? val : 0
    const [value, setValue] = useState(initialVal)
    const debouncedValue = useDebounce(value, 500)
    const { mutateAsync, status } = useAddRewardUsers({
        assessorSlot: assessorSlot,
        userAddr: userAddr,
        value: debouncedValue,
    })

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
                placeholder="Points"
                type="number"
                className="w-24 appearance-none text-center"
                min={0}
                onChange={(e) => setValue(parseInt(e.target.value))}
                value={value}
                step={5}
            />
            {/* <Button onClick={() => handleSubmit()}>Reward</Button> */}
        </div>
    )
}

export default InputReward
