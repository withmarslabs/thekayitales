# Design QA — localized language sharing

## Comparison input

- Source visual truth: `/var/folders/fm/gnkjxp6s5v3dx6cx18wvplbc0000gp/T/TemporaryItems/NSIRD_screencaptureui_tyhDYd/Screenshot 2026-10-16 at 1.39.19 AM.png`
- Browser-rendered implementation: `/private/tmp/kayita-localized-share-desktop.png`
- Mobile evidence: `/private/tmp/kayita-localized-share-mobile.png`
- Focused side-by-side evidence: `/private/tmp/kayita-localized-share-comparison.png`
- Source pixels: 592 × 184
- Implementation desktop CSS viewport: 1440 × 1000 at device scale factor 1
- Mobile CSS viewport: 390 × 844 at device scale factor 1
- State: RSVP completed; French query-load verification followed by Luganda query-change and share-link verification

## Full-view comparison

- The language dock now shows only the active language’s full name while keeping English, Kinyarwanda, Luganda, and French available in the dropdown.
- A dedicated share action sits beside the selector and uses the current localized URL.
- The dock preserves the screenshot’s forest-and-gold treatment while becoming substantially narrower and clearer.
- Existing invitation content, navigation, hero imagery, and reservation behavior remain unchanged.

## Focused comparison

- Query state: loading `?lang=fr` displays “French” as the single selected value, rather than four abbreviations at once.
- Change state: selecting Luganda changes the query to `?lang=lg` and updates the document language and visible copy without reloading.
- Share state: the fallback copy path produced the exact current localized URL and displayed a translated confirmation.
- Mobile: the dock is 182 px wide at 390 px viewport width with no horizontal overflow.

## Required fidelity surfaces

- Typography: existing Cormorant/Jost hierarchy is preserved; CTA label uses the navigation’s small uppercase tracking and avoids wrapping.
- Spacing and layout: desktop retains the three-column header balance; mobile fits monogram, reservation action, and menu within 390 px.
- Colors and tokens: CTA and dock reuse the existing forest, gold, ivory, and translucent border tokens.
- Image quality: no image assets or crops were changed.
- Copy: language names are explicit and complete; the share label and copy confirmation are translated in all four languages.

## Interaction and runtime checks

- `?lang=fr` loaded with “French” selected and exposed all four full language names in the dropdown.
- Selecting Luganda updated the live URL to `?lang=lg`.
- The share fallback produced `http://127.0.0.1:3000/?lang=lg`; production uses the same path/query contract on the live origin.
- Desktop and mobile reported no horizontal overflow; mobile dock width measured 182 px.
- No browser console errors or page errors were observed.
- `bun run lint` passed.
- `bun run build` passed under Next.js 16.4.0; `/`, `/admin`, and `/_not-found` were statically generated.

## Comparison history

- First implementation pass: no P0, P1, or P2 issues were found in query handling, full-name presentation, localized sharing, or responsive behavior.

## Findings

- P0: none
- P1: none
- P2: none

## Follow-up polish

- P3: none within this scoped refinement.

final result: passed
