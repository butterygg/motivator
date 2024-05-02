import * as React from 'react'

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '../ui/label'

type Props = {
    weekSelected: number
    setWeekSelected: (week: number) => void
}

export function WeekSelector({ setWeekSelected, weekSelected }: Props) {
    const handleSelect = (value: number) => {
        setWeekSelected(value)
    }
    const buildItems = () => {
        const items = []
        for (let i = 1; i <= Number(process.env.NEXT_PUBLIC_WEEK_ACTUAL); i++) {
            items.push(
                <SelectItem
                    key={i}
                    value={i.toString()}
                    onChange={() => handleSelect(i)}
                >{`Week ${i}`}</SelectItem>
            )
        }
        return items
    }
    return (
        <Select>
            <div className="flex flex-col gap-2">
                <Label>Week selected</Label>
                <SelectTrigger className="w-[180px]">
                    <SelectValue
                        defaultValue={weekSelected}
                        placeholder={`Week ${weekSelected}`}
                    />
                </SelectTrigger>
            </div>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Week</SelectLabel>
                    {buildItems()}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
