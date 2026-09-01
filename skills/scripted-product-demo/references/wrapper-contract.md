<!-- Authored by Daniel Hallman. -->

# Wrapper contract

The core skill owns capture and rendering. A wrapper owns audience and channel decisions.

## Wrapper input

A wrapper should hand the core a settled recording brief with:

- `product`: product and environment;
- `flow`: ordered visible actions;
- `success_state`: visible proof that the flow worked;
- `claims`: facts the recording may show or state;
- `limitations`: boundaries that must remain clear;
- `test_data`: fictional identities and controlled recipients;
- `viewport`: source width and height;
- `output`: aspect ratio, resolution, frame rate, and duration target;
- `brand`: source files or tokens for the frame;
- `captions`: none, action labels, or supplied timed captions;
- `click_audio`: canonical, supplied, or none;
- `presenter_keep_out`: optional screen region reserved by a wrapper for a camera bubble;
- `required_holds`: results that need extra reading time;
- `authorized_mutations`: explicit live actions already approved by the surrounding task.

The wrapper may also supply a script and edit map. The core must not rewrite the story, add platform claims, or decide publication policy.

## Core output

Return:

- a clean source capture;
- telemetry JSON;
- a polished screen-only MP4;
- render notes with timing, cadence, audio provenance, and known limits;
- optional transparent or composited layers when the wrapper needs captions or presenter footage;
- QA evidence for click sync, audio peak, cursor motion, camera transitions, and final framing.

The core does not upload, publish, add narration, create a presenter, or certify compliance unless the calling request separately asks for that work.

## Suggested wrappers

- `youtube-product-demo`: story, title, narration, thumbnail, chapters, and upload.
- `personal-brand-demo`: presenter camera, personal voice, vertical derivatives, and social copy.
- `ghl-marketplace-demo`: current Marketplace rules, listing cut, reviewer-evidence shot list, and submission fields.

Each wrapper should invoke or instruct the use of `$product-demo` for the screen-recording phase instead of copying its motion rules.
