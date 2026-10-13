import type { Config } from "@netlify/functions";
import Airtable from "airtable";
import { OAuth2Client } from "google-auth-library";

const BASE_ID = "appRN9fznyqtKQJjY";
const TABLE_ID = "tblteSLT5C4H2m8wl";
const DEFAULT_ADMIN_EMAIL = "marscompanyltd2025@gmail.com";
const VALID_STATUSES = new Set(["Accepted", "Declined", "Pending"]);

type UpdatePayload = {
  id?: unknown;
  status?: unknown;
  notes?: unknown;
};

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function getAllowedAdmins() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? DEFAULT_ADMIN_EMAIL)
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function authenticate(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const credential = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!credential || !clientId) return null;

  try {
    const ticket = await new OAuth2Client(clientId).verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    const email = payload?.email?.toLowerCase();
    if (!email || !payload?.email_verified || !getAllowedAdmins().has(email)) return null;
    return { email, name: payload.name ?? email, picture: payload.picture ?? "" };
  } catch {
    return null;
  }
}

const handler = async (request: Request) => {
  if (request.method !== "GET" && request.method !== "PATCH") {
    return json({ error: "Method not allowed" }, 405);
  }

  const admin = await authenticate(request);
  if (!admin) return json({ error: "Authentication required" }, 401);

  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  if (!token) return json({ error: "Airtable is not configured" }, 503);

  const table = new Airtable({ apiKey: token }).base(BASE_ID)(TABLE_ID);

  try {
    if (request.method === "PATCH") {
      const payload = await request.json() as UpdatePayload;
      const id = typeof payload.id === "string" ? payload.id : "";
      const status = typeof payload.status === "string" ? payload.status : "";
      const notes = typeof payload.notes === "string" ? payload.notes.trim().slice(0, 2_000) : "";

      if (!/^rec[A-Za-z0-9]{14}$/.test(id) || !VALID_STATUSES.has(status)) {
        return json({ error: "Invalid RSVP update" }, 400);
      }

      const record = await table.update(id, {
        "RSVP Status": status,
        Notes: notes,
      });

      return json({ ok: true, id: record.id });
    }

    const records = await table.select({
      fields: [
        "Guest Name",
        "Phone Number",
        "Number of Guests in Party",
        "RSVP Status",
        "RSVP Submission Time",
        "Notification Sent",
        "Notes",
        "RSVP Status Source",
      ],
      sort: [{ field: "RSVP Submission Time", direction: "desc" }],
      pageSize: 100,
      maxRecords: 500,
    }).all();

    return json({
      admin,
      records: records.map((record) => ({
        id: record.id,
        name: String(record.get("Guest Name") ?? ""),
        phone: String(record.get("Phone Number") ?? ""),
        guestCount: Number(record.get("Number of Guests in Party") ?? 0),
        status: String(record.get("RSVP Status") ?? "Pending"),
        submittedAt: String(record.get("RSVP Submission Time") ?? ""),
        notificationSent: Boolean(record.get("Notification Sent")),
        notes: String(record.get("Notes") ?? ""),
        source: String(record.get("RSVP Status Source") ?? "Wedding website"),
      })),
    });
  } catch (error) {
    console.error("Admin RSVP request failed", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Could not load the guest list" }, 502);
  }
};

export default handler;

export const config: Config = {
  path: "/api/admin/rsvps",
};
