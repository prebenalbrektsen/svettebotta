import sharp from "sharp";

// Proof photos live in the database, so keep them small: one 1080 px WebP (~60–100 KB) and a
// 200 px thumbnail (~5 KB) for lists. Re-encoding also drops all metadata, including the GPS
// position phones put in photos. The browser already shrinks before upload; this is the guarantee.
const MAX_INPUT = 8_000_000;

export type Proof = { image: Buffer; thumb: Buffer; mime: string };

export async function processProof(dataUrl: string): Promise<Proof | { error: string }> {
  const match = dataUrl.match(/^data:image\/(?:jpeg|png|webp|heic|heif);base64,(.+)$/);
  if (!match) return { error: "Ugyldig bilde." };
  const input = Buffer.from(match[1], "base64");
  if (input.length > MAX_INPUT) return { error: "Bildet er for stort." };
  try {
    const base = sharp(input, { failOn: "error" }).rotate(); // apply the phone's orientation, then forget it
    const [image, thumb] = await Promise.all([
      base.clone().resize(1080, 1080, { fit: "inside", withoutEnlargement: true }).webp({ quality: 70 }).toBuffer(),
      base.clone().resize(200, 200, { fit: "cover" }).webp({ quality: 60 }).toBuffer(),
    ]);
    return { image, thumb, mime: "image/webp" };
  } catch {
    return { error: "Klarte ikke å lese bildet. Prøv et annet." };
  }
}

/** Profile picture: square crop, 256 px, metadata stripped. */
export async function processAvatar(dataUrl: string): Promise<Buffer | { error: string }> {
  const match = dataUrl.match(/^data:image\/(?:jpeg|png|webp|heic|heif);base64,(.+)$/);
  if (!match) return { error: "Ugyldig bilde." };
  const input = Buffer.from(match[1], "base64");
  if (input.length > MAX_INPUT) return { error: "Bildet er for stort." };
  try {
    return await sharp(input, { failOn: "error" }).rotate().resize(256, 256, { fit: "cover", position: "attention" }).webp({ quality: 72 }).toBuffer();
  } catch {
    return { error: "Klarte ikke å lese bildet. Prøv et annet." };
  }
}
