# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Raycast extension ("Cloudflare R2 File Uploader") with a single no-view command: it uploads the Finder-selected
file to a Cloudflare R2 bucket (via the S3-compatible API), optionally converts images to AVIF first, and copies
the resulting URL (or a Markdown image link) to the clipboard.

## Commands

```bash
npm run dev        # ray develop — runs the extension in Raycast for local testing
npm run build       # ray build — production build / validation
npm run lint         # ray lint
npm run fix-lint     # ray lint --fix
npm run publish       # publish to the Raycast Store (npx @raycast/api@latest publish)
```

There is no test suite. `ray build`/`ray lint` (both wrappers around `@raycast/api`'s CLI) are the primary
correctness checks — they type-check against `raycast-env.d.ts` and validate the extension manifest.

Since this is a Raycast "no-view" command, it can't be run as a plain Node script — use `npm run dev`, which
registers the command with the local Raycast app so it can be invoked from the Raycast UI with a file selected
in Finder.

## Architecture

Entry point: `src/r2-uploader.ts` (`Command()`), wired up via the single command entry in `package.json`
(`commands[0].name === "r2-uploader"`). Flow on invocation:

1. Read preferences via `getPreferenceValues()` (typed by the auto-generated `raycast-env.d.ts`, which mirrors
   `package.json`'s `preferences` array — do not hand-edit `raycast-env.d.ts`; change `package.json` instead and
   let Raycast regenerate it).
2. Bail out with a toast (and a button to open extension preferences) if required R2 credentials aren't set.
3. Get the selected file from Finder via `getSelectedFinderItems()` — only the first selected item is used.
4. If the file is an image format AVIF-conversion supports (`isSupportedImageFormat` in
   `src/utils/mime-types.ts`) and the "Convert to AVIF" preference is on, shell out to `avifenc`
   (`src/utils/convert.ts`) to produce a sibling `.avif` file. The `avifenc` binary is an external dependency
   (`brew install libavif`); its path is configurable and falls back to `AVIFENC_DEFAULT_PATH` in
   `src/utils/constants.ts`.
5. If a custom filename format preference is set, render it via `generateFileName` (`src/utils/generate-fileName.ts`).
6. Upload via `uploadToR2` (`src/utils/uploadToR2.ts`), which builds an `@aws-sdk/client-s3` `S3Client` pointed at
   R2's S3-compatible endpoint (`https://{accountId}.r2.cloudflarestorage.com`, `forcePathStyle: true`,
   `region: "auto"`) and issues a `PutObjectCommand`. Content-Type is derived from the file extension via the
   static lookup table in `src/utils/mime-types.ts`.
7. Build the final URL — prefixed with the custom domain preference if set, otherwise the raw R2 endpoint/bucket
   URL — and copy either the plain URL or a Markdown `![alt](url)` link to the clipboard depending on the
   "Generate Markdown" preference.

Notes on the filename templating (`generateFileName`): it does simple string `.replace()` of `{name}`, `{ext}`,
`{year}`, `{month}`, `{day}`, `{hours}`, `{minutes}`, `{seconds}` placeholders, formatting the timestamp with
`dayjs`. It always forces the final extension to match the original (or a passed-in `customExtension`), overriding
whatever extension the format string produced.

## Preferences / config surface

All user-facing configuration lives in `package.json`'s `preferences` array (bucket name, access key, secret key,
account ID, custom domain, filename format, AVIF toggle + path + quality, Markdown toggle). When adding or
renaming a preference, update `package.json` and let Raycast regenerate `raycast-env.d.ts` — don't edit the
generated types by hand.

## Code style

- Formatting is enforced by Prettier (`.prettierrc`: 120 print width, double quotes).
- Linting extends `@raycast/eslint-config` (`eslint.config.js`) — this is the canonical style/correctness gate,
  not a custom ruleset.
- `tsconfig.json` runs in `strict` mode targeting ES2023/ESM (`"type": "module"` in `package.json`).
