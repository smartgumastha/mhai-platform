/**
 * Generate PWA icons as minimal valid PNGs.
 * Uses raw PNG encoding (no native dependencies).
 * Produces a green (#059669) square with a white "M" approximated as pixels.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(size) {
  // RGBA raw pixel data
  const pixels = Buffer.alloc(size * size * 4);
  const bg = [5, 150, 105]; // #059669
  const white = [255, 255, 255];

  // Fill background
  for (let i = 0; i < size * size; i++) {
    pixels[i * 4] = bg[0];
    pixels[i * 4 + 1] = bg[1];
    pixels[i * 4 + 2] = bg[2];
    pixels[i * 4 + 3] = 255;
  }

  // Draw a simple "M" letter in white
  const margin = Math.floor(size * 0.25);
  const thickness = Math.max(Math.floor(size * 0.12), 2);
  const top = margin;
  const bottom = size - margin;
  const left = margin;
  const right = size - margin;
  const midX = Math.floor(size / 2);

  function setPixel(x, y) {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      const idx = (y * size + x) * 4;
      pixels[idx] = white[0];
      pixels[idx + 1] = white[1];
      pixels[idx + 2] = white[2];
      pixels[idx + 3] = 255;
    }
  }

  function fillRect(x1, y1, x2, y2) {
    for (let y = y1; y < y2; y++)
      for (let x = x1; x < x2; x++)
        setPixel(x, y);
  }

  // Left vertical bar
  fillRect(left, top, left + thickness, bottom);
  // Right vertical bar
  fillRect(right - thickness, top, right, bottom);
  // Left diagonal (top-left to center)
  const diagHeight = Math.floor((bottom - top) * 0.45);
  for (let i = 0; i < diagHeight; i++) {
    const y = top + i;
    const x = left + thickness + Math.floor((midX - left - thickness) * i / diagHeight);
    fillRect(x, y, x + thickness, y + 1);
  }
  // Right diagonal (top-right to center)
  for (let i = 0; i < diagHeight; i++) {
    const y = top + i;
    const x = right - thickness - Math.floor((right - thickness - midX) * i / diagHeight);
    fillRect(x - thickness, y, x, y + 1);
  }

  // Build PNG file
  // Filter: each row prefixed with 0 (None filter)
  const rowSize = size * 4 + 1;
  const raw = Buffer.alloc(rowSize * size);
  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0; // filter byte
    pixels.copy(raw, y * rowSize + 1, y * size * 4, (y + 1) * size * 4);
  }

  const compressed = zlib.deflateSync(raw);

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type);
    const crcData = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeInt32BE(crc32(crcData));
    return Buffer.concat([len, typeB, data, crc]);
  }

  // CRC32 table
  const crcTable = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    crcTable[n] = c;
  }
  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return crc ^ -1;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', iend),
  ]);
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPNG(512));
console.log('Created icon-512.png');

fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPNG(192));
console.log('Created icon-192.png');
