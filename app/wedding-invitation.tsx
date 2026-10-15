"use client";

import { ArrowRight, CalendarBlank, Check, Church, ForkKnife, HeartStraight, MapPin, MusicNotes, Phone, UsersThree, Wine, X } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { LANGUAGE_NAMES, TRANSLATIONS, translate, type Language } from "./translations";

const HeroScene = dynamic(() => import("./hero-scene").then((module) => module.HeroScene), { ssr: false });
const PHOTOS = Array.from({ length: 6 }, (_, index) => `/images/photo-${index + 1}.webp`);
const TARGET_DATE = new Date("2027-01-30T11:00:00+02:00").getTime();
const RSVP_STORAGE_KEY = "kayitare-maranatha-rsvp-complete";
const EVENTS = [
  { time: "11:00", labelKey: "event1", localKey: "event1Local", venue: "Makita Tente Design · Kimironko", icon: HeartStraight },
  { time: "15:00", labelKey: "event2", localKey: "event2Local", venue: "Citylight Foursquare Church · Kigali", icon: Church },
  { time: "18:00", labelKey: "event3", localKey: "event3Local", venue: "Makita Tente Design · Kimironko", icon: ForkKnife },
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
  const [language, setLanguage] = useState<Language>("en");
  const [languageReady, setLanguageReady] = useState(false);
  const copy = TRANSLATIONS[language];
  const t = useCallback((key: string, replacements?: Record<string, string | number>) => translate(copy, key, replacements), [copy]);
  const lines = useCallback((key: string) => t(key).split("\n").map((line, index, all) => <span key={`${key}-${index}`}>{line}{index < all.length - 1 ? <br /> : null}</span>), [t]);
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
    const stored = window.localStorage.getItem("kayitare-maranatha-language");
    const timer = window.setTimeout(() => {
      if (stored === "en" || stored === "rw" || stored === "fr" || stored === "lg") setLanguage(stored);
      setLanguageReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!languageReady) return;
    window.localStorage.setItem("kayitare-maranatha-language", language);
    document.documentElement.lang = language;
  }, [language, languageReady]);
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
          ? t("rsvpDeploying")
          : t("rsvpSaveError");
        throw new Error(result?.error ?? fallback);
      }
      window.localStorage.setItem(RSVP_STORAGE_KEY, "true");
      setRsvpComplete(true);
      if (additionalRsvp) {
        setAdditionalRsvp(false);
        setRsvpNotice(t("additionalReserved"));
      } else {
        setLoaderOpened(false);
        setLoaderLeaving(false);
        setLoaderVisible(true);
      }
    } catch (error) {
      setRsvpError(error instanceof Error ? error.message : t("rsvpConnectionError"));
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
        <label className="gate-language-picker"><span>{t("language")}</span><select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>{Object.entries(LANGUAGE_NAMES).map(([code, name]) => <option value={code} key={code}>{name}</option>)}</select></label>
        {additionalRsvp ? <button className="rsvp-close" type="button" onClick={closeAdditionalRsvp} aria-label={t("returnInvitation")}><X size={21} weight="thin" /><span>{t("backInvitation")}</span></button> : null}
        <div className="rsvp-ornament" aria-hidden="true"><span /><i>K</i><b>&</b><i>M</i><span /></div>
        <div className="rsvp-intro">
          <p className="rsvp-kicker">{additionalRsvp ? t("welcomeAnother") : t("privateInvitation")}</p>
          <h1 id="rsvp-title">{additionalRsvp ? <>{t("reserve")}<br /><em>{t("anotherSeat")}</em></> : <>{t("invited")}<br /><em>{t("celebrateLove")}</em></>}</h1>
          <p className="rsvp-message">{additionalRsvp ? t("guestDetails") : t("joyfulInvite")}</p>
          <div className="rsvp-date" role="timer" aria-label={t("countdownLabel")}>{countdown.map(([label, value]) => <span className="rsvp-date-unit" key={label}><strong key={value} suppressHydrationWarning>{value}</strong><small>{t(label)}</small></span>)}</div>
          <p className="rsvp-script">{t("families")}</p>
        </div>
        <div className="rsvp-panel-wrap">
          <form className="rsvp-panel" name="wedding-rsvp" method="POST" data-netlify="true" netlify-honeypot="company" onSubmit={handleRsvpSubmit}>
            <input type="hidden" name="form-name" value="wedding-rsvp" />
            <p className="rsvp-honeypot" aria-hidden="true"><label>{t("leaveEmpty")}<input name="company" tabIndex={-1} autoComplete="off" /></label></p>
            <header><span>{additionalRsvp ? t("newGuestResponse") : t("kindlyRespond")}</span><h2>{additionalRsvp ? t("whoWelcome") : t("joinUs")}</h2><p>{additionalRsvp ? t("manageGuest") : t("responseHelps")}</p></header>
            <div className="rsvp-fields">
              <label className="rsvp-field"><span>{t("fullName")}</span><input name="fullName" type="text" autoComplete="name" placeholder="e.g. Aline Uwase" required /></label>
              <label className="rsvp-field"><span>{t("phoneNumber")}</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+250 7XX XXX XXX" required /></label>
              <fieldset className="attendance-choice"><legend>{t("willAttend")}</legend><div>
                <label className={attendance === "yes" ? "is-selected" : ""}><input type="radio" name="attendance" value="Attending" checked={attendance === "yes"} onChange={() => setAttendance("yes")} /><Check size={20} weight="bold" /><span><strong>{t("joyfullyAttending")}</strong><small>{t("wellBeThere")}</small></span></label>
                <label className={attendance === "no" ? "is-selected" : ""}><input type="radio" name="attendance" value="Not attending" checked={attendance === "no"} onChange={() => setAttendance("no")} /><X size={20} weight="bold" /><span><strong>{t("unableAttend")}</strong><small>{t("loveFromAfar")}</small></span></label>
              </div></fieldset>
              {attendance === "yes" ? <label className="rsvp-field guest-count"><span><UsersThree size={17} weight="thin" /> {t("totalGuests")}</span><select name="guestCount" defaultValue="1"><option value="1">{t("justMe")}</option>{[2, 3, 4, 5, 6, 7, 8].map((count) => <option value={count} key={count}>{count} {t("people")}</option>)}</select></label> : <input type="hidden" name="guestCount" value="0" />}
            </div>
            {rsvpError ? <p className="rsvp-error" role="alert">{rsvpError}</p> : null}
            <button className="rsvp-submit" type="submit" disabled={rsvpSubmitting}><span>{rsvpSubmitting ? t("saving") : attendance === "yes" ? t("confirmAttendance") : t("sendRegrets")}</span><ArrowRight size={19} weight="thin" /></button>
            <p className="rsvp-privacy">{t("privacy")}</p>
          </form>
        </div>
      </section> : null}
      {rsvpComplete && !loaderVisible ? <button className="reserve-another" type="button" onClick={openAdditionalRsvp}><UsersThree size={19} weight="thin" /><span>{t("reserveAnother")}</span><ArrowRight size={16} weight="thin" /></button> : null}
      {rsvpNotice ? <div className="rsvp-notice" role="status"><Check size={18} weight="bold" /><span>{rsvpNotice}</span></div> : null}
      {loaderVisible ? <div className={`wedding-loader${loaderOpened ? " is-open" : ""}${loaderLeaving ? " is-leaving" : ""}`} role="status" aria-live="polite" aria-label={t("openingInvitation")}>
        <div className="loader-scene" aria-hidden="true"><div className="stage-light" /><div className="presentation-box"><div className="box-base"><div className="box-card"><span>{t("families")}</span><h2>Kayitare <i>&</i> Maranatha</h2><p>{t("weddingDate")}</p><small>{t("kigaliRwanda")}</small></div></div><div className="box-lid"><span>K<i>/</i>M</span><small>{t("celebrationLove")}</small></div></div></div>
        <div className="loader-curtain left" aria-hidden="true" /><div className="loader-curtain right" aria-hidden="true" />
        <div className="loader-title"><span>{t("privateInvitation")}</span><p>Kayitare <i>&</i> Maranatha</p></div>
        <button className="loader-skip" type="button" onClick={() => setLoaderVisible(false)}>{t("skipEntrance")}</button>
      </div> : null}
      <nav className={scrolled ? "site-nav is-scrolled" : "site-nav"}>
        <a className="monogram" href="#home" aria-label={t("homeLabel")}><span>K</span><i /><span>M</span></a>
        <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label={t("toggleNavigation")}><span /><span /></button>
        <div className={menuOpen ? "nav-links is-open" : "nav-links"}><a href="#story" onClick={() => setMenuOpen(false)}>{t("ourStory")}</a><a href="#details" onClick={() => setMenuOpen(false)}>{t("theDay")}</a><a href="#gallery" onClick={() => setMenuOpen(false)}>{t("gallery")}</a><a href="#contacts" onClick={() => setMenuOpen(false)}>{t("contact")}</a><label className="language-picker"><span>{t("language")}</span><select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>{Object.entries(LANGUAGE_NAMES).map(([code, name]) => <option value={code} key={code}>{name}</option>)}</select></label></div>
        <p className="nav-vow">{lines("greaterStory")}</p>
      </nav>

      <header className="hero" id="home">
        <HeroScene />
        <div className="hero-photo" aria-hidden="true"><Image src="/images/hero.webp" alt="" fill priority quality={90} sizes="100vw" /></div>
        <div className="hero-shade" />
        <div className="hero-date-rail"><span>30</span><span>01</span><span>27</span></div><p className="hero-location">Kigali · Rwanda</p>
        <div className="hero-content"><p className="eyebrow">{t("togetherForever")}</p><h1><span>Kayitare</span><em>&</em><span>Maranatha</span></h1><div className="hero-meta"><CalendarBlank size={18} weight="thin" /><span>{t("weddingDate")}</span><MapPin size={18} weight="thin" /><span>{t("kigaliRwanda")}</span></div></div>
        <a href="#story" className="scroll-cue"><span />{t("scrollExplore")}</a>
      </header>

      <section className="invitation" id="story">
        <p className="side-label">Kayitare & Maranatha</p>
        <div className="invitation-copy" data-reveal><p className="eyebrow dark">{t("loveOrdained")}</p><h2>{lines("godJoined")}</h2><blockquote>{t("scripture")}</blockquote><p className="scripture">Matthew 19:6</p></div>
        <div className="invitation-collage" data-reveal><div className="collage-main"><Image src="/images/photo-3.webp" alt={t("collageAltMain")} fill quality={90} sizes="(max-width: 800px) 75vw, 32vw" /></div><div className="collage-small"><Image src="/images/photo-2.webp" alt={t("collageAltSmall")} fill quality={90} sizes="220px" /></div><p className="collage-note">{lines("faithPurpose")}</p></div>
        <p className="script-note">{t("beautifulBeginning")}</p>
      </section>

      <section className="day" id="details">
        <div className="day-intro" data-reveal><p className="eyebrow">{t("dayUnfolds")}</p><h2>{lines("weddingDay")}</h2><p>{lines("sameLove")}</p></div>
        <div className="timeline" data-reveal>{EVENTS.map(({ time, labelKey, localKey, venue, icon: Icon }) => <article className="timeline-row" key={time}><time>{time}</time><span className="timeline-dot" /><Icon size={30} weight="thin" /><div><h3>{t(labelKey)}</h3><p>{t(localKey)}</p><small>{venue}</small></div></article>)}</div>
        <div className="day-photo" data-reveal><Image src="/images/photo-6.webp" alt={t("dayPhotoAlt")} fill quality={90} sizes="(max-width: 800px) 100vw, 28vw" /><Image className="botanical botanical-day" src="/images/botanical-sprig.webp" alt="" width={380} height={570} quality={90} /><p>{lines("moreThanDay")}</p></div>
      </section>

      <section className="countdown" aria-label={t("countdownLabel")}><p className="eyebrow">{t("untilIDo")}</p><div className="countdown-grid">{countdown.map(([label, value]) => <div key={label}><strong key={value} suppressHydrationWarning>{value}</strong><span>{t(label)}</span></div>)}</div></section>

      <section className="gallery" id="gallery">
        <div className="gallery-heading" data-reveal><p className="eyebrow">{t("ourGallery")}</p><h2>{lines("storyPictures")}</h2><p>{lines("realMoments")}</p></div>
        <div className="gallery-grid" data-reveal>{PHOTOS.map((photo, index) => <button key={photo} className={`gallery-photo gallery-photo-${index + 1}`} onClick={() => setLightboxIndex(index)} aria-label={t("viewPortrait", { number: index + 1 })}><Image src={photo} alt={t("portraitAlt", { number: index + 1 })} fill quality={90} sizes="(max-width: 700px) 50vw, 25vw" /><span>0{index + 1}</span></button>)}</div>
      </section>

      <section className="contacts" id="contacts">
        <div className="contact-intro" data-reveal>
          <Image src="/images/photo-5.webp" alt={t("contactPhotoAlt")} fill quality={90} sizes="(max-width: 900px) 100vw, 44vw" />
          <div className="contact-intro-shade" />
          <Image className="botanical botanical-contact" src="/images/botanical-sprig.webp" alt="" width={500} height={750} quality={90} />
          <div className="contact-heading"><p className="eyebrow">{t("gratefulHearts")}</p><h2>{t("celebrateWithUs").split("\n")[0]}<br /><em>{t("celebrateWithUs").split("\n")[1]}</em></h2><p>{t("honorShare")}</p></div>
        </div>
        <div className="contact-directory" data-reveal>
          <div className="contact-directory-heading"><div><p>{t("familyContacts")}</p><h3>{t("hereHelp")}</h3></div><span>{t("tapCall")}</span></div>
          <div className="contact-list">{CONTACTS.map((contact) => <article key={contact.name}><header><span>{contact.initial}</span><div><h4>{contact.name}</h4><p>{t("family", { name: contact.name })}</p></div></header><div className="contact-numbers">{contact.numbers.map((number, index) => <a href={`tel:${number.replaceAll(" ", "")}`} key={number}><span><Phone size={17} weight="thin" />{number}</span><small>{index === 0 ? t("primary") : t("call")}</small></a>)}</div></article>)}</div>
          <p className="contact-signoff"><HeartStraight size={19} weight="thin" /> {t("welcomeKigali")}</p>
        </div>
      </section>

      <footer><div className="footer-monogram"><span>K</span><i /><span>M</span></div><p>30 · 01 · 2027 · Kigali, Rwanda</p><p className="footer-script">{t("lifetimeCelebrate")}</p><div className="footer-icons"><HeartStraight size={22} weight="thin" /><Church size={22} weight="thin" /><Wine size={22} weight="thin" /><MusicNotes size={22} weight="thin" /></div></footer>

      {lightboxIndex !== null ? <div className="lightbox" role="dialog" aria-modal="true" aria-label={t("portraitGallery")} onClick={(event) => event.target === event.currentTarget && setLightboxIndex(null)}><button className="lightbox-close" onClick={() => setLightboxIndex(null)} aria-label={t("closeGallery")}>×</button><button className="lightbox-arrow previous" onClick={() => shiftLightbox(-1)} aria-label={t("previousPhoto")}>←</button><div className="lightbox-image" key={PHOTOS[lightboxIndex]}><Image src={PHOTOS[lightboxIndex]} alt={t("portraitAlt", { number: lightboxIndex + 1 })} fill quality={90} sizes="90vw" /></div><button className="lightbox-arrow next" onClick={() => shiftLightbox(1)} aria-label={t("nextPhoto")}>→</button><p>{String(lightboxIndex + 1).padStart(2, "0")} / {String(PHOTOS.length).padStart(2, "0")}</p></div> : null}
    </main>
  );
}
