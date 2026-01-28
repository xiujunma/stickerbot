const PRINTER_WIDTH = 384;

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function imageToCanvas(
  img: HTMLImageElement,
  targetWidth: number = PRINTER_WIDTH
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const aspectRatio = img.height / img.width;
  canvas.width = targetWidth;
  canvas.height = Math.round(targetWidth * aspectRatio);

  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas;
}

export function canvasToGrayscale(canvas: HTMLCanvasElement): Uint8Array {
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const grayscale = new Uint8Array(canvas.width * canvas.height);

  for (let i = 0; i < grayscale.length; i++) {
    const r = imageData.data[i * 4];
    const g = imageData.data[i * 4 + 1];
    const b = imageData.data[i * 4 + 2];
    // Use luminance formula
    grayscale[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  return grayscale;
}

export function applyThreshold(
  grayscale: Uint8Array,
  threshold: number = 128
): Uint8Array {
  const binary = new Uint8Array(grayscale.length);
  for (let i = 0; i < grayscale.length; i++) {
    // 0 = black (print), 1 = white (no print)
    binary[i] = grayscale[i] > threshold ? 1 : 0;
  }
  return binary;
}

export function applyFloydSteinbergDithering(
  grayscale: Uint8Array,
  width: number,
  height: number
): Uint8Array {
  const buffer = new Float32Array(grayscale);
  const binary = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const oldPixel = buffer[i];
      const newPixel = oldPixel > 128 ? 255 : 0;
      binary[i] = newPixel > 128 ? 1 : 0;
      const error = oldPixel - newPixel;

      if (x + 1 < width) buffer[i + 1] += (error * 7) / 16;
      if (y + 1 < height) {
        if (x > 0) buffer[i + width - 1] += (error * 3) / 16;
        buffer[i + width] += (error * 5) / 16;
        if (x + 1 < width) buffer[i + width + 1] += (error * 1) / 16;
      }
    }
  }

  return binary;
}

export function binaryToBitmap(
  binary: Uint8Array,
  width: number
): Uint8Array {
  const height = Math.floor(binary.length / width);
  const bytesPerRow = Math.ceil(width / 8);
  const bitmap = new Uint8Array(bytesPerRow * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = y * width + x;
      const dstByteIdx = y * bytesPerRow + Math.floor(x / 8);
      const bitIdx = 7 - (x % 8);

      // 0 = black (print), 1 = white (no print)
      // For Cat Printer: 1 = print (black), 0 = no print (white)
      // So we invert: if binary[srcIdx] is 0 (black), we set bit to 1
      if (binary[srcIdx] === 0) {
        bitmap[dstByteIdx] |= 1 << bitIdx;
      }
    }
  }

  return bitmap;
}

export async function processImageForPrinter(
  imageSrc: string,
  useDithering: boolean = false
): Promise<{ bitmap: Uint8Array; width: number; height: number }> {
  const img = await loadImage(imageSrc);
  const canvas = imageToCanvas(img, PRINTER_WIDTH);
  const grayscale = canvasToGrayscale(canvas);

  const binary = useDithering
    ? applyFloydSteinbergDithering(grayscale, canvas.width, canvas.height)
    : applyThreshold(grayscale);

  const bitmap = binaryToBitmap(binary, canvas.width);

  return {
    bitmap,
    width: canvas.width,
    height: canvas.height,
  };
}
