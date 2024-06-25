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
import { Label } from '../../components/ui/label'

type Props = {
    weekSelected: number
    setWeekSelected: (week: number) => void
    weekAvailableForSelector: number[]
}

export function WeekSelector({
    setWeekSelected,
    weekSelected,
    weekAvailableForSelector,
}: Props) {
    const handleSelect = (value: number) => {
        setWeekSelected(value)
    }
    const buildItems = () => {
        const items: React.JSX.Element[] = []

        weekAvailableForSelector.forEach((element) => {
            items.push(
                <SelectItem
                    key={element}
                    value={element.toString()}
                >{`Week ${element.toString()}`}</SelectItem>
            )
        })
        return items
    }
    return (
        <Select onValueChange={(val) => handleSelect(Number(val))}>
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
