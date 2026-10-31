'use strict';
const { writeFileSync } = require('node:fs');
const side = 256, maskStride = side / 8;
const pixels = Buffer.alloc(side * side * 4), mask = Buffer.alloc(maskStride * side);
for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
  const dx = x - 127.5, dy = y - 127.5, r = Math.hypot(dx, dy);
  const visible = r < 120;
  const clock = (r > 87 && r < 99) || (Math.abs(dx) < 6 && dy > -61 && dy < 7) || (Math.abs(dy) < 6 && dx > -5 && dx < 56);
  const i = ((side - 1 - y) * side + x) * 4;
  pixels[i] = clock ? 240 : 43; pixels[i + 1] = clock ? 226 : 36; pixels[i + 2] = clock ? 211 : 30; pixels[i + 3] = visible ? 255 : 0;
  if (!visible) mask[(side - 1 - y) * maskStride + (x >> 3)] |= 0x80 >> (x & 7);
}
const bmp = Buffer.alloc(40); bmp.writeUInt32LE(40); bmp.writeInt32LE(side, 4); bmp.writeInt32LE(side * 2, 8); bmp.writeUInt16LE(1, 12); bmp.writeUInt16LE(32, 14); bmp.writeUInt32LE(pixels.length, 20);
const header = Buffer.alloc(22); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4); header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12); header.writeUInt32LE(bmp.length + pixels.length + mask.length, 14); header.writeUInt32LE(22, 18);
writeFileSync('installer/app.ico', Buffer.concat([header, bmp, pixels, mask]));
