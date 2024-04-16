'use client'
import React, { useState } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
} from '../ui/card'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'

type Props = {
    week: number
    weekmax: number
}

const StartAssessmentSlot = (props: Props) => {
    const { push } = useRouter()

    const handleStartAssessmentSlot = async () => {
        // await mutateSignAssessor()
        // const { res } = await mutateAssignAssessorSlot()
        push(`/payment`)
        // push(`/assessor/slot/${res?.id}`)
        // setAssessorId(res?.id as string)
    }

    return (
        <Card className="w-96 items-center p-4 rounded-lg mx-auto">
            <CardHeader className="font-bold p-4  flex flex-wrap">
                <h2 className="text-xl">Start an assessment slot</h2>
                <p className="text-md font-semibold">
                    {' '}
                    on week - {props.week} / {props.weekmax}
                </p>
            </CardHeader>
            <CardContent className="p-4">
                Allocate rewards to testnet players and get rewarded for
                that!Remember: you can get audited by the council and your
                rewards will be either doubled if deemed aligned with
                Hyperdrive, or slashed if misaligned.
            </CardContent>
            <CardDescription className="p-4">
                The more assessments you do, the more rewards you accumulate.
            </CardDescription>
            <CardFooter className="p-4">
                <Button
                    className="m-auto"
                    onClick={() => handleStartAssessmentSlot()}
                >
                    Start assessment slot
                </Button>
            </CardFooter>
        </Card>
    )
}

export default StartAssessmentSlot
