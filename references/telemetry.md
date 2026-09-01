<!-- Authored by Daniel Hallman. -->

# Telemetry contract

Store all times as integer milliseconds from one monotonic recording start. Coordinates and target bounds use the source viewport coordinate space.

```json
{
  "name": "send-a-message",
  "viewport": { "width": 1600, "height": 900 },
  "captureOffsetMs": 120,
  "durationMs": 12800,
  "cursorTrack": [
    { "tMs": 0, "x": 80, "y": 760 }
  ],
  "clicks": [
    {
      "tDepartMs": 2050,
      "tMs": 3268,
      "x": 652,
      "y": 691,
      "rect": { "x": 600, "y": 670, "width": 104, "height": 42 },
      "label": "Open the provider picker",
      "cluster": "provider",
      "caption": "Choose a sending account",
      "typeEndMs": null,
      "interactionKind": "control",
      "interactionGroup": null
    }
  ],
  "privacyMasks": [
    {
      "id": "account-email",
      "reason": "personal identifier",
      "treatment": "solid",
      "paddingPx": 8,
      "rect": { "x": 1210, "y": 24, "width": 240, "height": 28 }
    }
  ]
}
```

## Invariants

- `durationMs` is positive.
- The viewport is positive and matches the captured video.
- Cursor samples and clicks are time-sorted and fall within the duration.
- Cursor and click coordinates remain inside the viewport.
- A target rectangle has positive width and height.
- `tDepartMs <= tMs`.
- `typeEndMs`, when present, is not earlier than `tMs` and does not exceed the duration.
- `caretTrack`, on a `typing` event, contains time-sorted caret-center samples within the typing span and source viewport. Record a sample after each character when possible.
- `label` describes the action; `cluster` groups clicks that should share one camera pose.
- `interactionKind` is `control`, `typing`, or `submit`. Use `typing` and `submit` only for linked text-entry flows.
- A linked typing and submit pair shares one non-empty `interactionGroup`. This drives the close typing detail and the full field-plus-button pose before submission; camera code must not guess from labels.
- Captions are optional and should add meaning rather than restate a visible button label.
- `privacyMasks` is optional. Each mask has a unique non-sensitive `id`, a data-category `reason`, an optional active time span, and exactly one fixed `rect` or time-sorted `rectTrack`.
- Privacy rectangles stay inside the source viewport. The renderer projects them through the same camera pose as the source and never fades them on or off.
- `solid` is the safe default. Use blur or pixelation only when exposing shape or length cannot reveal useful information.

Run:

```bash
node <skill-dir>/scripts/validate-telemetry.mjs path/to/demo.telemetry.json
```

The validator checks the structural and timing invariants. It cannot prove that the named action or success state is true; verify those against the real capture.

Older captures without caret samples may use a renderer's documented timed field-position fallback. New `typing` telemetry must include the real caret track.
