/*
 * @Author: Yang
 * @Date: 2025-08-12 20:07:46
 * @Description: 请填写简介
 */
import { showToast, Toast, getSelectedFinderItems, Clipboard, getPreferenceValues } from "@raycast/api";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import "dotenv/config";
import { convertToAvif } from "./utils/convert";

interface Preferences {
  r2BucketName: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2AccountId: string;
  customDomain: string;
  fileNameFormat: string;
  convertToAvif: boolean;
  avifencPath: string;
}

// 检查 avifenc 命令是否存在
function isAvifencAvailable(customPath?: string): boolean {
  const avifencPath = customPath || "/opt/homebrew/bin/avifenc";

  try {
    execFileSync(avifencPath, ["--version"]);
    return true;
  } catch {
    // 如果默认路径失败，尝试系统 PATH 中的 avifenc
    try {
      execFileSync("avifenc", ["--version"]);
      return true;
    } catch {
      return false;
    }
  }
}

async function generateFileName(originalPath: string, format: string, customExtension?: string): Promise<string> {
  const ext = customExtension || path.extname(originalPath).toLowerCase();
  const basename = path.basename(originalPath, path.extname(originalPath));

  // 如果格式为空或未定义，使用原始文件名，但应用自定义扩展名（如果提供）
  if (!format) {
    if (customExtension) {
      return basename + customExtension;
    }
    return path.basename(originalPath);
  }

  // 替换格式字符串中的变量
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  let formattedName = format
    .replace(/{name}/g, basename)
    .replace(/{ext}/g, ext.substring(1)) // 移除点号
    .replace(/{year}/g, String(year))
    .replace(/{month}/g, month)
    .replace(/{day}/g, day)
    .replace(/{hours}/g, hours)
    .replace(/{minutes}/g, minutes)
    .replace(/{seconds}/g, seconds);

  // 确保文件名总是包含正确的扩展名
  if (!path.extname(formattedName)) {
    formattedName += ext;
  } else if (path.extname(formattedName) !== ext) {
    // 如果用户指定了不同的扩展名，我们仍然使用原始扩展名
    formattedName = path.basename(formattedName, path.extname(formattedName)) + ext;
  }

  return formattedName;
}

async function uploadToR2(filePath: string, customFileName?: string): Promise<{ url: string; markdown: string }> {
  // 首先尝试从环境变量获取
  let bucketName = process.env.R2_BUCKET_NAME;
  let accessKeyId = process.env.R2_ACCESS_KEY_ID;
  let secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  let accountId = process.env.R2_ACCOUNT_ID;
  let customDomain = process.env.CUSTOM_DOMAIN;
  let fileNameFormat = process.env.FILE_NAME_FORMAT;

  // 如果环境变量不存在，则从首选项获取
  if (!bucketName || !accessKeyId || !secretAccessKey || !accountId) {
    const preferences = getPreferenceValues<Preferences>();
    bucketName = preferences.r2BucketName;
    accessKeyId = preferences.r2AccessKeyId;
    secretAccessKey = preferences.r2SecretAccessKey;
    accountId = preferences.r2AccountId;
    customDomain = preferences.customDomain;
    fileNameFormat = preferences.fileNameFormat;
  }

  if (!bucketName || !accessKeyId || !secretAccessKey || !accountId) {
    throw new Error("Missing R2 credentials. Please configure in extension preferences.");
  }

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

  // 先读取文件内容到缓冲区，避免流式传输问题
  const fileContent = await fs.promises.readFile(filePath);

  // 确定文件名
  const finalFileName =
    customFileName || (await generateFileName(filePath, fileNameFormat || "", path.extname(filePath)));
  const key = finalFileName;

  // 获取文件的 MIME 类型
  // 根据实际文件路径（可能已转换格式）确定 MIME 类型
  const fileExt = path.extname(filePath).toLowerCase();
  let contentType = "image/jpeg";
  if (fileExt === ".png") {
    contentType = "image/png";
  } else if (fileExt === ".gif") {
    contentType = "image/gif";
  } else if (fileExt === ".webp") {
    contentType = "image/webp";
  } else if (fileExt === ".avif") {
    contentType = "image/avif";
  }

  const putObjectCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileContent, // 使用缓冲区而不是流
    ContentType: contentType,
  });

  await s3Client.send(putObjectCommand);

  // 构建返回的 URL
  let url: string;
  if (customDomain) {
    // 如果配置了自定义域名，则使用自定义域名
    const cleanDomain = customDomain.replace(/\/$/, ""); // 移除末尾的斜杠
    url = `${cleanDomain}/${key}`;
  } else {
    // 否则使用默认的 R2 端点
    url = `${endpoint}/${bucketName}/${key}`;
  }

  // 生成 Markdown 格式的链接
  const markdown = `![${path.basename(key, path.extname(key))}](${url})`;

  return { url, markdown };
}

export default async function Command() {
  try {
    // 使用 getSelectedFinderItems 获取选中的文件
    const selectedItems = await getSelectedFinderItems();

    if (!selectedItems || selectedItems.length === 0) {
      await showToast({ style: Toast.Style.Failure, title: "No file selected" });
      return;
    }

    const inputFilePath = selectedItems[0].path;

    // 获取首选项以检查是否需要自定义文件名和转换选项
    const preferences = getPreferenceValues<Preferences>();
    const fileNameFormat = preferences.fileNameFormat;
    const shouldConvertToAvif = preferences.convertToAvif;

    let customFileName: string | undefined;

    // 如果有文件名格式设置，生成自定义文件名
    if (fileNameFormat) {
      customFileName = await generateFileName(inputFilePath, fileNameFormat);
    }

    const toastUploading = await showToast({
      style: Toast.Style.Animated,
      title: "Uploading to Cloudflare R2...",
    });

    let newFilePath = inputFilePath;

    // 如果启用了转换功能
    if (shouldConvertToAvif) {
      // 检查 avifenc 是否可用
      const avifencPath = preferences.avifencPath || "/opt/homebrew/bin/avifenc";
      if (!isAvifencAvailable(avifencPath)) {
        await showToast({
          style: Toast.Style.Failure,
          title: "AVIF conversion tool not found",
          message: "Please install libavif using 'brew install libavif' or check the path in extension preferences",
        });
        // 即使转换失败也继续上传原始文件
      } else {
        try {
          newFilePath = await convertToAvif(inputFilePath, avifencPath);
        } catch (conversionError: unknown) {
          // 如果转换失败，使用原始文件
          console.error("Conversion failed, using original file:", conversionError);
          await showToast({
            style: Toast.Style.Failure,
            title: "Conversion failed",
            message: (conversionError as Error).message || "Unknown error occurred during conversion",
          });
          newFilePath = inputFilePath;
        }
      }
    }

    const { url, markdown } = await uploadToR2(newFilePath, customFileName);

    toastUploading.style = Toast.Style.Success;
    toastUploading.title = "Upload complete";
    toastUploading.message = url;

    // 将 Markdown 格式的链接复制到剪贴板
    Clipboard.copy(markdown);

    await showToast({
      style: Toast.Style.Success,
      title: "File uploaded",
      message: "Markdown link copied to clipboard",
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    await showToast({
      style: Toast.Style.Failure,
      title: "Error",
      message: (error as Error).message || "Unknown error occurred during upload",
    });
  }
}
