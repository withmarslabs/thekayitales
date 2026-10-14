"use client";

import { ArrowRight, CalendarBlank, Check, Church, ForkKnife, HeartStraight, MapPin, MusicNotes, Phone, UsersThree, Wine, X } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useState } from "react";

const HeroScene = dynamic(() => import("./hero-scene").then((module) => module.HeroScene), { ssr: false });
const PHOTOS = Array.from({ length: 6 }, (_, index) => `/images/photo-${index + 1}.webp`);
const TARGET_DATE = new Date("2027-01-30T11:00:00+02:00").getTime();
const RSVP_STORAGE_KEY = "kayitare-maranatha-rsvp-complete";
const EVENTS = [
  { time: "11:00", label: "Introduction & Dowry Giving", kinyarwanda: "Gusaba no Gukwa", venue: "Makita Tente Design · Kimironko", icon: HeartStraight },
  { time: "15:00", label: "Religious Ceremony", kinyarwanda: "Gusezerana Imbere y'Imana", venue: "Citylight Foursquare Church · Kigali", icon: Church },
  { time: "18:00", label: "Reception", kinyarwanda: "Kwakira Abatumiwe", venue: "Makita Tente Design · Kimironko", icon: ForkKnife },
];
const CONTACTS = [
  { name: "Maranatha", initial: "M", numbers: ["+250 788 944 521", "+250 788 767 389", "+250 788 247 085", "+250 780 140 776"] },
  { name: "Kayitare", initial: "K", numbers: ["+250 781 168 770", "+250 788 891 917", "+250 788 221 414", "+250 843 334 08"] },
];

function getCountdown() {
  const difference = Math.max(0, TARGET_DATE - Date.now());
  const pad = (value: number) => String(value).padStart(2, "0");
  return [["days", pad(Math.floor(difference / 86_400_000))], ["hours", pad(Math.floor((difference % 86_400_000) / 3_600_000))], ["minutes", pad(Math.floor((difference % 3_600_000) / 60_000))], ["seconds", pad(Math.floor((difference % 60_000) / 1_000))]];
}

export function WeddingInvitation() {
  const [countdown, setCountdown] = useState(getCountdown);
  const [rsvpReady, setRsvpReady] = useState(false);
  const [rsvpComplete, setRsvpComplete] = useState(false);
  const [additionalRsvp, setAdditionalRsvp] = useState(false);
  const [rsvpNotice, setRsvpNotice] = useState("");
  const [attendance, setAttendance] = useState<"yes" | "no">("yes");
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpError, setRsvpError] = useState("");
  const [loaderVisible, setLoaderVisible] = useState(false);
  const [loaderLeaving, setLoaderLeaving] = useState(false);
  const [loaderOpened, setLoaderOpened] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const shiftLightbox = useCallback((direction: number) => setLightboxIndex((current) => current === null ? null : (current + direction + PHOTOS.length) % PHOTOS.length), []);

  useEffect(() => {
    const alreadyRegistered = window.localStorage.getItem(RSVP_STORAGE_KEY) === "true";
    const readyTimer = window.setTimeout(() => {
      setRsvpComplete(alreadyRegistered);
      setRsvpReady(true);
    }, 0);
    return () => window.clearTimeout(readyTimer);
  }, []);
  useEffect(() => {
    if (!rsvpNotice) return;
    const noticeTimer = window.setTimeout(() => setRsvpNotice(""), 4_500);
    return () => window.clearTimeout(noticeTimer);
  }, [rsvpNotice]);
  useEffect(() => {
    if (!loaderVisible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const reducedMotionTimer = window.setTimeout(() => setLoaderVisible(false), 0);
      return () => window.clearTimeout(reducedMotionTimer);
    }
    const automaticOpenTimer = window.setTimeout(() => setLoaderOpened(true), 2_600);
    const leaveTimer = window.setTimeout(() => setLoaderLeaving(true), 4_450);
    const hideTimer = window.setTimeout(() => setLoaderVisible(false), 5_100);
    return () => {
      window.clearTimeout(automaticOpenTimer);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, [loaderVisible]);
  useEffect(() => { const tick = () => setCountdown(getCountdown()); tick(); const timer = window.setInterval(tick, 1_000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 60); onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll); }, []);
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const revealVisible = () => elements.forEach((element) => {
      if (element.getBoundingClientRect().top < window.innerHeight * 1.08) element.classList.add("is-visible");
    });
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
      { threshold: 0.02, rootMargin: "0px 0px -4% 0px" },
    );
    elements.forEach((element) => observer.observe(element));
    revealVisible();
    window.addEventListener("scroll", revealVisible, { passive: true });
    window.addEventListener("resize", revealVisible);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", revealVisible);
      window.removeEventListener("resize", revealVisible);
    };
  }, []);
  useEffect(() => {
    document.body.style.overflow = !rsvpComplete || loaderVisible || lightboxIndex !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIndex, loaderVisible, rsvpComplete]);
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setLightboxIndex(null); if (event.key === "ArrowLeft") shiftLightbox(-1); if (event.key === "ArrowRight") shiftLightbox(1); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, shiftLightbox]);

  const handleRsvpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRsvpSubmitting(true);
    setRsvpError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(Array.from(formData.entries(), ([key, value]) => [key, String(value)]));

    try {
      const response = await fetch("/.netlify/functions/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        const fallback = response.status === 404
          ? "The RSVP service is still being deployed. Please try again shortly."
          : "We could not save your response. Please try again.";
        throw new Error(result?.error ?? fallback);
      }
      window.localStorage.setItem(RSVP_STORAGE_KEY, "true");
      setRsvpComplete(true);
      if (additionalRsvp) {
        setAdditionalRsvp(false);
        setRsvpNotice("The additional seat has been reserved.");
      } else {
        setLoaderOpened(false);
        setLoaderLeaving(false);
        setLoaderVisible(true);
      }
    } catch (error) {
      setRsvpError(error instanceof Error ? error.message : "We could not save your response. Check your connection and try again.");
    } finally {
      setRsvpSubmitting(false);
    }
  };

  const openAdditionalRsvp = () => {
    setAttendance("yes");
    setRsvpError("");
    setRsvpNotice("");
    setAdditionalRsvp(true);
    setRsvpComplete(false);
  };

  const closeAdditionalRsvp = () => {
    setAdditionalRsvp(false);
    setRsvpError("");
    setRsvpComplete(true);
  };

  return (
    <main>
      {!rsvpComplete ? <section className={`rsvp-gate${rsvpReady ? " is-ready" : ""}`} aria-labelledby="rsvp-title">
        {additionalRsvp ? <button className="rsvp-close" type="button" onClick={closeAdditionalRsvp} aria-label="Return to the invitation"><X size={21} weight="thin" /><span>Back to invitation</span></button> : null}
        <div className="rsvp-ornament" aria-hidden="true"><span /><i>K</i><b>&</b><i>M</i><span /></div>
        <div className="rsvp-intro">
          <p className="rsvp-kicker">{additionalRsvp ? "Welcome another guest" : "A private invitation"}</p>
          <h1 id="rsvp-title">{additionalRsvp ? <>Reserve<br /><em>another seat.</em></> : <>You&apos;re invited<br /><em>to celebrate love.</em></>}</h1>
          <p className="rsvp-message">{additionalRsvp ? "Enter the guest’s details below and we’ll add their response to the family’s list." : "Kayitare and Maranatha joyfully invite you to the beginning of their forever."}</p>
          <div className="rsvp-date"><span>Saturday</span><strong>30</strong><span>January<br />2027 · Kigali</span></div>
          <p className="rsvp-script">Together with our families</p>
        </div>
        <div className="rsvp-panel-wrap">
          <form className="rsvp-panel" name="wedding-rsvp" method="POST" data-netlify="true" netlify-honeypot="company" onSubmit={handleRsvpSubmit}>
            <input type="hidden" name="form-name" value="wedding-rsvp" />
            <p className="rsvp-honeypot" aria-hidden="true"><label>Leave this field empty<input name="company" tabIndex={-1} autoComplete="off" /></label></p>
            <header><span>{additionalRsvp ? "New guest response" : "Kindly respond"}</span><h2>{additionalRsvp ? "Who shall we welcome?" : "Would you like to join us?"}</h2><p>{additionalRsvp ? "Use the new guest’s name and phone number so their reservation remains easy to manage." : "Your response helps our families prepare a beautiful welcome for every guest."}</p></header>
            <div className="rsvp-fields">
              <label className="rsvp-field"><span>Your full name</span><input name="fullName" type="text" autoComplete="name" placeholder="e.g. Aline Uwase" required /></label>
              <label className="rsvp-field"><span>Phone number</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+250 7XX XXX XXX" required /></label>
              <fieldset className="attendance-choice"><legend>Will you attend?</legend><div>
                <label className={attendance === "yes" ? "is-selected" : ""}><input type="radio" name="attendance" value="Attending" checked={attendance === "yes"} onChange={() => setAttendance("yes")} /><Check size={20} weight="bold" /><span><strong>Joyfully attending</strong><small>We&apos;ll be there</small></span></label>
                <label className={attendance === "no" ? "is-selected" : ""}><input type="radio" name="attendance" value="Not attending" checked={attendance === "no"} onChange={() => setAttendance("no")} /><X size={20} weight="bold" /><span><strong>Unable to attend</strong><small>With love from afar</small></span></label>
              </div></fieldset>
              {attendance === "yes" ? <label className="rsvp-field guest-count"><span><UsersThree size={17} weight="thin" /> Total guests attending</span><select name="guestCount" defaultValue="1"><option value="1">Just me · 1 person</option><option value="2">2 people</option><option value="3">3 people</option><option value="4">4 people</option><option value="5">5 people</option><option value="6">6 people</option><option value="7">7 people</option><option value="8">8 people</option></select></label> : <input type="hidden" name="guestCount" value="0" />}
            </div>
            {rsvpError ? <p className="rsvp-error" role="alert">{rsvpError}</p> : null}
            <button className="rsvp-submit" type="submit" disabled={rsvpSubmitting}><span>{rsvpSubmitting ? "Saving your response…" : attendance === "yes" ? "Confirm attendance" : "Send our regrets"}</span><ArrowRight size={19} weight="thin" /></button>
            <p className="rsvp-privacy">Your details are shared only with the wedding families.</p>
          </form>
        </div>
      </section> : null}
      {rsvpComplete && !loaderVisible ? <button className="reserve-another" type="button" onClick={openAdditionalRsvp}><UsersThree size={19} weight="thin" /><span>Reserve another seat</span><ArrowRight size={16} weight="thin" /></button> : null}
      {rsvpNotice ? <div className="rsvp-notice" role="status"><Check size={18} weight="bold" /><span>{rsvpNotice}</span></div> : null}
      {loaderVisible ? <div className={`wedding-loader${loaderOpened ? " is-open" : ""}${loaderLeaving ? " is-leaving" : ""}`} role="status" aria-live="polite" aria-label="Opening Kayitare and Maranatha's wedding invitation">
        <div className="loader-scene" aria-hidden="true"><div className="stage-light" /><div className="presentation-box"><div className="box-base"><div className="box-card"><span>Together with their families</span><h2>Kayitare <i>&</i> Maranatha</h2><p>Saturday · 30 January · 2027</p><small>Kigali, Rwanda</small></div></div><div className="box-lid"><span>K<i>/</i>M</span><small>A celebration of love</small></div></div></div>
        <div className="loader-curtain left" aria-hidden="true" /><div className="loader-curtain right" aria-hidden="true" />
        <div className="loader-title"><span>A private invitation</span><p>Kayitare <i>&</i> Maranatha</p></div>
        <button className="loader-skip" type="button" onClick={() => setLoaderVisible(false)}>Skip entrance</button>
      </div> : null}
      <nav className={scrolled ? "site-nav is-scrolled" : "site-nav"}>
        <a className="monogram" href="#home" aria-label="Kayitare and Maranatha home"><span>K</span><i /><span>M</span></a>
        <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="Toggle navigation"><span /><span /></button>
        <div className={menuOpen ? "nav-links is-open" : "nav-links"}><a href="#story" onClick={() => setMenuOpen(false)}>Our story</a><a href="#details" onClick={() => setMenuOpen(false)}>The day</a><a href="#gallery" onClick={() => setMenuOpen(false)}>Gallery</a><a href="#contacts" onClick={() => setMenuOpen(false)}>Contact</a></div>
        <p className="nav-vow">A greater story<br />together</p>
      </nav>

      <header className="hero" id="home">
        <HeroScene />
        <div className="hero-photo" aria-hidden="true"><Image src="/images/hero.webp" alt="" fill priority quality={90} sizes="100vw" /></div>
        <div className="hero-shade" />
        <div className="hero-date-rail"><span>30</span><span>01</span><span>27</span></div><p className="hero-location">Kigali · Rwanda</p>
        <div className="hero-content"><p className="eyebrow">Together forever</p><h1><span>Kayitare</span><em>&</em><span>Maranatha</span></h1><div className="hero-meta"><CalendarBlank size={18} weight="thin" /><span>Saturday, 30 January 2027</span><MapPin size={18} weight="thin" /><span>Kigali, Rwanda</span></div></div>
        <a href="#story" className="scroll-cue"><span />Scroll to explore</a>
      </header>

      <section className="invitation" id="story">
        <p className="side-label">Kayitare & Maranatha</p>
        <div className="invitation-copy" data-reveal><p className="eyebrow dark">A love ordained</p><h2>What God<br />Has Joined<br /><em>Together</em></h2><blockquote>“So they are no longer two, but one flesh. Therefore what God has joined together, let no one separate.”</blockquote><p className="scripture">Matthew 19:6</p></div>
        <div className="invitation-collage" data-reveal><div className="collage-main"><Image src="/images/photo-3.webp" alt="Kayitare and Maranatha smiling together" fill quality={90} sizes="(max-width: 800px) 75vw, 32vw" /></div><div className="collage-small"><Image src="/images/photo-2.webp" alt="A joyful moment between Kayitare and Maranatha" fill quality={90} sizes="220px" /></div><p className="collage-note">Faith<br />People<br />Purpose<br />Forever</p></div>
        <p className="script-note">A beautiful beginning</p>
      </section>

      <section className="day" id="details">
        <div className="day-intro" data-reveal><p className="eyebrow">The day unfolds</p><h2>Our<br />Wedding<br />Day</h2><p>Same God<br />Same love<br />A brighter<br />tomorrow</p></div>
        <div className="timeline" data-reveal>{EVENTS.map(({ time, label, kinyarwanda, venue, icon: Icon }) => <article className="timeline-row" key={time}><time>{time}</time><span className="timeline-dot" /><Icon size={30} weight="thin" /><div><h3>{label}</h3><p>{kinyarwanda}</p><small>{venue}</small></div></article>)}</div>
        <div className="day-photo" data-reveal><Image src="/images/photo-6.webp" alt="Kayitare and Maranatha sharing a smile" fill quality={90} sizes="(max-width: 800px) 100vw, 28vw" /><Image className="botanical botanical-day" src="/images/botanical-sprig.webp" alt="" width={380} height={570} quality={90} /><p>More than a day,<br />a lifetime.</p></div>
      </section>

      <section className="countdown" aria-label="Wedding countdown"><p className="eyebrow">Until we say “I do”</p><div className="countdown-grid">{countdown.map(([label, value]) => <div key={label}><strong key={value} suppressHydrationWarning>{value}</strong><span>{label}</span></div>)}</div></section>

      <section className="gallery" id="gallery">
        <div className="gallery-heading" data-reveal><p className="eyebrow">Our gallery</p><h2>A Story<br />in Pictures</h2><p>Real moments.<br />Eternal memories.</p></div>
        <div className="gallery-grid" data-reveal>{PHOTOS.map((photo, index) => <button key={photo} className={`gallery-photo gallery-photo-${index + 1}`} onClick={() => setLightboxIndex(index)} aria-label={`View portrait ${index + 1}`}><Image src={photo} alt={`Kayitare and Maranatha portrait ${index + 1}`} fill quality={90} sizes="(max-width: 700px) 50vw, 25vw" /><span>0{index + 1}</span></button>)}</div>
      </section>

      <section className="contacts" id="contacts">
        <div className="contact-intro" data-reveal>
          <Image src="/images/photo-5.webp" alt="Kayitare and Maranatha looking at each other" fill quality={90} sizes="(max-width: 900px) 100vw, 44vw" />
          <div className="contact-intro-shade" />
          <Image className="botanical botanical-contact" src="/images/botanical-sprig.webp" alt="" width={500} height={750} quality={90} />
          <div className="contact-heading"><p className="eyebrow">With grateful hearts</p><h2>Celebrate<br /><em>With Us</em></h2><p>We would be honored to have you share this special day with us.</p></div>
        </div>
        <div className="contact-directory" data-reveal>
          <div className="contact-directory-heading"><div><p>Family & day-of contacts</p><h3>We’re here to help</h3></div><span>Tap any number to call</span></div>
          <div className="contact-list">{CONTACTS.map((contact) => <article key={contact.name}><header><span>{contact.initial}</span><div><h4>{contact.name}</h4><p>{contact.name}&apos;s family</p></div></header><div className="contact-numbers">{contact.numbers.map((number, index) => <a href={`tel:${number.replaceAll(" ", "")}`} key={number}><span><Phone size={17} weight="thin" />{number}</span><small>{index === 0 ? "Primary" : "Call"}</small></a>)}</div></article>)}</div>
          <p className="contact-signoff"><HeartStraight size={19} weight="thin" /> We cannot wait to welcome you in Kigali.</p>
        </div>
      </section>

      <footer><div className="footer-monogram"><span>K</span><i /><span>M</span></div><p>30 January 2027 · Kigali, Rwanda</p><p className="footer-script">A lifetime worth celebrating</p><div className="footer-icons"><HeartStraight size={22} weight="thin" /><Church size={22} weight="thin" /><Wine size={22} weight="thin" /><MusicNotes size={22} weight="thin" /></div></footer>

      {lightboxIndex !== null ? <div className="lightbox" role="dialog" aria-modal="true" aria-label="Portrait gallery" onClick={(event) => event.target === event.currentTarget && setLightboxIndex(null)}><button className="lightbox-close" onClick={() => setLightboxIndex(null)} aria-label="Close gallery">×</button><button className="lightbox-arrow previous" onClick={() => shiftLightbox(-1)} aria-label="Previous photo">←</button><div className="lightbox-image" key={PHOTOS[lightboxIndex]}><Image src={PHOTOS[lightboxIndex]} alt={`Kayitare and Maranatha portrait ${lightboxIndex + 1}`} fill quality={90} sizes="90vw" /></div><button className="lightbox-arrow next" onClick={() => shiftLightbox(1)} aria-label="Next photo">→</button><p>{String(lightboxIndex + 1).padStart(2, "0")} / {String(PHOTOS.length).padStart(2, "0")}</p></div> : null}
    </main>
  );
}
