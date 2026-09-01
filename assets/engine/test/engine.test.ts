/** Authored by Daniel Hallman. */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createProductDemoEngine,
  DEFAULT_DEMO_STYLE,
  DEFAULT_OUTPUT_PRESETS,
  activePrivacyMasksAt,
  pointAt,
  projectSourceRect,
  type ClickLog,
} from "../src/index.js";

const engine = createProductDemoEngine({
  style: DEFAULT_DEMO_STYLE,
  formats: DEFAULT_OUTPUT_PRESETS,
});

const log: ClickLog = {
  name: "send-a-message",
  viewport: { width: 1_600, height: 900 },
  captureOffsetMs: 0,
  durationMs: 14_000,
  cursorTrack: [
    { tMs: 1_000, x: 80, y: 760 },
    { tMs: 5_000, x: 880, y: 775 },
    { tMs: 9_700, x: 1_128, y: 855 },
  ],
  clicks: [
    {
      tMs: 5_200,
      tDepartMs: 4_500,
      x: 880,
      y: 775,
      rect: { x: 589, y: 715, width: 582, height: 120 },
      label: "Write reply",
      cluster: "composer",
      typeEndMs: 8_300,
      caretTrack: [
        { tMs: 5_600, x: 625, y: 760 },
        { tMs: 7_000, x: 850, y: 760 },
        { tMs: 8_250, x: 1_130, y: 760 },
      ],
      interactionKind: "typing",
      interactionGroup: "message-composer",
    },
    {
      tMs: 9_700,
      tDepartMs: 8_850,
      x: 1_128,
      y: 855,
      rect: { x: 1_114, y: 843, width: 28, height: 24 },
      label: "Send",
      cluster: "submit",
      interactionKind: "submit",
      interactionGroup: "message-composer",
    },
  ],
};

const projectPoint = (
  point: { x: number; y: number },
  pose: { scale: number; cx: number; cy: number },
  format: keyof typeof DEFAULT_OUTPUT_PRESETS,
) => {
  const output = DEFAULT_OUTPUT_PRESETS[format];
  const plane = engine.screenPlaneSize(output, log.viewport);
  return {
    x: output.width / 2 + (point.x / log.viewport.width - pose.cx) * plane.width * pose.scale,
    y: output.height / 2 + (point.y / log.viewport.height - pose.cy) * plane.height * pose.scale,
  };
};

describe("public product-demo engine", () => {
  it("holds the final cursor sample", () => {
    assert.deepEqual(pointAt(99_000, log.cursorTrack), log.cursorTrack.at(-1));
  });

  it("starts the session camera two seconds before the click", () => {
    assert.equal(engine.cameraPoseAt(3_199, log).scale, 1);
    assert.ok(engine.cameraPoseAt(4_000, log).scale > 1);
    assert.equal(engine.cameraPoseAt(5_200, log).scale, DEFAULT_DEMO_STYLE.camera.sessionScale);
  });

  it("keeps the moving cursor in frame while the portrait camera eases in", () => {
    const pose = engine.cameraFrameAt(4_000, log, "portrait");
    const cursor = pointAt(4_000, log.cursorTrack);
    const projected = projectPoint(cursor, pose, "portrait");
    const output = DEFAULT_OUTPUT_PRESETS.portrait;
    const margin = DEFAULT_DEMO_STYLE.framing.cursorEdgeMarginPx;
    assert.ok(projected.x >= margin);
    assert.ok(projected.x <= output.width - margin);
    assert.ok(projected.y >= margin);
    assert.ok(projected.y <= output.height - margin);
  });

  it("follows the caret while typing", () => {
    const early = engine.cameraFrameAt(5_800, log, "portrait", "always-zoomed");
    const late = engine.cameraFrameAt(8_100, log, "portrait", "always-zoomed");
    assert.ok(late.cx > early.cx);
    assert.equal(late.scale, early.scale);
  });

  it("pulls back before submit to show the full field and button", () => {
    const typing = engine.cameraFrameAt(7_000, log, "portrait", "always-zoomed");
    const submit = engine.cameraFrameAt(9_350, log, "portrait", "always-zoomed");
    assert.ok(typing.scale > submit.scale);
    const visible = engine.visibleSourceBounds(submit, "portrait", log.viewport);
    assert.ok(visible.x <= 589);
    assert.ok(visible.x + visible.width >= 1_142);
  });

  it("does not jump when the final hold becomes persistent framing", () => {
    const session = engine.cameraSessionsFor(log).at(-1)!;
    const boundary = engine.cameraSessionWindow(session).holdUntil;
    const before = engine.cameraFrameAt(boundary, log, "portrait", "always-zoomed");
    const after = engine.cameraFrameAt(boundary + 1, log, "portrait", "always-zoomed");
    assert.ok(Math.abs(before.scale - after.scale) < 0.001);
    assert.ok(Math.abs(before.cx - after.cx) < 0.001);
    assert.ok(Math.abs(before.cy - after.cy) < 0.001);
  });

  it("supports every standard output preset", () => {
    assert.deepEqual(Object.keys(DEFAULT_OUTPUT_PRESETS), [
      "auto",
      "landscape",
      "portrait",
      "square",
      "classic",
      "tall",
    ]);
  });

  it("covers both positions while a tracked privacy region moves", () => {
    const [mask] = activePrivacyMasksAt(1_500, [{
      id: "account-email",
      reason: "personal identifier",
      rectTrack: [
        { tMs: 1_000, x: 100, y: 80, width: 180, height: 30 },
        { tMs: 2_000, x: 300, y: 80, width: 180, height: 30 },
      ],
      paddingPx: 10,
    }]);
    assert.equal(mask.treatment, "solid");
    assert.deepEqual(mask.rect, { x: 90, y: 70, width: 400, height: 50 });
  });

  it("preserves blur while a post-processing mask tracks a moving element", () => {
    const [mask] = activePrivacyMasksAt(1_500, [{
      id: "moving-account-field",
      reason: "personal identifier",
      treatment: "blur",
      rectTrack: [
        { tMs: 1_000, x: 100, y: 80, width: 180, height: 30 },
        { tMs: 2_000, x: 300, y: 120, width: 180, height: 30 },
      ],
      paddingPx: 10,
    }]);
    assert.equal(mask.treatment, "blur");
    assert.deepEqual(mask.rect, { x: 90, y: 70, width: 400, height: 90 });
  });

  it("keeps an unbounded privacy mask active for the full recording", () => {
    const masks = [{
      id: "contact-phone",
      reason: "personal identifier",
      rect: { x: 300, y: 820, width: 140, height: 28 },
      treatment: "blur" as const,
    }];
    assert.equal(activePrivacyMasksAt(0, masks).length, 1);
    assert.equal(activePrivacyMasksAt(log.durationMs, masks).length, 1);
    assert.equal(activePrivacyMasksAt(99_000, masks).length, 1);
  });

  it("honors an explicit privacy-mask visibility window", () => {
    const masks = [{
      id: "temporary-dialog",
      reason: "personal identifier",
      rect: { x: 300, y: 820, width: 140, height: 28 },
      startMs: 2_000,
      endMs: 4_000,
    }];
    assert.equal(activePrivacyMasksAt(1_999, masks).length, 0);
    assert.equal(activePrivacyMasksAt(2_000, masks).length, 1);
    assert.equal(activePrivacyMasksAt(4_000, masks).length, 1);
    assert.equal(activePrivacyMasksAt(4_001, masks).length, 0);
  });

  it("projects privacy regions through the same camera pose as the source", () => {
    const pose = engine.cameraFrameAt(7_000, log, "portrait", "always-zoomed");
    const rect = { x: 600, y: 120, width: 240, height: 32 };
    const projected = projectSourceRect(
      rect,
      pose,
      DEFAULT_OUTPUT_PRESETS.portrait,
      log.viewport,
    );
    const topLeft = projectPoint({ x: rect.x, y: rect.y }, pose, "portrait");
    const bottomRight = projectPoint({
      x: rect.x + rect.width,
      y: rect.y + rect.height,
    }, pose, "portrait");
    const expected = {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
    for (const key of ["x", "y", "width", "height"] as const) {
      assert.ok(Math.abs(projected[key] - expected[key]) < 0.000_001);
    }
  });
});
