#!/usr/bin/env node
/**
 * Generates extension toolbar icons (16, 32, 48, 128 PNG) from public/Logo (1).png
 * (or public/Logo (1).svg if the PNG is not present).
 * Run from project root: npm run generate-ext-icons
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pngPath = join(root, "public", "Logo (1).png");
const svgPath = join(root, "public", "Logo (1).svg");
const outDir = join(root, "extension", "public", "icon");
const faviconPublic = join(root, "public", "favicon.png");
const faviconApp = join(root, "src", "app", "icon.png");
const sizes = [16, 32, 48, 128];

mkdirSync(outDir, { recursive: true });

async function run() {
  if (existsSync(pngPath)) {
    const input = sharp(pngPath);
    for (const size of sizes) {
      const outPath = join(outDir, `${size}.png`);
      let pipeline = input.clone().resize(size, size);
      if (size === 16) pipeline = pipeline.sharpen();
      await pipeline.png().toFile(outPath);
      console.log(`Wrote ${outPath}`);
    }
    const favicon32 = await input.clone().resize(32, 32).png().toBuffer();
    writeFileSync(faviconPublic, favicon32);
    writeFileSync(faviconApp, favicon32);
    console.log(`Wrote ${faviconPublic} and ${faviconApp} (website favicon from Logo (1).png)`);
    console.log("Done. Extension icons updated from Logo (1).png.");
  } else {
    const svg = readFileSync(svgPath, "utf8");
    for (const size of sizes) {
      const resvg = new Resvg(svg, {
        fitTo: { mode: "width", value: size },
      });
      const pngData = resvg.render();
      const outPath = join(outDir, `${size}.png`);
      let buf = pngData.asPng();
      if (size === 16) {
        buf = await sharp(buf).sharpen().png().toBuffer();
      }
      writeFileSync(outPath, buf);
      console.log(`Wrote ${outPath}`);
    }
    const resvg32 = new Resvg(svg, { fitTo: { mode: "width", value: 32 } });
    const favicon32 = resvg32.render().asPng();
    writeFileSync(faviconPublic, favicon32);
    writeFileSync(faviconApp, favicon32);
    console.log(`Wrote ${faviconPublic} and ${faviconApp} (website favicon from Logo (1).svg)`);
    console.log("Done. Extension icons updated from Logo (1).svg.");
  }
}
run();
