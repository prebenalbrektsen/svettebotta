// Draws the app icons: the dumbbell from components/Icon.tsx, white on the orange heat colour.
// Run: node scripts/make-icons.cjs
const sharp = require("sharp");

const DUMBBELL = ["M6 6v12", "M18 6v12", "M3 9v6", "M21 9v6", "M6 12h12"];
const ORANGE = "#ff4d1c";

// `glyph` is how much of the icon the dumbbell fills; maskable icons need a wider safe margin.
function svg(size, glyph) {
  const scale = (size * glyph) / 24;
  const offset = (size - 24 * scale) / 2;
  const paths = DUMBBELL.map((d) => `<path d="${d}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="${ORANGE}"/>
    <g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${paths}</g>
  </svg>`;
}

const ICONS = [
  ["public/icon-192.png", 192, 0.62],
  ["public/icon-512.png", 512, 0.62],
  ["public/icon-maskable-512.png", 512, 0.48],
  ["src/app/icon.png", 192, 0.62],
  ["src/app/apple-icon.png", 180, 0.58],
];

(async () => {
  for (const [out, size, glyph] of ICONS) {
    await sharp(Buffer.from(svg(size, glyph))).png({ compressionLevel: 9 }).toFile(out);
    console.log(out, `${size}×${size}`);
  }
})();
