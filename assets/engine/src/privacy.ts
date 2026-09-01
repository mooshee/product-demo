/** Authored by Daniel Hallman. */
import type {
  ActivePrivacyMask,
  OutputPreset,
  Pose,
  PrivacyMask,
  Rect,
} from "./types.js";

const unionRects = (a: Rect, b: Rect): Rect => {
  const left = Math.min(a.x, b.x);
  const top = Math.min(a.y, b.y);
  const right = Math.max(a.x + a.width, b.x + b.width);
  const bottom = Math.max(a.y + a.height, b.y + b.height);
  return { x: left, y: top, width: right - left, height: bottom - top };
};

const expandRect = (rect: Rect, paddingPx: number): Rect => ({
  x: rect.x - paddingPx,
  y: rect.y - paddingPx,
  width: rect.width + paddingPx * 2,
  height: rect.height + paddingPx * 2,
});

export const privacyMaskRectAt = (
  timeMs: number,
  mask: PrivacyMask,
): Rect | undefined => {
  if (timeMs < (mask.startMs ?? 0) || timeMs > (mask.endMs ?? Number.POSITIVE_INFINITY)) {
    return undefined;
  }

  let rect = mask.rect;
  const track = mask.rectTrack;
  if (track?.length) {
    const nextIndex = track.findIndex((sample) => sample.tMs >= timeMs);
    if (nextIndex < 0) rect = track.at(-1);
    else if (nextIndex === 0) rect = track[0];
    else rect = unionRects(track[nextIndex - 1], track[nextIndex]);
  }
  const defaultPaddingPx = mask.treatment === "blur" ? 0 : 8;
  return rect ? expandRect(rect, Math.max(0, mask.paddingPx ?? defaultPaddingPx)) : undefined;
};

export const activePrivacyMasksAt = (
  timeMs: number,
  masks: PrivacyMask[] = [],
): ActivePrivacyMask[] => masks.flatMap((mask) => {
  const rect = privacyMaskRectAt(timeMs, mask);
  return rect
    ? [{
      id: mask.id,
      reason: mask.reason,
      rect,
      treatment: mask.treatment ?? "solid",
    }]
    : [];
});

export const projectSourceRect = (
  rect: Rect,
  pose: Pose,
  output: OutputPreset,
  viewport: { width: number; height: number },
): Rect => {
  const planeWidth = output.width - output.frameInsetX * 2;
  const planeHeight = planeWidth * viewport.height / viewport.width;
  const left = output.width / 2
    + (rect.x / viewport.width - pose.cx) * planeWidth * pose.scale;
  const top = output.height / 2
    + (rect.y / viewport.height - pose.cy) * planeHeight * pose.scale;
  return {
    x: left,
    y: top,
    width: rect.width / viewport.width * planeWidth * pose.scale,
    height: rect.height / viewport.height * planeHeight * pose.scale,
  };
};
