#!/bin/sh
# Authored by Daniel Hallman.
set -eu

target=${1:-}
if [ -z "$target" ]; then
  echo "Usage: scripts/install-engine.sh TARGET_DIRECTORY" >&2
  exit 64
fi

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
source_dir="$script_dir/../assets/engine"

if [ -e "$target" ]; then
  echo "Refusing to overwrite existing target: $target" >&2
  exit 73
fi

mkdir -p "$(dirname -- "$target")" "$target"
tar -C "$source_dir" --exclude='./node_modules' --exclude='./.DS_Store' -cf - . \
  | tar -C "$target" -xf -
echo "Installed product-demo engine template at $target"
