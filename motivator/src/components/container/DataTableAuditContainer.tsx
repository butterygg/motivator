'use client'
import React, { useEffect } from 'react'
import { DataTableAuditAssessorSlot } from '@/components/audit/DataTableAuditAssessorSlot'
import { AssessorSlot } from '@/types/data/assessorSlot'
import { useAccount } from 'wagmi'
import { RoundSpinner } from '@/components/ui/spinner'
import { useRouter } from 'next/navigation'
import { AuditAssessorsSlotsDatatable } from '@/components/audit/DataTableAuditAssessorSlot'
import { useGetAllAssessorSlotsAudit } from '@/hooks/global/useGetAllAssessorSlotsAudit'
const DataTableAuditContainer = () => {
    const prepareDataForTable = (assessorSlots: AssessorSlot[]) => {
        const res: AuditAssessorsSlotsDatatable[] = []
        assessorSlots.forEach((assessorSlot, index) => {
            const rewardSent = assessorSlot.rewards.reduce((acc, curr) => {
                return {
                    date: curr.date,
                    user_address: curr.user_address,
                    amount:
                        (acc?.amount ? acc.amount : 0) +
                        (curr?.amount ? curr.amount : 0),
                    assessor_slot_id: curr.assessor_slot_id,
                    id: curr.id,
                }
            })

            const auditGrade = assessorSlot.audit?.auditGrade
            const auditAddress = assessorSlot.audit?.auditorAddress
            // Filter the statistics for each pool
            res.push({
                id: index.toString(),
                assessorSlotID: assessorSlot.id,
                assessorAddress: assessorSlot.assessorID,
                rewardsSent: rewardSent.amount as number,
                audit: {
                    auditGrade: auditGrade ? auditGrade : undefined,
                    auditorAddress: auditAddress ? auditAddress : undefined,
                },
            })
        })

        // sort the array first are the ones without audit
        return res.sort((a) => {
            if (a.audit.auditGrade === undefined) return -1
            return 1
        })
    }

    const { address, status: statusAccount } = useAccount()
    const { data, error, status, refetch } = useGetAllAssessorSlotsAudit()

    const { push } = useRouter()
    // Refresh the data when the account is connected
    useEffect(() => {
        if (statusAccount === 'connected' && refetch) refetch()
    }, [refetch, statusAccount])

    // // Redirecting to avoid error
    // useEffect(() => {
    //     if (data === undefined) {
    //         push(`/`)
    //     }
    // }, [data])

    // Implement Skeletton
    if (status != 'success' || data === undefined) {
        return (
            <div className="mx-auto">
                <RoundSpinner size="triplexl" />
            </div>
        )
    }

    return <DataTableAuditAssessorSlot users={prepareDataForTable(data)} />
}

export default DataTableAuditContainer
