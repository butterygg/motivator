import { getScoreAndAddr } from '@protocols/hyperdrive/server/actions/randomize/getScoreAndAddr'

type Props = {
    protocol: string
}
export const proxyRandomizeAssessorSlot = ({ protocol }: Props) => {
    switch (protocol) {
        case 'hyperdrive':
            return getScoreAndAddr()

        default:
            return getScoreAndAddr()
    }
}
