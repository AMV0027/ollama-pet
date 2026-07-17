import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const SPRITE_DIR = '/tmp/ollama-sprites';
const OUTPUT_DIR = join(process.cwd(), 'public/sprites');

const ANIMATIONS = [
  { name: 'waving', dir: 'waving', frames: 4, fps: 8, loop: true, pingPong: true, files: ['1.png', '2.png', '3.png', '4.png'] },
  { name: 'walking', dir: 'walking', frames: 6, fps: 12, loop: true, files: ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'] },
  { name: 'using_laptop', dir: 'using_laptop', frames: 10, fps: 10, loop: true, files: ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png', '8.png', '9.png', '10.png'] },
  { name: 'thinking', dir: 'thinking', frames: 5, fps: 8, loop: true, files: ['1.png', '2.png', '3.png', '4.png', '5.png'] },
  { name: 'speaking', dir: 'speaking', frames: 8, fps: 12, loop: true, files: ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png', '8.png'] },
  { name: 'jumping', dir: 'jumping', frames: 4, fps: 15, loop: true, files: ['1.png', '2.png', '3.png', '4.png'] },
  { name: 'sleeping', dir: 'sleeping', frames: 5, fps: 4, loop: true, files: ['1.png', '2.png', '3.png', '4.png', '5.png'] },
  { name: 'looking', dir: 'looking', frames: 4, fps: 6, loop: true, pingPong: true, files: ['left.png', 'right.png', 'up.png', 'down.png'] },
];

const ASSETS = [
  { name: 'heart', file: 'assets/heart.png' },
  { name: 'stars', file: 'assets/stars.png' },
  { name: 'question_mark', file: 'assets/question_mark.png' },
  { name: 'exclamation_mark', file: 'assets/exclamation_mark.png' },
  { name: 'tear_drop', file: 'assets/tear_drop.png' },
  { name: 'light_bulb', file: 'assets/light_bulb.png' },
  { name: 'sleeping_symbols', file: 'assets/sleeping_symbols.png' },
];

async function processAnimation(anim: typeof ANIMATIONS[0]) {
  // First pass: read all frames and find max dimensions
  const frameInfos: { buf: Buffer; meta: sharp.Metadata }[] = [];
  let maxWidth = 0, maxHeight = 0;

  for (const file of anim.files) {
    const inputPath = join(SPRITE_DIR, anim.dir, file);
    const buf = readFileSync(inputPath);
    const meta = await sharp(buf).metadata();
    frameInfos.push({ buf, meta });
    maxWidth = Math.max(maxWidth, meta.width || 0);
    maxHeight = Math.max(maxHeight, meta.height || 0);
  }

  // Resize all frames to max dimensions and composite
  const resizedFrames: Buffer[] = [];
  for (const { buf } of frameInfos) {
    const resized = await sharp(buf)
      .resize(maxWidth, maxHeight, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
    resizedFrames.push(resized);
  }

  const atlasWidth = maxWidth * anim.frames;
  const atlasHeight = maxHeight;

  const composite = sharp({
    create: {
      width: atlasWidth,
      height: atlasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  });

  const overlayOps = resizedFrames.map((buf, i) => ({
    input: buf,
    left: i * maxWidth,
    top: 0
  }));

  const atlas = await composite
    .composite(overlayOps)
    .webp({ quality: 85, effort: 6 })
    .toBuffer();

  const outputPath = join(OUTPUT_DIR, `${anim.name}.webp`);
  writeFileSync(outputPath, atlas);
  
  console.log(`  ✓ ${anim.name}.webp (${anim.frames} frames, ${atlasWidth}x${atlasHeight})`);
  
  return {
    name: anim.name,
    frames: anim.frames,
    fps: anim.fps,
    loop: anim.loop,
    pingPong: anim.pingPong || false,
    grid: [1, anim.frames],
    frameWidth: maxWidth,
    frameHeight: maxHeight,
    atlasWidth,
    atlasHeight
  };
}

async function processAsset(asset: typeof ASSETS[0]) {
  const inputPath = join(SPRITE_DIR, asset.file);
  const outputPath = join(OUTPUT_DIR, `${asset.name}.webp`);
  
  await sharp(inputPath)
    .webp({ quality: 85, effort: 6 })
    .toFile(outputPath);
  
  console.log(`  ✓ ${asset.name}.webp`);
  return asset.name;
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log('🎨 Processing sprites...\n');

  const animationResults = [];
  for (const anim of ANIMATIONS) {
    const result = await processAnimation(anim);
    animationResults.push(result);
  }

  const assetResults = [];
  for (const asset of ASSETS) {
    const result = await processAsset(asset);
    assetResults.push(result);
  }

  const manifest = {
    animations: animationResults.reduce((acc, a) => ({ ...acc, [a.name]: a }), {}),
    assets: assetResults,
    defaults: { size: 120, scale: 1 }
  };

  writeFileSync(join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('\n✅ Sprite processing complete!');
  console.log(`   ${animationResults.length} animations, ${assetResults.length} assets`);
}

main().catch(console.error);