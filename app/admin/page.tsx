import type { Metadata } from "next";
import { AdminDashboard } from "./admin-dashboard";

export const metadata: Metadata = {
  title: "Guest Ledger — Kayitare & Maranatha",
  description: "Private wedding RSVP administration for Kayitare and Maranatha.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""} />;
}
