/** Authored by Daniel Hallman. */
export type Rect = { x: number; y: number; width: number; height: number };
export type Point = { x: number; y: number };
export type TimedPoint = Point & { tMs: number };
export type TimedRect = Rect & { tMs: number };
export type Pose = { scale: number; cx: number; cy: number };

export type PrivacyTreatment = "solid" | "pixelate" | "blur";
export type PrivacyMask = {
  id: string;
  reason: string;
  startMs?: number;
  endMs?: number;
  rect?: Rect;
  rectTrack?: TimedRect[];
  paddingPx?: number;
  treatment?: PrivacyTreatment;
};

export type ActivePrivacyMask = {
  id: string;
  reason: string;
  rect: Rect;
  treatment: PrivacyTreatment;
};

export type ClickEvent = TimedPoint & {
  tDepartMs: number;
  rect: Rect;
  label: string;
  cluster: string;
  caption?: string;
  typeEndMs?: number;
  caretTrack?: TimedPoint[];
  interactionKind?: "control" | "typing" | "submit";
  interactionGroup?: string;
};

export type ClickLog = {
  name: string;
  viewport: { width: number; height: number };
  captureOffsetMs: number;
  durationMs: number;
  cursorTrack: TimedPoint[];
  clicks: ClickEvent[];
  privacyMasks?: PrivacyMask[];
};

export type ProductDemoStyle = {
  camera: {
    preRollMs: number;
    zoomInMs: number;
    holdAfterClickMs: number;
    releaseMs: number;
    sessionScale: number;
    maxBlurPx: number;
  };
  cursor: {
    maxSpeedPxPerSecond: number;
    minDurationMs: number;
    idleHoldMs: number;
    idleFadeMs: number;
    fadeInMs: number;
  };
  typing: {
    focusDelayMs: number;
    detailScaleMultiplier: number;
    caretCameraLagMs: number;
    fallbackCaretInsetPx: number;
    submitContextLeadMs: number;
    submitContextTransitionMs: number;
    submitContextSettleBeforeClickMs: number;
  };
  framing: {
    sourcePaddingPx: number;
    cursorEdgeMarginPx: number;
    persistentVerticalInsetPx: number;
    persistentCursorLagMs: number;
  };
};

export type OutputPreset = {
  width: number;
  height: number;
  frameInsetX: number;
  focusScale: number;
  interactionInset: number;
};

export type FramingMode = "overview" | "always-zoomed";
