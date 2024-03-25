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
import { OnChainAction } from '@/types/data/action'
import AddrAvatar from '../globals/AddrAvatar'
import { DataCard } from './DataCard'
import EthLogo from '~/ethereum-eth-logo.svg'
import { useSendReward } from '../../hooks/oldAPIToDelete/useSendReward'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Address } from 'viem'
import { Reward } from '../../types/data/assessorSlot'
import { useAddRewardUsers } from '../../hooks/reward/useAddRewardUsers'
import { useGetAssessorSlotID } from '../../hooks/assessorSlot/useGetAssessorSlotID'

type Props = {
    user: User
    assessorSlotId: string
    // onChainActions: OnChainAction[]
    // offChainActions: OnChainAction[]
}

export function UserData({ user, assessorSlotId }: Props) {
    console.log(user, 'user')
    const [points, setPoints] = useState(
        user.reward?.amount ? user.reward.amount : 0
    )
    const { address } = useAccount()
    // const { data } = useGetAssessorSlotID({ assessorAddr: address as Address })
    const { mutate } = useAddRewardUsers({
        assessorSlot: assessorSlotId,
        userAddr: user.addressName,
        value: points ? points : 0,
    })
    const handleSubmit = () => {
        mutate()
    }
    const handleOnChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPoints(parseInt(e.target.value))
    }
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">+</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px] sm:w-fit">
                <DialogHeader>
                    <DialogTitle>
                        <AddrAvatar addressName={user.addressName} />
                    </DialogTitle>
                    <DialogDescription>Historical data</DialogDescription>
                </DialogHeader>
                <Label htmlFor="name" className="">
                    Statistics
                </Label>
                <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-3 items-center gap-2">
                        <DataCard
                            title="Volume"
                            value={user.stat.volume ? user.stat.volume : 0}
                            icon={<EthLogo className="h-4 w-4" />}
                        />
                        <DataCard title="Pnl" value={user.pnl + 'K$'} />
                        <DataCard
                            title="Actions"
                            value={user.stat.actions ? user.stat.actions : 0}
                        />
                    </div>
                </div>

                <DialogFooter className="flex-row justify-between w-full">
                    <Button variant="destructive" className="rounded-full">
                        X
                    </Button>
                    <div className="align-top flex gap-2 w-fit">
                        <Input
                            placeholder="Points"
                            type="number"
                            className="w-32 appearance-none"
                            min={0}
                            onChange={handleOnChangeInput}
                            value={points}
                        />
                        <Button onClick={() => handleSubmit()} type="submit">
                            Reward
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
