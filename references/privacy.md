<!-- Authored by Daniel Hallman. -->

# Sensitive-data protection

Protect the source before polishing the video. A mask in the final render is a backup, not permission to record secrets carelessly.

## Before capture

- Use a dedicated demo account, fictional people, controlled recipients, and synthetic values.
- Close notifications, password managers, autofill suggestions, bookmarks, unrelated tabs, account switchers, and OS surfaces that can reveal private data.
- Replace known DOM text, input values, avatars, email addresses, phone numbers, identifiers, and account names before the first captured frame when the product can still behave truthfully with those values changed.
- Never place the original private value in telemetry, captions, filenames, mask IDs, mask reasons, logs, or render notes.

## Mask what remains

Declare masks in source coordinates so the compositor moves them through the same crop, zoom, and aspect-ratio transform as the product footage.

- Use one fixed rectangle for a stationary field.
- Use a time-sorted rectangle track for menus, dialogs, toasts, or other moving surfaces. Between samples, cover the union of both positions rather than interpolating a narrow rectangle that can expose an edge.
- Add enough padding for shadows, antialiasing, and motion.
- Omit `startMs` and `endMs` when the field can appear at any point. The mask then covers the full recording by default.
- Never attach a mask to the final canvas. Put it inside the transformed screen layer so it stays aligned through camera movement, reframing, and every aspect ratio.
- Default to an opaque branded or neutral replacement for tokens, pairing codes, one-time codes, billing data, customer records, and any value whose disclosure would create security or legal risk.
- For ordinary personal data in a polished product demo, a strong frosted blur can preserve the layout without exposing the value. Combine a large blur radius with a mostly opaque tint, a subtle border, and generous padding. Verify that the result stays unreadable at full resolution.
- Avoid light blur and coarse pixelation. Both can preserve length, color, character shape, or recognizable structure.
- Do not animate mask opacity. Start the mask before the sensitive element appears and end it after the element is gone. If the visibility window is not known with certainty, cover the full recording.

The engine helpers `activePrivacyMasksAt`, `privacyMaskRectAt`, and `projectSourceRect` provide fail-closed tracked geometry. The product compositor owns the visual treatment.

## Review

- Inspect the raw capture locally before it leaves the machine.
- Inspect every rendered output, including the first frame where the screen appears, the first and last frame of each timed mask, every camera transition, and the final frame where the field remains visible.
- Scrub the whole timeline at speed as well as frame by frame. A mask that appears only in a feature callout or closing shot is a failed mask.
- Check at full resolution and at the target player size. OCR can help find missed text, but it cannot replace visual review.
- Keep raw captures and renders in ignored local paths. If a raw recording contains a secret, do not upload it; rotate the secret if exposure extended beyond the controlled local workflow.
- Upload or publish only after the request's approval gate.
