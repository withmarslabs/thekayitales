"use client";

import {
  ArrowClockwise,
  ArrowLeft,
  Check,
  DownloadSimple,
  MagnifyingGlass,
  SignOut,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import Script from "next/script";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./admin.module.css";

type Guest = {
  id: string;
  name: string;
  phone: string;
  guestCount: number;
  status: string;
  submittedAt: string;
  notificationSent: boolean;
  notes: string;
  source: string;
};

type Admin = { email: string; name: string; picture: string };
type GoogleCredentialResponse = { credential: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

const TOKEN_KEY = "km-admin-google-credential";
const FILTERS = ["All", "Accepted", "Declined", "Pending"];

function escapeCsv(value: string | number | boolean) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function AdminDashboard({ clientId }: { clientId: string }) {
  const [credential, setCredential] = useState(() => typeof window === "undefined" ? "" : window.sessionStorage.getItem(TOKEN_KEY) ?? "");
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<Guest | null>(null);
  const [draftStatus, setDraftStatus] = useState("Pending");
  const [draftNotes, setDraftNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleError, setGoogleError] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const signOut = useCallback(() => {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.google?.accounts.id.disableAutoSelect();
    setCredential("");
    setAdmin(null);
    setGuests([]);
    setSelected(null);
  }, []);

  const loadGuests = useCallback(async (token: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/.netlify/functions/admin-rsvps", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json() as { admin?: Admin; records?: Guest[]; error?: string };
      if (response.status === 401) {
        signOut();
        throw new Error("Your session expired. Sign in again.");
      }
      if (!response.ok) throw new Error(result.error ?? "Could not load the guest list.");
      setAdmin(result.admin ?? null);
      setGuests(result.records ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load the guest list.");
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  const handleCredential = useCallback((response: GoogleCredentialResponse) => {
    window.sessionStorage.setItem(TOKEN_KEY, response.credential);
    setCredential(response.credential);
  }, []);

  const initializeGoogle = useCallback(() => {
    if (!clientId || !buttonRef.current || !window.google) return;
    window.google.accounts.id.initialize({ client_id: clientId, callback: handleCredential });
    buttonRef.current.replaceChildren();
    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "rectangular",
      text: "signin_with",
      width: 300,
    });
    setGoogleReady(true);
    setGoogleError(false);
  }, [clientId, handleCredential]);

  useEffect(() => {
    if (!credential) return;
    const timer = window.setTimeout(() => void loadGuests(credential), 0);
    return () => window.clearTimeout(timer);
  }, [credential, loadGuests]);

  const visibleGuests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return guests.filter((guest) => {
      const matchesFilter = filter === "All" || guest.status === filter;
      const matchesQuery = !normalizedQuery || `${guest.name} ${guest.phone}`.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, guests, query]);

  const totals = useMemo(() => guests.reduce(
    (result, guest) => ({
      responses: result.responses + 1,
      attending: result.attending + (guest.status === "Accepted" ? 1 : 0),
      guests: result.guests + (guest.status === "Accepted" ? guest.guestCount : 0),
      declined: result.declined + (guest.status === "Declined" ? 1 : 0),
    }),
    { responses: 0, attending: 0, guests: 0, declined: 0 },
  ), [guests]);

  const openGuest = (guest: Guest) => {
    setSelected(guest);
    setDraftStatus(guest.status);
    setDraftNotes(guest.notes);
    setError("");
  };

  const saveGuest = async () => {
    if (!selected || !credential) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/.netlify/functions/admin-rsvps", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${credential}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, status: draftStatus, notes: draftNotes }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not save this RSVP.");
      setGuests((current) => current.map((guest) => guest.id === selected.id
        ? { ...guest, status: draftStatus, notes: draftNotes }
        : guest));
      setSelected(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this RSVP.");
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const rows = [
      ["Guest name", "Phone", "Party size", "Status", "Submitted", "Notification sent", "Notes"],
      ...visibleGuests.map((guest) => [guest.name, guest.phone, guest.guestCount, guest.status, guest.submittedAt, guest.notificationSent, guest.notes]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `kayitare-maranatha-rsvps-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!admin) {
    return <main className={styles.loginShell}>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={initializeGoogle} onReady={initializeGoogle} onError={() => setGoogleError(true)} />
      <Link className={styles.backLink} href="/"><ArrowLeft size={17} /> Return to invitation</Link>
      <section className={styles.loginCard} aria-labelledby="admin-title">
        <div className={styles.monogram}><span>K</span><i /><span>M</span></div>
        <p className={styles.eyebrow}>Private administration</p>
        <h1 id="admin-title">The Guest<br /><em>Ledger</em></h1>
        <p className={styles.loginCopy}>Sign in with the approved Google account to review and manage wedding responses.</p>
        {clientId ? <div ref={buttonRef} className={styles.googleButton} /> : <p className={styles.error}>Google sign-in is not configured.</p>}
        {clientId && !googleReady && !googleError ? <p className={styles.loadingText}>Loading secure Google sign-in…</p> : null}
        {googleError ? <p className={styles.error}>Google sign-in could not load. Check your connection and refresh this page.</p> : null}
        {loading ? <p className={styles.loadingText}>Opening the guest ledger…</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <p className={styles.securityNote}>Access is restricted to the wedding administrators.</p>
      </section>
    </main>;
  }

  return <main className={styles.dashboard}>
    <header className={styles.topbar}>
      <div className={styles.brand}><div className={styles.smallMonogram}>K<span>/</span>M</div><div><p>Kayitare & Maranatha</p><span>Guest administration</span></div></div>
      <div className={styles.adminIdentity}>{admin.picture ? <span className={styles.adminAvatar} style={{ backgroundImage: `url(${admin.picture})` }} aria-hidden="true" /> : null}<div><strong>{admin.name}</strong><span>{admin.email}</span></div><button onClick={signOut} aria-label="Sign out"><SignOut size={20} /></button></div>
    </header>

    <section className={styles.ledgerHeading}>
      <div><p className={styles.eyebrow}>30 January 2027 · Kigali</p><h1>Guest <em>Ledger</em></h1><p>Every response, gathered in one private place.</p></div>
      <div className={styles.headingActions}><button onClick={() => void loadGuests(credential)} disabled={loading}><ArrowClockwise size={18} className={loading ? styles.spinning : ""} /> Refresh</button><button onClick={exportCsv}><DownloadSimple size={18} /> Export CSV</button></div>
    </section>

    <section className={styles.metrics} aria-label="RSVP summary">
      <article><span>Responses</span><strong>{totals.responses}</strong><small>received</small></article>
      <article><span>Attending</span><strong>{totals.attending}</strong><small>confirmed parties</small></article>
      <article><span>Expected guests</span><strong>{totals.guests}</strong><small>seats to prepare</small></article>
      <article><span>Unable to attend</span><strong>{totals.declined}</strong><small>with love from afar</small></article>
    </section>

    <section className={styles.ledger}>
      <div className={styles.toolbar}>
        <label><MagnifyingGlass size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guest or phone" /></label>
        <div className={styles.filters}>{FILTERS.map((item) => <button key={item} className={filter === item ? styles.activeFilter : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
        <p>{visibleGuests.length} {visibleGuests.length === 1 ? "response" : "responses"}</p>
      </div>

      {error ? <p className={styles.tableError} role="alert">{error}</p> : null}
      <div className={styles.tableWrap}>
        <table>
          <thead><tr><th>Guest</th><th>Party</th><th>Status</th><th>Submitted</th><th>Notice</th><th><span className="sr-only">Manage</span></th></tr></thead>
          <tbody>{visibleGuests.map((guest) => <tr key={guest.id}>
            <td><strong>{guest.name || "Unnamed guest"}</strong><a href={`tel:${guest.phone}`}>{guest.phone || "No phone"}</a></td>
            <td><span className={styles.party}><UsersThree size={18} />{guest.guestCount}</span></td>
            <td><span className={`${styles.status} ${styles[`status${guest.status.replaceAll(" ", "")}`] ?? ""}`}>{guest.status}</span></td>
            <td>{formatDate(guest.submittedAt)}</td>
            <td>{guest.notificationSent ? <span className={styles.sent}><Check size={16} /> Sent</span> : <span className={styles.unsent}>Pending</span>}</td>
            <td><button className={styles.manageButton} onClick={() => openGuest(guest)}>Manage</button></td>
          </tr>)}</tbody>
        </table>
        {!loading && visibleGuests.length === 0 ? <div className={styles.empty}><p>No responses match this view.</p><span>Try another status or clear the search.</span></div> : null}
        {loading ? <div className={styles.empty}><p>Refreshing the guest ledger…</p></div> : null}
      </div>
    </section>

    {selected ? <div className={styles.drawerBackdrop} onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
      <aside className={styles.drawer} aria-label={`Manage ${selected.name}`}>
        <button className={styles.closeDrawer} onClick={() => setSelected(null)} aria-label="Close"><X size={22} /></button>
        <p className={styles.eyebrow}>Guest response</p>
        <h2>{selected.name}</h2>
        <a href={`tel:${selected.phone}`}>{selected.phone}</a>
        <dl><div><dt>Party size</dt><dd>{selected.guestCount}</dd></div><div><dt>Submitted</dt><dd>{formatDate(selected.submittedAt)}</dd></div><div><dt>Source</dt><dd>{selected.source}</dd></div></dl>
        <label className={styles.drawerField}><span>RSVP status</span><select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)}><option>Accepted</option><option>Declined</option><option>Pending</option></select></label>
        <label className={styles.drawerField}><span>Private notes</span><textarea value={draftNotes} onChange={(event) => setDraftNotes(event.target.value)} rows={6} placeholder="Add a note for the family…" /></label>
        <button className={styles.saveButton} onClick={() => void saveGuest()} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
      </aside>
    </div> : null}
  </main>;
}
