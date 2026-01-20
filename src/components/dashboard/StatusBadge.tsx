import { cn } from '@/lib/utils'

type Status = 'draft' | 'sent' | 'overdue' | 'paid' | 'void'

interface StatusBadgeProps {
  status: Status
  className?: string
}

const STATUS_STYLES: Record<Status, { bg: string; text: string; label: string }> = {
  draft: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    label: 'Draft'
  },
  sent: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: 'Sent'
  },
  overdue: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'Overdue'
  },
  paid: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Paid'
  },
  void: {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    label: 'Void'
  }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status] || STATUS_STYLES.draft

  return (
    <span
      data-testid="status-badge"
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        styles.bg,
        styles.text,
        className
      )}
    >
      {styles.label}
    </span>
  )
}
