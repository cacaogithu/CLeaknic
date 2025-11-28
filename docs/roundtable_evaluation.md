# Roundtable Evaluation: Google Sheets Double-Sync Issue

**Topic:** Evaluation of the "Double-Sync" and reliability issues in the Google Sheets <-> Supabase integration.
**Date:** 2025-11-23
**Participants:**
- **Winston (System Architect)**
- **Amelia (Lead Developer)**
- **John (Product Manager)**

---

## 1. Problem Statement

**John (PM):** "The client is reporting a 'double-sync' issue. It's not working reliably. When they use the sheet, sometimes they get duplicate appointments, or updates don't stick. We need to fix this immediately as it's a core part of their workflow."

**Amelia (DEV):** "I've looked at the code. We have a two-way sync:
1.  **Sheet -> Supabase:** Triggered by `onEdit` in Apps Script. Sends `date`, `time`, `phone`, etc.
2.  **Supabase -> Sheet:** Triggered by `update-sheets-status` Edge Function. Finds row by `date`, `time`, `phone` and updates status."

## 2. Root Cause Analysis

**Winston (Architect):** "I see the flaw immediately. You are using **mutable fields** (`date`, `time`) as your **primary identifier** (Composite Key).
In distributed systems, this is a classic error.
If the user changes the **Time** of an appointment in the Sheet:
1.  The Apps Script sends the *new* time.
2.  Supabase looks for an appointment with the *new* time.
3.  It finds nothing (because the record in DB has the *old* time).
4.  It creates a **new** appointment.
5.  The old appointment remains in the DB (orphan).
**Result:** Double appointments (Double-Sync)."

**Amelia (DEV):** "That explains the duplication. And it explains the sync-back failure too. If the AI updates the status of the *old* appointment in Supabase, the `update-sheets-status` function tries to find a row in the Sheet with the *old* time. But the user already changed the row to the *new* time. So the lookup fails, and the status never updates in the Sheet."

**John (PM):** "So if they move a patient from 10:00 to 11:00, the system thinks it's a new patient at 11:00 and leaves a ghost at 10:00?"

**Winston (Architect):** "Precisely. We lack **Identity Persistence**."

## 3. Proposed Solution: The Stable ID

**Winston (Architect):** "We must introduce an immutable identifier that persists across mutations of business data.
1.  **Supabase ID in Sheet:** We need to store the Supabase `appointment_id` (UUID) in the Sheet.
2.  **Hidden Column:** Use a hidden column (e.g., Column I) to store this ID.
3.  **Idempotent Updates:**
    - When `onEdit` fires, send the `appointment_id` (if it exists).
    - Supabase checks: Does this ID exist?
        - **Yes:** Update *that* record (even if date/time changed).
        - **No:** Create new record and return the new ID.
    - Apps Script writes the new ID back to the hidden column."

**Amelia (DEV):** "I can implement that.
- **Apps Script:** Add `ID_COL = 9` (Column I). Read/Write this ID.
- **Edge Function (`receive-sheets-update`):** Accept `appointmentId`. If provided, update by ID. If not, create and return ID.
- **Edge Function (`update-sheets-status`):** We should also try to use ID to find the row if possible, but searching the whole sheet for an ID might be slow? Or we can just stick to `date/time/phone` for sync-back *if* we assume the sheet is the source of truth for time changes.
Actually, if we store the ID in the sheet, `update-sheets-status` can search for that ID column to find the row. It's safer."

**Winston (Architect):** "Searching by ID in the sheet is O(N), but for a daily sheet (assuming 100-200 rows), it's negligible. Reliability > Micro-optimization here."

## 4. Implementation Plan

**John (PM):** "Okay, what's the plan? We need this fixed now."

**Amelia (DEV):**
1.  **Modify Apps Script:**
    - Add `ID_COL` to config.
    - Include `appointmentId` in the payload sent to Supabase.
    - Handle the response: If `appointmentId` is returned, write it to `ID_COL`.
2.  **Modify `receive-sheets-update`:**
    - Check for `appointmentId` in payload.
    - If present, update that specific appointment.
    - If not, create new and return the ID.
3.  **Modify `update-sheets-status` (Optional but recommended):**
    - Allow finding row by ID if available, otherwise fallback to `date/time/phone`.

**Winston (Architect):** "Approved. This will ensure strong consistency between the Sheet and the Database."

---
**Status:** Ready for Implementation.
