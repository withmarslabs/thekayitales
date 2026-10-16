# Design QA — mobile invitation grammar

## Comparison input

- Source visual truth: `/var/folders/fm/gnkjxp6s5v3dx6cx18wvplbc0000gp/T/codex-clipboard-3c88b357-0fa8-428f-b088-c95d459f64a6.png`
- Browser-rendered implementation: `/private/tmp/kayitare-grammar-mobile-2.png`
- Normalized side-by-side evidence: `/private/tmp/kayitare-grammar-comparison.png`
- Source pixels: 591 × 1280, including WhatsApp and browser chrome
- Implementation pixels: 390 × 844 at device scale factor 1
- Comparison viewport: source app content normalized to 390 × 678 CSS-equivalent pixels; implementation cropped to the same 390 × 678 region
- State: English invitation, contact section at the top of the mobile viewport

## Full-view comparison

- The existing image crop, navigation, heading hierarchy, forest overlay, and transition into the contact directory remain unchanged.
- The corrected sentence fits inside the contact text column without clipping or horizontal overflow.

## Focused comparison

- Before: “We would be honored to have you share this special day with us.” leaves “share” isolated at the right edge and reads awkwardly.
- After: “We would be honored to have you join us on this special day.” wraps into two balanced lines at 390 px.
- Browser measurement: the paragraph is 340 px wide and two lines tall; document width equals the 390 px viewport.

## Required fidelity surfaces

- Typography: the existing serif face, weight, size, and line height are preserved; only the sentence changed.
- Spacing and layout: the 25 px mobile insets and contact composition are unchanged.
- Colors and tokens: no color, overlay, or token changes.
- Image quality: the existing photograph, crop, and decorative botanical asset are unchanged.
- Copy: the English invitation now uses natural, direct wording with no orphaned “share.”

## Interaction and runtime checks

- The contact section was rendered locally at a 390 × 844 mobile viewport.
- No horizontal overflow was observed (`body.scrollWidth` = 390 px).
- The corrected sentence was present in the rendered DOM and visible in the captured implementation.

## Comparison history

- Initial source: P2 copy issue — awkward phrasing and an isolated final word at the mobile edge.
- Fix: replaced the sentence with “We would be honored to have you join us on this special day.”
- Post-fix evidence: the normalized side-by-side comparison shows a balanced two-line paragraph with no clipping.

## Findings

- P0: none
- P1: none
- P2: none

## Follow-up polish

- P3: none within this scoped correction.

final result: passed
