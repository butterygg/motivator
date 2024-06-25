import React from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, formatAddress } from '@/utils/utils'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import Debank from '~/debank.svg'
import Etherscan from '~/etherscan.svg'
import Link from 'next/link'
import { MinidenticonImg } from '@/components/globals/MinidenticonImg'

type Props = {
    src?: string
    addressName: string
    isDatatableStyle?: boolean
}

const AddrAvatar = ({ addressName, isDatatableStyle = false }: Props) => {
    return (
        <div
            className={cn(
                isDatatableStyle ? 'lg:flex-row' : 'flex-col lg:flex-row',
                'flex font-bold gap-2 items-center'
            )}
        >
            <Avatar>
                <MinidenticonImg
                    username={addressName}
                    lightness={80}
                    saturation={80}
                    width={40}
                    height={40}
                />
                <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <TooltipProvider>
                <div className="flex flex-col">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <p className="flex flex-wrap cursor-help">
                                {formatAddress(addressName)}
                            </p>
                        </TooltipTrigger>
                        <div className="flex gap-2 items-center">
                            <Link
                                href={`https://debank.com/profile/${addressName}`}
                                className="bg-black rounded-full p-1 dark:bg-none"
                            >
                                <Debank />
                            </Link>
                            <Link
                                href={`https://sepolia.etherscan.io/address/${addressName}`}
                                className="bg-black rounded-full p-1 dark:bg-none"
                            >
                                <Etherscan />
                            </Link>
                        </div>
                        <TooltipContent>
                            <p>{addressName}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
        </div>
    )
}

export default AddrAvatar
