<!-- Authored by Daniel Hallman. -->

# Full-screen and native-app capture

Use a full-display source when the story crosses browser and native apps, opens a menu-bar panel, shows an installer or permission sheet, or needs reviewer-grade proof that would be weakened by a browser-only crop.

## Prepare a clean desktop

Keep the cleanup reversible. Never move, rename, hide, or delete the user's actual desktop files as individual file operations.

1. Close unrelated windows and apps. Quit password managers, chat clients, mail, calendars, clipboard tools, and any app that can place private content in front of the recording.
2. Turn on a Focus mode that suppresses banners, calls, badges, and notification previews for the whole capture. Verify it with a short throwaway recording; do not assume the icon means every alert is blocked.
3. Use the supplied helper to save the current wallpaper, desktop-item visibility, and Dock auto-hide setting, then apply the neutral bundled background:

   ```bash
   <skill-dir>/scripts/fullscreen-capture-mode.sh prepare \
     --state-dir path/to/ignored/fullscreen-state
   ```

4. Keep the menu bar visible when the product story uses a status item. Remove or hide unrelated status items when practical, and verify that no account name, sync alert, calendar title, audio-device name, or personal app state is visible.
5. Use one display at a known native resolution and scale. Disconnect or exclude other displays unless the story needs them. Do not resize or move the captured display during the take.
6. Frame the real browser or app against the clean background. Use full-screen capture for continuity, then let the compositor crop and zoom from telemetry. Do not fake a menu, permission sheet, installer, or result state.

The helper writes only to the requested ignored state directory. It hides desktop items through Finder settings and enables Dock auto-hide; it does not touch the files themselves.

## Record

- Capture the display at a stable 60 fps when the system and recorder support it. Use the source cadence if it is lower; do not invent frames with optical flow.
- Record full-display coordinates for cursor, click, target, and native-window bounds on the same monotonic clock as source frames.
- Hide the native pointer when the recorder permits it. If the native pointer must remain visible, do not add a second synthetic cursor.
- Treat app switches and menu-bar movement as story actions. Omit setup motions from telemetry and the final edit.
- Keep private data out of the first frame. A clean wallpaper does not make an authenticated menu, browser profile, notification, or account switcher safe.

## Restore and verify

Restore the desktop immediately after recording, including after a failed or cancelled take:

```bash
<skill-dir>/scripts/fullscreen-capture-mode.sh restore \
  --state-dir path/to/ignored/fullscreen-state
```

Use a shell trap when the capture is scripted so restore runs on normal exit and interruption. Confirm that the original wallpaper, desktop visibility, and Dock setting returned. Turn off the temporary Focus mode only after the recorder has stopped.

Review the raw first and last frames before rendering. Reject the take if it shows a personal file, notification, unrelated window, account identifier, browser profile, or menu-bar item that cannot be safely removed with source-bound privacy treatment.
