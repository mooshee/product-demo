#!/usr/bin/env bash
# Authored by Daniel Hallman.
set -euo pipefail

if [[ $# -lt 2 || $# -gt 3 ]]; then
  echo "Usage: $0 INPUT.mp3 OUTPUT.wav [EXPECTED_SHA256]" >&2
  exit 64
fi

input_path=$1
output_path=$2
expected_sha=${3:-}

if [[ ! -f "$input_path" ]]; then
  echo "Missing input: $input_path" >&2
  exit 66
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required." >&2
  exit 69
fi

if [[ -n "$expected_sha" ]]; then
  if command -v sha256sum >/dev/null 2>&1; then
    actual_sha=$(sha256sum "$input_path" | awk '{print $1}')
  elif command -v shasum >/dev/null 2>&1; then
    actual_sha=$(shasum -a 256 "$input_path" | awk '{print $1}')
  else
    echo "sha256sum or shasum is required when EXPECTED_SHA256 is set." >&2
    exit 69
  fi

  if [[ "$actual_sha" != "$expected_sha" ]]; then
    echo "SHA-256 mismatch: got $actual_sha; expected $expected_sha" >&2
    exit 65
  fi
fi

mkdir -p "$(dirname "$output_path")"
ffmpeg -hide_banner -loglevel error -y \
  -i "$input_path" \
  -af "atrim=start=0.040:end=0.285,asetpts=N/SR/TB,pan=mono|c0=0.5*c0+0.5*c1,volume=4dB,alimiter=limit=0.841395:level=false,afade=t=in:st=0:d=0.002,afade=t=out:st=0.205:d=0.040" \
  -ar 48000 \
  -c:a pcm_s16le \
  "$output_path"

echo "Prepared $output_path"
