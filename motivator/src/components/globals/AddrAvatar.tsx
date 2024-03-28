import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { cn, formatAddress } from '../../utils/utils'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '../ui/button'

type Props = {
    src?: string
    addressName: string
    isDatatableStyle?: boolean
}

const AddrAvatar = ({
    addressName = '0xMazout.eth',
    src = 'https://avatars.githubusercontent.com/u/1000000?v=4',
    isDatatableStyle = false,
}: Props) => {
    return (
        <div
            className={cn(
                isDatatableStyle ? 'lg:flex-row' : 'flex-col lg:flex-row',
                'flex font-bold gap-2 items-center'
            )}
        >
            <Avatar>
                <AvatarImage src={src} />
                <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <p className="flex flex-wrap cursor-help">
                            {formatAddress(addressName)}
                        </p>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{addressName}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}

export default AddrAvatar
