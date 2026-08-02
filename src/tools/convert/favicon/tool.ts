export interface FaviconSizes {
  favicon: number[];
  png: number[];
  apple: number[];
  android: number[];
  windows: number[];
}

export const FAVICON_SIZES: FaviconSizes = {
  favicon: [16, 32, 48],
  png: [16, 32, 48, 64, 96, 128, 192, 256, 512],
  apple: [57, 60, 72, 76, 114, 120, 144, 152, 167, 180],
  android: [36, 48, 72, 96, 144, 192, 512],
  windows: [70, 150, 310],
};

export interface FaviconOptions {
  backgroundColor?: string;
  themeColor?: string;
  appName?: string;
  shortName?: string;
  display?: "fullscreen" | "standalone" | "minimal-ui" | "browser";
  orientation?: "portrait" | "landscape" | "any";
  maskable?: boolean;
}

export interface GeneratedIcon {
  size: number;
  name: string;
  dataUrl: string;
  blob: Blob;
}

export async function generateFavicons(
  imageData: Uint8Array,
  mimeType: string,
  options: FaviconOptions = {}
): Promise<{ icons: GeneratedIcon[]; manifest: string; html: string }> {
  const imageBitmap = await createImageBitmap(new Blob([imageData.slice()], { type: mimeType }));
  const icons: GeneratedIcon[] = [];

  const allSizes = new Set<number>([
    ...FAVICON_SIZES.favicon,
    ...FAVICON_SIZES.png,
    ...FAVICON_SIZES.apple,
    ...FAVICON_SIZES.android,
    ...FAVICON_SIZES.windows,
  ]);

  for (const size of allSizes) {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext("2d")!;

    if (options.backgroundColor) {
      ctx.fillStyle = options.backgroundColor;
      ctx.fillRect(0, 0, size, size);
    }

    const scale = Math.min(size / imageBitmap.width, size / imageBitmap.height);
    const drawWidth = imageBitmap.width * scale;
    const drawHeight = imageBitmap.height * scale;
    const x = (size - drawWidth) / 2;
    const y = (size - drawHeight) / 2;

    ctx.drawImage(imageBitmap, x, y, drawWidth, drawHeight);

    const blob = await canvas.convertToBlob({ type: "image/png" });
    const dataUrl = await blobToDataUrl(blob);

    icons.push({
      size,
      name: `icon-${size}x${size}.png`,
      dataUrl,
      blob,
    });
  }

  const icoBlob = await generateIco(icons);
  const icoDataUrl = await blobToDataUrl(icoBlob);
  icons.unshift({ size: 0, name: "favicon.ico", dataUrl: icoDataUrl, blob: icoBlob });

  const manifest = generateManifest(icons, options);
  const html = generateHtml(icons, options);

  return { icons, manifest, html };
}

async function generateIco(icons: GeneratedIcon[]): Promise<Blob> {
  const sizes = [16, 32, 48];
  const pngs = icons.filter(i => sizes.includes(i.size)).map(i => i.blob);

  const header = new Uint8Array(6);
  header[0] = 0; header[1] = 0;
  header[2] = 1; header[3] = 0;
  header[4] = sizes.length; header[5] = 0;

  const dirEntries = new Uint8Array(sizes.length * 16);
  let offset = 6 + sizes.length * 16;

  for (let i = 0; i < sizes.length; i++) {
    const png = pngs[i];
    const arrayBuffer = await png.arrayBuffer();
    const pngData = new Uint8Array(arrayBuffer);

    dirEntries[i * 16] = sizes[i];
    dirEntries[i * 16 + 1] = sizes[i];
    dirEntries[i * 16 + 2] = 0;
    dirEntries[i * 16 + 3] = 0;
    dirEntries[i * 16 + 4] = 1;
    dirEntries[i * 16 + 5] = 0;
    dirEntries[i * 16 + 6] = 32;
    dirEntries[i * 16 + 7] = 0;
    const view = new DataView(dirEntries.buffer, i * 16 + 8, 4);
    view.setUint32(0, pngData.length, true);
    const offsetView = new DataView(dirEntries.buffer, i * 16 + 12, 4);
    offsetView.setUint32(0, offset, true);

    offset += pngData.length;
  }

  const totalSize = offset;
  const icoData = new Uint8Array(totalSize);
  icoData.set(header, 0);
  icoData.set(dirEntries, 6);

  let pngOffset = 6 + sizes.length * 16;
  for (const png of pngs) {
    const arrayBuffer = await png.arrayBuffer();
    icoData.set(new Uint8Array(arrayBuffer), pngOffset);
    pngOffset += arrayBuffer.byteLength;
  }

  return new Blob([icoData], { type: "image/x-icon" });
}

function generateManifest(icons: GeneratedIcon[], options: FaviconOptions): string {
  const pngIcons = icons.filter(i => i.size > 0 && i.name.endsWith(".png"));

  const manifest = {
    name: options.appName || "Web App",
    short_name: options.shortName || options.appName?.slice(0, 12) || "App",
    description: "",
    start_url: "/",
    display: options.display || "standalone",
    background_color: options.backgroundColor || "#ffffff",
    theme_color: options.themeColor || "#000000",
    orientation: options.orientation || "any",
    icons: pngIcons.map(i => ({
      src: i.name,
      sizes: `${i.size}x${i.size}`,
      type: "image/png",
      purpose: options.maskable ? "any maskable" : "any",
    })),
  };

  return JSON.stringify(manifest, null, 2);
}

function generateHtml(icons: GeneratedIcon[], options: FaviconOptions): string {
  let html = "";
  const pngIcons = icons.filter(i => i.size > 0 && i.name.endsWith(".png"));

  const ico = icons.find(i => i.name === "favicon.ico");
  if (ico) {
    html += `<link rel="icon" href="${ico.name}" sizes="any">\n`;
  }

  for (const icon of pngIcons) {
    const isApple = FAVICON_SIZES.apple.includes(icon.size);
    if (isApple) {
      html += `<link rel="apple-touch-icon" sizes="${icon.size}x${icon.size}" href="${icon.name}">\n`;
    } else {
      html += `<link rel="icon" type="image/png" sizes="${icon.size}x${icon.size}" href="${icon.name}">\n`;
    }
  }

  if (options.maskable) {
    const maskable = pngIcons.find(i => i.size >= 192);
    if (maskable) {
      html += `<link rel="icon" type="image/png" sizes="${maskable.size}x${maskable.size}" href="${maskable.name}" purpose="any maskable">\n`;
    }
  }

  if (options.themeColor) {
    html += `<meta name="theme-color" content="${options.themeColor}">\n`;
  }

  html += `<link rel="manifest" href="manifest.json">\n`;

  return html;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}