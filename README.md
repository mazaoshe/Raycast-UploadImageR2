# Image to R2 Uploader / 图片上传到 R2

Upload images to Cloudflare R2 storage service with optional AVIF conversion to reduce file size.

将图片上传到 Cloudflare R2 存储服务，并可选择转换为 AVIF 格式以减小文件大小。

## Features / 功能

- Upload images to Cloudflare R2 storage service
- Optionally convert images to AVIF format to reduce file size
- Support custom filename formats
- Automatically generate Markdown image links and copy to clipboard

- 将图片上传到 Cloudflare R2 存储服务
- 可选地将图片转换为 AVIF 格式以减小文件大小
- 支持自定义文件名格式
- 自动生成 Markdown 格式的图片链接并复制到剪贴板

## Requirements / 要求

### Required Configuration / 必需配置
- Cloudflare R2 Bucket
- Cloudflare API Access Keys

- Cloudflare R2 存储桶
- Cloudflare API 访问密钥

### Optional Dependencies (for AVIF conversion) / 可选依赖（用于 AVIF 转换）
If AVIF conversion is enabled, you need to install the libavif tool:

如果启用 AVIF 转换功能，需要安装 libavif 工具：

```bash
brew install libavif
```

## Configuration Options / 配置选项

1. **R2 Bucket Name** - Your Cloudflare R2 bucket name
2. **R2 Access Key ID** - Your Cloudflare R2 access key ID
3. **R2 Secret Access Key** - Your Cloudflare R2 secret access key
4. **R2 Account ID** - Your Cloudflare account ID
5. **Custom Domain** (optional) - Custom domain for accessing files
6. **File Name Format** (optional) - Custom filename format
7. **Convert to AVIF** - Convert images to AVIF format before uploading
8. **AVIF Encoder Path** (optional) - Path to avifenc command (default: `/opt/homebrew/bin/avifenc`)

1. **R2 Bucket Name** - 您的 Cloudflare R2 存储桶名称
2. **R2 Access Key ID** - 您的 Cloudflare R2 访问密钥 ID
3. **R2 Secret Access Key** - 您的 Cloudflare R2 秘密访问密钥
4. **R2 Account ID** - 您的 Cloudflare 账户 ID
5. **Custom Domain** (可选) - 用于访问文件的自定义域名
6. **File Name Format** (可选) - 自定义文件名格式
7. **Convert to AVIF** - 是否在上传前将图片转换为 AVIF 格式
8. **AVIF Encoder Path** (可选) - avifenc 命令的路径（默认为 `/opt/homebrew/bin/avifenc`）

## Custom Filename Format / 自定义文件名格式

Supported variables / 支持的变量：
- `{name}` - Original filename (without extension)
- `{ext}` - File extension (without dot)
- `{year}` - Four-digit year
- `{month}` - Two-digit month (01-12)
- `{day}` - Two-digit day (01-31)
- `{hours}` - Two-digit hour (00-23)
- `{minutes}` - Two-digit minute (00-59)
- `{seconds}` - Two-digit second (00-59)

- `{name}` - 原始文件名（不包含扩展名）
- `{ext}` - 文件扩展名（不包含点号）
- `{year}` - 四位数年份
- `{month}` - 两位数月份（01-12）
- `{day}` - 两位数日期（01-31）
- `{hours}` - 两位数小时（00-23）
- `{minutes}` - 两位数分钟（00-59）
- `{seconds}` - 两位数秒数（00-59）

Example formats / 示例格式：
- `{name}_{year}{month}{day}_{hours}{minutes}{seconds}.{ext}` → Result: `screenshot_20250815_143022.png`
- `image_{year}-{month}-{day}.{ext}` → Result: `image_2025-08-15.png`

- `{name}_{year}{month}{day}_{hours}{minutes}{seconds}.{ext}` → 结果：`screenshot_20250815_143022.png`
- `image_{year}-{month}-{day}.{ext}` → 结果：`image_2025-08-15.png`

## Usage Workflow / 使用流程

### Initial Setup / 初始设置
1. Install the extension from Raycast Store
2. Open Raycast Preferences > Extensions > Image to R2 Uploader
3. Configure your Cloudflare R2 credentials:
   - R2 Bucket Name
   - R2 Access Key ID
   - R2 Secret Access Key
   - R2 Account ID
4. (Optional) Install libavif for AVIF conversion: `brew install libavif`
5. (Optional) Configure additional settings:
   - Custom Domain
   - File Name Format
   - Convert to AVIF (enabled by default)
   - AVIF Encoder Path (if different from default)

1. 从 Raycast 商店安装扩展
2. 打开 Raycast 首选项 > 扩展 > Image to R2 Uploader
3. 配置您的 Cloudflare R2 凭据：
   - R2 存储桶名称
   - R2 访问密钥 ID
   - R2 秘密访问密钥
   - R2 账户 ID
4. （可选）安装 libavif 以进行 AVIF 转换：`brew install libavif`
5. （可选）配置其他设置：
   - 自定义域名
   - 文件名格式
   - 转换为 AVIF（默认启用）
   - AVIF 编码器路径（如果与默认路径不同）

### Daily Usage / 日常使用
1. Select an image file in Finder
2. Open Raycast (Cmd + Space) and search for "Upload Image to R2"
3. Press Enter to execute the command
4. The extension will:
   - (If enabled) Convert the image to AVIF format
   - Upload the image to your R2 bucket
   - Generate a Markdown image link
   - Copy the link to your clipboard
5. Paste the Markdown link anywhere you need it

1. 在 Finder 中选择一个图片文件
2. 打开 Raycast（Cmd + Space）并搜索"Upload Image to R2"
3. 按回车键执行命令
4. 扩展将：
   - （如果启用）将图片转换为 AVIF 格式
   - 将图片上传到您的 R2 存储桶
   - 生成 Markdown 图片链接
   - 将链接复制到剪贴板
5. 在任何需要的地方粘贴 Markdown 链接

## Troubleshooting / 故障排除

### AVIF Conversion Tool Not Found / AVIF 转换工具未找到
If you encounter the "AVIF conversion tool not found" error:
1. Ensure libavif is installed: `brew install libavif`
2. Check that the "AVIF Encoder Path" setting points to the correct avifenc command
3. Run `which avifenc` in terminal to find the correct path

如果遇到 "AVIF conversion tool not found" 错误：
1. 确保已安装 libavif：`brew install libavif`
2. 检查 "AVIF Encoder Path" 设置是否正确指向 avifenc 命令
3. 在终端中运行 `which avifenc` 查找正确路径

### Upload Failed / 上传失败
If the upload fails:
1. Check your Cloudflare R2 credentials in extension preferences
2. Verify your internet connection
3. Check that your R2 bucket exists and is accessible
4. Review the Raycast console logs for detailed error information

如果上传失败：
1. 检查扩展首选项中的 Cloudflare R2 凭据
2. 验证您的网络连接
3. 检查您的 R2 存储桶是否存在且可访问
4. 查看 Raycast 控制台日志以获取详细的错误信息