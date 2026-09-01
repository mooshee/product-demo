/** Authored by Daniel Hallman. */
import type { Point } from "./types.js";

/**
 * Pass this function directly to Playwright's locator.evaluate(). It has no
 * module closures, so Playwright can serialize it into the page safely.
 */
export const readCaretPoint = (element: Element): Point | undefined => {
  const target = element as HTMLElement;
  const bounds = target.getBoundingClientRect();
  const clamp = (value: number, start: number, end: number) => Math.min(end, Math.max(start, value));

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    const style = window.getComputedStyle(target);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return undefined;
    context.font = style.font;
    const selection = target.selectionStart ?? target.value.length;
    const prefixWidth = context.measureText(target.value.slice(0, selection)).width;
    return {
      x: clamp(
        bounds.left + Number.parseFloat(style.paddingLeft || "0") + prefixWidth - target.scrollLeft,
        bounds.left + 4,
        bounds.right - 4,
      ),
      y: bounds.top + bounds.height / 2,
    };
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return undefined;
  const range = selection.getRangeAt(0).cloneRange();
  range.collapse(false);
  let caretBounds = range.getBoundingClientRect();
  let caretX = caretBounds.right;
  const container = range.startContainer;
  if (!caretBounds.height && container.nodeType === Node.TEXT_NODE) {
    const text = container.textContent ?? "";
    const offset = range.startOffset;
    const probe = document.createRange();
    if (offset > 0) {
      probe.setStart(container, offset - 1);
      probe.setEnd(container, offset);
      caretBounds = probe.getBoundingClientRect();
      caretX = caretBounds.right;
    } else if (text.length > 0) {
      probe.setStart(container, 0);
      probe.setEnd(container, 1);
      caretBounds = probe.getBoundingClientRect();
      caretX = caretBounds.left;
    }
  }
  if (!caretBounds.height) return undefined;
  return {
    x: clamp(caretX, bounds.left + 4, bounds.right - 4),
    y: clamp(caretBounds.top + caretBounds.height / 2, bounds.top + 4, bounds.bottom - 4),
  };
};
