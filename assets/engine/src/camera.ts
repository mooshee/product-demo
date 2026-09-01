/** Authored by Daniel Hallman. */
import { pointAt } from "./cursor.js";
import { clamp01, easeInOutCubic, mixPose, smootherstep } from "./math.js";
import type {
  ClickEvent,
  ClickLog,
  FramingMode,
  OutputPreset,
  Point,
  Pose,
  ProductDemoStyle,
  Rect,
} from "./types.js";

const BASE_POSE: Pose = { scale: 1, cx: 0.5, cy: 0.5 };

export const createProductDemoEngine = <TFormat extends string>(options: {
  style: ProductDemoStyle;
  formats: Record<TFormat, OutputPreset>;
}) => {
  const { style, formats } = options;
  const sessionGapMs = style.camera.preRollMs
    + style.camera.holdAfterClickMs
    + style.camera.releaseMs;

  const formatFor = (format: TFormat) => formats[format];
  const screenPlaneSize = (output: OutputPreset, viewport: ClickLog["viewport"]) => {
    const width = output.width - output.frameInsetX * 2;
    return { width, height: width * viewport.height / viewport.width };
  };
  const clampFocus = (center: number, visibleFraction: number) => {
    if (visibleFraction >= 1) return 0.5;
    const low = visibleFraction / 2;
    const high = 1 - visibleFraction / 2;
    return Math.min(high, Math.max(low, center));
  };
  const unionRects = (rects: Rect[]): Rect => {
    const left = Math.min(...rects.map((rect) => rect.x));
    const top = Math.min(...rects.map((rect) => rect.y));
    const right = Math.max(...rects.map((rect) => rect.x + rect.width));
    const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));
    return { x: left, y: top, width: right - left, height: bottom - top };
  };

  const cameraSessionsFor = (log: ClickLog) => {
    const sessions: ClickEvent[][] = [];
    for (const event of [...log.clicks].sort((a, b) => a.tMs - b.tMs)) {
      const current = sessions.at(-1);
      const previous = current?.at(-1);
      if (!current || !previous || event.tMs - previous.tMs > sessionGapMs) sessions.push([event]);
      else current.push(event);
    }
    return sessions;
  };

  const cameraSessionWindow = (events: ClickEvent[]) => {
    const first = events[0];
    const last = events.at(-1)!;
    const start = Math.max(0, first.tMs - style.camera.preRollMs);
    const arriveAt = Math.min(first.tMs, start + style.camera.zoomInMs);
    const holdUntil = Math.max(
      last.typeEndMs ?? last.tMs,
      last.tMs + style.camera.holdAfterClickMs,
    );
    return { start, arriveAt, holdUntil, end: holdUntil + style.camera.releaseMs };
  };

  const cameraSessionAt = (timeMs: number, log: ClickLog) => cameraSessionsFor(log).find((events) => {
    const { start, end } = cameraSessionWindow(events);
    return timeMs >= start && timeMs <= end;
  });

  const cameraSessionBounds = (events: ClickEvent[], log: ClickLog): Rect => {
    const { arriveAt, holdUntil } = cameraSessionWindow(events);
    const cursorRects = log.cursorTrack
      .filter((sample) => sample.tMs >= arriveAt && sample.tMs <= holdUntil)
      .map((sample) => ({ x: sample.x, y: sample.y, width: 0, height: 0 }));
    const clickRects = events.flatMap((event) => [
      event.rect,
      { x: event.x, y: event.y, width: 0, height: 0 },
    ]);
    return unionRects([...clickRects, ...cursorRects]);
  };

  const cameraPoseAt = (timeMs: number, log: ClickLog): Pose => {
    const session = cameraSessionAt(timeMs, log);
    if (!session) return BASE_POSE;
    const { start, arriveAt, holdUntil, end } = cameraSessionWindow(session);
    const focus = session.reduce(
      (sum, event) => ({
        x: sum.x + event.rect.x + event.rect.width / 2,
        y: sum.y + event.rect.y + event.rect.height / 2,
      }),
      { x: 0, y: 0 },
    );
    const target: Pose = {
      scale: style.camera.sessionScale,
      cx: focus.x / session.length / log.viewport.width,
      cy: focus.y / session.length / log.viewport.height,
    };
    if (timeMs <= arriveAt) {
      const progress = easeInOutCubic((timeMs - start) / Math.max(1, arriveAt - start));
      return mixPose(BASE_POSE, target, progress);
    }
    if (timeMs <= holdUntil) return target;
    const progress = easeInOutCubic((timeMs - holdUntil) / Math.max(1, end - holdUntil));
    return mixPose(target, BASE_POSE, progress);
  };

  const capScaleToKeepPoint = (
    pose: Pose,
    point: Point,
    output: OutputPreset,
    viewport: ClickLog["viewport"],
    marginPx = style.framing.cursorEdgeMarginPx,
  ): Pose => {
    const plane = screenPlaneSize(output, viewport);
    const dx = Math.abs(point.x / viewport.width - pose.cx) * plane.width;
    const dy = Math.abs(point.y / viewport.height - pose.cy) * plane.height;
    const maxX = dx === 0 ? Number.POSITIVE_INFINITY : (output.width / 2 - marginPx) / dx;
    const maxY = dy === 0 ? Number.POSITIVE_INFINITY : (output.height / 2 - marginPx) / dy;
    return { ...pose, scale: Math.max(1, Math.min(pose.scale, maxX, maxY)) };
  };

  const shiftPoseToKeepPoint = (
    pose: Pose,
    point: Point,
    output: OutputPreset,
    viewport: ClickLog["viewport"],
  ): Pose => {
    const plane = screenPlaneSize(output, viewport);
    const margin = style.framing.cursorEdgeMarginPx;
    const halfX = (output.width / 2 - margin) / (plane.width * pose.scale);
    const halfY = (output.height / 2 - margin) / (plane.height * pose.scale);
    const x = point.x / viewport.width;
    const y = point.y / viewport.height;
    return {
      ...pose,
      cx: Math.min(x + halfX, Math.max(x - halfX, pose.cx)),
      cy: Math.min(y + halfY, Math.max(y - halfY, pose.cy)),
    };
  };

  const capScaleToKeepRect = (
    pose: Pose,
    rect: Rect,
    output: OutputPreset,
    viewport: ClickLog["viewport"],
  ) => [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x, y: rect.y + rect.height },
    { x: rect.x + rect.width, y: rect.y + rect.height },
  ].reduce(
    (safePose, point) => capScaleToKeepPoint(
      safePose,
      point,
      output,
      viewport,
      output.interactionInset,
    ),
    pose,
  );

  const revealRectFromPoint = (
    rect: Rect,
    point: Point,
    progress: number,
  ): Rect => {
    const right = rect.x + rect.width;
    const bottom = rect.y + rect.height;
    const x = point.x + (rect.x - point.x) * progress;
    const y = point.y + (rect.y - point.y) * progress;
    return {
      x,
      y,
      width: point.x + (right - point.x) * progress - x,
      height: point.y + (bottom - point.y) * progress - y,
    };
  };

  const fitScaleForBounds = (
    bounds: Rect,
    output: OutputPreset,
    viewport: ClickLog["viewport"],
  ) => {
    const plane = screenPlaneSize(output, viewport);
    const paddedWidth = Math.max(1, bounds.width + style.framing.sourcePaddingPx * 2);
    const paddedHeight = Math.max(1, bounds.height + style.framing.sourcePaddingPx * 2);
    const usableWidth = output.width - output.interactionInset * 2;
    const usableHeight = output.height - output.interactionInset * 2;
    return Math.max(1, Math.min(
      output.focusScale,
      usableWidth / (paddedWidth / viewport.width * plane.width),
      usableHeight / (paddedHeight / viewport.height * plane.height),
    ));
  };

  const poseForBounds = (
    bounds: Rect,
    scale: number,
    output: OutputPreset,
    viewport: ClickLog["viewport"],
  ): Pose => {
    const plane = screenPlaneSize(output, viewport);
    return {
      scale,
      cx: clampFocus(
        (bounds.x + bounds.width / 2) / viewport.width,
        output.width / (plane.width * scale),
      ),
      cy: clampFocus(
        (bounds.y + bounds.height / 2) / viewport.height,
        output.height / (plane.height * scale),
      ),
    };
  };

  const typingCaretAt = (timeMs: number, typing: ClickEvent): Point => {
    const laggedTime = Math.max(typing.tMs, timeMs - style.typing.caretCameraLagMs);
    if (typing.caretTrack?.length) return pointAt(laggedTime, typing.caretTrack);
    const inset = Math.min(style.typing.fallbackCaretInsetPx, typing.rect.width * 0.2);
    const startsAt = typing.tMs + style.typing.focusDelayMs;
    const progress = smootherstep(
      (laggedTime - startsAt) / Math.max(1, (typing.typeEndMs ?? startsAt) - startsAt),
    );
    return {
      x: typing.rect.x + inset + (typing.rect.width - inset * 2) * progress,
      y: typing.rect.y + typing.rect.height / 2,
    };
  };

  const typingSubmitSequenceAt = (timeMs: number, events: ClickEvent[]) => {
    for (let index = events.length - 2; index >= 0; index -= 1) {
      const typing = events[index];
      if (typing.typeEndMs === undefined || timeMs < typing.tDepartMs) continue;
      const explicitSubmitIndex = events.findIndex((candidate, candidateIndex) =>
        candidateIndex > index
        && candidate.interactionKind === "submit"
        && candidate.interactionGroup !== undefined
        && candidate.interactionGroup === typing.interactionGroup
      );
      const submitIndex = explicitSubmitIndex >= 0
        ? explicitSubmitIndex
        : typing.interactionKind === undefined
          ? index + 1
          : -1;
      const submit = events[submitIndex];
      const following = events[submitIndex + 1];
      if (submit && timeMs <= (following?.tDepartMs ?? Number.POSITIVE_INFINITY)) {
        return { typing, submit };
      }
    }
    return undefined;
  };

  const alwaysZoomedScaleFor = (log: ClickLog, format: TFormat) => {
    const output = formatFor(format);
    const plane = screenPlaneSize(output, log.viewport);
    return Math.min(output.focusScale, Math.max(
      1,
      (output.width - output.frameInsetX * 2) / plane.width,
      (output.height - style.framing.persistentVerticalInsetPx * 2) / plane.height,
    ));
  };

  const alwaysZoomedPoseAt = (timeMs: number, log: ClickLog, format: TFormat) => {
    const output = formatFor(format);
    const plane = screenPlaneSize(output, log.viewport);
    const scale = alwaysZoomedScaleFor(log, format);
    const pointer = pointAt(
      Math.max(0, timeMs - style.framing.persistentCursorLagMs),
      log.cursorTrack,
    );
    return shiftPoseToKeepPoint({
      scale,
      cx: clampFocus(pointer.x / log.viewport.width, output.width / (plane.width * scale)),
      cy: clampFocus(pointer.y / log.viewport.height, output.height / (plane.height * scale)),
    }, pointer, output, log.viewport);
  };

  const cameraFrameAt = (
    timeMs: number,
    log: ClickLog,
    format: TFormat,
    framingMode: FramingMode = "overview",
  ): Pose => {
    const timedPose = cameraPoseAt(timeMs, log);
    const timedSession = cameraSessionAt(timeMs, log);
    const lastSession = cameraSessionsFor(log).at(-1);
    const lastWindow = lastSession ? cameraSessionWindow(lastSession) : undefined;
    const terminalHold = framingMode === "always-zoomed"
      && lastSession !== undefined
      && lastWindow !== undefined
      && timeMs > lastWindow.holdUntil;
    const session = timedSession ?? (terminalHold ? lastSession : undefined);
    const restPose = framingMode === "always-zoomed"
      ? alwaysZoomedPoseAt(timeMs, log, format)
      : BASE_POSE;
    if (!session || (timedPose.scale === 1 && !terminalHold)) return restPose;

    const output = formatFor(format);
    const bounds = cameraSessionBounds(session, log);
    const settledScale = fitScaleForBounds(bounds, output, log.viewport);
    const progress = terminalHold
      ? 1
      : clamp01((timedPose.scale - 1) / (style.camera.sessionScale - 1));
    const target = poseForBounds(bounds, settledScale, output, log.viewport);
    const interactionPose = mixPose(restPose, target, progress);
    const pointer = pointAt(timeMs, log.cursorTrack);
    let pointerSafePose = capScaleToKeepRect(
      interactionPose,
      revealRectFromPoint(bounds, pointer, progress),
      output,
      log.viewport,
    );
    pointerSafePose = framingMode === "always-zoomed"
      ? shiftPoseToKeepPoint(pointerSafePose, pointer, output, log.viewport)
      : capScaleToKeepPoint(pointerSafePose, pointer, output, log.viewport);

    const sequence = typingSubmitSequenceAt(timeMs, session);
    if (!sequence) return pointerSafePose;
    const { typing, submit } = sequence;
    const submitBounds = unionRects([
      typing.rect,
      submit.rect,
      { x: typing.x, y: typing.y, width: 0, height: 0 },
      { x: submit.x, y: submit.y, width: 0, height: 0 },
    ]);
    const submitScale = fitScaleForBounds(submitBounds, output, log.viewport);
    const submitPose = capScaleToKeepRect(
      poseForBounds(submitBounds, submitScale, output, log.viewport),
      submitBounds,
      output,
      log.viewport,
    );
    const typingScale = Math.min(
      output.focusScale,
      Math.max(restPose.scale, submitPose.scale * style.typing.detailScaleMultiplier),
    );
    const caret = typingCaretAt(timeMs, typing);
    const caretPose = poseForBounds(
      { x: caret.x, y: caret.y, width: 0, height: 0 },
      typingScale,
      output,
      log.viewport,
    );
    const mouseSafe = shiftPoseToKeepPoint(caretPose, pointer, output, log.viewport);
    const caretTakeover = smootherstep((timeMs - typing.tMs) / style.typing.focusDelayMs);
    const typingPose = mixPose(mouseSafe, caretPose, caretTakeover);
    const detailProgress = smootherstep(
      (timeMs - typing.tDepartMs) / Math.max(1, typing.tMs - typing.tDepartMs),
    );
    const detailedPose = mixPose(pointerSafePose, typingPose, detailProgress);
    const settleAt = submit.tMs - style.typing.submitContextSettleBeforeClickMs;
    const pullbackStart = Math.max(
      typing.typeEndMs!,
      submit.tMs - style.typing.submitContextLeadMs,
      settleAt - style.typing.submitContextTransitionMs,
    );
    if (timeMs <= pullbackStart) return detailedPose;
    const pullback = smootherstep((timeMs - pullbackStart) / Math.max(1, settleAt - pullbackStart));
    return mixPose(typingPose, submitPose, pullback);
  };

  const visibleSourceBounds = (
    pose: Pose,
    format: TFormat,
    viewport: ClickLog["viewport"],
  ): Rect => {
    const output = formatFor(format);
    const plane = screenPlaneSize(output, viewport);
    const width = Math.min(viewport.width, output.width / (plane.width * pose.scale) * viewport.width);
    const height = Math.min(viewport.height, output.height / (plane.height * pose.scale) * viewport.height);
    return {
      x: width === viewport.width ? 0 : pose.cx * viewport.width - width / 2,
      y: height === viewport.height ? 0 : pose.cy * viewport.height - height / 2,
      width,
      height,
    };
  };

  const cameraBlurAt = (timeMs: number, log: ClickLog) => {
    const before = cameraPoseAt(Math.max(0, timeMs - 24), log);
    const after = cameraPoseAt(timeMs + 24, log);
    return Math.min(
      style.camera.maxBlurPx,
      Math.abs(after.scale - before.scale) * 34
        + Math.hypot(after.cx - before.cx, after.cy - before.cy) * 26,
    );
  };

  return {
    alwaysZoomedScaleFor,
    cameraBlurAt,
    cameraFrameAt,
    cameraPoseAt,
    cameraSessionsFor,
    cameraSessionWindow,
    screenPlaneSize,
    visibleSourceBounds,
  };
};
