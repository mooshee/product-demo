<!-- Authored by Daniel Hallman. -->

# Click audio

The default sound is Pixabay “Mouse click” (asset 290204) by MatthewVakaliuk73627:

- source: https://pixabay.com/sound-effects/film-special-effects-mouse-click-290204/
- license summary: https://pixabay.com/service/license-summary/
- expected source SHA-256: `075e17bdac5c13662a1c9530050e0046f81d4138e00eb3bf30427a7b4404103d`

The skill does not bundle the original MP3. Fetch it from the official asset page, save it in an ignored local media directory, and verify the hash. Do not commit or redistribute the source as a standalone audio file.

Prepare a render master:

```bash
<skill-dir>/scripts/prepare-click-audio.sh \
  path/to/ignored/mouse-click.mp3 \
  path/to/ignored/generated/click.wav \
  075e17bdac5c13662a1c9530050e0046f81d4138e00eb3bf30427a7b4404103d
```

The script removes the silent head and tail, preserves the press/release character, raises and limits the signal, and writes 48 kHz mono PCM. The prepared master is about 245 ms, so the compositor must allow at least 250 ms of playback.

For a loud click preset, start near 0.5–0.6 compositor volume after this normalization. Measure the final mix, not only the WAV. Keep final peaks below 0 dBFS and leave headroom for narration or music.

If the source file or license changes, update the URL, hash, notice, transform, and audio QA together.
