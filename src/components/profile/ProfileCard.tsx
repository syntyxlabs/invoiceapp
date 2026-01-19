'use client'

import Link from 'next/link'
import { Building2, Star, CreditCard, FileText } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { formatABN } from '@/lib/validation/abn'
import type { BusinessProfileWithSequence } from '@/types/database'
import { toast } from 'sonner'

interface ProfileCardProps {
  profile: BusinessProfileWithSequence
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const { setDefault, isSettingDefault } = useBusinessProfile()

  const handleSetDefault = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      await setDefault(profile.id)
      toast.success('Default profile updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to set default')
    }
  }

  return (
    <Link href={`/profiles/${profile.id}`}>
      <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base truncate">
                  {profile.trading_name}
                </CardTitle>
                {profile.business_name && (
                  <p className="text-sm text-muted-foreground truncate">
                    {profile.business_name}
                  </p>
                )}
              </div>
            </div>
            {profile.is_default && (
              <Badge variant="secondary" className="shrink-0">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Default
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.abn && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="font-mono">{formatABN(profile.abn)}</span>
              {profile.gst_registered && (
                <Badge variant="outline" className="text-xs">GST</Badge>
              )}
            </div>
          )}

          {(profile.bank_bsb || profile.payid) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4 shrink-0" />
              <span>
                {profile.bank_bsb ? 'Bank details configured' : 'PayID configured'}
              </span>
            </div>
          )}

          {profile.sequence && (
            <div className="rounded bg-muted px-3 py-2">
              <p className="text-xs text-muted-foreground">Next Invoice</p>
              <p className="font-mono font-medium">
                {profile.sequence.prefix}-{String(profile.sequence.next_number).padStart(5, '0')}
              </p>
            </div>
          )}

          {!profile.is_default && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleSetDefault}
              disabled={isSettingDefault}
            >
              {isSettingDefault ? 'Setting...' : 'Set as Default'}
            </Button>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
