import * as React from 'react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

type Props = {
    title: string
    value: number | string
    icon?: React.ReactNode
}
/**
 * Component to display a card with a title and a value
 * @param title Title of the card
 * @param value Value to display
 * @param icon Icon to display
 * @returns the DataCard component
 */
export function DataCard({ title, value, icon }: Props) {
    return (
        <Card className="p-2 w-36">
            <CardHeader className="p-2">
                <p className="text-xs text-center">{title}</p>
            </CardHeader>
            <CardContent className="p-2">
                <div className="  flex gap-1 items-center">
                    {icon ? icon : null}
                    <Label className="text-lg mx-auto" htmlFor="name">
                        <p
                            className="
                        overflow-hidden"
                        >
                            {value}
                        </p>
                    </Label>
                </div>
            </CardContent>
        </Card>
    )
}
