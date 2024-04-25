import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ToggleTheme } from './ToggleTheme'
import Link from 'next/link'

export const YourApp = () => {
    return
}
type Props = {}

const NavBar = (props: Props) => {
    return (
        <div className="items-center max-md:flex-col w-full p-8 justify-between flex">
            <div className="flex items-center gap-4">
                <Link href={'/'}>
                    <h1 className="font-bold text-2xl">Motivator</h1>
                    <h2 className="font-semibold text-xl">
                        A Buttery Good Game
                    </h2>
                </Link>
                <Link href={'/payment'}>Purchase Slot</Link>
                <Link href={'/audit'}>Audit</Link>
            </div>
            <div className="flex items-center gap-2">
                <ToggleTheme />
                <ConnectButton />
            </div>
        </div>
    )
}

export default NavBar
