import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Get current user to ensure authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get today's date in ISO format (date only)
    const today = new Date().toISOString().split('T')[0]

    // Update all sent invoices that are past due date to overdue
    const { data, error } = await supabase
      .from('inv_invoices')
      .update({
        status: 'overdue',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'sent')
      .lt('due_date', today)
      .eq('user_id', user.id)
      .select('id')

    if (error) {
      console.error('Update overdue error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      updated: data?.length || 0
    })

  } catch (error) {
    console.error('Update overdue error:', error)
    return NextResponse.json(
      { error: 'Failed to update overdue invoices' },
      { status: 500 }
    )
  }
}
