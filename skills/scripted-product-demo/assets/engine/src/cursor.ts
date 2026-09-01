/** Authored by Daniel Hallman. */
import { clamp01, easeInOutCubic, easeOutCubic } from "./math.js";
import type { ClickEvent, ProductDemoStyle, TimedPoint } from "./types.js";

const SMOOTHERSTEP_PEAK_SLOPE = 1.875;

export const cursorDurationMs = (
  distancePx: number,
  style: ProductDemoStyle,
) => Math.max(
  style.cursor.minDurationMs,
  Math.max(0, distancePx) * SMOOTHERSTEP_PEAK_SLOPE * 1_000
    / style.cursor.maxSpeedPxPerSecond,
);

export const pointAt = (timeMs: number, samples: TimedPoint[]) => {
  if (samples.length === 0) return { x: 0, y: 0 };
  const nextIndex = samples.findIndex((sample) => sample.tMs >= timeMs);
  if (nextIndex === -1) return samples[samples.length - 1];
  if (nextIndex <= 0) return samples[Math.max(0, nextIndex)];
  const a = samples[nextIndex - 1];
  const b = samples[nextIndex];
  const progress = clamp01((timeMs - a.tMs) / Math.max(1, b.tMs - a.tMs));
  return { x: a.x + (b.x - a.x) * progress, y: a.y + (b.y - a.y) * progress };
};

const movementTimes = (samples: TimedPoint[]) => samples.flatMap((sample, index) => {
  const previous = samples[index - 1];
  if (!previous || Math.hypot(sample.x - previous.x, sample.y - previous.y) < 0.35) return [];
  return [sample.tMs];
});

export const cursorOpacityAt = (
  timeMs: number,
  samples: TimedPoint[],
  style: ProductDemoStyle,
) => {
  const activity = movementTimes(samples);
  const last = [...activity].reverse().find((sampleTime) => sampleTime <= timeMs);
  const next = activity.find((sampleTime) => sampleTime > timeMs);
  const fadeOut = last === undefined
    ? 0
    : 1 - easeInOutCubic(
      (timeMs - last - style.cursor.idleHoldMs) / style.cursor.idleFadeMs,
    );
  const fadeIn = next === undefined
    ? 0
    : 1 - easeInOutCubic((next - timeMs) / style.cursor.fadeInMs);
  return Math.max(clamp01(fadeOut), clamp01(fadeIn));
};

export const cursorVelocityAt = (timeMs: number, samples: TimedPoint[]) => {
  const before = pointAt(Math.max(0, timeMs - 32), samples);
  const after = pointAt(timeMs + 32, samples);
  return { x: (after.x - before.x) / 0.064, y: (after.y - before.y) / 0.064 };
};

export const cursorPressScaleAt = (timeMs: number, clicks: ClickEvent[]) => {
  const click = [...clicks].reverse().find(({ tMs }) => tMs <= timeMs);
  if (!click) return 1;
  const age = timeMs - click.tMs;
  if (age > 190) return 1;
  if (age <= 65) return 1 + (0.86 - 1) * easeOutCubic(age / 65);
  return 0.86 + (1 - 0.86) * easeOutCubic((age - 65) / 125);
};
