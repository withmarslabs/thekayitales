# Wedding RSVP administration

The public RSVP form sends validated submissions to a Netlify Function at `/api/rsvp`. The function stores each response in the private Airtable base instead of exposing Airtable credentials in browser code.

## Airtable resources

- Base: `Kayitare & Maranatha Wedding`
- Base ID: `apphwhrze9XfqmJSG`
- Table: `RSVP Responses`
- Table ID: `tblEjBgMb7zr1FRnT`
- Admin interface: [Wedding RSVP Admin](https://airtable.com/apphwhrze9XfqmJSG/pagbHjLSdfBbBlnpL)

The admin interface uses Airtable authentication, including Google sign-in when it is enabled on the Airtable account. It contains the guest name, phone number, attendance status, guest count, submission time, and source. It can be filtered by attendance and totals the guest count.

## Netlify environment variable

Create an Airtable personal access token with `data.records:write` access scoped only to this base. In Netlify, add it under **Project configuration → Environment variables**:

```text
AIRTABLE_PERSONAL_ACCESS_TOKEN=pat_...
```

The variable must be available to Functions. Redeploy after adding it.

## Email notification automation

Create or enable an Airtable automation with:

1. Trigger: **When record created** in `RSVP Responses`.
2. Action: **Send email** to the wedding administrator.
3. Subject: `New wedding RSVP — {Guest Name}`.
4. Include `{Attendance}`, `{Guest Count}`, `{Phone}`, and `{Submitted At}` in the message.

The email address is intentionally not stored in the public repository.
