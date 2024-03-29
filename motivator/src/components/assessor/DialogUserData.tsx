'use client'
import { Button } from '@/components/ui/button'

import {
    Dialog,
    DialogContent,
    DialogContentCustom,
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
import { PNLChart } from '../statistics/PNLChart'
import { Separator } from '../ui/separator'
import { VolumeChart } from '../statistics/VolumeChart'

type Props = {
    user: User
}

export function DialogUserData({ user }: Props) {
    return (
        <Dialog>
            <TooltipProvider>
                <Tooltip>
                    <DialogTrigger asChild>
                        <TooltipTrigger asChild>
                            <Button className="rounded-full" variant="outline">
                                ?
                            </Button>
                        </TooltipTrigger>
                    </DialogTrigger>
                    <TooltipContent>
                        <p>Details about the user</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            {/* <DialogContent className="sm:max-w-[625px] sm:w-fit overflow-auto"> */}
            <DialogContentCustom className="w-full overflow-auto">
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
                <>
                    <div className="p-5 ">
                        <Label className="text-xl text-tremor-content dark:text-dark-tremor-content">
                            Trading
                        </Label>
                        <div className="grid gap-2 lg:grid-flow-col p-2">
                            <PNLChart title={'PNL'} value={'25000'} />
                            <VolumeChart title={'Volume'} value={'25000'} />
                            {/* <PNLChart title={'Volume'} value={'25000'} /> */}
                        </div>
                    </div>
                    <div className="p-5 mt-3 ">
                        <Label className="text-xl text-tremor-content dark:text-dark-tremor-content">
                            Liquidity Providing
                        </Label>
                        <div className="grid gap-2 lg:grid-flow-col p-2">
                            <PNLChart title={'PNL'} value={'25000'} />
                            <VolumeChart title={'Volume'} value={'25000'} />
                            {/* <PNLChart title={'Volume'} value={'25000'} /> */}
                        </div>
                    </div>
                </>

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
            </DialogContentCustom>
        </Dialog>
    )
}
