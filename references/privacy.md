<!-- Authored by Daniel Hallman. -->

# Sensitive-data protection

Choose the privacy path before capture or editing begins. A new recording can keep sensitive pixels out of the raw footage. Existing footage cannot, so it needs tracked post-processing and stricter control of the raw file.

## New capture: hide before recording

- Use a dedicated demo account, fictional people, controlled recipients, and synthetic values.
- Close notifications, password managers, autofill suggestions, bookmarks, unrelated tabs, account switchers, and OS surfaces that can reveal private data.
- Before starting the frame stream, identify every sensitive DOM element and replace its value or apply an in-page privacy treatment. Keep that treatment attached while the element moves, resizes, rerenders, or scrolls. The raw captured pixels must already be safe.
- Prefer synthetic replacement for secrets and any value needed only to make the flow realistic. A strong in-page blur is acceptable for ordinary personal data when the original value must remain in the live page for the flow to work.
- For browser capture, derive the cover from the element bounds and keep it current with DOM, resize, and scroll observation. Verify the first captured frame before continuing the flow.
- For native or remote surfaces where pre-capture element treatment is not reliable, use synthetic application data or a product-level demo/privacy mode. If neither is possible, treat the recording as existing footage and use the post-processing path below.
- Never place the original private value in telemetry, captions, filenames, mask IDs, mask reasons, logs, or render notes.

This follows Loom's safer model: private information is hidden before or during capture, so it does not enter the recording pixels.

## Existing footage: track and blur in post

Keep the original video local and ignored. Track each sensitive element in source-video coordinates, then blur it before camera polish, captions, or aspect-ratio reframing.

- Use one fixed rectangle only when the element is stationary for its full visible lifetime.
- Prefer exact element-bound samples recorded with the original interaction telemetry. When that is unavailable, use visual tracking with correction keyframes at scrolls, cuts, layout shifts, occlusions, and other points where the tracker can lose the element.
- Use a time-sorted rectangle track for moving or scrolling fields, menus, dialogs, toasts, and other changing surfaces. Between samples, cover the union of both positions rather than interpolating a narrow rectangle that can expose an edge.
- Add enough padding for shadows, antialiasing, and motion.
- Omit `startMs` and `endMs` when the field can appear at any point. The mask then covers the full recording by default.
- Never attach a mask to the final canvas. Put it inside the transformed screen layer so it stays aligned through camera movement, reframing, and every aspect ratio.
- Default to an opaque branded or neutral replacement for tokens, pairing codes, one-time codes, billing data, customer records, and any value whose disclosure would create security or legal risk.
- For ordinary personal data, use a strong blur that preserves the layout without exposing the value. A subtle tint can make the treatment cleaner, but it must not substitute for enough blur. Verify that the result stays unreadable at full resolution.
- Avoid light blur and coarse pixelation. Both can preserve length, color, character shape, or recognizable structure.
- Do not animate mask opacity. Start the mask before the sensitive element appears and end it after the element is gone. If the visibility window is not known with certainty, cover the full recording.
- Fail closed when tracking confidence drops: hold or widen the last safe region, switch to an opaque cover, or stop the render. Never reveal the original while searching for the element again.

The engine helpers `activePrivacyMasksAt`, `privacyMaskRectAt`, and `projectSourceRect` provide fail-closed tracked geometry. The product compositor owns the visual treatment.

## Review

- For a new capture, inspect the first raw frame before running the full interaction and confirm the sensitive pixels are already hidden.
- For existing footage, inspect the raw file locally and never upload it merely to obtain a blur effect.
- Inspect every rendered output, including the first frame where the screen appears, the first and last frame of each timed mask, every camera transition, and the final frame where the field remains visible.
- Scrub the whole timeline at speed as well as frame by frame. A mask that appears only in a feature callout or closing shot is a failed mask.
- Inspect every scroll, layout shift, occlusion, and tracker correction. Confirm the blur stays over the element rather than following the final canvas or an obsolete screen position.
- Check at full resolution and at the target player size. OCR can help find missed text, but it cannot replace visual review.
- Keep raw captures and renders in ignored local paths. If a raw recording contains a secret, do not upload it; rotate the secret if exposure extended beyond the controlled local workflow.
- Upload or publish only after the request's approval gate.
