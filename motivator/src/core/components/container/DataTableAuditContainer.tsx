'use client'
import React, { useEffect } from 'react'
import { DataTableAuditAssessorSlot } from '@/components/datatables/DataTableAuditAssessorSlot'
import { AssessorSlot } from '@protocols/hyperdrive/types/data/assessorSlot'
import { useAccount } from 'wagmi'
import { RoundSpinner } from '@/components/ui/spinner'
import { AuditAssessorsSlotsDatatable } from '@/components/datatables/DataTableAuditAssessorSlot'
import { useGetAllAssessorSlotsAudit } from '@/hooks/global/useGetAllAssessorSlotsAudit'
import { Grade } from '@/types/enums/grade'
import { Address } from 'viem'
/**
 * Container for the Audit DataTable , it fetches the data and prepare it for the table
 * @returns The DataTableAuditAssessorSlot component
 */
const DataTableAuditContainer = () => {
    const { address, status: statusAccount } = useAccount()
    const { data, error, status, refetch } = useGetAllAssessorSlotsAudit()

    // Refresh the data when the account is connected
    useEffect(() => {
        if (statusAccount === 'connected' && refetch) refetch()
    }, [refetch, statusAccount])

    const prepareDataForTable = (assessorSlots: AssessorSlot[]) => {
        const res: AuditAssessorsSlotsDatatable[] = []
        if (
            assessorSlots === undefined ||
            assessorSlots.length == 0 ||
            assessorSlots == null ||
            assessorSlots.map == null
        ) {
            if (refetch) refetch()
            return []
        }
        assessorSlots.map((assessorSlot, index) => {
            if (assessorSlot == null) return
            const rewardSent =
                assessorSlot.rewards.length > 0
                    ? assessorSlot?.rewards?.reduce((acc, curr) => {
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
                    : {
                          date: new Date(),
                          user_address: '0x0',
                          amount: 0,
                          assessor_slot_id: '0x0',
                          id: '0x0',
                      }

            const auditGrade = assessorSlot.audit?.auditGrade
            const auditAddress = assessorSlot.audit?.auditorAddress
            // Filter the statistics for each pool
            res.push({
                id: index.toString(),
                assessorSlotID: {
                    id: assessorSlot.assessorSlotCore.id,
                    week: assessorSlot.week,
                },
                assessorAddress: assessorSlot.assessorSlotCore.assessorID,
                rewardsSent: rewardSent.amount
                    ? (rewardSent.amount as number)
                    : 0,
                audit: {
                    auditGrade: auditGrade ? (auditGrade as Grade) : undefined,
                    auditorAddress: auditAddress
                        ? (auditAddress as Address)
                        : undefined,
                },
            })
        })

        // sort the array first are the ones without audit
        return res.sort((a) => {
            if (a.audit.auditGrade === undefined) return -1
            return 1
        })
    }

    // Implement Skeletton
    if (status != 'success' || data == undefined || data.length == 0) {
        return (
            <div className="mx-auto">
                <RoundSpinner size="triplexl" />
            </div>
        )
    } else {
        return (
            <DataTableAuditAssessorSlot
                users={prepareDataForTable(data ? data : [])}
            />
        )
    }
}

export default DataTableAuditContainer
