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

type Props = {
    week: number
    slotsAvailable: number
}

const StartAssessmentSlot = (props: Props) => {
    return (
        <Card className="w-96 items-center p-4 rounded-lg mx-auto">
            <CardHeader className="font-bold text-lg flex flex-wrap">
                Start an assessment slot on week - {props.week}
            </CardHeader>
            <CardContent className="p-4">
                Allocate rewards to testnet players and get rewarded for
                that!Remember: you can get audited by the council and your
                rewards will be either doubled if deemed aligned with
                Hyperdrive, or slashed if misaligned.
            </CardContent>
            <CardDescription className="p-4 flex">
                There are {props.slotsAvailable} slots still available. The more
                assessments you do, the more rewards you accumulate.
            </CardDescription>
            <CardFooter className="p-4 flex">
                <Button className="m-auto">Start assessment slot</Button>
            </CardFooter>
        </Card>
    )
}

export default StartAssessmentSlot
