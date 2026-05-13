#!/usr/bin/env node
/**
 * Generate all platform icons + branded assets for the Electron build
 * from the source PNGs at the repo root.
 *
 * Inputs (repo root):
 *   - Potomac-icon.png   (square mark, 533x538)
 *   - fulllogo.png       (horizontal wordmark, 1416x297)
 *   - blacklogo.png      (alternate square mark, 550x555)
 *
 * Outputs (electron/resources/):
 *   - icon.ico            (multi-resolution Windows icon: 16,24,32,48,64,128,256)
 *   - icon.png            (512x512 Linux/dock icon, square, padded)
 *   - icon@2x.png         (1024x1024)
 *   - logo-mark.png       (256x256 transparent mark for in-app use)
 *   - logo-wordmark.png   (high-DPI horizontal wordmark)
 *   - splash-logo.png     (used by the splash screen)
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default || pngToIcoModule;

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.resolve(__dirname, '..', 'resources');

const SOURCES = {
  mark: path.join(REPO_ROOT, 'Potomac-icon.png'),
  wordmark: path.join(REPO_ROOT, 'fulllogo.png'),
  altMark: path.join(REPO_ROOT, 'blacklogo.png'),
};

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

/** Resize a square PNG to a given size, preserving transparency. */
async function squarePng(input, size, outFile) {
  await sharp(input)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(outFile);
  console.log(`  ✓ ${path.relative(REPO_ROOT, outFile)} (${size}x${size})`);
}

async function main() {
  console.log('Generating Electron icon assets…');

  // Verify sources exist
  for (const [k, p] of Object.entries(SOURCES)) {
    if (!fs.existsSync(p)) {
      console.error(`❌ Missing source: ${p}`);
      process.exit(1);
    }
    console.log(`  source[${k}] = ${path.relative(REPO_ROOT, p)}`);
  }

  // 1) Generate intermediate square PNGs from the mark at all common sizes.
  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const tmpDir = path.join(OUT_DIR, '.tmp-ico');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const tmpFiles = [];
  for (const s of icoSizes) {
    const f = path.join(tmpDir, `mark-${s}.png`);
    await squarePng(SOURCES.mark, s, f);
    tmpFiles.push(f);
  }

  // 2) Bundle into a multi-resolution .ico for Windows.
  const icoBuf = await pngToIco(tmpFiles);
  const icoOut = path.join(OUT_DIR, 'icon.ico');
  fs.writeFileSync(icoOut, icoBuf);
  console.log(`  ✓ ${path.relative(REPO_ROOT, icoOut)} (multi-res Windows .ico, ${icoBuf.length} bytes)`);

  // 3) Linux & generic icon.png + retina.
  await squarePng(SOURCES.mark, 512, path.join(OUT_DIR, 'icon.png'));
  await squarePng(SOURCES.mark, 1024, path.join(OUT_DIR, 'icon@2x.png'));

  // 4) macOS .icns — skip generation here (requires macOS tooling or `iconutil`);
  //    electron-builder will auto-generate from icon.png if .icns is missing
  //    when building on macOS. For now we don't ship a Mac build.

  // 5) In-app branded assets (used by splash + future UI surfaces).
  await squarePng(SOURCES.mark, 256, path.join(OUT_DIR, 'logo-mark.png'));
  await squarePng(SOURCES.mark, 128, path.join(OUT_DIR, 'splash-logo.png'));

  // Horizontal wordmark — preserve aspect ratio, target 600px wide.
  const wordmarkOut = path.join(OUT_DIR, 'logo-wordmark.png');
  await sharp(SOURCES.wordmark)
    .resize({ width: 600, withoutEnlargement: false })
    .png({ compressionLevel: 9 })
    .toFile(wordmarkOut);
  console.log(`  ✓ ${path.relative(REPO_ROOT, wordmarkOut)} (wordmark, 600px wide)`);

  // 6) Cleanup tmp.
  for (const f of tmpFiles) fs.unlinkSync(f);
  fs.rmdirSync(tmpDir);

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
