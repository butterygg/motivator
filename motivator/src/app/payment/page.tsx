'use client'
import React from 'react'
import { Label } from '../../components/ui/label'
import { Button } from '../../components/ui/button'

type Props = {}

const Payment = (props: Props) => {
    const value = 0.1
    return (
        <section className="lg-max:w-fit mx-auto lg:w-fit p-8">
            <div className="rounded-md border">
                <h2>Payment</h2>
                <Label>
                    To enable assessor slots, you need to pay ${value} $SETH
                </Label>
                <Button>Send ${value} $SETH</Button>
            </div>
        </section>
    )
}

export default Payment
