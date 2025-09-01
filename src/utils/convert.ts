import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { showFailureToast } from "@raycast/utils";
import { AVIFENC_DEFAULT_PATH } from "./constants";

const execFileAsync = promisify(execFile);

/**
 * Convert an image to AVIF format
 * @param inputPath Path to the input image file
 * @param avifencPath Path to the avifenc tool (optional)
 * @param quality Quality setting for conversion, 0-100 (optional, default: 80)
 * @returns Path to the converted AVIF file
 */
export async function convertToAvif(
  inputPath: string,
  avifencPath: string = AVIFENC_DEFAULT_PATH,
  quality: number = 80,
): Promise<string> {
  try {
    const outputPath = path.join(path.dirname(inputPath), path.basename(inputPath, path.extname(inputPath)) + ".avif");

    // Convert quality value to avifenc parameter (avifenc uses 0-63 range, 63 is lowest quality)
    const avifQuality = Math.max(0, Math.min(63, 63 - Math.round((quality * 63) / 100)));

    await execFileAsync(avifencPath, ["-q", avifQuality.toString(), "-s", "6", inputPath, outputPath]);

    return outputPath;
  } catch (error: unknown) {
    console.error("AVIF conversion error:", error);
    await showFailureToast(error, { title: "AVIF conversion failed" });
    throw error;
  }
}

/**
 * Convert an image to WebP format
 * @param inputPath Path to the input image file
 * @param quality Quality setting for conversion, 0-100 (optional, default: 80)
 * @returns Path to the converted WebP file
 */
export async function convertToWebP(
  inputPath: string,
  quality: number = 80,
): Promise<string> {
  try {
    const outputPath = path.join(path.dirname(inputPath), path.basename(inputPath, path.extname(inputPath)) + ".webp");
    
    
    return outputPath;
  } catch (error: unknown) {
    console.error("WebP conversion error:", error);
    await showFailureToast(error, { title: "WebP conversion failed" });
    throw error;
  }
}