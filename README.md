# mr.tools

A growing collection of tiny tools for PDFs, text, images, colors, CSV, code and more. Everything runs in your browser. Nothing uploads, nothing tracks you.

## Try it

https://mrtools.mrbro.cfd/

## Features

- **Private by design.** Every tool runs on the client. Nothing leaves your device.
- **Installable PWA.** Everything runs in your browser - nothing uploads.
- **Free forever.** Open source under the MIT license.

## Tools

Twelve families of tools, all client-side:

- **PDF**: merge, split, compress, annotate, convert images, and more.
- **Text**: case conversion, Lorem Ipsum, passwords, word games, and more.
- **Image**: compress, convert, crop, dither, and other transforms.
- **Color**: blend, contrast, gradient, hue, and palette helpers.
- **CSV**: clean, compare, calculate, lint, and Excel conversions.
- **QR**: generate, read, vCard, and barcode helpers.
- **Convert**: documents, ebooks, archives, contacts, and encodings.
- **Dev**: hashes, JSON, regex, timestamps, and code tools.
- **Markdown**: lint, footnotes, anchors, and more.
- **Audio**: BPM, chords, mic, and mixer tools.
- **Data**: format, compare, escape, and analyze.
- **Age**: age, date differences, countdowns, and time zones.

Browse the full list at https://mrtools.mrbro.cfd/.

## Development

```sh
npm install
npm run dev        # start the dev server
npm run check      # type-check (astro check)
npm run test       # run the tool unit tests
npm run smoke      # browser smoke test of every page
npm run build      # build the static site into dist/
```

The build validates every tool's metadata and runs a smoke test over every page. Tests and checks must pass before a release.

## License

MIT. See [LICENSE](LICENSE).
