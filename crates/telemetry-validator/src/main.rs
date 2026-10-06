// Author: Daniel Hallman

use std::fs;
use std::path::Path;
use std::process::exit;
use telemetry_validator::validate_telemetry_value;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 || args[1] == "-h" || args[1] == "--help" {
        println!("Usage: validate-telemetry PATH.json");
        println!();
        println!("Validate product demo interaction telemetry JSON against structural and timing invariants.");
        exit(if args.len() < 2 { 64 } else { 0 });
    }

    let file_path = &args[1];
    let path = Path::new(file_path);

    let content = match fs::read_to_string(path) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Unable to read {}: {}", file_path, e);
            exit(65);
        }
    };

    let log: serde_json::Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(e) => {
            eprintln!("Unable to read {}: {}", file_path, e);
            exit(65);
        }
    };

    let result = validate_telemetry_value(&log);

    if !result.is_valid {
        for err in result.errors {
            eprintln!("- {}", err);
        }
        exit(1);
    }

    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(file_path);

    println!(
        "Valid telemetry: {}; {} cursor samples; {} clicks; {} privacy masks; {} ms",
        file_name,
        result.cursor_samples,
        result.clicks_count,
        result.privacy_masks_count,
        result.duration_ms
    );
}
