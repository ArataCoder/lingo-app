// Renders tools/brand/description.html frame by frame and encodes the BotFather description animation.
// Usage: node tools/brand/render.cjs   (needs playwright + ffmpeg; serves files over file://)
const { chromium } = require(process.env.PW || 'playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');

const FPS = 25, SECONDS = 6, W = 960, H = 540;
const here = __dirname, out = path.join(here, '..', '..', 'assets', 'brand');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lb-desc-'));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(here, 'description.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForFunction(() => document.querySelector('#girl img').complete);
  const n = FPS * SECONDS;
  for (let f = 0; f < n; f++) {
    await p.evaluate(t => document.getAnimations().forEach(a => { a.pause(); a.currentTime = t; }), f * 1000 / FPS);
    await p.screenshot({ path: path.join(tmp, String(f).padStart(4, '0') + '.png') });
  }
  await b.close();
  if (errs.length) throw new Error(errs.join('; '));
  const inp = ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, '%04d.png')];
  execFileSync('ffmpeg', [...inp, '-vf', `scale=${W}:${H}:flags=lanczos`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', '-an', path.join(out, 'description-960x540.mp4')]);
  for (const [w, h] of [[640, 360]]) {
    execFileSync('ffmpeg', [...inp, '-vf', `fps=15,scale=${w}:${h}:flags=lanczos,split[a][b];[a]palettegen=max_colors=192:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`, '-loop', '0', path.join(out, `description-${w}x${h}.gif`)]);
  }
  fs.copyFileSync(path.join(tmp, '0080.png'), path.join(tmp, 'still.png'));
  console.log(JSON.stringify({ frames: n, tmp, files: fs.readdirSync(out).filter(f => f.startsWith('description')).map(f => f + ' ' + fs.statSync(path.join(out, f)).size) }));
})().catch(e => { console.error(e); process.exit(1); });
