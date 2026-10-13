"use client";

import {
  ArrowClockwise, ArrowLeft, Bell, CalendarDots, Check, CheckCircle, Clock,
  DownloadSimple, House, ListBullets, MagnifyingGlass, NotePencil,
  SidebarSimple, SignOut, UsersThree, X, XCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./admin.module.css";

type RsvpStatus = "Accepted" | "Declined" | "Pending";
type View = "All" | RsvpStatus | "Follow-up";
type Guest = { id: string; name: string; phone: string; guestCount: number; status: RsvpStatus; submittedAt: string; notificationSent: boolean; notes: string; source: string };
type Admin = { email: string; name: string; picture: string };
type GoogleCredentialResponse = { credential: string };

declare global { interface Window { google?: { accounts: { id: { initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void; renderButton: (element: HTMLElement, options: Record<string, unknown>) => void; disableAutoSelect: () => void } } } } }

const TOKEN_KEY = "km-admin-google-credential";
const STATUS_OPTIONS: RsvpStatus[] = ["Accepted", "Declined", "Pending"];

function normalizeStatus(value: string): RsvpStatus {
  const status = value.trim().toLowerCase();
  if (["accepted", "attending", "yes", "confirmed"].includes(status)) return "Accepted";
  if (["declined", "not attending", "no", "unable to attend"].includes(status)) return "Declined";
  return "Pending";
}
function escapeCsv(value: string | number | boolean) { return `"${String(value).replaceAll('"', '""')}"`; }
function formatDate(value: string) { return value ? new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not recorded"; }
function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "G"; }

export function AdminDashboard({ clientId }: { clientId: string }) {
  const [credential, setCredential] = useState(() => typeof window === "undefined" ? "" : window.sessionStorage.getItem(TOKEN_KEY) ?? "");
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("All");
  const [selected, setSelected] = useState<Guest | null>(null);
  const [draftStatus, setDraftStatus] = useState<RsvpStatus>("Pending");
  const [draftNotes, setDraftNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleError, setGoogleError] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const signOut = useCallback(() => {
    window.sessionStorage.removeItem(TOKEN_KEY); window.google?.accounts.id.disableAutoSelect();
    setCredential(""); setAdmin(null); setGuests([]); setSelected(null);
  }, []);

  const loadGuests = useCallback(async (token: string) => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/.netlify/functions/admin-rsvps", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const result = await response.json() as { admin?: Admin; records?: Array<Omit<Guest, "status"> & { status: string }>; error?: string };
      if (response.status === 401) { signOut(); throw new Error("Your session expired. Sign in again."); }
      if (!response.ok) throw new Error(result.error ?? "Could not load the guest list.");
      setAdmin(result.admin ?? null);
      setGuests((result.records ?? []).map((guest) => ({ ...guest, status: normalizeStatus(guest.status) })));
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Could not load the guest list."); }
    finally { setLoading(false); }
  }, [signOut]);

  const handleCredential = useCallback((response: GoogleCredentialResponse) => { window.sessionStorage.setItem(TOKEN_KEY, response.credential); setCredential(response.credential); }, []);
  const initializeGoogle = useCallback(() => {
    if (!clientId || !buttonRef.current || !window.google) return;
    window.google.accounts.id.initialize({ client_id: clientId, callback: handleCredential });
    buttonRef.current.replaceChildren();
    window.google.accounts.id.renderButton(buttonRef.current, { type: "standard", theme: "outline", size: "large", shape: "rectangular", text: "signin_with", width: 300 });
    setGoogleReady(true); setGoogleError(false);
  }, [clientId, handleCredential]);
  useEffect(() => { if (!credential) return; const timer = window.setTimeout(() => void loadGuests(credential), 0); return () => window.clearTimeout(timer); }, [credential, loadGuests]);

  const totals = useMemo(() => guests.reduce((result, guest) => ({
    responses: result.responses + 1,
    attending: result.attending + (guest.status === "Accepted" ? 1 : 0),
    guests: result.guests + (guest.status === "Accepted" ? guest.guestCount : 0),
    declined: result.declined + (guest.status === "Declined" ? 1 : 0),
    pending: result.pending + (guest.status === "Pending" ? 1 : 0),
    followUp: result.followUp + (!guest.notificationSent ? 1 : 0),
  }), { responses: 0, attending: 0, guests: 0, declined: 0, pending: 0, followUp: 0 }), [guests]);

  const visibleGuests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return guests.filter((guest) => {
      const matchesView = view === "All" || (view === "Follow-up" ? !guest.notificationSent : guest.status === view);
      const matchesQuery = !normalizedQuery || `${guest.name} ${guest.phone} ${guest.source} ${guest.notes}`.toLowerCase().includes(normalizedQuery);
      return matchesView && matchesQuery;
    });
  }, [guests, query, view]);

  const navItems = [
    { label: "Overview", value: "All" as View, icon: House, count: totals.responses },
    { label: "Attending", value: "Accepted" as View, icon: CheckCircle, count: totals.attending },
    { label: "Declined", value: "Declined" as View, icon: XCircle, count: totals.declined },
    { label: "Awaiting reply", value: "Pending" as View, icon: Clock, count: totals.pending },
    { label: "Email follow-up", value: "Follow-up" as View, icon: Bell, count: totals.followUp },
  ];

  const openGuest = (guest: Guest) => { setSelected(guest); setDraftStatus(guest.status); setDraftNotes(guest.notes); setError(""); };
  const saveGuest = async () => {
    if (!selected || !credential) return; setSaving(true); setError("");
    try {
      const response = await fetch("/.netlify/functions/admin-rsvps", { method: "PATCH", headers: { Authorization: `Bearer ${credential}`, "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, status: draftStatus, notes: draftNotes }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not save this RSVP.");
      setGuests((current) => current.map((guest) => guest.id === selected.id ? { ...guest, status: draftStatus, notes: draftNotes } : guest)); setSelected(null);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Could not save this RSVP."); }
    finally { setSaving(false); }
  };
  const exportCsv = () => {
    const rows = [["Guest name", "Phone", "Party size", "RSVP status", "Submitted", "Email notice", "Source", "Notes"], ...visibleGuests.map((guest) => [guest.name, guest.phone, guest.guestCount, guest.status, guest.submittedAt, guest.notificationSent ? "Sent" : "Not sent", guest.source, guest.notes])];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n"); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `kayitare-maranatha-rsvps-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  if (!admin) return <main className={styles.loginShell}>
    <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={initializeGoogle} onReady={initializeGoogle} onError={() => setGoogleError(true)} />
    <Link className={styles.backLink} href="/"><ArrowLeft size={17} /> Return to invitation</Link>
    <section className={styles.loginCard} aria-labelledby="admin-title"><div className={styles.monogram}><span>K</span><i /><span>M</span></div><p className={styles.eyebrow}>Private administration</p><h1 id="admin-title">The Guest<br /><em>Ledger</em></h1><p className={styles.loginCopy}>Sign in with the approved Google account to review and manage wedding responses.</p>
      {clientId ? <div ref={buttonRef} className={styles.googleButton} /> : <p className={styles.error}>Google sign-in is not configured.</p>}
      {clientId && !googleReady && !googleError ? <p className={styles.loadingText}>Loading secure Google sign-in…</p> : null}{googleError ? <p className={styles.error}>Google sign-in could not load. Check your connection and refresh this page.</p> : null}{loading ? <p className={styles.loadingText}>Opening the guest ledger…</p> : null}{error ? <p className={styles.error} role="alert">{error}</p> : null}<p className={styles.securityNote}>Access is restricted to the wedding administrators.</p>
    </section>
  </main>;

  return <main className={styles.dashboard}>
    <button className={styles.mobileSidebarButton} onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><SidebarSimple size={20} /></button>
    {sidebarOpen ? <button className={styles.mobileBackdrop} onClick={() => setSidebarOpen(false)} aria-label="Close navigation" /> : null}
    <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
      <div className={styles.sidebarBrand}><div className={styles.brandMark}>K<span>/</span>M</div><div><strong>Guest Ledger</strong><span>Wedding administration</span></div></div>
      <nav aria-label="RSVP views"><p>Responses</p>{navItems.map((item) => <button key={item.value} className={view === item.value ? styles.navActive : ""} onClick={() => { setView(item.value); setSidebarOpen(false); }}><item.icon size={18} /><span>{item.label}</span><small>{item.count}</small></button>)}</nav>
      <div className={styles.eventCard}><CalendarDots size={19} /><div><strong>Wedding day</strong><span>30 January 2027</span><span>Kigali, Rwanda</span></div></div>
      <div className={styles.sidebarProfile}>{admin.picture ? <span className={styles.adminAvatar} style={{ backgroundImage: `url(${admin.picture})` }} aria-hidden="true" /> : <span className={styles.adminInitials}>{initials(admin.name)}</span>}<div><strong>{admin.name}</strong><span>{admin.email}</span></div><button onClick={signOut} aria-label="Sign out"><SignOut size={18} /></button></div>
    </aside>

    <section className={styles.workspace}>
      <header className={styles.workspaceHeader}><div><span>Wedding administration</span><h1>{view === "All" ? "Reservation overview" : navItems.find((item) => item.value === view)?.label}</h1></div><div className={styles.headingActions}><button onClick={() => void loadGuests(credential)} disabled={loading}><ArrowClockwise size={17} className={loading ? styles.spinning : ""} /> Refresh</button><button className={styles.primaryAction} onClick={exportCsv}><DownloadSimple size={17} /> Export CSV</button></div></header>
      {error ? <p className={styles.tableError} role="alert">{error}</p> : null}
      <section className={styles.metrics} aria-label="RSVP summary"><article><div><span>Total responses</span><strong>{totals.responses}</strong></div><ListBullets size={21} /></article><article><div><span>Confirmed parties</span><strong>{totals.attending}</strong></div><CheckCircle size={21} /></article><article><div><span>Expected guests</span><strong>{totals.guests}</strong></div><UsersThree size={21} /></article><article><div><span>Awaiting reply</span><strong>{totals.pending}</strong></div><Clock size={21} /></article></section>
      <section className={styles.ledger}><div className={styles.ledgerHeader}><div><h2>Reservations</h2><p>{visibleGuests.length} of {totals.responses} responses shown</p></div><label className={styles.search}><MagnifyingGlass size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guests, phone, source or notes" /></label></div>
        <div className={styles.mobileGuestList}>{visibleGuests.map((guest) => <button key={guest.id} onClick={() => openGuest(guest)}><span className={styles.guestInitials}>{initials(guest.name)}</span><span><strong>{guest.name || "Unnamed guest"}</strong><small>{guest.phone || "No phone"} · {guest.guestCount} {guest.guestCount === 1 ? "guest" : "guests"}</small></span><span className={`${styles.status} ${styles[`status${guest.status}`]}`}>{guest.status}</span></button>)}</div>
        <div className={styles.tableWrap}><table><thead><tr><th>Guest</th><th>Party</th><th>RSVP</th><th>Submitted</th><th>Email notice</th><th>Source</th><th><span className="sr-only">Manage</span></th></tr></thead><tbody>{visibleGuests.map((guest) => <tr key={guest.id}><td><div className={styles.guestCell}><span className={styles.guestInitials}>{initials(guest.name)}</span><span><strong>{guest.name || "Unnamed guest"}</strong><a href={`tel:${guest.phone}`}>{guest.phone || "No phone"}</a></span></div></td><td><span className={styles.party}><UsersThree size={17} />{guest.guestCount}</span></td><td><span className={`${styles.status} ${styles[`status${guest.status}`]}`}>{guest.status}</span></td><td>{formatDate(guest.submittedAt)}</td><td>{guest.notificationSent ? <span className={styles.sent}><Check size={15} /> Sent</span> : <span className={styles.notSent}>Not sent</span>}</td><td><span className={styles.source}>{guest.source || "Wedding website"}</span></td><td><button className={styles.manageButton} onClick={() => openGuest(guest)}><NotePencil size={17} /> Manage</button></td></tr>)}</tbody></table>
          {!loading && visibleGuests.length === 0 ? <div className={styles.empty}><UsersThree size={26} /><p>No reservations in this view</p><span>Try another status or clear the search.</span></div> : null}{loading ? <div className={styles.loadingRows} aria-label="Refreshing reservations"><i /><i /><i /></div> : null}
        </div>
      </section>
    </section>
    {selected ? <div className={styles.drawerBackdrop} onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}><aside className={styles.drawer} aria-label={`Manage ${selected.name}`}><header><div><span className={styles.guestInitials}>{initials(selected.name)}</span><div><p>Guest reservation</p><h2>{selected.name}</h2></div></div><button className={styles.closeDrawer} onClick={() => setSelected(null)} aria-label="Close"><X size={20} /></button></header><a className={styles.phoneLink} href={`tel:${selected.phone}`}>{selected.phone}</a><dl><div><dt>Party size</dt><dd>{selected.guestCount}</dd></div><div><dt>Submitted</dt><dd>{formatDate(selected.submittedAt)}</dd></div><div><dt>Email notice</dt><dd>{selected.notificationSent ? "Sent" : "Not sent"}</dd></div><div><dt>Source</dt><dd>{selected.source || "Wedding website"}</dd></div></dl><label className={styles.drawerField}><span>RSVP status</span><select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as RsvpStatus)}>{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select></label><label className={styles.drawerField}><span>Private notes</span><textarea value={draftNotes} onChange={(event) => setDraftNotes(event.target.value)} rows={6} placeholder="Add a note for the family…" /></label><button className={styles.saveButton} onClick={() => void saveGuest()} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></aside></div> : null}
  </main>;
}
