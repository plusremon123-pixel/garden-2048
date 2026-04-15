const { createCanvas, loadImage } = require('C:/Users/19002857/AppData/Roaming/npm/node_modules/canvas');
const fs = require('fs');

async function run() {
  const map = [
    ['spring_current',   'spring_stay'],
    ['spring_available', 'spring_ready'],
    ['spring_done',      'spring_end'],
  ];
  for (const [src, dst] of map) {
    const img = await loadImage(
      'C:/Users/19002857/Desktop/plant2048/' + src + '.png'
    );
    const c = createCanvas(256, 256);
    const ctx = c.getContext('2d');
    // white background so JPEG-style artifacts blend cleanly
    ctx.clearRect(0, 0, 256, 256);
    ctx.drawImage(img, 0, 0, 256, 256);
    fs.writeFileSync('public/nodes/' + dst + '.png', c.toBuffer('image/png'));
    console.log('saved: ' + dst + '.png');
  }
}
run().catch(console.error);
