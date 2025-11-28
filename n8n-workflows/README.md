# Hybrid N8n Workflow for Google Sheets Sync

This workflow combines the best features from both approaches:
- ✅ **Conflict detection** from the original workflow
- ✅ **Matrix cell mapping** for visual calendar layout
- ✅ **Supabase integration** for complete appointment data
- ✅ **Dynamic formatting** with status colors and doctor info

## Setup Instructions

### 1. Import Workflow to N8n
1. Open your n8n instance
2. Click **"Add workflow"** → **"Import from File"**
3. Select `hybrid-sheets-sync.json`

### 2. Configure Credentials

#### Supabase API Key
1. In n8n, go to **Credentials** → **Create New**
2. Choose **"HTTP Header Auth"**
3. Name it `Supabase API Key`
4. Add header:
   - **Name**: `apikey`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbGdxcG5vZHpiZWh1ZmxuYnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODQxNDAsImV4cCI6MjA3ODM2MDE0MH0.qR2s-8Wi3RN-f-bd0WD5722YossgHbH-HZ645kVBz7c`
5. Add another header:
   - **Name**: `Authorization`
   - **Value**: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbGdxcG5vZHpiZWh1ZmxuYnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODQxNDAsImV4cCI6MjA3ODM2MDE0MH0.qR2s-8Wi3RN-f-bd0WD5722YossgHbH-HZ645kVBz7c`

#### Google Sheets
1. Create **Google Service Account** credentials
2. Share your spreadsheet with the service account email

### 3. Update Spreadsheet ID
In the workflow nodes, replace the spreadsheet ID `1OP5bmnODHC30Y5CLM1a3c62dqHOreN0Rp5fJ8lu6GMA` with your actual spreadsheet ID.

### 4. Get Webhook URL
1. Activate the workflow
2. Click on **"Webhook Trigger"** node
3. Copy the **Production URL**
4. Use this URL in your Supabase trigger or edge function

## How It Works

```mermaid
graph LR
    A[Webhook Trigger] --> B[Extract Appointment ID]
    B --> C[Fetch from Supabase]
    C --> D[Format for Matrix]
    D --> E[Read Current Cell]
    E --> F{Slot Available?}
    F -->|Yes| G[Update Matrix Cell]
    F -->|No| H[Respond Conflict]
    G --> I[Respond Success]
```

### Data Flow

1. **Webhook receives** appointment event (from Supabase trigger or edge function)
2. **Fetches complete data** from Supabase (client, doctor, appointment)
3. **Calculates cell position**:
   - Row = time slot (13:00 = row 3, 13:30 = row 4, etc.)
   - Column = day of month (day 1 = column B, day 2 = column C, etc.)
4. **Checks for conflicts** by reading current cell value
5. **Updates cell** with formatted data and status color if available
6. **Returns response** with success or conflict information

## Calendar Layout

```
         B        C        D        E     ...
    ┌─────────┬─────────┬─────────┬─────────┐
  3 │ 13:00   │         │         │         │
  4 │ 13:30   │         │         │         │
  5 │ 14:00   │ Cliente │         │         │
  6 │ 14:30   │ Proc.   │         │         │
    └─────────┴─────────┴─────────┴─────────┘
```

## Status Colors

- 🟢 **Confirmado**: Light green
- 🟡 **Pendente**: Light yellow  
- 🔴 **Cancelado**: Light red
- 🔵 **Concluído**: Light blue

## Webhook Payload

Send POST request to webhook URL:

```json
{
  "appointment_id": 123,
  "record": {
    "id": 123
  }
}
```

Or trigger from Supabase database trigger on `appointments` table.

## Conflict Handling

If a time slot is already occupied:
- ❌ Returns `success: false`
- 📝 Includes conflict details:
  - Current occupant
  - Cell address
  - Time and date

## Testing

Use the webhook URL with a test payload:

```bash
curl -X POST https://your-n8n-instance.com/webhook/sync-appointment \\
  -H "Content-Type: application/json" \\
  -d '{"appointment_id": 123}'
```

## Troubleshooting

### Issue: "Appointment not found in Supabase"
- Check that appointment ID exists
- Verify Supabase credentials

### Issue: "Sheet not found"
- Ensure sheet name matches format: `JANEIRO/2025`
- Create sheets for each month

### Issue: Cell not updating
- Verify spreadsheet ID is correct
- Check service account has edit permissions
- Ensure sheet structure matches (column A = time labels, columns B+ = days)

## Integration with Edge Function

Update your `sync-to-n8n` edge function to call this workflow:

```typescript
const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');

await fetch(n8nWebhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ appointment_id: record.id })
});
```
