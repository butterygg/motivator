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
import { DataCard } from '@/components/assessor/DataCard'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { useGetTotalPointsDistributed } from '@/hooks/dataComponents/useGetTotalPointsDistributed'
import { cn } from '@/utils/utils'
import { useSubmitAssessorSlot } from '@/hooks/assessorSlot/useSubmitAssessorSlot'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RoundSpinner } from '@/components/ui/spinner'
import { Card } from '@/components/ui/card'
import { Address } from 'viem'
import { useGetAssessorSlotWithID } from '@/hooks/assessorSlot/useGetAssessorSlotWithID'
import { useIsThisAssessorSlotYours } from '@/hooks/global/useIsThisAssessorSlotYours'

type Props = {
    assessorSlotId: string
}

export function DialogConfirmSubmit({ assessorSlotId }: Props) {
    const [isSubmited, setIsSubmited] = useState(false)
    const { address } = useAccount()
    const { data, mutateAsync, status } = useSubmitAssessorSlot({
        assessorSlotID: assessorSlotId,
        assessorAddr: address as Address,
    })
    const { push } = useRouter()
    const { data: isThisYours, status: statusIsThisYours } =
        useIsThisAssessorSlotYours({
            assessorAddr: address as Address,
            assessorSlotID: assessorSlotId,
        })
    const isAuthorized =
        isThisYours?.status === 'ok' && statusIsThisYours === 'success'
            ? true
            : false
    const points = useGetTotalPointsDistributed()
    const {
        data: AssessorSlot,
        refetch,
        status: statusAssessorSlotRQT,
    } = useGetAssessorSlotWithID({
        assessorSlotID: assessorSlotId,
    })
    const getPointsAvailable = (val: number) => {
        return 100 - val
    }

    async function handleSubmit() {
        toast('Submitting')
        setIsSubmited(true)
        setTimeout(async () => {
            await mutateAsync()
        }, 2000)
        if (refetch) refetch()
    }

    useEffect(() => {
        if (status === 'success' && data?.status === 'ok') {
            if (AssessorSlot?.res?.done) {
                push(`/`)
            } else {
                if (refetch) refetch()
            }
        }
        if (status === 'error' || data?.status === 'ko') {
            toast.error('Error on Submit')
            setIsSubmited(false)
        }
    }, [status, statusAssessorSlotRQT, AssessorSlot])

    return (
        <>
            {isAuthorized && (
                <Dialog>
                    <TooltipProvider>
                        <Tooltip>
                            <DialogTrigger asChild>
                                <TooltipTrigger asChild>
                                    <Button
                                        className="rounded-full"
                                        variant="submit"
                                    >
                                        Submit
                                    </Button>
                                </TooltipTrigger>
                            </DialogTrigger>
                            <TooltipContent>
                                <p>
                                    Press Submit when you’ve finished allocating
                                    your points.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <DialogContent className="sm:max-w-[625px] sm:w-fit">
                        {isSubmited ? (
                            <>
                                <Card className="w-96 items-center p-4 rounded-lg mx-auto">
                                    <div className=" flex flex-col gap-4 items-center justify-center">
                                        <RoundSpinner size="triplexl" />
                                        <Label className="font-bold">
                                            Sending Motivator Slot, you will be
                                            redirected quickly.
                                        </Label>
                                    </div>
                                </Card>
                            </>
                        ) : (
                            <>
                                <DialogHeader>
                                    <DialogTitle>
                                        <h3>Confirm Assessment Submit</h3>
                                    </DialogTitle>
                                    <DialogDescription>
                                        Once you press confirm you won’t be able
                                        to change your allocation, and your
                                        points will be distributed. Feel free to
                                        double check, we’ll wait.
                                    </DialogDescription>
                                </DialogHeader>
                                <Label htmlFor="name" className="">
                                    {(points ? getPointsAvailable(points) : 0) >
                                    0 ? (
                                        <p className="font-semibold gap">
                                            You still have points to assess.{' '}
                                            <br /> If you want press the Cancel
                                            button and keep assessing
                                        </p>
                                    ) : null}
                                </Label>
                                <div className="grid gap-4 py-2">
                                    <div className="grid grid-cols-3 items-center gap-2">
                                        <DataCard
                                            title="Available"
                                            value={
                                                points
                                                    ? getPointsAvailable(points)
                                                    : 100
                                            }
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
                                                    (points
                                                        ? getPointsAvailable(
                                                              points
                                                          )
                                                        : 0) < 0
                                                        ? 'hidden'
                                                        : ''
                                                )}
                                                variant={'submit'}
                                            >
                                                Confirm
                                            </Button>
                                            <DialogClose asChild>
                                                <Button variant={'destructive'}>
                                                    Cancel
                                                </Button>
                                            </DialogClose>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}
