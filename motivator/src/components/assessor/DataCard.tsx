import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
    title: string
    value: number | string
    icon?: React.ReactNode
}

export function DataCard({ title, value, icon }: Props) {
    return (
        <Card className="p-2 w-28">
            <CardHeader className="p-2">
                <p className="text-xs text-center">{title}</p>
            </CardHeader>
            <CardContent className="p-2">
                <div className=" text-xl flex items-center">
                    {icon ? icon : null}
                    <Label className="text-xl mx-auto" htmlFor="name">
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
