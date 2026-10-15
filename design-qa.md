# Design QA — header reservation action and language position

## Comparison input

- Source visual truth: `/var/folders/fm/gnkjxp6s5v3dx6cx18wvplbc0000gp/T/codex-clipboard-6968a4d3-9ba9-44f3-ba48-a17df8d46dad.png`
- Browser-rendered implementation: `/private/tmp/kayita-header-cta-match.png`
- Combined side-by-side evidence: `/private/tmp/kayita-header-cta-comparison.png`
- Mobile evidence: `/private/tmp/kayita-header-cta-mobile.png`
- Source pixels: 2698 × 1976
- Implementation pixels and desktop CSS viewport: 2698 × 1976 at device scale factor 1; no density normalization required
- Mobile CSS viewport: 390 × 844 at device scale factor 1
- State: RSVP completed, French desktop invitation at the top of the page and Luganda mobile invitation after the hero entrance animation

## Full-view comparison

- The requested information hierarchy is now present: the translated reservation action occupies the header’s right region where the decorative vow previously appeared.
- The language dock has moved from bottom-right to bottom-left while retaining its forest, gold, and ivory visual language.
- The unscrolled header has no visible bottom rule. After scrolling 220 px, the compact header appears at approximately 72 px tall with the subtle gold rule restored.
- The existing hero photography, botanical treatment, typography, translated copy, and navigation remain unchanged outside the requested control placement.

## Focused comparison

- Desktop header: the reservation action is visually distinct but restrained, uses the existing Phosphor guest and arrow icons, and preserves the centered navigation.
- Mobile header: the reservation action collapses to a 42 × 42 px icon button with the full translated accessible name, next to the menu toggle.
- Mobile language dock: EN, RW, LG, and FR remain directly selectable at bottom-left without horizontal overflow.
- A separate crop was unnecessary because the header and language dock are clearly readable in the full-size desktop comparison and mobile capture.

## Required fidelity surfaces

- Typography: existing Cormorant/Jost hierarchy is preserved; CTA label uses the navigation’s small uppercase tracking and avoids wrapping.
- Spacing and layout: desktop retains the three-column header balance; mobile fits monogram, reservation action, and menu within 390 px.
- Colors and tokens: CTA and dock reuse the existing forest, gold, ivory, and translucent border tokens.
- Image quality: no image assets or crops were changed.
- Copy: the reservation action continues to use the translated `reserveAnother` copy in all four languages.

## Interaction and runtime checks

- Desktop language dock computed at 38 px from the left; mobile computed at 12 px from the left.
- The initial header border computed transparent; the scrolled border computed as translucent gold.
- The mobile reservation action opened the additional RSVP form successfully.
- Desktop and mobile reported no horizontal overflow.
- No browser console errors or page errors were observed.
- `bun run lint` passed.
- `bun run build` passed under Next.js 16.4.0; `/`, `/admin`, and `/_not-found` were statically generated.

## Comparison history

- First implementation pass: no P0, P1, or P2 issues were found in the requested control placement, scrolling state, or responsive behavior.

## Findings

- P0: none
- P1: none
- P2: none

## Follow-up polish

- P3: none within this scoped refinement.

final result: passed
