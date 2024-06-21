import { minidenticon } from 'minidenticons'
import { useMemo } from 'react'
import Image from 'next/image'
/**
 * Component to generate a minidenticon image from a username
 */
export const MinidenticonImg = ({
    username,
    saturation,
    lightness,
    width,
    height,
    ...props
}: {
    username: string
    saturation: number
    lightness: number
    width: number
    height: number
}) => {
    const svgURI = useMemo(
        () =>
            'data:image/svg+xml;utf8,' +
            encodeURIComponent(minidenticon(username, saturation, lightness)),
        [username, saturation, lightness]
    )
    return (
        <Image
            className="rounded-full dark:bg-slate-300 bg-black"
            src={svgURI}
            alt={username}
            width={width}
            height={height}
            {...props}
        />
    )
}
