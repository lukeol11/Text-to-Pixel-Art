import type { Font, Glyph, Pixel } from 'js-pixel-fonts';

type ConvertFontOptions = {
  chars?: string;
  fontSize?: number;
};

type GlyphBounds = {
  minX: number;
  maxX: number;
};

async function loadFont(fontUrl: string, name = 'custom-font') {
  const res = await fetch(fontUrl);
  const buffer = await res.arrayBuffer();

  const blob = new Blob([buffer], { type: 'font/ttf' });
  const blobUrl = URL.createObjectURL(blob);

  const fontFace = new FontFace(name, `url(${blobUrl})`);
  await fontFace.load();

  document.fonts.add(fontFace);

  return name;
}

function getGlyphBounds(image: ImageData, width: number, height: number): GlyphBounds | null {
  let minX = width;
  let maxX = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;

      if ((image.data[index] ?? 0) <= 10) {
        continue;
      }

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
  }

  if (maxX === -1) {
    return null;
  }

  return { minX, maxX };
}

function buildGlyphPixels(image: ImageData, width: number, height: number, bounds: GlyphBounds): Pixel[][] {
  const pixels: Pixel[][] = [];

  for (let y = 0; y < height; y++) {
    const row: Pixel[] = [];

    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      const index = (y * width + x) * 4;
      row.push((image.data[index] ?? 0) > 127 ? 1 : 0);
    }

    pixels.push(row);
  }

  return pixels;
}

function drawGlyph(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  char: string,
  fontName: string,
  fontSize: number,
  height: number,
  ascent: number,
) {
  canvas.width = 64;
  canvas.height = height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${fontSize}px ${fontName}`;
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(char, 0, ascent);
}

async function convertFont(fontUrl: string, options: ConvertFontOptions = {}): Promise<Font> {
  const { chars = '', fontSize = 24 } = options;
  const fontName = await loadFont(fontUrl);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  ctx.font = `${fontSize}px ${fontName}`;

  // Measure baseline metrics once
  const metrics = ctx.measureText('Hg');
  const ascent = Math.ceil(metrics.actualBoundingBoxAscent);
  const descent = Math.ceil(metrics.actualBoundingBoxDescent);

  const height = ascent + descent;

  const glyphs: Record<string, Glyph> = {};

  for (const char of chars) {
    drawGlyph(ctx, canvas, char, fontName, fontSize, height, ascent);

    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const bounds = getGlyphBounds(img, canvas.width, canvas.height);

    if (!bounds) {
      glyphs[char] = { offset: 0, pixels: [[0]] };
      continue;
    }

    glyphs[char] = {
      // baseline alignment offset (important for renderer)
      offset: ascent,
      pixels: buildGlyphPixels(img, canvas.width, canvas.height, bounds),
    };
  }

  return {
    name: fontName,
    lineHeight: ascent + descent,
    description: 'Generated from TTF via canvas (baseline aligned)',
    isFixedWidth: false,
    glyphs,
  };
}

export default convertFont;
