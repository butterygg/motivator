'use client'
import { Button } from '@/components/ui/button'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User } from '@/types/data/user'
import AddrAvatar from '../globals/AddrAvatar'
import { DataCard } from './DataCard'
import EthLogo from '~/ethereum-eth-logo.svg'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useAddRewardUsers } from '../../hooks/reward/useAddRewardUsers'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { useGetTotalPointsDistributed } from '../../hooks/dataComponents/useGetTotalPointsDistributed'

type Props = {
    assessorSlotId: string
}

export function DialogConfirmSubmit({ assessorSlotId }: Props) {
    // const { mutate, error, data } = useAddRewardUsers({
    //     assessorSlot: assessorSlotId,
    //     userAddr: user.addressName,
    //     value: points ? points : 0,
    // })
    // const handleSubmit = () => {
    //     mutate()
    //     console.log('error', error, 'data', data)
    // }

    const points = useGetTotalPointsDistributed({
        assessorSlotId: assessorSlotId,
    })

    const getPointsAvailable = (val: number) => {
        return 100 - val
    }

    return (
        <Dialog>
            <TooltipProvider>
                <Tooltip>
                    <DialogTrigger asChild>
                        <TooltipTrigger asChild>
                            <Button className="rounded-full" variant="outline">
                                Submit
                            </Button>
                        </TooltipTrigger>
                    </DialogTrigger>
                    <TooltipContent>
                        <p>
                            Submit your rewards when you finished your
                            assessment
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <DialogContent className="sm:max-w-[625px] sm:w-fit">
                <DialogHeader>
                    <DialogTitle>
                        <h3>Confirm Assessment Submit</h3>
                    </DialogTitle>
                    <DialogDescription>
                        Pressing the confirm button, will lock the amount you
                        selected and distribute rewards to the users. You won
                        `&apos`t have access to this assessment and this will be
                        definitive.{' '}
                    </DialogDescription>
                </DialogHeader>
                <Label htmlFor="name" className="">
                    Statistics
                </Label>
                <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-3 items-center gap-2">
                        <DataCard
                            title="Available"
                            value={points ? getPointsAvailable(points) : 0}
                        />
                        <DataCard
                            title="Distributed"
                            value={points ? points : 0}
                        />
                    </div>
                </div>

                {/* <DialogFooter className="flex-row justify-between w-full">
                    <div className="align-top flex gap-2 w-fit">
                        <Input
                            placeholder="Points"
                            type="number"
                            className="w-32 appearance-none"
                            min={0}
                            onChange={handleOnChangeInput}
                            value={points}
                        />
                        <Button onClick={() => handleSubmit()}>Reward</Button>
                    </div>
                </DialogFooter> */}
            </DialogContent>
        </Dialog>
    )
}
