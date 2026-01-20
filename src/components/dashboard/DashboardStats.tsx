'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { FileText, Clock, AlertCircle, CheckCircle } from 'lucide-react'

interface Stats {
  draft: number
  sent: number
  overdue: number
  paid: number
  totalOutstanding: number
  totalPaid: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    draft: 0,
    sent: 0,
    overdue: 0,
    paid: 0,
    totalOutstanding: 0,
    totalPaid: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      const { data: invoices } = await supabase
        .from('inv_invoices')
        .select('status, total')

      if (invoices) {
        const draft = invoices.filter(i => i.status === 'draft').length
        const sent = invoices.filter(i => i.status === 'sent').length
        const overdue = invoices.filter(i => i.status === 'overdue').length
        const paid = invoices.filter(i => i.status === 'paid').length

        const totalOutstanding = invoices
          .filter(i => ['sent', 'overdue'].includes(i.status))
          .reduce((sum, i) => sum + Number(i.total), 0)

        const totalPaid = invoices
          .filter(i => i.status === 'paid')
          .reduce((sum, i) => sum + Number(i.total), 0)

        setStats({ draft, sent, overdue, paid, totalOutstanding, totalPaid })
      }

      setIsLoading(false)
    }

    fetchStats()
  }, [supabase])

  const statCards = [
    {
      label: 'Draft',
      value: stats.draft,
      icon: FileText,
      color: 'text-gray-500'
    },
    {
      label: 'Sent',
      value: stats.sent,
      icon: Clock,
      color: 'text-blue-500'
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: AlertCircle,
      color: 'text-red-500'
    },
    {
      label: 'Paid',
      value: stats.paid,
      icon: CheckCircle,
      color: 'text-green-500'
    }
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-8 w-8 bg-gray-200 rounded mb-2" />
                <div className="h-6 w-12 bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Outstanding Amount */}
      <Card className="col-span-2">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold text-amber-600">
            ${stats.totalOutstanding.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      {/* Paid Amount */}
      <Card className="col-span-2">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Paid (all time)</p>
          <p className="text-2xl font-bold text-green-600">
            ${stats.totalPaid.toFixed(2)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
