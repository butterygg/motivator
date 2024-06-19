'use client'
import React, { useState } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
} from '@/components//ui/card'
import { Button } from '@/components//ui/button'
import { useRouter } from 'next/navigation'

type Props = {
    week: number
    weekmax: number
}

const StartAssessmentSlot = (props: Props) => {
    const { push } = useRouter()

    const handleStartAssessmentSlot = async () => {
        push(`/payment`)
    }

    return (
        <Card className="w-96 items-center p-4 rounded-lg mx-auto">
            <CardHeader className="font-bold p-4  flex flex-wrap">
                <div>
                    <h2 className="text-xl">Purchase a Motivator Slot</h2>
                    <h2 className="font-semibold">Week {props.week}</h2>
                </div>
                <br />
                <p className="text-md font-semibold"> The Rules</p>
            </CardHeader>
            <CardContent className="p-4">
                <ol
                    className="gap-3 flex flex-col"
                    style={{ listStyleType: 'decimal' }}
                >
                    <li>Each slot contains a random selection of players</li>
                    <li>
                        Allocate the points you’ve been assigned based on player
                        participation and performance
                    </li>
                    <li>
                        Identify top performers and participants with innovative
                        strategies and avoid rewarding fraudulent behavior to
                        receive extra points
                    </li>
                </ol>
            </CardContent>
            <CardDescription className="p-4">
                The more slots you complete, the more points you earn.
            </CardDescription>
            <CardFooter className="p-4">
                <Button
                    className="m-auto"
                    onClick={() => handleStartAssessmentSlot()}
                >
                    Purchase Motivator slot
                </Button>
            </CardFooter>
        </Card>
    )
}

export default StartAssessmentSlot
