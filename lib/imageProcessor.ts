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

export function adjustBrightness(
  grayscale: Uint8Array,
  value: number
): Uint8Array {
  // value from -100 to 100
  if (value === 0) return grayscale;
  const newData = new Uint8Array(grayscale.length);
  const v = Math.round((255 * value) / 100);

  for (let i = 0; i < grayscale.length; i++) {
    newData[i] = Math.min(255, Math.max(0, grayscale[i] + v));
  }
  return newData;
}

export function adjustContrast(
  grayscale: Uint8Array,
  value: number
): Uint8Array {
  // value from -100 to 100
  if (value === 0) return grayscale;
  const newData = new Uint8Array(grayscale.length);
  const factor = (259 * (value + 255)) / (255 * (259 - value));

  for (let i = 0; i < grayscale.length; i++) {
    newData[i] = Math.min(255, Math.max(0, factor * (grayscale[i] - 128) + 128));
  }
  return newData;
}

export function sharpenImage(
  grayscale: Uint8Array,
  width: number,
  height: number,
  amount: number = 0 // 0 to 100 (percentage mix)
): Uint8Array {
  if (amount <= 0) return grayscale;

  const newData = new Uint8Array(grayscale.length);
  const mix = Math.min(1, Math.max(0, amount / 100));
  
  // Simple kernel for sharpening
  //  0 -1  0
  // -1  5 -1
  //  0 -1  0
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        newData[idx] = grayscale[idx];
        continue;
      }

      const top = grayscale[idx - width];
      const bottom = grayscale[idx + width];
      const left = grayscale[idx - 1];
      const right = grayscale[idx + 1];
      const center = grayscale[idx];

      const val = 5 * center - left - right - top - bottom;
      const sharpened = Math.min(255, Math.max(0, val));
      
      // Blend original with sharpened based on amount
      newData[idx] = Math.round(center * (1 - mix) + sharpened * mix);
    }
  }
  
  return newData;
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

export function applyAtkinsonDithering(
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

      // Atkinson error diffusion
      //       X   1/8 1/8
      //   1/8 1/8 1/8
      //       1/8

      const errDiv8 = error / 8;

      if (x + 1 < width) buffer[i + 1] += errDiv8;
      if (x + 2 < width) buffer[i + 2] += errDiv8;
      
      if (y + 1 < height) {
        if (x > 0) buffer[i + width - 1] += errDiv8;
        buffer[i + width] += errDiv8;
        if (x + 1 < width) buffer[i + width + 1] += errDiv8;
      }
      
      if (y + 2 < height) {
        buffer[i + 2 * width] += errDiv8;
      }
    }
  }

  return binary;
}

export function applySierraDithering(
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

      // Sierra Lite error diffusion
      //       X   2/4
      //   1/4 1/4

      const errDiv4 = error / 4;
      const errMul2Div4 = (error * 2) / 4;

      if (x + 1 < width) buffer[i + 1] += errMul2Div4;

      if (y + 1 < height) {
         if (x > 0) buffer[i + width - 1] += errDiv4;
         buffer[i + width] += errDiv4;
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

export type DitherAlgo = 'none' | 'floyd' | 'atkinson' | 'sierra';

export interface ImageProcessingOptions {
  dither: DitherAlgo;
  threshold?: number;
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  sharpen?: number; // 0 to 100
}

export async function processImageForPrinter(
  imageSrc: string,
  options: ImageProcessingOptions = { dither: 'floyd' }
): Promise<{ bitmap: Uint8Array; width: number; height: number }> {
  const img = await loadImage(imageSrc);
  const canvas = imageToCanvas(img, PRINTER_WIDTH);
  let grayscale = canvasToGrayscale(canvas);

  // Apply preprocessing
  if (options.brightness && options.brightness !== 0) {
    grayscale = adjustBrightness(grayscale, options.brightness);
  }
  
  if (options.contrast && options.contrast !== 0) {
    grayscale = adjustContrast(grayscale, options.contrast);
  }
  
  if (options.sharpen && options.sharpen > 0) {
    grayscale = sharpenImage(grayscale, canvas.width, canvas.height, options.sharpen);
  }

  let binary: Uint8Array;
  
  switch (options.dither) {
    case 'floyd':
      binary = applyFloydSteinbergDithering(grayscale, canvas.width, canvas.height);
      break;
    case 'atkinson':
      binary = applyAtkinsonDithering(grayscale, canvas.width, canvas.height);
      break;
    case 'sierra':
      binary = applySierraDithering(grayscale, canvas.width, canvas.height);
      break;
    case 'none':
    default:
      binary = applyThreshold(grayscale, options.threshold ?? 128);
      break;
  }

  const bitmap = binaryToBitmap(binary, canvas.width);

  return {
    bitmap,
    width: canvas.width,
    height: canvas.height,
  };
}
