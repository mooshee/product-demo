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
      "typeEndMs": null
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
- `label` describes the action; `cluster` groups clicks that should share one camera pose.
- Captions are optional and should add meaning rather than restate a visible button label.

Run:

```bash
node <skill-dir>/scripts/validate-telemetry.mjs path/to/demo.telemetry.json
```

The validator checks the structural and timing invariants. It cannot prove that the named action or success state is true; verify those against the real capture.
