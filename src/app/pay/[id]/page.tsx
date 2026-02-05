import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { PaymentDetails } from './PaymentDetails'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PaymentPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createServiceClient()

  // Fetch invoice with business profile (using service role to bypass RLS)
  const { data: invoice, error } = await supabase
    .from('inv_invoices')
    .select(`
      id,
      invoice_number,
      total,
      due_date,
      customer_name,
      status,
      inv_business_profiles (
        trading_name,
        bank_bsb,
        bank_account,
        payid,
        payment_link,
        logo_url
      )
    `)
    .eq('id', id)
    .single()

  if (error || !invoice) {
    notFound()
  }

  // Type assertion for the business profile
  const businessProfile = invoice.inv_business_profiles as {
    trading_name: string
    bank_bsb: string | null
    bank_account: string | null
    payid: string | null
    payment_link: string | null
    logo_url: string | null
  } | null

  return (
    <PaymentDetails
      invoice={{
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        total: invoice.total,
        due_date: invoice.due_date,
        customer_name: invoice.customer_name,
        status: invoice.status,
      }}
      businessProfile={businessProfile}
    />
  )
}
