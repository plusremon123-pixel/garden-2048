const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'public', 'nodes');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const POT = {
  spring: { body: '#C07850', rim: '#D49060' },
  summer: { body: '#B87840', rim: '#CC8C50' },
  autumn: { body: '#C47038', rim: '#D88448' },
  winter: { body: '#8898A8', rim: '#9AAABB' },
};

function drawPot(ctx, bodyColor, rimColor) {
  const cx = 128;
  // Ground shadow
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, 238, 62, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.fill();
  ctx.restore();
  // Pot body
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - 85, 162);
  ctx.lineTo(cx + 85, 162);
  ctx.lineTo(cx + 65, 228);
  ctx.quadraticCurveTo(cx + 65, 236, cx + 53, 236);
  ctx.lineTo(cx - 53, 236);
  ctx.quadraticCurveTo(cx - 65, 236, cx - 65, 228);
  ctx.closePath();
  ctx.fillStyle = bodyColor;
  ctx.fill();
  // Right shading
  ctx.beginPath();
  ctx.moveTo(cx + 22, 162);
  ctx.lineTo(cx + 85, 162);
  ctx.lineTo(cx + 65, 228);
  ctx.quadraticCurveTo(cx + 65, 236, cx + 53, 236);
  ctx.lineTo(cx + 22, 236);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.10)';
  ctx.fill();
  ctx.restore();
  // Rim
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, 160, 88, 12, 0, 0, Math.PI * 2);
  ctx.fillStyle = rimColor;
  ctx.fill();
  ctx.restore();
  // Rim highlight
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx - 18, 157, 36, 5, -0.2, 0, Math.PI);
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fill();
  ctx.restore();
  // Soil
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, 160, 80, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#5A3D20';
  ctx.fill();
  ctx.restore();
}

// Maple leaf helper
function drawMapleLeaf(ctx, cx, cy, size, color, rotation) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.beginPath();
  const tips = 5;
  const outerR = size;
  const innerR = size * 0.42;
  for (let i = 0; i < tips * 2; i++) {
    const angle = (i / (tips * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  // Leaf stem
  ctx.beginPath();
  ctx.moveTo(-4, size * 0.2);
  ctx.lineTo(4, size * 0.2);
  ctx.lineTo(2, size * 0.55);
  ctx.lineTo(-2, size * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ─── SPRING ─────────────────────────────────────────────────────────────────

function drawSpringStay(ctx) {
  // Stem
  ctx.save();
  ctx.strokeStyle = '#4A8A30';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(128, 158);
  ctx.bezierCurveTo(128, 130, 124, 100, 120, 72);
  ctx.stroke();
  ctx.restore();

  // Left large leaf
  ctx.save();
  ctx.fillStyle = '#5AAE38';
  ctx.beginPath();
  ctx.moveTo(120, 128);
  ctx.bezierCurveTo(90, 108, 48, 88, 52, 68);
  ctx.bezierCurveTo(56, 50, 100, 90, 118, 112);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Right large leaf
  ctx.save();
  ctx.fillStyle = '#68C040';
  ctx.beginPath();
  ctx.moveTo(122, 108);
  ctx.bezierCurveTo(150, 86, 196, 70, 200, 52);
  ctx.bezierCurveTo(202, 36, 158, 72, 126, 98);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 6-petal flower at top
  const fx = 120, fy = 68;
  const petalDist = 40;
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const px = fx + Math.cos(angle) * petalDist;
    const py = fy + Math.sin(angle) * petalDist;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.fillStyle = '#F2A8C0';
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Yellow center
  ctx.save();
  ctx.fillStyle = '#FFD84A';
  ctx.beginPath();
  ctx.arc(fx, fy, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpringReady(ctx) {
  // Stem
  ctx.save();
  ctx.strokeStyle = '#4A8A30';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(128, 158);
  ctx.bezierCurveTo(128, 135, 126, 112, 124, 98);
  ctx.stroke();
  ctx.restore();

  // One leaf
  ctx.save();
  ctx.fillStyle = '#5AAE38';
  ctx.beginPath();
  ctx.moveTo(124, 130);
  ctx.bezierCurveTo(94, 112, 62, 96, 68, 78);
  ctx.bezierCurveTo(74, 60, 112, 98, 122, 118);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 5-petal flower
  const fx = 124, fy = 88;
  const petalDist = 26;
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const px = fx + Math.cos(angle) * petalDist;
    const py = fy + Math.sin(angle) * petalDist;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.fillStyle = '#F4B8CC';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Yellow center
  ctx.save();
  ctx.fillStyle = '#FFD84A';
  ctx.beginPath();
  ctx.arc(fx, fy, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpringEnd(ctx) {
  // Short drooping stem
  ctx.save();
  ctx.strokeStyle = '#5A9030';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(128, 158);
  ctx.bezierCurveTo(130, 145, 136, 130, 138, 115);
  ctx.stroke();
  ctx.restore();

  // 4 wilted drooping petals
  const fx = 138, fy = 115;
  ctx.save();
  ctx.globalAlpha = 0.75;
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 8;
    // Droop: petals hang down more
    const px = fx + Math.cos(angle + 0.3) * 22;
    const py = fy + Math.sin(angle + 0.3) * 22 + 8;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle + 0.5);
    ctx.fillStyle = '#D8A8B8';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Small center
  ctx.save();
  ctx.fillStyle = '#FFCC44';
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(fx, fy, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ─── SUMMER ─────────────────────────────────────────────────────────────────

function drawSummerStay(ctx) {
  // Thick straight stem
  ctx.save();
  ctx.strokeStyle = '#3A8820';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(128, 158);
  ctx.lineTo(128, 82);
  ctx.stroke();
  ctx.restore();

  // LEFT tropical leaf
  ctx.save();
  ctx.fillStyle = '#52A838';
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.bezierCurveTo(100, 110, 52, 72, 42, 55);
  ctx.bezierCurveTo(62, 58, 110, 88, 128, 105);
  ctx.closePath();
  ctx.fill();
  // Vein
  ctx.strokeStyle = '#3E8828';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.bezierCurveTo(96, 106, 64, 80, 42, 55);
  ctx.stroke();
  ctx.restore();

  // RIGHT tropical leaf
  ctx.save();
  ctx.fillStyle = '#62B844';
  ctx.beginPath();
  ctx.moveTo(128, 115);
  ctx.bezierCurveTo(156, 96, 200, 60, 214, 42);
  ctx.bezierCurveTo(196, 48, 148, 78, 128, 88);
  ctx.closePath();
  ctx.fill();
  // Vein
  ctx.strokeStyle = '#4E9834';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(128, 115);
  ctx.bezierCurveTo(160, 94, 198, 58, 214, 42);
  ctx.stroke();
  ctx.restore();

  // TOP tall pointed leaf
  ctx.save();
  ctx.fillStyle = '#4A9C30';
  ctx.beginPath();
  ctx.moveTo(128, 90);
  ctx.bezierCurveTo(158, 80, 162, 44, 128, 22);
  ctx.bezierCurveTo(94, 44, 98, 80, 128, 90);
  ctx.closePath();
  ctx.fill();
  // Vein
  ctx.strokeStyle = '#387820';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(128, 90);
  ctx.lineTo(128, 22);
  ctx.stroke();
  ctx.restore();
}

function drawSummerReady(ctx) {
  // Stem
  ctx.save();
  ctx.strokeStyle = '#3A8820';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(128, 158);
  ctx.lineTo(128, 105);
  ctx.stroke();
  ctx.restore();

  // LEFT leaf (70% size)
  ctx.save();
  ctx.fillStyle = '#52A838';
  ctx.beginPath();
  ctx.moveTo(128, 138);
  ctx.bezierCurveTo(106, 122, 70, 98, 62, 84);
  ctx.bezierCurveTo(78, 86, 114, 108, 128, 120);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3E8828';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(128, 138);
  ctx.bezierCurveTo(102, 118, 74, 96, 62, 84);
  ctx.stroke();
  ctx.restore();

  // RIGHT leaf (70% size)
  ctx.save();
  ctx.fillStyle = '#62B844';
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.bezierCurveTo(150, 112, 184, 88, 196, 74);
  ctx.bezierCurveTo(180, 80, 146, 104, 128, 115);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4E9834';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.bezierCurveTo(152, 110, 184, 86, 196, 74);
  ctx.stroke();
  ctx.restore();
}

function drawSummerEnd(ctx) {
  // Short stem
  ctx.save();
  ctx.strokeStyle = '#3A8820';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(128, 158);
  ctx.lineTo(128, 120);
  ctx.stroke();
  ctx.restore();

  // Two small drooping leaves, muted
  ctx.save();
  ctx.fillStyle = '#78A858';
  ctx.beginPath();
  ctx.moveTo(128, 148);
  ctx.bezierCurveTo(108, 138, 82, 128, 78, 120);
  ctx.bezierCurveTo(90, 118, 116, 132, 128, 138);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#78A858';
  ctx.beginPath();
  ctx.moveTo(128, 138);
  ctx.bezierCurveTo(148, 128, 172, 118, 176, 110);
  ctx.bezierCurveTo(164, 110, 140, 124, 128, 130);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ─── AUTUMN ─────────────────────────────────────────────────────────────────

function drawAutumnStay(ctx) {
  // Main branch stem
  ctx.save();
  ctx.strokeStyle = '#7A4820';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(128, 158);
  ctx.lineTo(120, 98);
  ctx.stroke();
  ctx.restore();

  // Branch left
  ctx.save();
  ctx.strokeStyle = '#7A4820';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(120, 125);
  ctx.lineTo(65, 72);
  ctx.stroke();
  ctx.restore();

  // Branch right
  ctx.save();
  ctx.strokeStyle = '#7A4820';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(122, 112);
  ctx.lineTo(180, 58);
  ctx.stroke();
  ctx.restore();

  // Maple leaves at tips
  drawMapleLeaf(ctx, 120, 88, 52, '#D4522A', -0.2);
  drawMapleLeaf(ctx, 60, 62, 52, '#E06030', 0.3);
  drawMapleLeaf(ctx, 184, 50, 52, '#C84428', -0.4);
}

function drawAutumnReady(ctx) {
  // Main stem (thinner)
  ctx.save();
  ctx.strokeStyle = '#7A4820';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(128, 158);
  ctx.lineTo(122, 108);
  ctx.stroke();
  ctx.restore();

  // 2 branches (thinner)
  ctx.save();
  ctx.strokeStyle = '#7A4820';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(124, 130);
  ctx.lineTo(76, 84);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#7A4820';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(124, 118);
  ctx.lineTo(172, 70);
  ctx.stroke();
  ctx.restore();

  // 2 maple leaves
  drawMapleLeaf(ctx, 72, 74, 44, '#D4522A', 0.2);
  drawMapleLeaf(ctx, 176, 62, 44, '#C84428', -0.3);
}

function drawAutumnEnd(ctx) {
  // Main stem only
  ctx.save();
  ctx.strokeStyle = '#7A4820';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(128, 158);
  ctx.lineTo(124, 118);
  ctx.stroke();
  ctx.restore();

  // 1 branch
  ctx.save();
  ctx.strokeStyle = '#7A4820';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(125, 135);
  ctx.lineTo(84, 100);
  ctx.stroke();
  ctx.restore();

  // 1 small leaf, muted
  drawMapleLeaf(ctx, 80, 92, 36, '#B87040', 0.1);
}

// ─── WINTER ─────────────────────────────────────────────────────────────────

function drawSnowflake(ctx, cx, cy, armLength, armWidth, branchWidth) {
  const armCount = 6;
  ctx.save();
  for (let i = 0; i < armCount; i++) {
    const angle = (i / armCount) * Math.PI * 2;
    const ex = cx + Math.cos(angle) * armLength;
    const ey = cy + Math.sin(angle) * armLength;

    // Main arm
    ctx.save();
    ctx.strokeStyle = '#B8D8F0';
    ctx.lineWidth = armWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.restore();

    // Side branches at 60% length
    const b1x = cx + Math.cos(angle) * armLength * 0.6;
    const b1y = cy + Math.sin(angle) * armLength * 0.6;
    const perpAngle1 = angle + Math.PI / 3;
    const perpAngle2 = angle - Math.PI / 3;
    const branchLen = armLength * 0.35;

    ctx.save();
    ctx.strokeStyle = '#90C4E8';
    ctx.lineWidth = branchWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(b1x, b1y);
    ctx.lineTo(b1x + Math.cos(perpAngle1) * branchLen, b1y + Math.sin(perpAngle1) * branchLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(b1x, b1y);
    ctx.lineTo(b1x + Math.cos(perpAngle2) * branchLen, b1y + Math.sin(perpAngle2) * branchLen);
    ctx.stroke();
    ctx.restore();

    // Tip fork at 80% length
    const t1x = cx + Math.cos(angle) * armLength * 0.8;
    const t1y = cy + Math.sin(angle) * armLength * 0.8;
    const forkLen = armLength * 0.22;

    ctx.save();
    ctx.strokeStyle = '#90C4E8';
    ctx.lineWidth = branchWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(t1x, t1y);
    ctx.lineTo(t1x + Math.cos(perpAngle1) * forkLen, t1y + Math.sin(perpAngle1) * forkLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(t1x, t1y);
    ctx.lineTo(t1x + Math.cos(perpAngle2) * forkLen, t1y + Math.sin(perpAngle2) * forkLen);
    ctx.stroke();
    ctx.restore();
  }

  // Center hexagon
  ctx.save();
  ctx.fillStyle = '#E8F4FF';
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawWinterStay(ctx) {
  // Icy stem
  ctx.save();
  ctx.strokeStyle = '#90B8D0';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(128, 158);
  ctx.lineTo(128, 92);
  ctx.stroke();
  ctx.restore();

  drawSnowflake(ctx, 128, 80, 62, 10, 6);
}

function drawWinterReady(ctx) {
  // Icy stem
  ctx.save();
  ctx.strokeStyle = '#90B8D0';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(128, 158);
  ctx.lineTo(128, 108);
  ctx.stroke();
  ctx.restore();

  drawSnowflake(ctx, 128, 96, 46, 8, 5);
}

function drawWinterEnd(ctx) {
  // Short icy stem
  ctx.save();
  ctx.strokeStyle = '#90B8D0';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(128, 158);
  ctx.lineTo(128, 125);
  ctx.stroke();
  ctx.restore();

  drawSnowflake(ctx, 128, 115, 34, 6, 4);
}

// ─── CONFIG ─────────────────────────────────────────────────────────────────

const configs = [
  { season: 'spring', state: 'stay',   draw: drawSpringStay   },
  { season: 'spring', state: 'ready',  draw: drawSpringReady  },
  { season: 'spring', state: 'end',    draw: drawSpringEnd    },
  { season: 'summer', state: 'stay',   draw: drawSummerStay   },
  { season: 'summer', state: 'ready',  draw: drawSummerReady  },
  { season: 'summer', state: 'end',    draw: drawSummerEnd    },
  { season: 'autumn', state: 'stay',   draw: drawAutumnStay   },
  { season: 'autumn', state: 'ready',  draw: drawAutumnReady  },
  { season: 'autumn', state: 'end',    draw: drawAutumnEnd    },
  { season: 'winter', state: 'stay',   draw: drawWinterStay   },
  { season: 'winter', state: 'ready',  draw: drawWinterReady  },
  { season: 'winter', state: 'end',    draw: drawWinterEnd    },
];

configs.forEach(({ season, state, draw }) => {
  const canvas = createCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  draw(ctx);
  drawPot(ctx, POT[season].body, POT[season].rim);
  const filePath = path.join(outDir, `${season}_${state}.png`);
  fs.writeFileSync(filePath, canvas.toBuffer('image/png'));
  const size = fs.statSync(filePath).size;
  console.log(`✓ ${season}_${state}.png  (${size} bytes)`);
});

console.log('\nAll 12 node PNGs generated.');
