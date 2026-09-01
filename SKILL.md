---
name: product-demo
description: Record and render polished, Screen Studio-style walkthroughs of a real product with interaction telemetry, a smooth synthetic cursor, stable click-focused camera moves, tactile click feedback, and reproducible landscape, portrait, or square MP4 output. Use for real product screen recordings that need automated capture and motion polish. Do not use for a fully animated promo with no real product interaction.
---

# Product Demo

Create a clear, polished walkthrough from real product interactions. Treat the running product and its verified documentation as the source of truth. Never fabricate screens, delivery states, permissions, results, analytics, contacts, or capabilities.

## Accept the recording brief

Resolve from the request, calling wrapper, and repo before asking the user:

- product and one core outcome;
- exact flow and success state;
- duration, aspect ratio, and export resolution;
- captions and click-sound choices;
- brand source of truth;
- fictional test account and controlled recipients;
- claims and limitations that affect the visible flow;
- whether any click causes a live send, purchase, publish, deletion, or other external change.

Audience, story, presenter, narration, music, publishing, and platform-review policy belong to a calling wrapper when one is used. Read [references/wrapper-contract.md](references/wrapper-contract.md) when another skill hands off the recording or when building a new wrapper.

External actions still need the authority required by the surrounding task. Recording a demo does not itself authorize a live send, purchase, publication, or production mutation.

## Capture the real flow

Use the product's real test environment and the most reliable browser or native-app automation available. Keep secrets and session state out of commands, telemetry, screenshots, and git.

Capture a stable product viewport and log, on the same monotonic clock:

- source-frame timestamps;
- cursor samples;
- intentional click time and coordinates;
- target bounds, action label, and related-click cluster;
- typing start and end;
- named result beats and optional captions.

Hide the native cursor when practical and reconstruct it from telemetry. A click should be recorded only when it advances the story; do not log setup clicks, hover probes, or cleanup movements.

Read [references/telemetry.md](references/telemetry.md) when creating or adapting a recorder. Validate the resulting JSON with `scripts/validate-telemetry.mjs`.

## Motion and framing

Use one stable camera pose for a related click session:

- begin the zoom about two seconds before the first click;
- settle 0.3–0.6 seconds before the click;
- hold at least two seconds after the last click or result;
- let a new nearby click extend the same session and reset the hold;
- ease the camera in and out; never retarget on every DOM repaint;
- keep settled text sharp and disable camera blur when transformed UI shimmers;
- keep the full UI visible long enough to establish context before the first zoom.

Smooth the synthetic cursor with a zero-velocity ease, cap its speed, and fade it after a short idle hold. Leave it on the completed action until it fades. Never move it away merely to clear the frame. Add a 300–400 ms focus pause after selecting a text field before typing begins.

Read [references/motion-and-capture.md](references/motion-and-capture.md) for the full timing preset, cadence rules, and jitter checks.

## Reframe for each output

When the brief needs more than one aspect ratio, capture the real flow once and render each format from the same source frames and telemetry. Use standard masters unless the calling wrapper specifies another platform requirement:

- landscape: 1920x1080;
- portrait: 1080x1920;
- square: 1080x1080.

Begin every version with the complete product view. During action beats, map the recorded target bounds and camera focus into that format instead of stretching the footage or applying one fixed center crop. Portrait usually needs a stronger settled zoom than landscape so the active text and controls remain readable on a phone. Keep captions inside the target platform's safe area and inspect each version independently.

## Click feedback

Drive the ripple, cursor press, and sound from the same click timestamp. Do not use recorded system audio as the timing source.

The skill uses a canonical permissively licensed mouse click when available, but does not redistribute the source file. Read [references/click-audio.md](references/click-audio.md) and run `scripts/prepare-click-audio.sh` to verify, trim, normalize, and convert it for rendering.

## Render

Prefer a repo-native, reproducible renderer. A typical implementation uses Playwright or native automation for capture and Remotion or an equivalent deterministic compositor for the final MP4.

Keep style values in one preset:

- camera timing and scale;
- cursor speed, easing, tilt, trail, and idle fade;
- click sound level, ripple, and press duration;
- frame background, padding, corners, border, and shadow;
- caption placement and lifetime;
- typing delay;
- source and export cadence.

Match output cadence to source cadence or use an integer multiple. Do not stretch a low-rate recording into 60 fps with uneven repeated frames. Use a product-branded frame only when it leaves the product text large enough to read.

## Inspect before delivery

Run tests and type checks, then render every requested real MP4. Inspect:

- the opening and final frames;
- every zoom transition;
- every click, ripple, press, and sound;
- cursor paths and idle fades;
- typing focus delay;
- result holds;
- private-data masks;
- audio peaks and clipping;
- text sharpness and any UI jitter;
- action framing, caption safe areas, and readability in every aspect ratio;
- the target platform's actual player or upload preview when available.

Fix visible timing, framing, cursor, privacy, or audio faults before reporting completion. A successful render command is not visual QA.

## Outputs and privacy

Use ignored repo-local directories for source captures and renders. Produce at minimum:

- final MP4;
- click and cursor telemetry JSON;
- render notes with source, cadence, style preset, audio provenance, and known limits.

Never commit authenticated profiles, raw private recordings, generated videos, phone numbers, contact data, tokens, pairing codes, OAuth values, or licensed source audio that cannot be redistributed on its own.
