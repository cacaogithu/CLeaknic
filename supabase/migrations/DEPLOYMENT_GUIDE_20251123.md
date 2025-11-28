# P0 Security Migration - Deployment Guide

## Overview

This guide walks through deploying the P0 security and GDPR/LGPD compliance migration to your Supabase database.

---

## Pre-Deployment Checklist

- [ ] **Backup your database** before running this migration
- [ ] Ensure Eliana's user account exists in the `auth.users` table
- [ ] Verify you have admin access to Supabase dashboard
- [ ] Review the migration file: `supabase/migrations/20251123_p0_security_compliance.sql`

---

## Deployment Steps

### Option 1: Via Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy Migration SQL**
   - Open `supabase/migrations/20251123_p0_security_compliance.sql`
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Run Migration**
   - Click "Run" button
   - Wait for completion (should take 5-10 seconds)
   - Check for any errors in the output

5. **Verify Success**
   - Run the verification queries below

### Option 2: Via Supabase CLI

```bash
# From project root
cd /Users/rafaelalmeida/EvidenS\ Repository/crm-navigator-ai

# Push migration to remote database
npx supabase db push
```

---

## Post-Deployment Verification

### Step 1: Verify RLS is Enabled

Run this query in the SQL Editor:

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('clientes', 'conversas', 'mensagens', 'appointments', 'followups', 'ai_decision_log')
ORDER BY tablename;
```

**Expected Result**: All tables should have `rowsecurity = true`

### Step 2: Verify Consent Fields Exist

```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'clientes'
  AND column_name IN ('consent_given', 'consent_date', 'consent_type', 'data_retention_until')
ORDER BY column_name;
```

**Expected Result**: 4 rows returned with the consent columns

### Step 3: Verify Audit Log Table Exists

```sql
SELECT count(*) as audit_log_exists
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'audit_log';
```

**Expected Result**: `audit_log_exists = 1`

### Step 4: Verify Existing Clients Have Consent

```sql
SELECT 
  count(*) as total_clients,
  count(*) FILTER (WHERE consent_given = true) as clients_with_consent,
  count(*) FILTER (WHERE consent_date IS NOT NULL) as clients_with_consent_date
FROM clientes;
```

**Expected Result**: All counts should be equal (all existing clients backfilled with consent)

### Step 5: Test Audit Logging

```sql
-- Make a test update
UPDATE clientes 
SET name = name 
WHERE id = (SELECT id FROM clientes LIMIT 1);

-- Check if audit log was created
SELECT 
  table_name,
  action,
  user_role,
  created_at
FROM audit_log
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result**: You should see an UPDATE entry for the clientes table

---

## Critical Post-Deployment Tasks

### 1. Ensure Eliana Has Admin Role

Run this query to check Eliana's role:

```sql
SELECT 
  u.email,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email LIKE '%eliana%' OR p.full_name LIKE '%Eliana%';
```

If Eliana doesn't have a profile or doesn't have admin role, run:

```sql
-- Replace 'eliana-user-id-here' with Eliana's actual user ID from auth.users
INSERT INTO profiles (id, full_name, role)
VALUES ('eliana-user-id-here', 'Eliana', 'admin')
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
```

### 2. Test AI Agent Functionality

Send a test WhatsApp message to verify:
- [ ] AI agent can create new clients
- [ ] AI agent can schedule appointments
- [ ] AI agent can log interests
- [ ] AI agent can transfer to human

**If AI agent fails**: The service role key should bypass RLS automatically. Check Edge Function logs for errors.

### 3. Test Frontend Appointment Creation

1. Log in as Eliana
2. Navigate to Appointments page
3. Create a new appointment
4. Verify it appears in the calendar

**If appointment creation fails**: 
- Check that Eliana's profile has `role = 'admin'` or `role = 'receptionist'`
- Check browser console for RLS policy errors

---

## Troubleshooting

### Error: "new row violates row-level security policy"

**Cause**: User doesn't have admin/receptionist role

**Solution**:
```sql
-- Update user's role
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'user-id-here';
```

### Error: AI agent can't create appointments

**Cause**: Edge Function not using service role key

**Solution**: Verify `_shared/createSupabaseClient.ts` uses `SUPABASE_SERVICE_ROLE_KEY`

### Performance Issues

**Cause**: Audit triggers adding overhead

**Solution**: Temporarily disable audit triggers:
```sql
ALTER TABLE clientes DISABLE TRIGGER audit_clientes;
ALTER TABLE conversas DISABLE TRIGGER audit_conversas;
ALTER TABLE mensagens DISABLE TRIGGER audit_mensagens;
ALTER TABLE appointments DISABLE TRIGGER audit_appointments;
```

---

## Rollback Instructions

If you need to rollback this migration:

```sql
-- Disable RLS
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_decision_log DISABLE ROW LEVEL SECURITY;

-- Drop triggers
DROP TRIGGER IF EXISTS audit_clientes ON public.clientes;
DROP TRIGGER IF EXISTS audit_conversas ON public.conversas;
DROP TRIGGER IF EXISTS audit_mensagens ON public.mensagens;
DROP TRIGGER IF EXISTS audit_appointments ON public.appointments;

-- Drop functions
DROP FUNCTION IF EXISTS public.audit_trigger();
DROP FUNCTION IF EXISTS auth.user_role();
DROP FUNCTION IF EXISTS auth.is_admin();

-- Drop audit table (optional - keeps historical data if not dropped)
-- DROP TABLE IF EXISTS public.audit_log;

-- Remove consent columns (optional - keeps data if not dropped)
-- ALTER TABLE public.clientes 
--   DROP COLUMN consent_given,
--   DROP COLUMN consent_date,
--   DROP COLUMN consent_type,
--   DROP COLUMN data_retention_until;
```

---

## Success Criteria

✅ All verification queries return expected results  
✅ Eliana can create appointments through the frontend  
✅ AI agent can still process WhatsApp messages  
✅ Audit log entries are being created  
✅ No performance degradation observed  

---

## Support

If you encounter any issues during deployment:

1. Check the Supabase logs in the dashboard
2. Review the Edge Function logs for the AI agent
3. Check browser console for frontend errors
4. Use the rollback instructions if needed

**Remember**: The service role key bypasses RLS, so the AI agent should continue working regardless of RLS policies.
