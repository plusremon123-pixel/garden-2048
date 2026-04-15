try {
  const m = require.resolve('canvas');
  console.log('found at:', m);
} catch(e) {
  // try global
  const p = require('path');
  const { execSync } = require('child_process');
  try {
    const gp = execSync('npm root -g').toString().trim();
    console.log('global root:', gp);
    const c = require(p.join(gp, 'canvas'));
    console.log('canvas found globally!');
  } catch(e2) {
    console.log('not found:', e2.message.split('\n')[0]);
  }
}
