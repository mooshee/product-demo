<!-- Authored by Daniel Hallman. -->

# Motion and capture

This preset captures the useful parts of Screen Studio-style product recordings without copying its interface or forcing every feature into each video.

## Capture cadence

- Use one monotonic clock for frames, cursor samples, clicks, and typing spans.
- Prefer a high-rate browser screencast or native capture when a default recorder cannot supply the intended cadence.
- Assemble variable-rate capture frames by their actual wall-clock duration before compositing.
- Export at the source rate or an integer multiple. A 60 fps source to 60 fps output is the safest default for UI motion.
- Do not interpolate UI frames with optical flow; it can bend text and cursor edges.

## Camera preset

- Establish the full product at 1× for at least 0.6 seconds.
- Start the camera move roughly 2.0 seconds before the first intentional click when the cut has enough lead time.
- Use 1.0–1.5 seconds for a smooth ease-in and leave 0.3–0.6 seconds settled before the click.
- Hold at least 2.0 seconds after the last click or visible result.
- Use 1.0–1.5 seconds for the ease-out.
- Group related clicks. A new click in the same region extends the session and resets the result hold.
- Start around 1.6–1.9× for dense desktop UI, then adjust to preserve target context and readable copy.
- Derive the session focus from target bounds, but allow a manual safe-frame override when the average clips important content.
- Build the safe frame from the union of every active target rectangle and the cursor samples used after the camera settles. Keep a focused text field protected until its typing span ends.
- Cap the requested zoom at the largest scale that fits that safe frame with room for the cursor. A smaller readable zoom is better than a clipped field or pointer.
- While easing in, constrain the moving pointer to the frame edge if needed. Do not chase it once the camera reaches the stable session pose.

The camera transform must depend on telemetry and time, not transient DOM layout changes. UI repainting must not change the computed pose.

## Aspect-ratio reframing

- Capture the real product once at a stable source viewport; reuse its frames and telemetry for each requested master.
- Use 1920x1080 for landscape, 1080x1920 for portrait, and 1080x1080 for square unless the target platform specifies another resolution.
- Show the full source view at rest so viewers understand the product context.
- Map the settled focus scale per output. A dense desktop source may need roughly 3x or more in portrait while 1.6-1.9x remains suitable in landscape and square.
- Center the recorded action target inside the available output, then clamp only enough to avoid exposing empty source bounds.
- Do not stretch the source, use optical-flow interpolation, or apply the same fixed center crop to every format.
- Keep portrait captions away from the bottom and right-edge controls used by short-form mobile players.
- Review each output at its intended display size; a crop that is legible on a desktop preview may still fail on a phone.

## Cursor preset

- Reconstruct a vector cursor from telemetry and hide the captured cursor.
- Use a smootherstep or equivalent path with zero velocity at both ends.
- Cap peak speed. Around 700–900 source pixels per second is a useful desktop starting point.
- Use a minimum movement duration around 0.4 seconds so short moves still feel deliberate.
- Fade after 0.6–0.9 seconds idle; fade back in 0.15–0.25 seconds before meaningful movement.
- Keep travel tilt under roughly five degrees.
- Use a faint motion trail only above a speed threshold.
- After the last action, leave the pointer on the completed control and let it fade. Remove telemetry that does not serve an action.
- Cursor interpolation after the final telemetry timestamp must return the final sample, never the first sample or a default position.

## Click and typing treatment

- Derive cursor press, ripple, sound, and caption from one click timestamp.
- Keep the ripple in a fixed box and animate only transform and opacity.
- Use a quick cursor compression and release under 0.2 seconds.
- Play the complete click transient; do not cut a press/release sample to an arbitrary frame count.
- Pause 0.3–0.4 seconds after focusing a field before typing.
- Type through the real UI at a short fixed delay or time-compress a logged typing span. Do not replace the UI with fabricated text.

## Prevent jitter

- Keep one camera pose through a click cluster.
- Disable camera blur on dense rasterized text if it shimmers.
- Use `translate3d` and a stable transform origin.
- Avoid per-frame layout changes to the capture container, border radius, shadow, or ripple dimensions.
- Match the capture and export clocks.
- Inspect frames immediately before, during, and after each click and UI state change.

## Reference sources

- Screen Studio guide: https://screen.studio/guide
- Auto zoom: https://screen.studio/guide/auto-zoom
- Cursor controls: https://screen.studio/guide/cursor
- Background framing: https://screen.studio/guide/background
- Typing speed: https://screen.studio/guide/speed-up-typing-segments
- Export settings: https://screen.studio/guide/explanation-of-export-settings

These sources inform the motion grammar. Do not copy Screen Studio branding, UI, or proprietary assets.
