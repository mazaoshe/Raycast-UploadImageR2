import { showToast, Toast, getSelectedFinderItems, Clipboard, getPreferenceValues } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { format } from "date-fns";
import { AVIFENC_DEFAULT_PATH } from "./utils/constants";
import { getMimeType, isSupportedImageFormat } from "./utils/mime-types";
import { convertToAvif, convertToWebP } from "./utils/convert";

function isAvifencAvailable(avifencPath: string): boolean {
  try {
    execFileSync(avifencPath, ["--version"]);
    return true;
  } catch (error) {
    try {
      execFileSync("avifenc", ["--version"]);
      return true;
    } catch (error) {
      return false;
    }
  }
}

async function generateFileName(originalPath: string, formatString: string, customExtension?: string): Promise<string> {
  const ext = customExtension || path.extname(originalPath).toLowerCase();
  const basename = path.basename(originalPath, path.extname(originalPath));

  if (!formatString) {
    if (customExtension) {
      return basename + customExtension;
    }
    return path.basename(originalPath);
  }

  const now = new Date();

  let formattedName = formatString
    .replace(/{name}/g, basename)
    .replace(/{ext}/g, ext.substring(1))
    .replace(/{year}/g, format(now, "yyyy"))
    .replace(/{month}/g, format(now, "MM"))
    .replace(/{day}/g, format(now, "dd"))
    .replace(/{hours}/g, format(now, "HH"))
    .replace(/{minutes}/g, format(now, "mm"))
    .replace(/{seconds}/g, format(now, "ss"));

  if (!path.extname(formattedName)) {
    formattedName += ext;
  } else if (path.extname(formattedName) !== ext) {
    formattedName = path.basename(formattedName, path.extname(formattedName)) + ext;
  }

  return formattedName;
}


async function uploadToR2(
  filePath: string,
  customFileName: string | undefined,
): Promise<{ url: string; markdown: string }> {
  const preferences = getPreferenceValues();
  const {
    r2BucketName: bucketName,
    r2AccessKeyId: accessKeyId,
    r2SecretAccessKey: secretAccessKey,
    r2AccountId: accountId,
    customDomain,
    fileNameFormat,
  } = preferences;

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

  const s3Client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });

  const fileContent = await fs.promises.readFile(filePath);

  const finalFileName =
    customFileName || (await generateFileName(filePath, fileNameFormat || "", path.extname(filePath)));
  const key = finalFileName;

  const contentType = getMimeType(filePath);

  const putObjectCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
  });

  await s3Client.send(putObjectCommand);

  let url: string;
  if (customDomain) {
    const cleanDomain = customDomain.replace(/\/$/, "");
    url = `${cleanDomain}/${key}`;
  } else {
    url = `${endpoint}/${bucketName}/${key}`;
  }

  const markdown = `![${path.basename(key, path.extname(key))}](${url})`;

  return { url, markdown };
}

export default async function Command() {
  try {
    const selectedItems = await getSelectedFinderItems();

    if (!selectedItems || selectedItems.length === 0) {
      await showToast({ style: Toast.Style.Failure, title: "No file selected" });
      return;
    }

    const inputFilePath = selectedItems[0].path;

    const preferences = getPreferenceValues();
    const {
      fileNameFormat,
      convertToAvif: shouldConvertToAvif,
      avifencPath: avifencPathPreference,
    } = preferences;

    let customFileName: string | undefined;

    if (fileNameFormat) {
      customFileName = await generateFileName(inputFilePath, fileNameFormat);
    }

    const toastUploading = await showToast({
      style: Toast.Style.Animated,
      title: "Uploading to Cloudflare R2...",
    });

    let newFilePath = inputFilePath;

    // Prioritize WebP conversions, or AVIF conversions if WebP is not enabled and AVIF is enabled
    if (preferences.convertToWebP) {
      if (isSupportedImageFormat(inputFilePath)) {
        try {
          // Get the WebP quality setting, which defaults to 80
          const webpQuality = preferences.webpQuality ? parseInt(preferences.webpQuality, 10) : 80;
          // Ensure that the quality value is within the valid range
          const quality = Math.max(0, Math.min(100, webpQuality));

          newFilePath = await convertToWebP(inputFilePath, quality);
        } catch (conversionError) {
          await showFailureToast(conversionError, { title: "Conversion failed" });
          newFilePath = inputFilePath;
        }
      }
    } else if (shouldConvertToAvif) {
      if (isSupportedImageFormat(inputFilePath)) {
        const avifencPath = avifencPathPreference || AVIFENC_DEFAULT_PATH;
        if (!isAvifencAvailable(avifencPath)) {
          await showToast({
            style: Toast.Style.Failure,
            title: "AVIF conversion tool not found",
            message: "Please install libavif using 'brew install libavif' or check the path in extension preferences",
          });
        } else {
          try {
            const avifQuality = preferences.avifQuality ? parseInt(preferences.avifQuality, 10) : 80;
            const quality = Math.max(0, Math.min(100, avifQuality));

            newFilePath = await convertToAvif(inputFilePath, avifencPath, quality);
          } catch (conversionError) {
            await showFailureToast(conversionError, { title: "Conversion failed" });
            newFilePath = inputFilePath;
          }
        }
      }
    }

    const { url, markdown } = await uploadToR2(newFilePath, customFileName);

    toastUploading.style = Toast.Style.Success;
    toastUploading.title = "Upload complete";
    toastUploading.message = url;

    await Clipboard.copy(markdown);
    toastUploading.style = Toast.Style.Success;
    toastUploading.title = "Upload completed!";
    toastUploading.message = "URL copied to clipboard";

  } catch (error) {
    await showFailureToast(error, { title: "Error uploading to R2" });
  }
}
