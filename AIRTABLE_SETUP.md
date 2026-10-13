# Wedding RSVP administration

The public RSVP form sends validated submissions to a Netlify Function at `/api/rsvp`. The function stores each response in the private Airtable base instead of exposing Airtable credentials in browser code.

## Airtable resources

- Base: `Wedding Reservations`
- Base ID: `appRN9fznyqtKQJjY`
- Table: `Wedding RSVPs`
- Table ID: `tblteSLT5C4H2m8wl`
- Admin view: [Wedding RSVPs](https://airtable.com/appRN9fznyqtKQJjY/tblteSLT5C4H2m8wl/viwc1r4R2cjk8tMPF?blocks=show)

The admin view uses Airtable authentication, including Google sign-in when it is enabled on the Airtable account. It contains the guest name, phone number, party size, RSVP status, submission time, notification state, notes, and submission source. It can be filtered by status and totals the guest count.

## Netlify environment variable

Create an Airtable personal access token with `data.records:write` access scoped only to this base. In Netlify, add it under **Project configuration → Environment variables**:

```text
AIRTABLE_PERSONAL_ACCESS_TOKEN=pat_...
```

The variable must be available to Functions. Redeploy after adding it.

## Email notification automation

Create or enable an Airtable automation with:

1. Trigger: **When record created** in `Wedding RSVPs`.
2. Action: **Send email** to `marscompanyltd2025@gmail.com`.
3. Subject: `New wedding RSVP — {Guest Name}`.
4. Include `{RSVP Status}`, `{Number of Guests in Party}`, `{Phone Number}`, and `{RSVP Submission Time}` in the message.
