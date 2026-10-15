# Design QA — navigation and language sharing

## Comparison input

- Source visual truth: `/var/folders/fm/gnkjxp6s5v3dx6cx18wvplbc0000gp/T/codex-clipboard-229caa8e-1973-481d-a58a-ae8af679ab70.png`
- Browser-rendered implementation: `/private/tmp/kayita-hero-navigation-match.png`
- Combined side-by-side evidence: `/private/tmp/kayita-navigation-comparison.png`
- RSVP gate evidence: `/private/tmp/kayita-rsvp-language-desktop.png`
- Mobile evidence: `/private/tmp/kayita-hero-navigation-mobile.png`
- Desktop comparison viewport: 1888 × 1976 CSS px at device scale factor 1
- Source pixels: 1888 × 1976; implementation pixels: 1888 × 1976; no density normalization required
- Mobile viewport: 390 × 844 CSS px at device scale factor 1
- State: RSVP completed for hero captures; English for the matched desktop comparison, Luganda for mobile URL/state verification, and French for the RSVP-gate verification

## Full-view comparison

- The rebuilt header keeps the original editorial composition while separating the monogram, four navigation links, and closing vow into three balanced regions.
- The former header language select is removed, eliminating the crowded overlap visible in the source capture.
- The compact language dock sits at the bottom-right on both the invitation gate and the main invitation without horizontal overflow.
- Hero image crop, central names, date/location line, side rails, forest palette, serif typography, and gold accents remain consistent with the source.

## Focused comparison

- Navigation: a restrained transparent-to-forest header, fine gold dividers, consistent letter spacing, clearer focus/hover treatment, and a compact scrolled state improve legibility without changing the invitation’s art direction.
- Language control: EN, RW, LG, and FR are direct buttons with a visible active state. The selected language updates both the document language and `?lang=` in the URL.
- RSVP gate: the selector is no longer competing with the centered K & M ornament at the top; it remains reachable at the bottom-right.
- Mobile: the top bar reduces to monogram plus menu toggle; the menu opens correctly, fixed actions do not overlap, and the page has no horizontal overflow.
- A separate focused crop was unnecessary because the navigation and language dock are clearly readable in the full-size equal-viewport comparison and mobile capture.

## Interaction and runtime checks

- `?lang=rw` loaded Kinyarwanda and `?lang=fr` loaded French directly, taking precedence over saved browser preference.
- Selecting LG changed the live URL to `?lang=lg`, updated `<html lang="lg">`, and preserved the invitation route without reload.
- Mobile navigation opened with the correct translated links and `aria-expanded="true"`.
- Desktop and mobile both reported no horizontal overflow.
- No browser console errors or page errors were observed.
- `bun run lint` passed.
- `bun run build` passed under Next.js 16.4.0; `/`, `/admin`, and `/_not-found` were statically generated.

## Comparison history

- First implementation pass: no P0, P1, or P2 visual issues were found. The first same-viewport capture occurred during the existing hero entrance animation; it was recaptured after the animation completed before judging fidelity.

## Findings

- P0: none
- P1: none
- P2: none

## Follow-up polish

- P3: native `<select>` controls elsewhere in the RSVP form remain browser-styled by design and were outside this navigation/language scope.

final result: passed
