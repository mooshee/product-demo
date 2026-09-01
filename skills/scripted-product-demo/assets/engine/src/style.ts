/** Authored by Daniel Hallman. */
import type { OutputPreset, ProductDemoStyle } from "./types.js";

export const DEFAULT_DEMO_STYLE: ProductDemoStyle = {
  camera: {
    preRollMs: 2_000,
    zoomInMs: 1_400,
    holdAfterClickMs: 2_000,
    releaseMs: 1_400,
    sessionScale: 2,
    maxBlurPx: 1.15,
  },
  cursor: {
    maxSpeedPxPerSecond: 800,
    minDurationMs: 420,
    idleHoldMs: 650,
    idleFadeMs: 260,
    fadeInMs: 180,
  },
  typing: {
    focusDelayMs: 420,
    detailScaleMultiplier: 1.8,
    caretCameraLagMs: 140,
    fallbackCaretInsetPx: 36,
    submitContextLeadMs: 2_000,
    submitContextTransitionMs: 1_600,
    submitContextSettleBeforeClickMs: 400,
  },
  framing: {
    sourcePaddingPx: 48,
    cursorEdgeMarginPx: 30,
    persistentVerticalInsetPx: 54,
    persistentCursorLagMs: 180,
  },
};

export const DEFAULT_OUTPUT_PRESETS = {
  auto: { width: 1_920, height: 1_080, frameInsetX: 64, focusScale: 2, interactionInset: 88 },
  landscape: { width: 1_920, height: 1_080, frameInsetX: 64, focusScale: 2, interactionInset: 88 },
  portrait: { width: 1_080, height: 1_920, frameInsetX: 48, focusScale: 5.2, interactionInset: 90 },
  square: { width: 1_080, height: 1_080, frameInsetX: 48, focusScale: 2, interactionInset: 78 },
  classic: { width: 1_440, height: 1_080, frameInsetX: 56, focusScale: 2.3, interactionInset: 82 },
  tall: { width: 1_080, height: 1_440, frameInsetX: 48, focusScale: 4.2, interactionInset: 86 },
} satisfies Record<string, OutputPreset>;
