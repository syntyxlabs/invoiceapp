-- Payment Reminders Phase Migration
-- This migration creates tables needed for the payment reminder system

-- Create reminder_settings table for storing business-level reminder preferences
CREATE TABLE IF NOT EXISTS reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES inv_business_profiles(id) ON DELETE CASCADE,
  auto_remind_before_days INTEGER CHECK (auto_remind_before_days IS NULL OR (auto_remind_before_days >= 1 AND auto_remind_before_days <= 30)),
  auto_remind_on_due BOOLEAN DEFAULT false,
  auto_remind_after_days INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(business_profile_id)
);

-- Create payment_reminders table for tracking sent reminders
CREATE TABLE IF NOT EXISTS payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES inv_invoices(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('manual', 'before_due', 'on_due', 'after_due')),
  days_offset INTEGER,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reminder_settings_business_profile ON reminder_settings(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_invoice ON payment_reminders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_status ON payment_reminders(status);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_sent_at ON payment_reminders(sent_at);

-- Enable Row Level Security
ALTER TABLE reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reminder_settings
CREATE POLICY "Users can view their own reminder settings"
  ON reminder_settings FOR SELECT
  USING (
    business_profile_id IN (
      SELECT id FROM inv_business_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own reminder settings"
  ON reminder_settings FOR INSERT
  WITH CHECK (
    business_profile_id IN (
      SELECT id FROM inv_business_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own reminder settings"
  ON reminder_settings FOR UPDATE
  USING (
    business_profile_id IN (
      SELECT id FROM inv_business_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own reminder settings"
  ON reminder_settings FOR DELETE
  USING (
    business_profile_id IN (
      SELECT id FROM inv_business_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for payment_reminders
CREATE POLICY "Users can view their own payment reminders"
  ON payment_reminders FOR SELECT
  USING (
    invoice_id IN (
      SELECT i.id FROM inv_invoices i
      JOIN inv_business_profiles bp ON i.business_profile_id = bp.id
      WHERE bp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own payment reminders"
  ON payment_reminders FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT i.id FROM inv_invoices i
      JOIN inv_business_profiles bp ON i.business_profile_id = bp.id
      WHERE bp.user_id = auth.uid()
    )
  );

-- Service role can do anything (for Edge Functions)
CREATE POLICY "Service role can manage all reminder_settings"
  ON reminder_settings FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all payment_reminders"
  ON payment_reminders FOR ALL
  USING (auth.role() = 'service_role');

-- Add columns to inv_invoices if they don't exist (for customer info)
-- Note: Run these only if columns don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inv_invoices' AND column_name = 'customer_name') THEN
    ALTER TABLE inv_invoices ADD COLUMN customer_name VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inv_invoices' AND column_name = 'customer_emails') THEN
    ALTER TABLE inv_invoices ADD COLUMN customer_emails TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inv_invoices' AND column_name = 'job_address') THEN
    ALTER TABLE inv_invoices ADD COLUMN job_address TEXT;
  END IF;
END $$;
