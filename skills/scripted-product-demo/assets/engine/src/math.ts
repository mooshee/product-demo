/** Authored by Daniel Hallman. */
import type { Pose } from "./types.js";

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const smootherstep = (progress: number) => {
  const p = clamp01(progress);
  return p * p * p * (p * (p * 6 - 15) + 10);
};

export const easeInOutCubic = (progress: number) => {
  const p = clamp01(progress);
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
};

export const easeOutCubic = (progress: number) => 1 - Math.pow(1 - clamp01(progress), 3);

export const mixPose = (from: Pose, to: Pose, progress: number): Pose => ({
  scale: from.scale + (to.scale - from.scale) * progress,
  cx: from.cx + (to.cx - from.cx) * progress,
  cy: from.cy + (to.cy - from.cy) * progress,
});
