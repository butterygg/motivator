import { getScoreAndAddr } from '@protocols/hyperdrive/server/actions/randomize/getScoreAndAddr'

type Props = {
    protocol: string
}
/**
 * This proxy is use to load the function associated with the specified protocol
 * |ImplementProtocol| When you implement a new protocol
 * just add a new case in the switch statement with the name of the protocol and the new function to acquire Score and Address to Randomize
 * @param param0
 * @returns
 */
export const proxyRandomizeAssessorSlot = ({ protocol }: Props) => {
    switch (protocol) {
        case 'hyperdrive':
            return getScoreAndAddr()

        default:
            return getScoreAndAddr()
    }
}
