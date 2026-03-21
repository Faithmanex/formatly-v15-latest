import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "../public");

const conversions = [
  {
    input: "logo-full.svg",
    output: "og-image.png",
    width: 1200,
    height: 630,
    background: "#002a57",
  },
  {
    input: "logo-icon.svg",
    output: "og-icon.png",
    width: 512,
    height: 512,
    background: "#002a57",
  },
];

for (const { input, output, width, height, background } of conversions) {
  const svgBuffer = readFileSync(resolve(publicDir, input));

  await sharp(svgBuffer, { density: 300 })
    .resize(width, height, { fit: "contain", background })
    .flatten({ background })
    .png()
    .toFile(resolve(publicDir, output));

  console.log(`✅ ${input} → ${output} (${width}x${height})`);
}

console.log("\nDone! PNG files created in /public");
