import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ToggleTheme } from '@/components/globals/ToggleTheme'
import Link from 'next/link'

export const YourApp = () => {
    return
}
type Props = {}

/** If we want to make it generic for each protocole we should insert a Record of Key labe */
const NavBar = (props: Props) => {
    return (
        <div className="items-center max-md:gap-4 max-md:flex-col w-full p-8 justify-between flex">
            <div className="flex md:items-center gap-2 md:gap-4 max-md:flex-col">
                <Link href={'/'}>
                    <h1 className="font-bold text-2xl text-primary">
                        Motivator
                    </h1>
                    <h2 className="hover:text-primary font-semibold text-xl">
                        A Buttery Good Game
                    </h2>
                </Link>
                <div className="flex md:items-center md:ml-14 gap-1 md:gap-8 max-md:flex-col">
                    <Link
                        className="hover:text-primary font-semibold text-md"
                        href={'/payment'}
                    >
                        <h3>Purchase Slot</h3>
                    </Link>
                    <Link
                        className="hover:text-primary font-semibold text-md"
                        href={'/audit'}
                    >
                        <h3>Audit</h3>
                    </Link>
                    <Link
                        className="hover:text-primary font-semibold text-md"
                        href={'/leaderboard'}
                    >
                        <h3>Leaderboard</h3>
                    </Link>
                    <Link
                        className="hover:text-primary font-semibold text-md"
                        href={'https://motivator-docs.buttery.gg'}
                    >
                        <h3>Documentation</h3>
                    </Link>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <ToggleTheme />
                <ConnectButton />
            </div>
        </div>
    )
}

export default NavBar
