import React from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
} from '../ui/card'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '../ui/button'
import Link from 'next/link'

type Props = {
    week: number
    slotsAvailable: number
    weekmax: number
}

const StartAssessmentSlot = (props: Props) => {
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
                There are {props.slotsAvailable} slots still available. The more
                assessments you do, the more rewards you accumulate.
            </CardDescription>
            <CardFooter className="p-4">
                <Button className="m-auto">
                    <Link href={''}>Start assessment slot</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

export default StartAssessmentSlot
