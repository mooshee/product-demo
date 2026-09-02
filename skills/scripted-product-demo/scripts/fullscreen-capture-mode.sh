#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Prepare or restore a reversible clean macOS desktop for full-screen recording.

Usage:
  fullscreen-capture-mode.sh prepare --state-dir PATH [--background PATH]
  fullscreen-capture-mode.sh restore --state-dir PATH

The state directory must be ignored by version control. The prepare command hides
desktop items, enables Dock auto-hide, and applies the bundled neutral background.
It never moves or deletes desktop files. Focus mode and unrelated apps remain the
operator's responsibility because those controls vary by macOS version.
EOF
}

command_name="${1:-}"
if [[ -z "$command_name" || "$command_name" == "-h" || "$command_name" == "--help" ]]; then
  usage
  exit 0
fi
shift

state_dir=""
background_path=""
while (($#)); do
  case "$1" in
    --state-dir)
      state_dir="${2:-}"
      shift 2
      ;;
    --background)
      background_path="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This helper requires macOS." >&2
  exit 1
fi

if [[ -z "$state_dir" ]]; then
  echo "--state-dir is required." >&2
  exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
skill_dir="$(cd "$script_dir/.." && pwd)"
default_background="$skill_dir/assets/clean-desktop.png"
background_path="${background_path:-$default_background}"

read_default() {
  local domain="$1"
  local key="$2"
  local destination="$3"
  if /usr/bin/defaults read "$domain" "$key" >"$destination" 2>/dev/null; then
    return 0
  fi
  printf '%s\n' '__UNSET__' >"$destination"
}

restore_default_bool() {
  local domain="$1"
  local key="$2"
  local source_file="$3"
  local value
  value="$(<"$source_file")"
  if [[ "$value" == "__UNSET__" ]]; then
    /usr/bin/defaults delete "$domain" "$key" >/dev/null 2>&1 || true
  elif [[ "$value" == "1" || "$value" == "true" ]]; then
    /usr/bin/defaults write "$domain" "$key" -bool true
  else
    /usr/bin/defaults write "$domain" "$key" -bool false
  fi
}

case "$command_name" in
  prepare)
    if [[ ! -f "$background_path" ]]; then
      echo "Background not found: $background_path" >&2
      exit 1
    fi
    if [[ -e "$state_dir" ]]; then
      echo "State path already exists; restore or remove it before another prepare: $state_dir" >&2
      exit 1
    fi

    /bin/mkdir -p "$state_dir"
    read_default com.apple.finder CreateDesktop "$state_dir/finder-create-desktop.txt"
    read_default com.apple.dock autohide "$state_dir/dock-autohide.txt"
    /usr/bin/osascript <<'APPLESCRIPT' >"$state_dir/wallpapers.txt"
tell application "System Events"
  set savedPictures to ""
  repeat with desktopItem in desktops
    set savedPictures to savedPictures & (picture of desktopItem as text) & linefeed
  end repeat
  return savedPictures
end tell
APPLESCRIPT

    /usr/bin/defaults write com.apple.finder CreateDesktop -bool false
    /usr/bin/defaults write com.apple.dock autohide -bool true
    /usr/bin/osascript - "$background_path" <<'APPLESCRIPT'
on run argv
  set cleanPicture to POSIX file (item 1 of argv) as text
  tell application "System Events"
    repeat with desktopItem in desktops
      set picture of desktopItem to cleanPicture
    end repeat
  end tell
end run
APPLESCRIPT
    /usr/bin/killall Finder >/dev/null 2>&1 || true
    /usr/bin/killall Dock >/dev/null 2>&1 || true
    printf '%s\n' "Prepared clean full-screen capture mode. State: $state_dir"
    ;;
  restore)
    for required_file in finder-create-desktop.txt dock-autohide.txt wallpapers.txt; do
      if [[ ! -f "$state_dir/$required_file" ]]; then
        echo "Incomplete capture state: missing $state_dir/$required_file" >&2
        exit 1
      fi
    done

    restore_default_bool com.apple.finder CreateDesktop "$state_dir/finder-create-desktop.txt"
    restore_default_bool com.apple.dock autohide "$state_dir/dock-autohide.txt"

    desktop_index=1
    while IFS= read -r saved_picture; do
      [[ -z "$saved_picture" ]] && continue
      /usr/bin/osascript - "$desktop_index" "$saved_picture" <<'APPLESCRIPT'
on run argv
  set desktopIndex to (item 1 of argv) as integer
  set savedPicture to item 2 of argv
  tell application "System Events"
    if desktopIndex is less than or equal to (count of desktops) then
      set picture of item desktopIndex of desktops to savedPicture
    end if
  end tell
end run
APPLESCRIPT
      desktop_index=$((desktop_index + 1))
    done <"$state_dir/wallpapers.txt"

    /usr/bin/killall Finder >/dev/null 2>&1 || true
    /usr/bin/killall Dock >/dev/null 2>&1 || true
    printf '%s\n' "Restored desktop state from: $state_dir"
    ;;
  *)
    echo "Unknown command: $command_name" >&2
    usage >&2
    exit 2
    ;;
esac
