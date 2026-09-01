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
- Default to an opaque branded or neutral cover for tokens, pairing codes, one-time codes, email addresses, phone numbers, customer records, billing data, and other identifiers.
- Use blur or pixelation only for low-risk content where visible length, color, or shape cannot identify the hidden value.
- Do not animate mask opacity. Start the mask before the sensitive element appears and end it after the element is gone.

The engine helpers `activePrivacyMasksAt`, `privacyMaskRectAt`, and `projectSourceRect` provide fail-closed tracked geometry. The product compositor owns the visual treatment.

## Review

- Inspect the raw capture locally before it leaves the machine.
- Inspect every rendered output, including the first and last frame of each mask and every camera transition.
- Check at full resolution and at the target player size. OCR can help find missed text, but it cannot replace visual review.
- Keep raw captures and renders in ignored local paths. If a raw recording contains a secret, do not upload it; rotate the secret if exposure extended beyond the controlled local workflow.
- Upload or publish only after the request's approval gate.
