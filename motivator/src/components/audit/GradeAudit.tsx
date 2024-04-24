import React, { useState } from 'react'
import { Button } from '../ui/button'
import { setGrade } from '../../server/actions/audit/setGrade'
import { cn } from '../../utils/utils'

type Props = {
    auditor: string
    grade: string
}

const GradeAudit = ({ auditor, grade }: Props) => {
    const [localGrade, setLocalGrade] = useState(grade)

    const updateGrade = async (grade: string) => {
        setLocalGrade(grade)
        await setGrade({
            auditorAddr: auditor,
            assessorSlotId: '',
            grade: grade,
        })
    }
    return (
        <div className="border p-2 flex flex-col items-center rounded-xl">
            <h2>Grade</h2>
            <div className="flex gap-2">
                <Button
                    className={cn(localGrade == 'A' && 'bg-green-400/50')}
                    onClick={() => updateGrade('A')}
                    variant={'outline'}
                >
                    A
                </Button>
                <Button
                    className={cn(localGrade == 'B' && 'bg-orange-400/50')}
                    onClick={() => updateGrade('B')}
                    variant={'outline'}
                >
                    B
                </Button>
                <Button
                    className={cn(localGrade == 'C' && 'bg-red-400/50')}
                    onClick={() => updateGrade('C')}
                    variant={'outline'}
                >
                    C
                </Button>
            </div>
            <p>Auditor: {}</p>
        </div>
    )
}

export default GradeAudit
