-- Migration: Invoice Enhancements
-- Adds: logo_url to business profiles, customer_abn and prices_include_gst to invoices

-- Add logo_url to business profiles
ALTER TABLE inv_business_profiles
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add customer_abn and prices_include_gst to invoices
ALTER TABLE inv_invoices
ADD COLUMN IF NOT EXISTS customer_abn TEXT,
ADD COLUMN IF NOT EXISTS prices_include_gst BOOLEAN DEFAULT false;

-- Also ensure customer_name and customer_emails exist (may have been added in earlier migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inv_invoices' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE inv_invoices ADD COLUMN customer_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inv_invoices' AND column_name = 'customer_emails'
  ) THEN
    ALTER TABLE inv_invoices ADD COLUMN customer_emails TEXT[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inv_invoices' AND column_name = 'job_address'
  ) THEN
    ALTER TABLE inv_invoices ADD COLUMN job_address TEXT;
  END IF;
END $$;

-- Create storage bucket for business logos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for logos - users can upload their own logos
CREATE POLICY "Users can upload their own logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view all logos (public bucket)
CREATE POLICY "Anyone can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'business-logos');

-- Users can update their own logos
CREATE POLICY "Users can update their own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own logos
CREATE POLICY "Users can delete their own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Comment for documentation
COMMENT ON COLUMN inv_business_profiles.logo_url IS 'URL to business logo in storage';
COMMENT ON COLUMN inv_invoices.customer_abn IS 'Customer ABN for B2B invoices';
COMMENT ON COLUMN inv_invoices.prices_include_gst IS 'Whether line item prices include GST (true) or exclude GST (false)';
