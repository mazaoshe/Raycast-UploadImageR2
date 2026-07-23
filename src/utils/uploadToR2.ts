import { getPreferenceValues } from "@raycast/api";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { getMimeType } from "./mime-types";
import { generateFileName, renderTemplateTokens } from "./generate-fileName";

function buildObjectKey(fileName: string, pathPrefix: string | undefined, originalFilePath: string): string {
  if (!pathPrefix) {
    return fileName;
  }

  const renderedPrefix = renderTemplateTokens(pathPrefix, originalFilePath)
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0 && segment !== ".." && segment !== ".")
    .join("/");

  return renderedPrefix ? `${renderedPrefix}/${fileName}` : fileName;
}

export async function uploadToR2(
  filePath: string,
  customFileName: string | undefined,
  pathPrefixOverride?: string,
): Promise<{ url: string; markdown: string; html: string; key: string }> {
  const preferences = getPreferenceValues();
  const {
    r2BucketName: bucketName,
    r2AccessKeyId: accessKeyId,
    r2SecretAccessKey: secretAccessKey,
    r2AccountId: accountId,
    customDomain,
    fileNameFormat,
    uploadPathPrefix,
  } = preferences;

  const effectivePathPrefix = pathPrefixOverride !== undefined ? pathPrefixOverride : uploadPathPrefix;

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
  const key = buildObjectKey(finalFileName, effectivePathPrefix, filePath);

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

  const alt = path.basename(key, path.extname(key));
  const markdown = `![${alt}](${url})`;
  const html = `<img src="${url}" alt="${alt}" />`;

  return { url, markdown, html, key };
}
