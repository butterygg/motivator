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
import { useEffect, useState } from 'react'
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
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type Props = {
    assessorSlotId: string
}

export function DialogConfirmSubmit({ assessorSlotId }: Props) {
    const { address } = useAccount()
    const { mutateAsync, status } = useSubmitAssessorSlot({
        assessorAddr: address,
    })
    const { push } = useRouter()

    const points = useGetTotalPointsDistributed()

    const getPointsAvailable = (val: number) => {
        return 100 - val
    }

    async function handleSubmit() {
        toast('Submitting assessment')
        setTimeout(async () => {
            await mutateAsync()
        }, 2000)
    }

    useEffect(() => {
        if (status === 'success') {
            push(`/`)
        }
    }, [status])

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
                            Press Submit when you're finished allocating your 
                            points
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <DialogContent className="sm:max-w-[625px] sm:w-fit">
                <DialogHeader>
                    <DialogTitle>
                        <h3>Are you sure?</h3>
                    </DialogTitle>
                    <DialogDescription>
                        Once you press confirm, you won’t be able to change 
                        your allocation and your points will be distributed. 
                        Feel free to double-check—we’ll wait.
                    </DialogDescription>
                </DialogHeader>
                <Label htmlFor="name" className="">
                    {(points ? getPointsAvailable(points) : 0) > 0 ? (
                        <p className="font-semibold gap">
                            It looks like you haven’t allocated all your points. 
                            <br /> Press cancel if you want to go back.
                        </p>
                    ) : null}
                </Label>
                <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-3 items-center gap-2">
                        <DataCard
                            title="Remaining Balance"
                            value={points ? getPointsAvailable(points) : 0}
                        />
                        <DataCard
                            title="Allocated"
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
