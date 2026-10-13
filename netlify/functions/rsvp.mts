import type { Config } from "@netlify/functions";
import Airtable from "airtable";

const BASE_ID = "appRN9fznyqtKQJjY";
const TABLE_ID = "tblteSLT5C4H2m8wl";
const ALLOWED_ATTENDANCE = new Set(["Attending", "Not attending"]);

type RsvpPayload = {
  fullName?: unknown;
  phone?: unknown;
  attendance?: unknown;
  guestCount?: unknown;
  company?: unknown;
};

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

const handler = async (request: Request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return json({ error: "Expected JSON" }, 415);

  let payload: RsvpPayload;
  try {
    payload = await request.json() as RsvpPayload;
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  if (typeof payload.company === "string" && payload.company.trim()) {
    return json({ ok: true });
  }

  const fullName = typeof payload.fullName === "string" ? payload.fullName.trim() : "";
  const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
  const attendance = typeof payload.attendance === "string" ? payload.attendance : "";
  const parsedGuestCount = Number(payload.guestCount);
  const guestCount = attendance === "Attending" ? parsedGuestCount : 0;

  if (fullName.length < 2 || fullName.length > 120) return json({ error: "Please enter your full name." }, 400);
  if (!/^\+?[0-9 ()-]{7,24}$/.test(phone)) return json({ error: "Please enter a valid phone number." }, 400);
  if (!ALLOWED_ATTENDANCE.has(attendance)) return json({ error: "Please choose whether you will attend." }, 400);
  if (!Number.isInteger(guestCount) || guestCount < 0 || guestCount > 8) return json({ error: "Please select a valid party size." }, 400);

  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  if (!token) {
    console.error("AIRTABLE_PERSONAL_ACCESS_TOKEN is not configured");
    return json({ error: "RSVP service is not configured yet." }, 503);
  }

  try {
    const base = new Airtable({ apiKey: token }).base(BASE_ID);
    const records = await base(TABLE_ID).create([
      {
        fields: {
          "Guest Name": fullName,
          "Phone Number": phone,
          "Number of Guests in Party": guestCount,
          "RSVP Status": attendance === "Attending" ? "Accepted" : "Declined",
        },
      },
    ], { typecast: false });

    return json({ ok: true, submissionId: records[0]?.id });
  } catch (error) {
    console.error("Airtable RSVP submission failed", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "We could not save your response. Please try again." }, 502);
  }
};

export default handler;

export const config: Config = {
  path: "/api/rsvp",
};
