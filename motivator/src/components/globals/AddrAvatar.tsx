import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { cn } from '../../utils/utils'

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
            <p className="flex flex-wrap">{addressName}</p>
        </div>
    )
}

export default AddrAvatar
