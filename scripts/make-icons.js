// Generates real PNG icons for PartKart PWA (192, 512, maskable) — Flipkart style: blue rounded square, white italic "P", yellow ⚡
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const outDir = path.join("/home/z/my-project", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

const svg = (maskable) => {
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2874F0"/>
      <stop offset="100%" stop-color="#1A5CBE"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="512" height="512" rx="${maskable ? 0 : 112}" fill="url(#bg)"/>
  <text x="216" y="330" font-family="Arial, Helvetica, sans-serif" font-size="270" font-weight="800" font-style="italic" fill="#FFFFFF" text-anchor="middle">P</text>
  <text x="352" y="238" font-family="Arial, Helvetica, sans-serif" font-size="120" font-weight="900" fill="#FFE11B" text-anchor="middle">⚡</text>
  <text x="256" y="428" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="700" fill="#FFE11B" text-anchor="middle" letter-spacing="2">PARTKART</text>
</svg>`;
};

async function make(name, size, maskable) {
  const buf = await sharp(Buffer.from(svg(maskable)), { density: 300 })
    .resize(size, size)
    .png({ quality: 90, compressionLevel: 9 })
    .toBuffer();
  const p = path.join(outDir, name);
  fs.writeFileSync(p, buf);
  const kb = (fs.statSync(p).size / 1024).toFixed(1);
  console.log(`${name}: ${size}x${size} — ${kb} KB`);
}

(async () => {
  await make("icon-192.png", 192, false);
  await make("icon-512.png", 512, false);
  await make("icon-512-maskable.png", 512, true);
  console.log("icons done");
})();
