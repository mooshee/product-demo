#!/usr/bin/env node
// Authored by Daniel Hallman.
import fs from "node:fs";
import path from "node:path";

const telemetryPath = process.argv[2];
if (!telemetryPath) {
  console.error("Usage: validate-telemetry.mjs PATH.json");
  process.exit(64);
}

let log;
try {
  log = JSON.parse(fs.readFileSync(telemetryPath, "utf8"));
} catch (error) {
  console.error(`Unable to read ${telemetryPath}: ${error.message}`);
  process.exit(65);
}

const errors = [];
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const positive = (value) => finite(value) && value > 0;
const inside = (value, maximum) => finite(value) && value >= 0 && value <= maximum;
const fail = (message) => errors.push(message);

if (typeof log.name !== "string" || !log.name.trim()) fail("name must be a non-empty string");
if (!positive(log.durationMs)) fail("durationMs must be positive");
if (!positive(log.viewport?.width) || !positive(log.viewport?.height)) {
  fail("viewport width and height must be positive");
}
if (!finite(log.captureOffsetMs) || log.captureOffsetMs < 0) fail("captureOffsetMs must be non-negative");
if (!Array.isArray(log.cursorTrack)) fail("cursorTrack must be an array");
if (!Array.isArray(log.clicks)) fail("clicks must be an array");
if (log.privacyMasks != null && !Array.isArray(log.privacyMasks)) {
  fail("privacyMasks must be an array when provided");
}
const privacyMasks = Array.isArray(log.privacyMasks) ? log.privacyMasks : [];

const width = log.viewport?.width;
const height = log.viewport?.height;
const interactionKinds = new Set(["control", "typing", "submit"]);
const privacyTreatments = new Set(["solid", "pixelate", "blur"]);
const rectInsideViewport = (rect) => finite(rect?.x)
  && finite(rect?.y)
  && positive(rect?.width)
  && positive(rect?.height)
  && rect.x >= 0
  && rect.y >= 0
  && rect.x + rect.width <= width
  && rect.y + rect.height <= height;
let previousCursorTime = -1;
for (const [index, sample] of (log.cursorTrack ?? []).entries()) {
  if (!finite(sample.tMs) || sample.tMs < previousCursorTime || sample.tMs > log.durationMs) {
    fail(`cursorTrack[${index}].tMs must be sorted and within durationMs`);
  }
  if (!inside(sample.x, width) || !inside(sample.y, height)) {
    fail(`cursorTrack[${index}] must be inside the viewport`);
  }
  previousCursorTime = sample.tMs;
}

let previousClickTime = -1;
for (const [index, click] of (log.clicks ?? []).entries()) {
  const prefix = `clicks[${index}]`;
  if (!finite(click.tMs) || click.tMs < previousClickTime || click.tMs > log.durationMs) {
    fail(`${prefix}.tMs must be sorted and within durationMs`);
  }
  if (!finite(click.tDepartMs) || click.tDepartMs < 0 || click.tDepartMs > click.tMs) {
    fail(`${prefix}.tDepartMs must be between zero and tMs`);
  }
  if (!inside(click.x, width) || !inside(click.y, height)) fail(`${prefix} must be inside the viewport`);
  if (!finite(click.rect?.x) || !finite(click.rect?.y) || !positive(click.rect?.width) || !positive(click.rect?.height)) {
    fail(`${prefix}.rect must contain finite x/y and positive width/height`);
  }
  if (typeof click.label !== "string" || !click.label.trim()) fail(`${prefix}.label must be a non-empty string`);
  if (typeof click.cluster !== "string" || !click.cluster.trim()) fail(`${prefix}.cluster must be a non-empty string`);
  if (click.typeEndMs != null && (!finite(click.typeEndMs) || click.typeEndMs < click.tMs || click.typeEndMs > log.durationMs)) {
    fail(`${prefix}.typeEndMs must be between tMs and durationMs`);
  }
  if (click.interactionKind != null && !interactionKinds.has(click.interactionKind)) {
    fail(`${prefix}.interactionKind must be control, typing, or submit`);
  }
  if (["typing", "submit"].includes(click.interactionKind)
    && (typeof click.interactionGroup !== "string" || !click.interactionGroup.trim())) {
    fail(`${prefix}.interactionGroup must link typing and submit events`);
  }
  if (click.interactionKind === "typing" && click.typeEndMs == null) {
    fail(`${prefix}.typeEndMs is required for a typing interaction`);
  }
  if (click.interactionKind === "typing" && (!Array.isArray(click.caretTrack) || click.caretTrack.length === 0)) {
    fail(`${prefix}.caretTrack is required for a typing interaction`);
  }
  let previousCaretTime = click.tMs;
  for (const [caretIndex, sample] of (click.caretTrack ?? []).entries()) {
    if (!finite(sample.tMs)
      || sample.tMs < previousCaretTime
      || sample.tMs > (click.typeEndMs ?? log.durationMs)) {
      fail(`${prefix}.caretTrack[${caretIndex}].tMs must be sorted and within the typing span`);
    }
    if (!inside(sample.x, width) || !inside(sample.y, height)) {
      fail(`${prefix}.caretTrack[${caretIndex}] must be inside the viewport`);
    }
    previousCaretTime = sample.tMs;
  }
  previousClickTime = click.tMs;
}

const privacyIds = new Set();
for (const [index, mask] of privacyMasks.entries()) {
  const prefix = `privacyMasks[${index}]`;
  if (typeof mask.id !== "string" || !mask.id.trim()) fail(`${prefix}.id must be a non-empty string`);
  else if (privacyIds.has(mask.id)) fail(`${prefix}.id must be unique`);
  else privacyIds.add(mask.id);
  if (typeof mask.reason !== "string" || !mask.reason.trim()) {
    fail(`${prefix}.reason must name a data category without repeating the private value`);
  }
  if (mask.treatment != null && !privacyTreatments.has(mask.treatment)) {
    fail(`${prefix}.treatment must be solid, pixelate, or blur`);
  }
  if (mask.paddingPx != null && (!finite(mask.paddingPx) || mask.paddingPx < 0)) {
    fail(`${prefix}.paddingPx must be non-negative`);
  }
  const startMs = mask.startMs ?? 0;
  const endMs = mask.endMs ?? log.durationMs;
  if (!finite(startMs) || !finite(endMs) || startMs < 0 || endMs < startMs || endMs > log.durationMs) {
    fail(`${prefix} startMs and endMs must define a valid span within durationMs`);
  }
  const hasRect = mask.rect != null;
  const hasTrack = Array.isArray(mask.rectTrack) && mask.rectTrack.length > 0;
  if (hasRect === hasTrack) fail(`${prefix} must provide exactly one of rect or rectTrack`);
  if (hasRect && !rectInsideViewport(mask.rect)) fail(`${prefix}.rect must be inside the viewport`);
  let previousMaskTime = startMs;
  for (const [sampleIndex, sample] of (mask.rectTrack ?? []).entries()) {
    if (!finite(sample.tMs) || sample.tMs < previousMaskTime || sample.tMs > endMs) {
      fail(`${prefix}.rectTrack[${sampleIndex}].tMs must be sorted and within the mask span`);
    }
    if (!rectInsideViewport(sample)) {
      fail(`${prefix}.rectTrack[${sampleIndex}] must be inside the viewport`);
    }
    previousMaskTime = sample.tMs;
  }
}

for (const [index, click] of (log.clicks ?? []).entries()) {
  if (click.interactionKind === "typing") {
    const submit = log.clicks.slice(index + 1).find((candidate) =>
      candidate.interactionKind === "submit"
      && candidate.interactionGroup === click.interactionGroup
    );
    if (!submit) fail(`clicks[${index}] must have a later submit in interactionGroup ${click.interactionGroup}`);
  }
  if (click.interactionKind === "submit") {
    const typing = log.clicks.slice(0, index).find((candidate) =>
      candidate.interactionKind === "typing"
      && candidate.interactionGroup === click.interactionGroup
    );
    if (!typing) fail(`clicks[${index}] must have an earlier typing event in interactionGroup ${click.interactionGroup}`);
  }
}

if (errors.length) {
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Valid telemetry: ${path.basename(telemetryPath)}; ${log.cursorTrack.length} cursor samples; ${log.clicks.length} clicks; ${privacyMasks.length} privacy masks; ${log.durationMs} ms`,
);
