
import path from "path";
import { format } from "date-fns";

export async function generateFileName(originalPath: string, formatString: string, customExtension?: string): Promise<string> {
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
