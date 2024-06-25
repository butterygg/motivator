import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/utils'
import { SpokeCheck } from '@/components/ui/check'
import { RoundSpinner } from '@/components/ui/spinner'

type Props = {
    assessorSlotFinded: boolean
    statusTransaction: string
    transactionReceipt: any
    value: number
    isPurchaseReady: boolean
    handleOnClick: () => void
}
export const DisplayPayment = ({
    assessorSlotFinded,
    handleOnClick,
    statusTransaction,
    transactionReceipt,
    value,
    isPurchaseReady,
}: Props) => {
    if (assessorSlotFinded) {
        return (
            <Card className="w-96 items-center p-4 rounded-lg mx-auto">
                <div className=" flex flex-col gap-4 items-center justify-center">
                    <RoundSpinner size="triplexl" />
                    <Label className="font-bold">
                        Motivator slot found, you will be redirected shortly.
                    </Label>
                </div>
            </Card>
        )
    }
    if (statusTransaction === 'pending' || statusTransaction === 'success') {
        return (
            <div className="flex flex-col gap-4 items-center">
                <div className="flex gap-2 items-center">
                    {statusTransaction === 'pending' ? (
                        <>
                            <Label className="font-bold">
                                Awaiting validation
                            </Label>
                            <RoundSpinner size="xl" />
                        </>
                    ) : (
                        <>
                            <Label className="font-bold">
                                Transaction sent
                            </Label>
                            <SpokeCheck color="green" size="xl" />
                        </>
                    )}
                </div>
                <div className="flex gap-2 items-center">
                    {transactionReceipt?.status != 'success' ? (
                        <>
                            <Label className="font-bold">
                                Transaction sent. Waiting for confirmation
                            </Label>
                            <RoundSpinner size="xl" />
                        </>
                    ) : (
                        <>
                            <Label className="font-bold">
                                Transaction confirmed
                            </Label>
                            <SpokeCheck color="green" size="xl" />
                        </>
                    )}
                </div>
                <div className="flex gap-2 items-center">
                    <Label className="font-bold">
                        Redirection incoming ...
                    </Label>
                    <RoundSpinner size="xl" />
                </div>
            </div>
        )
    }
    return (
        <div className="border rounded-md p-4">
            <Label className="font-bold">Purchase Motivator Slot</Label>
            <div className="mt-2 gap-4 items-center flex flex-col">
                <Label className="font-light">
                    To purchase a Motivator slot, pay {value} $SETH
                </Label>
                <Button
                    onClick={handleOnClick}
                    variant={'submit'}
                    className={cn('disabled:cursor-not-allowed', 'w-1/2')}
                    disabled={!isPurchaseReady}
                >
                    Send {value} $SETH
                </Button>
                {statusTransaction === 'error' && (
                    <Label className="text-orange-500">
                        {' '}
                        Transaction Error ... <br />
                        <Label className="text-black">
                            Retry or contact support on Discord
                        </Label>
                    </Label>
                )}
            </div>
        </div>
    )
}
