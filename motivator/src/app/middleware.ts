import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { useAccount } from 'wagmi'

import { getAccount } from '@wagmi/core'
import { config as ConfigWeb3 } from '@/utils/Web3Provider'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    // const account = getAccount(ConfigWeb3)
    // if (account.address) {
    //     return NextResponse.next()
    // }
    return NextResponse.redirect(new URL('/signup', request.url))
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: '/assessor/*',
}

export { default } from 'next-auth/middleware'
