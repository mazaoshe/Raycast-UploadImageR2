# R2 Uploader Changelog

## [Custom Upload Path & Link Format] - {PR_MERGE_DATE}

- Add **Upload Path Prefix** preference to store uploads under a folder instead of the bucket root, with the same date/name placeholders as the filename format (closes [#1](https://github.com/mazaoshe/Raycast-UploadImageR2/issues/1))
- Add an optional **Folder** argument to set the upload folder per invocation; it's "sticky" across uploads (persisted until changed or reset with `/` or `root`) and reflected live in the command's subtitle so the active folder is always visible before uploading
- Replace the **Generate Markdown** checkbox with a **Link Format** dropdown (Plain URL / Markdown / HTML)
- Fix `{year}`/`{day}` filename placeholders, which used invalid dayjs format tokens and produced incorrect output

## [Initial Version] - 2025-09-04