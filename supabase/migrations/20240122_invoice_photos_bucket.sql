-- Migration: Invoice Photos Storage Bucket
-- Creates storage bucket for invoice photo attachments

-- Create storage bucket for invoice photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoice-photos', 'invoice-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for photos - users can upload to their own folder
CREATE POLICY "Users can upload their own invoice photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoice-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own photos
CREATE POLICY "Users can view their own invoice photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoice-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own photos
CREATE POLICY "Users can update their own invoice photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'invoice-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own photos
CREATE POLICY "Users can delete their own invoice photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoice-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Comment for documentation
COMMENT ON TABLE storage.buckets IS 'invoice-photos bucket stores photo attachments for invoices, organized by user_id/draft_id/';
