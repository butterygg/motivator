import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ToggleTheme } from './ToggleTheme'

export const YourApp = () => {
    return
}
type Props = {}

const NavBar = (props: Props) => {
    return (
        <div className="max-md:flex-col w-full p-8 justify-between flex">
            <div>
                <h1 className="font-bold text-2xl">Motivator</h1>
                <h2 className="font-semibold text-xl">A Buttery Good Game</h2>
            </div>
            <div className="flex items-center gap-2">
                <ToggleTheme />
                <ConnectButton />
            </div>
        </div>
    )
}

export default NavBar
