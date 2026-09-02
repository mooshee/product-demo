# Scripted Product Demo: One Capture, 6 Video Formats

Record a real product walkthrough once, then render polished MP4s for source, wide, vertical, square, classic, and tall layouts. This open Agent Skill from [Moosh Works](https://mooshworks.com/skills/) uses interaction telemetry to rebuild the cursor, time camera moves to clicks and typing, keep privacy masks attached to the source, and reframe each format around the action. Browser-only and full-screen native flows share the same motion engine; the native path adds reversible desktop cleanup for installers, app switches, permission sheets, and menu-bar apps.

You keep selectors, captions, brand framing, and product-specific render code in your adapter. The tested TypeScript engine handles the shared camera, cursor, caret, privacy-mask, typing-to-submit, and aspect-ratio logic. Optional cursor-follow framing keeps vertical and square cuts focused between interactions.

Scripted Product Demo handles repeatable capture and motion polish. It does not replace Screen Studio’s desktop editor.

## Watch a Finished Demo

Open either animated preview to play the full H.264 MP4 with sound.

### Scripted Camera, Cursor, Typing, and Clicks

[![Scripted Product Demo adding automatic camera moves, a reconstructed cursor, caret-follow typing, and click feedback to a recorded product flow](examples/screen-studio-style-product-demo.gif)](examples/screen-studio-style-product-demo.mp4)

The renderer applies camera moves, cursor motion, typing focus, click feedback, captions, and aspect-aware reframing to one real capture.

### Privacy Masks That Follow the Source

[![The same LinePort recording comparing blur applied before capture with tracked blur applied to existing footage](examples/privacy-blur-comparison.gif)](examples/privacy-blur-comparison.mp4)

New recordings can blur a measured DOM element before its pixels are captured. Existing footage uses the same tight element bounds inside the transformed source layer, so the blur follows every camera move without covering neighboring controls.

The repository includes a tested TypeScript engine template under [`skills/scripted-product-demo/assets/engine`](skills/scripted-product-demo/assets/engine). It provides the reusable camera, cursor, caret, privacy-mask, typing-to-submit, and aspect-ratio logic. Product adapters keep their selectors, recorded flow, branding, captions, and compositor shell.

For full-screen capture, the skill includes a neutral desktop background and a reversible macOS helper that hides desktop items and the Dock without moving or deleting files. The original desktop settings and wallpapers are restored after the take.

A wrapper can add YouTube, personal-brand, or Marketplace review rules without copying the capture and motion engine.

## Install

Install globally with the open `skills` CLI:

```bash
npx skills add mooshee/product-demo --skill scripted-product-demo -g
```

The installable payload lives in `skills/scripted-product-demo/`, so the CLI includes its scripts, references, and engine rather than only the instruction file.

Restart the host application if the skill is not discovered in the current session.

## Use

```text
Use $scripted-product-demo to record a polished walkthrough of this product’s core workflow.
```

The skill adapts to the target repository. It does not bundle an authenticated browser profile, product footage, a third-party click recording, or a product-specific flow.

To seed a product adapter with the reusable engine from a repository checkout:

```bash
./skills/scripted-product-demo/scripts/install-engine.sh path/to/product-demo-engine
cd path/to/product-demo-engine
npm ci
npm test
npm run typecheck
```

## Need the Research Skill?

[ChatGPT Query Research](https://github.com/mooshee/chatgpt-search-query-mining) turns web-search queries from a ChatGPT session you control into a source-backed content plan. See both install commands on the [Moosh Works skills page](https://mooshworks.com/skills/).

## Author & License

Built by [Daniel Hallman](https://github.com/mooshee) at [Moosh Works](https://mooshworks.com/).

The skill instructions and scripts are MIT licensed. Third-party sources and reference assets retain their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
