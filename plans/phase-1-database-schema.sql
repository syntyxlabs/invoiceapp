-- Phase 1: Database Schema Migration
-- Syntyx Invoices - Foundation
-- Using 'inv_' prefix for all tables to support multi-app database

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE public.inv_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BUSINESS PROFILES
-- ============================================
CREATE TABLE public.inv_business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.inv_users(id) ON DELETE CASCADE,
    trading_name TEXT NOT NULL,
    business_name TEXT,
    abn TEXT, -- Australian Business Number (11 digits)
    address TEXT,
    gst_registered BOOLEAN DEFAULT FALSE,
    default_hourly_rate DECIMAL(10,2),
    bank_bsb TEXT, -- 6 digits
    bank_account TEXT,
    payid TEXT,
    payment_link TEXT, -- External Stripe/Square/PayPal URL
    default_footer_note TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOMERS (CONTACTS)
-- ============================================
CREATE TABLE public.inv_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.inv_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    emails TEXT[], -- Array of email addresses
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICES
-- ============================================
CREATE TABLE public.inv_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.inv_users(id) ON DELETE CASCADE,
    business_profile_id UUID NOT NULL REFERENCES public.inv_business_profiles(id),
    customer_id UUID REFERENCES public.inv_customers(id),

    -- Invoice header
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    job_address TEXT,

    -- Customer info (denormalized for invoice immutability)
    customer_name TEXT NOT NULL,
    customer_emails TEXT[] NOT NULL,

    -- Totals
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    gst_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    gst_enabled BOOLEAN DEFAULT TRUE,

    -- Status workflow: draft -> sent -> overdue/paid/void
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'sent', 'overdue', 'paid', 'void')),

    -- Timestamps
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    voided_at TIMESTAMPTZ,

    -- Notes
    notes TEXT,

    -- AI tracking (for debugging/improvement)
    original_voice_transcript TEXT,
    ai_draft_json JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICE LINE ITEMS
-- ============================================
CREATE TABLE public.inv_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.inv_invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'ea', -- hr, ea, m, m2, m3, kg, l
    unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(10,2) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICE PHOTOS (PROOF OF WORK)
-- ============================================
CREATE TABLE public.inv_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.inv_invoices(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL, -- Supabase Storage path
    filename TEXT,
    mime_type TEXT,
    size_bytes INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENT REMINDERS (v1.5)
-- ============================================
CREATE TABLE public.inv_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.inv_invoices(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('manual', 'before_due', 'on_due', 'after_due')),
    days_offset INTEGER, -- Days before/after due date (negative = before)
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REMINDER SETTINGS (PER BUSINESS PROFILE)
-- ============================================
CREATE TABLE public.inv_reminder_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_profile_id UUID NOT NULL REFERENCES public.inv_business_profiles(id) ON DELETE CASCADE,
    auto_remind_before_days INTEGER, -- NULL = disabled
    auto_remind_on_due BOOLEAN DEFAULT FALSE,
    auto_remind_after_days INTEGER[], -- Array like [7, 14, 30]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_profile_id)
);

-- ============================================
-- INVOICE NUMBER SEQUENCES
-- ============================================
CREATE TABLE public.inv_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_profile_id UUID NOT NULL REFERENCES public.inv_business_profiles(id) ON DELETE CASCADE,
    prefix TEXT DEFAULT 'INV',
    next_number INTEGER DEFAULT 1,
    UNIQUE(business_profile_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_inv_business_profiles_user_id ON public.inv_business_profiles(user_id);
CREATE INDEX idx_inv_customers_user_id ON public.inv_customers(user_id);
CREATE INDEX idx_inv_invoices_user_id ON public.inv_invoices(user_id);
CREATE INDEX idx_inv_invoices_status ON public.inv_invoices(status);
CREATE INDEX idx_inv_invoices_due_date ON public.inv_invoices(due_date);
CREATE INDEX idx_inv_line_items_invoice_id ON public.inv_line_items(invoice_id);
CREATE INDEX idx_inv_photos_invoice_id ON public.inv_photos(invoice_id);
CREATE INDEX idx_inv_reminders_invoice_id ON public.inv_reminders(invoice_id);
CREATE INDEX idx_inv_reminders_status ON public.inv_reminders(status);
CREATE INDEX idx_inv_reminders_scheduled ON public.inv_reminders(scheduled_at) WHERE status = 'pending';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.inv_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_sequences ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Users
CREATE POLICY "inv_users_select_own" ON public.inv_users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "inv_users_update_own" ON public.inv_users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "inv_users_insert_own" ON public.inv_users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Business profiles
CREATE POLICY "inv_business_profiles_crud_own" ON public.inv_business_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Customers
CREATE POLICY "inv_customers_crud_own" ON public.inv_customers
    FOR ALL USING (auth.uid() = user_id);

-- Invoices
CREATE POLICY "inv_invoices_crud_own" ON public.inv_invoices
    FOR ALL USING (auth.uid() = user_id);

-- Line items (through invoice ownership)
CREATE POLICY "inv_line_items_crud_via_invoice" ON public.inv_line_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.inv_invoices
            WHERE inv_invoices.id = inv_line_items.invoice_id
            AND inv_invoices.user_id = auth.uid()
        )
    );

-- Photos (through invoice ownership)
CREATE POLICY "inv_photos_crud_via_invoice" ON public.inv_photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.inv_invoices
            WHERE inv_invoices.id = inv_photos.invoice_id
            AND inv_invoices.user_id = auth.uid()
        )
    );

-- Payment reminders (through invoice ownership)
CREATE POLICY "inv_reminders_crud_via_invoice" ON public.inv_reminders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.inv_invoices
            WHERE inv_invoices.id = inv_reminders.invoice_id
            AND inv_invoices.user_id = auth.uid()
        )
    );

-- Reminder settings (through business profile ownership)
CREATE POLICY "inv_reminder_settings_crud_via_profile" ON public.inv_reminder_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.inv_business_profiles
            WHERE inv_business_profiles.id = inv_reminder_settings.business_profile_id
            AND inv_business_profiles.user_id = auth.uid()
        )
    );

-- Invoice sequences (through business profile ownership)
CREATE POLICY "inv_sequences_crud_via_profile" ON public.inv_sequences
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.inv_business_profiles
            WHERE inv_business_profiles.id = inv_sequences.business_profile_id
            AND inv_business_profiles.user_id = auth.uid()
        )
    );

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('inv-photos', 'inv-photos', false);

INSERT INTO storage.buckets (id, name, public)
VALUES ('inv-pdfs', 'inv-pdfs', false);

-- Storage policies
CREATE POLICY "inv_photos_upload_own" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'inv-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "inv_photos_select_own" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'inv-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "inv_photos_delete_own" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'inv-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "inv_pdfs_upload_own" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'inv-pdfs' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "inv_pdfs_select_own" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'inv-pdfs' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_inv_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.inv_users (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created_inv
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_inv_new_user();

-- Function to get next invoice number
CREATE OR REPLACE FUNCTION public.inv_get_next_invoice_number(profile_id UUID)
RETURNS TEXT AS $$
DECLARE
    seq RECORD;
    next_num INTEGER;
BEGIN
    -- Get or create sequence
    SELECT * INTO seq FROM public.inv_sequences
    WHERE business_profile_id = profile_id;

    IF NOT FOUND THEN
        INSERT INTO public.inv_sequences (business_profile_id, prefix, next_number)
        VALUES (profile_id, 'INV', 1)
        RETURNING * INTO seq;
    END IF;

    next_num := seq.next_number;

    -- Increment sequence
    UPDATE public.inv_sequences
    SET next_number = next_number + 1
    WHERE business_profile_id = profile_id;

    RETURN seq.prefix || '-' || LPAD(next_num::text, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update invoice totals
CREATE OR REPLACE FUNCTION public.inv_update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
    inv_subtotal DECIMAL(10,2);
    inv_gst DECIMAL(10,2);
    inv_gst_enabled BOOLEAN;
BEGIN
    -- Calculate subtotal from line items
    SELECT COALESCE(SUM(line_total), 0) INTO inv_subtotal
    FROM public.inv_line_items
    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);

    -- Get GST setting
    SELECT gst_enabled INTO inv_gst_enabled
    FROM public.inv_invoices
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

    -- Calculate GST (10% in Australia)
    IF inv_gst_enabled THEN
        inv_gst := inv_subtotal * 0.10;
    ELSE
        inv_gst := 0;
    END IF;

    -- Update invoice totals
    UPDATE public.inv_invoices
    SET
        subtotal = inv_subtotal,
        gst_amount = inv_gst,
        total = inv_subtotal + inv_gst,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update totals when line items change
CREATE TRIGGER inv_update_totals_on_line_item_change
    AFTER INSERT OR UPDATE OR DELETE ON public.inv_line_items
    FOR EACH ROW EXECUTE FUNCTION public.inv_update_invoice_totals();

-- Function to auto-update overdue status
CREATE OR REPLACE FUNCTION public.inv_update_overdue_invoices()
RETURNS void AS $$
BEGIN
    UPDATE public.inv_invoices
    SET status = 'overdue', updated_at = NOW()
    WHERE status = 'sent'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
