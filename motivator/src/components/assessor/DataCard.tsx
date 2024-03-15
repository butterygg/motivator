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
}

export function DataCard({ title, value }: Props) {
    return (
        <Card className="p-2">
            <CardHeader className="p-2">
                <p className="text-xs text-center">{title}</p>
            </CardHeader>
            <CardContent className="p-2">
                <div className="">
                    <div className="text-center text-xl">
                        <Label className="text-xl" htmlFor="name">
                            {value}
                        </Label>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
