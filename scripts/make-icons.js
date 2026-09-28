// Generates real PNG icons for PartKart PWA (192, 512, maskable variants) — White + Yellow theme (#FFC107)
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const outDir = path.join("/home/z/my-project", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

const svg = (maskable) => {
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFD54F"/>
      <stop offset="55%" stop-color="#FFC107"/>
      <stop offset="100%" stop-color="#FFB300"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="512" height="512" rx="${maskable ? 0 : 112}" fill="url(#bg)"/>
  <g transform="translate(256 224)">
    <g fill="#1A1A1A" opacity="0.95">
      ${Array.from({ length: 12 })
        .map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const x = Math.cos(a) * 122;
          const y = Math.sin(a) * 122;
          return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="20"/>`;
        })
        .join("\n      ")}
    </g>
    <circle r="126" fill="none" stroke="#1A1A1A" stroke-width="32" opacity="0.95"/>
    <path d="M -17 -70 L 17 -70 L 17 -17 L 32 8 L 32 74 L 11 74 L 11 28 L -11 28 L -11 74 L -32 74 L -32 8 L -17 -17 Z" fill="#FFFFFF"/>
  </g>
  <text x="256" y="440" font-family="Arial, Helvetica, sans-serif" font-size="84" font-weight="800" fill="#1A1A1A" text-anchor="middle" letter-spacing="2">PartKart</text>
</svg>`;
};

async function make(name, size, maskable) {
  const buf = await sharp(Buffer.from(svg(maskable)))
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
