'use client'
import { Button } from '@/components/ui/button'

import {
    Dialog,
    DialogClose,
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
import { cn } from '../../utils/utils'
import { useSubmitAssessorSlot } from '../../hooks/assessorSlot/useSubmitAssessorSlot'
import { useRouter } from 'next/router'

type Props = {
    assessorSlotId: string
}

export function DialogConfirmSubmit({ assessorSlotId }: Props) {
    const { address } = useAccount()
    const { data, mutateAsync, status } = useSubmitAssessorSlot({
        assessorAddr: address,
    })
    const { push } = useRouter()
    // const { mutate, error, data } = useAddRewardUsers({
    //     assessorSlot: assessorSlotId,
    //     userAddr: user.addressName,
    //     value: points ? points : 0,
    // })
    // const handleSubmit = () => {
    //     mutate()
    //     console.log('error', error, 'data', data)
    // }

    const points = useGetTotalPointsDistributed()

    const getPointsAvailable = (val: number) => {
        return 100 - val
    }

    async function handleSubmit() {
        await mutateAsync()
        if (status === 'success') {
            push(`/`)
        }
    }

    return (
        <Dialog>
            <TooltipProvider>
                <Tooltip>
                    <DialogTrigger asChild>
                        <TooltipTrigger asChild>
                            <Button className="rounded-full" variant="submit">
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
                        selected and distribute rewards to the users. You
                        won&apos;t have access to this assessment and this will
                        be definitive .
                    </DialogDescription>
                </DialogHeader>
                <Label htmlFor="name" className="">
                    {(points ? getPointsAvailable(points) : 0) > 0 ? (
                        <p className="font-semibold gap">
                            You still have points to assess. <br /> If you want
                            press the Cancel button and keep assessing
                        </p>
                    ) : null}
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

                        <div className="flex flex-col p-4 gap-5">
                            <Button
                                onClick={() => {
                                    handleSubmit()
                                }}
                                className={cn(
                                    (points ? getPointsAvailable(points) : 0) <
                                        0
                                        ? 'hidden'
                                        : ''
                                )}
                                variant={'submit'}
                            >
                                Confirm
                            </Button>
                            <DialogClose asChild>
                                <Button variant={'destructive'}>Cancel</Button>
                            </DialogClose>
                        </div>
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
