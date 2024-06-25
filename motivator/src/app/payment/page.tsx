/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import React from 'react'

import PaymentContainer from '@/components/container/PaymentContainer'

const Payment = () => {

    return (
        <section className="mx-auto w-fit p-12">{<PaymentContainer />}</section>
    )
}

export default Payment
