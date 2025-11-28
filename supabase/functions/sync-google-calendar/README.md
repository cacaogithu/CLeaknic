# Sync Google Calendar Edge Function

This Edge Function (`sync-google-calendar`) synchronizes appointments from Supabase to a Google Calendar using a **Service Account**.

## 📋 What you need

1. **Google Cloud project** with the **Google Calendar API** enabled.
2. **Service Account** (the same one you already use for Google Sheets) with the following:
   - The JSON key stored in Supabase environment variables:
     - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
     - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
   - **Calendar permissions** – share the target calendar with the service‑account e‑mail as **Editor** (or Manager).  This is the step you already performed.
3. **Calendar ID** – the e‑mail address of the calendar you want to write to.  In your case it is:
   ```
   gabrielcortez.tm@gmail.com
   ```
   Set this value in Supabase as `GOOGLE_CALENDAR_ID`.
4. (Optional) Public URL / embed code / iCal links – you can keep those in your documentation for reference; they are not required by the function.

## 🔧 Environment variables (Supabase)
| Variable | Description |
|----------|-------------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service‑account e‑mail (e.g. `my‑svc‑account@my‑project.iam.gserviceaccount.com`). |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Private key from the JSON key file – store it as a single‑line string, escaping new‑lines as `\n`. |
| `GOOGLE_CALENDAR_ID` | **Calendar ID** where events will be created. Use the value you gave: `gabrielcortez.tm@gmail.com`. |

## 🚀 Deploying the function
```bash
# From the project root
supabase functions deploy sync-google-calendar
```
The function will be available at:
```
https://<YOUR_PROJECT>.supabase.co/functions/v1/sync-google-calendar
```

## 📦 How it works (high‑level)
1. The function receives a JSON payload:
   ```json
   { "action": "create"|"update"|"delete", "appointment": { … } }
   ```
2. It builds a JWT using the service‑account credentials and the `https://www.googleapis.com/auth/calendar` scope.
3. Depending on the action it calls the Google Calendar API (`events.insert`, `events.update`, `events.delete`).
4. On success it returns the `google_event_id` so you can store it in the `appointments` table for later updates or deletions.

## 🛠️ Adding the `google_event_id` column (if not present)
If you haven’t already, add a column to the `appointments` table to keep the Calendar event ID:
```sql
ALTER TABLE public.appointments ADD COLUMN google_event_id text;
```

## 📚 References
- [Google Calendar API – Events](https://developers.google.com/calendar/api/v3/reference/events)
- [Service Account authentication (JWT)](https://developers.google.com/identity/protocols/oauth2/service-account)
- [Supabase Edge Functions docs](https://supabase.com/docs/guides/functions)

---
*This README was generated automatically to help you integrate the Google Calendar agenda you provided.*
