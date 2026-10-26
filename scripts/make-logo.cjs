// Cuts design/logo-source.png (the logo sheet from ChatGPT) into the files the app uses:
// app icons (favicon, iPhone, Android incl. a maskable one) and the two wordmarks (light and
// dark) with transparent backgrounds. Run: node scripts/make-logo.cjs
const sharp = require("sharp");
const SRC = "design/logo-source.png";

(async () => {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const px = (x, y) => { const i = (y * W + x) * 4; return [data[i], data[i + 1], data[i + 2]]; };
  const diff = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  const bbox = (x0, y0, x1, y1, test) => {
    let a = [W, H, 0, 0];
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (test(px(x, y))) a = [Math.min(a[0], x), Math.min(a[1], y), Math.max(a[2], x), Math.max(a[3], y)];
    return a;
  };

  // 1) The orange app-icon square (left half of the sheet).
  const isOrange = ([r, g, b]) => r > 220 && g > 50 && g < 120 && b < 70;
  const [ox0, oy0, ox1, oy1] = bbox(0, 0, 610, 660, isOrange);
  let n = 0, acc = [0, 0, 0];
  for (let y = oy0; y < oy1; y++) for (let x = ox0; x < ox1; x++) { const p = px(x, y); if (isOrange(p)) { acc = acc.map((v, i) => v + p[i]); n++; } }
  const orange = acc.map((v) => Math.round(v / n));
  // Cut inside the rounded corners so the icon is full-bleed orange (phones round it themselves).
  const side = Math.min(ox1 - ox0, oy1 - oy0);
  const inset = Math.round(side * 0.07);
  const cx = Math.round((ox0 + ox1) / 2), cy = Math.round((oy0 + oy1) / 2), half = Math.round(side / 2) - inset;
  const icon = await sharp(SRC).extract({ left: cx - half, top: cy - half, width: half * 2, height: half * 2 }).png().toBuffer();
  const bg = { r: orange[0], g: orange[1], b: orange[2], alpha: 1 };
  // Phones round the corners, so give the artwork some air (86 % of the tile).
  const padded = await sharp({ create: { width: 512, height: 512, channels: 4, background: bg } })
    .composite([{ input: await sharp(icon).resize(440, 440).png().toBuffer(), gravity: "centre" }]).png().toBuffer();
  await sharp(padded).resize(180, 180).png().toFile("src/app/apple-icon.png");
  await sharp(padded).resize(192, 192).png().toFile("src/app/icon.png");
  await sharp(padded).png({ compressionLevel: 9 }).toFile("public/icon-512.png");
  await sharp(padded).resize(192, 192).png().toFile("public/icon-192.png");
  // Maskable: Android may cut it to a circle, so the artwork sits in the middle 72 %.
  const inner = await sharp(icon).resize(368, 368).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: bg } }).composite([{ input: inner, gravity: "centre" }]).png().toFile("public/icon-maskable-512.png");

  // 2) Wordmarks: crop, then make the background transparent by flood-filling from the edges,
  //    so enclosed areas (inside the bucket, letter holes) keep their colour.
  async function wordmark(region, bgColor, out) {
    const [x0, y0, x1, y1] = region;
    const pad = 6;
    const left = x0 - pad, top = y0 - pad, w = x1 - x0 + 2 * pad, h = y1 - y0 + 2 * pad;
    const { data: d } = await sharp(SRC).extract({ left, top, width: w, height: h }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const seen = new Uint8Array(w * h), stack = [];
    for (let x = 0; x < w; x++) stack.push([x, 0], [x, h - 1]);
    for (let y = 0; y < h; y++) stack.push([0, y], [w - 1, y]);
    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= w || y >= h || seen[y * w + x]) continue;
      const i = (y * w + x) * 4, dist = diff([d[i], d[i + 1], d[i + 2]], bgColor);
      if (dist > 90) continue;
      seen[y * w + x] = 1;
      // Soft edge: fully clear on the background, partly on the anti-aliased rim.
      d[i + 3] = dist < 40 ? 0 : Math.round(((dist - 40) / 50) * 255);
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    // 160 px tall is sharp enough for the biggest use (64 px on the login page, at 2× density).
    const trimmed = await sharp(d, { raw: { width: w, height: h, channels: 4 } }).trim().png().toBuffer();
    await sharp(trimmed).resize({ height: 160 }).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(out);
    const m = await sharp(out).metadata();
    console.log(out, m.width + "×" + m.height);
  }
  const cream = px(5, 5);
  const isInk = ([r, g, b]) => r < 40 && g < 40 && b < 40;
  const [bx0, by0, bx1, by1] = bbox(0, Math.floor(H * 0.6), W, H, isInk);
  const ink = px(bx0 + 40, by0 + 40);
  await wordmark(bbox(610, 150, W, 660, (p) => diff(p, cream) > 60), cream, "public/logo-light.png");
  await wordmark(bbox(bx0 + 20, by0 + 20, bx1 - 20, by1 - 20, (p) => diff(p, ink) > 60), ink, "public/logo-dark.png");
  console.log("orange", orange, "icon crop", half * 2);
})();
