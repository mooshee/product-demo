// Author: Daniel Hallman

#![allow(clippy::collapsible_if)]

use serde_json::Value;
use std::collections::HashSet;

#[derive(Debug, Default)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub errors: Vec<String>,
    pub cursor_samples: usize,
    pub clicks_count: usize,
    pub privacy_masks_count: usize,
    pub duration_ms: f64,
}

fn is_finite(v: &Value) -> bool {
    v.as_f64().is_some_and(|n| n.is_finite())
}

fn is_positive(v: &Value) -> bool {
    v.as_f64().is_some_and(|n| n.is_finite() && n > 0.0)
}

fn is_inside(v: &Value, max: f64) -> bool {
    v.as_f64().is_some_and(|n| n.is_finite() && n >= 0.0 && n <= max)
}

fn rect_inside_viewport(rect: &Value, width: f64, height: f64) -> bool {
    let x = match rect.get("x").and_then(|v| v.as_f64()) {
        Some(v) if v.is_finite() => v,
        _ => return false,
    };
    let y = match rect.get("y").and_then(|v| v.as_f64()) {
        Some(v) if v.is_finite() => v,
        _ => return false,
    };
    let w = match rect.get("width").and_then(|v| v.as_f64()) {
        Some(v) if v.is_finite() && v > 0.0 => v,
        _ => return false,
    };
    let h = match rect.get("height").and_then(|v| v.as_f64()) {
        Some(v) if v.is_finite() && v > 0.0 => v,
        _ => return false,
    };

    x >= 0.0 && y >= 0.0 && (x + w) <= width && (y + h) <= height
}

pub fn validate_telemetry_value(log: &Value) -> ValidationResult {
    let mut errors = Vec::new();

    let name = log.get("name").and_then(|v| v.as_str());
    if name.map(|s| s.trim().is_empty()).unwrap_or(true) {
        errors.push("name must be a non-empty string".to_string());
    }

    let duration_ms = match log.get("durationMs").and_then(|v| v.as_f64()) {
        Some(d) if d.is_finite() && d > 0.0 => d,
        _ => {
            errors.push("durationMs must be positive".to_string());
            0.0
        }
    };

    let viewport = log.get("viewport");
    let width = viewport
        .and_then(|v| v.get("width"))
        .and_then(|w| w.as_f64())
        .unwrap_or(0.0);
    let height = viewport
        .and_then(|v| v.get("height"))
        .and_then(|h| h.as_f64())
        .unwrap_or(0.0);

    let has_positive_width = viewport
        .and_then(|v| v.get("width"))
        .map(is_positive)
        .unwrap_or(false);
    let has_positive_height = viewport
        .and_then(|v| v.get("height"))
        .map(is_positive)
        .unwrap_or(false);

    if !has_positive_width || !has_positive_height {
        errors.push("viewport width and height must be positive".to_string());
    }

    if let Some(offset) = log.get("captureOffsetMs") {
        if !is_finite(offset) || offset.as_f64().unwrap_or(-1.0) < 0.0 {
            errors.push("captureOffsetMs must be non-negative".to_string());
        }
    }

    let cursor_track = log.get("cursorTrack").and_then(|v| v.as_array());
    let mut cursor_samples = 0;
    if let Some(samples) = cursor_track {
        cursor_samples = samples.len();
        let mut prev_time = -1.0;
        for (i, sample) in samples.iter().enumerate() {
            let t_ms = sample.get("tMs").and_then(|v| v.as_f64());
            match t_ms {
                Some(t) if t.is_finite() && t >= prev_time && t <= duration_ms => {
                    prev_time = t;
                }
                _ => {
                    errors.push(format!("cursorTrack[{}].tMs must be sorted and within durationMs", i));
                }
            }

            let x_ok = sample.get("x").map(|x| is_inside(x, width)).unwrap_or(false);
            let y_ok = sample.get("y").map(|y| is_inside(y, height)).unwrap_or(false);
            if !x_ok || !y_ok {
                errors.push(format!("cursorTrack[{}] must be inside the viewport", i));
            }
        }
    } else {
        errors.push("cursorTrack must be an array".to_string());
    }

    let clicks = log.get("clicks").and_then(|v| v.as_array());
    let mut clicks_count = 0;
    let interaction_kinds: HashSet<&str> = ["control", "typing", "submit"].into_iter().collect();

    if let Some(click_list) = clicks {
        clicks_count = click_list.len();
        let mut prev_click_time = -1.0;

        for (i, click) in click_list.iter().enumerate() {
            let prefix = format!("clicks[{}]", i);
            let t_ms_opt = click.get("tMs").and_then(|v| v.as_f64());
            let click_time = match t_ms_opt {
                Some(t) if t.is_finite() && t >= prev_click_time && t <= duration_ms => {
                    prev_click_time = t;
                    t
                }
                _ => {
                    errors.push(format!("{}.tMs must be sorted and within durationMs", prefix));
                    0.0
                }
            };

            let t_depart_opt = click.get("tDepartMs").and_then(|v| v.as_f64());
            match t_depart_opt {
                Some(td) if td.is_finite() && td >= 0.0 && td <= click_time => {}
                _ => {
                    errors.push(format!("{}.tDepartMs must be between zero and tMs", prefix));
                }
            }

            let x_ok = click.get("x").map(|x| is_inside(x, width)).unwrap_or(false);
            let y_ok = click.get("y").map(|y| is_inside(y, height)).unwrap_or(false);
            if !x_ok || !y_ok {
                errors.push(format!("{} must be inside the viewport", prefix));
            }

            let rect = click.get("rect");
            let rect_ok = rect
                .map(|r| {
                    let rx = r.get("x").map(is_finite).unwrap_or(false);
                    let ry = r.get("y").map(is_finite).unwrap_or(false);
                    let rw = r.get("width").map(is_positive).unwrap_or(false);
                    let rh = r.get("height").map(is_positive).unwrap_or(false);
                    rx && ry && rw && rh
                })
                .unwrap_or(false);

            if !rect_ok {
                errors.push(format!("{}.rect must contain finite x/y and positive width/height", prefix));
            }

            let label = click.get("label").and_then(|v| v.as_str());
            if label.map(|s| s.trim().is_empty()).unwrap_or(true) {
                errors.push(format!("{}.label must be a non-empty string", prefix));
            }

            let cluster = click.get("cluster").and_then(|v| v.as_str());
            if cluster.map(|s| s.trim().is_empty()).unwrap_or(true) {
                errors.push(format!("{}.cluster must be a non-empty string", prefix));
            }

            let type_end_ms = click.get("typeEndMs").and_then(|v| v.as_f64());
            if let Some(te) = type_end_ms {
                if !te.is_finite() || te < click_time || te > duration_ms {
                    errors.push(format!("{}.typeEndMs must be between tMs and durationMs", prefix));
                }
            }

            let interaction_kind = click.get("interactionKind").and_then(|v| v.as_str());
            if let Some(k) = interaction_kind {
                if !interaction_kinds.contains(k) {
                    errors.push(format!("{}.interactionKind must be control, typing, or submit", prefix));
                }
            }

            if matches!(interaction_kind, Some("typing") | Some("submit")) {
                let group = click.get("interactionGroup").and_then(|v| v.as_str());
                if group.map(|s| s.trim().is_empty()).unwrap_or(true) {
                    errors.push(format!("{}.interactionGroup must link typing and submit events", prefix));
                }
            }

            if interaction_kind == Some("typing") {
                if type_end_ms.is_none() {
                    errors.push(format!("{}.typeEndMs is required for a typing interaction", prefix));
                }
                let caret_track = click.get("caretTrack").and_then(|v| v.as_array());
                if caret_track.map(|c| c.is_empty()).unwrap_or(true) {
                    errors.push(format!("{}.caretTrack is required for a typing interaction", prefix));
                } else if let Some(carets) = caret_track {
                    let mut prev_caret_time = click_time;
                    let max_caret_time = type_end_ms.unwrap_or(duration_ms);
                    for (ci, sample) in carets.iter().enumerate() {
                        let ct = sample.get("tMs").and_then(|v| v.as_f64());
                        match ct {
                            Some(t) if t.is_finite() && t >= prev_caret_time && t <= max_caret_time => {
                                prev_caret_time = t;
                            }
                            _ => {
                                errors.push(format!(
                                    "{}.caretTrack[{}].tMs must be sorted and within the typing span",
                                    prefix, ci
                                ));
                            }
                        }

                        let cx_ok = sample.get("x").map(|x| is_inside(x, width)).unwrap_or(false);
                        let cy_ok = sample.get("y").map(|y| is_inside(y, height)).unwrap_or(false);
                        if !cx_ok || !cy_ok {
                            errors.push(format!("{}.caretTrack[{}] must be inside the viewport", prefix, ci));
                        }
                    }
                }
            }
        }

        // Check typing has submit, submit has typing
        for (i, click) in click_list.iter().enumerate() {
            let kind = click.get("interactionKind").and_then(|v| v.as_str());
            let group = click.get("interactionGroup").and_then(|v| v.as_str()).unwrap_or_default();

            if kind == Some("typing") {
                let has_later_submit = click_list[i + 1..].iter().any(|c| {
                    c.get("interactionKind").and_then(|v| v.as_str()) == Some("submit")
                        && c.get("interactionGroup").and_then(|v| v.as_str()) == Some(group)
                });
                if !has_later_submit {
                    errors.push(format!("clicks[{}] must have a later submit in interactionGroup {}", i, group));
                }
            } else if kind == Some("submit") {
                let has_earlier_typing = click_list[..i].iter().any(|c| {
                    c.get("interactionKind").and_then(|v| v.as_str()) == Some("typing")
                        && c.get("interactionGroup").and_then(|v| v.as_str()) == Some(group)
                });
                if !has_earlier_typing {
                    errors.push(format!("clicks[{}] must have an earlier typing event in interactionGroup {}", i, group));
                }
            }
        }
    } else {
        errors.push("clicks must be an array".to_string());
    }

    let privacy_treatments: HashSet<&str> = ["solid", "pixelate", "blur"].into_iter().collect();
    let mut privacy_masks_count = 0;

    if let Some(masks_val) = log.get("privacyMasks") {
        if let Some(masks) = masks_val.as_array() {
            privacy_masks_count = masks.len();
            let mut privacy_ids = HashSet::new();

            for (i, mask) in masks.iter().enumerate() {
                let prefix = format!("privacyMasks[{}]", i);
                let id = mask.get("id").and_then(|v| v.as_str());
                if id.map(|s| s.trim().is_empty()).unwrap_or(true) {
                    errors.push(format!("{}.id must be a non-empty string", prefix));
                } else if let Some(id_str) = id {
                    if !privacy_ids.insert(id_str) {
                        errors.push(format!("{}.id must be unique", prefix));
                    }
                }

                let reason = mask.get("reason").and_then(|v| v.as_str());
                if reason.map(|s| s.trim().is_empty()).unwrap_or(true) {
                    errors.push(format!("{}.reason must name a data category without repeating the private value", prefix));
                }

                if let Some(t) = mask.get("treatment").and_then(|v| v.as_str()) {
                    if !privacy_treatments.contains(t) {
                        errors.push(format!("{}.treatment must be solid, pixelate, or blur", prefix));
                    }
                }

                if let Some(pad) = mask.get("paddingPx") {
                    if !is_finite(pad) || pad.as_f64().unwrap_or(-1.0) < 0.0 {
                        errors.push(format!("{}.paddingPx must be non-negative", prefix));
                    }
                }

                let start_ms = mask.get("startMs").and_then(|v| v.as_f64()).unwrap_or(0.0);
                let end_ms = mask.get("endMs").and_then(|v| v.as_f64()).unwrap_or(duration_ms);

                if !start_ms.is_finite() || !end_ms.is_finite() || start_ms < 0.0 || end_ms < start_ms || end_ms > duration_ms {
                    errors.push(format!("{} startMs and endMs must define a valid span within durationMs", prefix));
                }

                let has_rect = mask.get("rect").is_some();
                let rect_track = mask.get("rectTrack").and_then(|v| v.as_array());
                let has_track = rect_track.map(|t| !t.is_empty()).unwrap_or(false);

                if has_rect == has_track {
                    errors.push(format!("{} must provide exactly one of rect or rectTrack", prefix));
                }

                if has_rect {
                    if let Some(rect) = mask.get("rect") {
                        if !rect_inside_viewport(rect, width, height) {
                            errors.push(format!("{}.rect must be inside the viewport", prefix));
                        }
                    }
                }

                if let Some(track) = rect_track {
                    let mut prev_mask_time = start_ms;
                    for (si, sample) in track.iter().enumerate() {
                        let t_ms = sample.get("tMs").and_then(|v| v.as_f64());
                        match t_ms {
                            Some(t) if t.is_finite() && t >= prev_mask_time && t <= end_ms => {
                                prev_mask_time = t;
                            }
                            _ => {
                                errors.push(format!("{}.rectTrack[{}].tMs must be sorted and within the mask span", prefix, si));
                            }
                        }

                        if !rect_inside_viewport(sample, width, height) {
                            errors.push(format!("{}.rectTrack[{}] must be inside the viewport", prefix, si));
                        }
                    }
                }
            }
        } else {
            errors.push("privacyMasks must be an array when provided".to_string());
        }
    }

    let is_valid = errors.is_empty();
    ValidationResult {
        is_valid,
        errors,
        cursor_samples,
        clicks_count,
        privacy_masks_count,
        duration_ms,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_telemetry_payload() {
        let json = serde_json::json!({
            "name": "sample-walkthrough",
            "durationMs": 5000,
            "viewport": { "width": 1920, "height": 1080 },
            "captureOffsetMs": 100,
            "cursorTrack": [
                { "tMs": 0, "x": 100, "y": 100 },
                { "tMs": 200, "x": 120, "y": 130 }
            ],
            "clicks": [
                {
                    "tMs": 500,
                    "tDepartMs": 300,
                    "x": 120,
                    "y": 130,
                    "rect": { "x": 100, "y": 100, "width": 50, "height": 50 },
                    "label": "Input Name",
                    "cluster": "form-field",
                    "interactionKind": "typing",
                    "interactionGroup": "user-input",
                    "typeEndMs": 1500,
                    "caretTrack": [
                        { "tMs": 600, "x": 125, "y": 130 },
                        { "tMs": 1200, "x": 140, "y": 130 }
                    ]
                },
                {
                    "tMs": 2000,
                    "tDepartMs": 1800,
                    "x": 200,
                    "y": 300,
                    "rect": { "x": 180, "y": 280, "width": 80, "height": 40 },
                    "label": "Save",
                    "cluster": "submit-btn",
                    "interactionKind": "submit",
                    "interactionGroup": "user-input"
                }
            ],
            "privacyMasks": [
                {
                    "id": "mask-1",
                    "reason": "Customer PII",
                    "treatment": "blur",
                    "rect": { "x": 100, "y": 200, "width": 300, "height": 50 }
                }
            ]
        });

        let res = validate_telemetry_value(&json);
        assert!(res.is_valid, "Expected valid telemetry: {:?}", res.errors);
        assert_eq!(res.cursor_samples, 2);
        assert_eq!(res.clicks_count, 2);
        assert_eq!(res.privacy_masks_count, 1);
    }
}
