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
import { useSignAssessor } from '@/hooks/signup/useSignAssessor'
import { useAccount } from 'wagmi'
import { Address } from 'viem'
import { useAssignAssessorSlot } from '@/hooks/assessorSlot/useAssignAssessorSlot'

type Props = {
    week: number
    slotsAvailable: number
    weekmax: number
}

const StartAssessmentSlot = (props: Props) => {
    const { address } = useAccount()
    console.log(address, 'address')
    const { mutate: mutateSignAssessor } = useSignAssessor({
        assessorAddr: address as Address,
    })

    const { mutate: mutateAssignAssessorSlot } = useAssignAssessorSlot({
        assessorAddr: address as Address,
    })

    const handleStartAssessmentSlot = async () => {
        mutateSignAssessor()
        mutateAssignAssessorSlot()
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
                There are {props.slotsAvailable} slots still available. The more
                assessments you do, the more rewards you accumulate.
            </CardDescription>
            <CardFooter className="p-4">
                <Button
                    className="m-auto"
                    onClick={() => handleStartAssessmentSlot()}
                >
                    Start assessment slot
                    {/* <Link href={'/assessor'}></Link> */}
                </Button>
            </CardFooter>
        </Card>
    )
}

export default StartAssessmentSlot
