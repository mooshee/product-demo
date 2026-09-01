# Product Demo skill

An open Codex skill for recording real product workflows and rendering smooth, telemetry-driven, Screen Studio-style demo videos in source, wide, vertical, square, classic, and tall formats, with optional persistent cursor-follow framing.

The workflow adds a reconstructed cursor, click-synchronized camera moves, caret-follow typing, tactile click feedback, branded framing, action captions, and reproducible MP4 output while keeping private sessions and generated media out of git. One capture can produce every supported format through action-aware reframing rather than fixed center crops.

The repository includes a tested TypeScript engine template under `assets/engine`. It provides the reusable camera, cursor, caret, typing-to-submit, and aspect-ratio logic. Product adapters keep their selectors, real workflow, branding, captions, and compositor shell.

Channel-specific skills can wrap this core for YouTube production, personal-brand presentation, or Marketplace review requirements without duplicating the capture and motion system.

## Install

```bash
npx skills add mooshee/product-demo -g
```

Or copy this repository into your Codex skills directory as `product-demo`.

## Use

```text
Use $product-demo to record a polished walkthrough of this product's core workflow.
```

The skill adapts to the target repository. It does not bundle an authenticated browser profile, product footage, a third-party click recording, or a product-specific flow.

To seed a product adapter with the reusable engine:

```bash
scripts/install-engine.sh path/to/product-demo-engine
cd path/to/product-demo-engine
npm ci
npm test
npm run typecheck
```

## License

The skill instructions and scripts are MIT licensed. Third-party sources and reference assets retain their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
