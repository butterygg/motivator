import React, { useState } from 'react'
import { Button } from '../ui/button'
import { setGrade } from '../../server/actions/audit/setGrade'
import { cn, formatAddress } from '../../utils/utils'
import { useAccount } from 'wagmi'
import { toast } from 'sonner'

type Props = {
    auditor: string
    grade: string
    assessorSlotID: string
}

const GradeAudit = ({ auditor, grade, assessorSlotID }: Props) => {
    const [localGrade, setLocalGrade] = useState(grade)
    const [localAuditor, setLocalAuditor] = useState(auditor)
    const { address } = useAccount()
    const updateGrade = async (gradeParam: string) => {
        setLocalGrade(gradeParam)
        const response = await setGrade({
            auditorAddr: address as string,
            assessorSlotID: assessorSlotID as string,
            grade: gradeParam,
        })
        if (response.status === 'ko') {
            toast.error(response.message)
        }
        setLocalAuditor(address as string)
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

            {localAuditor && <p>{formatAddress(localAuditor)}</p>}
        </div>
    )
}

export default GradeAudit
