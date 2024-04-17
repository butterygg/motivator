'use client'
import { Button } from '@/components/ui/button'

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { DataCard } from './DataCard'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
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
                        Once you press confirm you won’t be able to change your
                        allocation and your points will be distributed. Feel
                        free to double check, we’ll wait.
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
                            value={points ? getPointsAvailable(points) : 100}
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
            </DialogContent>
        </Dialog>
    )
}
