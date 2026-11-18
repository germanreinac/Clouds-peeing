// Shared settings, sky themes and cloud drawing.
(function () {
  const CP = (window.CP = window.CP || {});

  const DEFAULTS = { style: 'puffy', sky: 'day', mode: 'pee', amount: 9, wind: 1, faces: true };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('cp-settings') || '{}'); } catch (e) {}
  CP.settings = Object.assign({}, DEFAULTS, saved);
  CP.saveSettings = function () {
    try { localStorage.setItem('cp-settings', JSON.stringify(CP.settings)); } catch (e) {}
  };

  CP.STYLES = { puffy: 'Puffy', wispy: 'Wispy', stormy: 'Stormy', pixel: 'Pixel' };
  CP.SKIES = {
    day:    { label: 'Day',    top: '#2f86e0', bottom: '#c6e6ff', cloud: '#ffffff', shade: '#c4d5ec', orb: '#fff6c2', ox: .82, oy: .16, stars: 0 },
    dawn:   { label: 'Dawn',   top: '#6a7fd6', bottom: '#ffd0b0', cloud: '#fff4ee', shade: '#e6b9c0', orb: '#ffe9b8', ox: .2,  oy: .72, stars: 0 },
    sunset: { label: 'Sunset', top: '#41307a', bottom: '#ff9a5c', cloud: '#ffd9c2', shade: '#cf7f88', orb: '#ffd27a', ox: .7,  oy: .8,  stars: .35 },
    night:  { label: 'Night',  top: '#070b24', bottom: '#27376e', cloud: '#aab6d8', shade: '#69759c', orb: '#f4f1dc', ox: .78, oy: .2,  stars: 1 },
  };
  CP.MODES = {
    pee:  { label: 'Pee',  color: '#ffd92e', tank: 'Bladder' },
    rain: { label: 'Rain', color: '#8fd0ff', tank: 'Water' },
    dry:  { label: 'Dry',  color: null,      tank: 'Water' },
  };
  // In-game there is no "dry": fall back to rain.
  CP.wetMode = function () { return CP.settings.mode === 'pee' ? 'pee' : 'rain'; };

  CP.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // Build a cloud shape in local units (roughly 200 wide, bottom near y = 30).
  CP.makeCloud = function (seed, style) {
    const r = CP.rng(seed);
    const blobs = [];
    if (style === 'wispy') {
      const n = 4 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        blobs.push({ x: (r() - .5) * 120, y: (r() - .5) * 36, rx: 60 + r() * 70, ry: 4 + r() * 6 });
      }
      return { style, blobs };
    }
    const stormy = style === 'stormy';
    const n = (stormy ? 7 : 5) + Math.floor(r() * 3);
    const span = stormy ? 200 : 150;
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      const rad = 22 + Math.sin(Math.PI * f) * (stormy ? 30 : 34) + r() * 10;
      blobs.push({ x: (f - .5) * span + (r() - .5) * 10, y: 30 - rad, r: rad });
    }
    const cloud = { style, blobs };
    if (style === 'pixel') {
      const C = 12, cells = [];
      for (let cx = -150; cx < 150; cx += C) {
        for (let cy = -90; cy < 36; cy += C) {
          const px = cx + C / 2, py = cy + C / 2;
          if (blobs.some(b => (px - b.x) ** 2 + (py - b.y) ** 2 < b.r * b.r)) cells.push([cx, cy]);
        }
      }
      cloud.cells = cells;
      cloud.cell = C;
    }
    return cloud;
  };

  function blobPass(ctx, cloud, color, dy) {
    ctx.fillStyle = color;
    if (cloud.cells) {
      const C = cloud.cell;
      for (const c of cloud.cells) ctx.fillRect(c[0], c[1] + dy, C + .5, C + .5);
      return;
    }
    ctx.beginPath();
    for (const b of cloud.blobs) {
      ctx.moveTo(b.x + b.r, b.y + dy);
      ctx.arc(b.x, b.y + dy, b.r, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  // opts: { face, strain, t }
  CP.drawCloud = function (ctx, cloud, x, y, s, opts) {
    opts = opts || {};
    const sky = CP.SKIES[CP.settings.sky];
    let main = sky.cloud, shade = sky.shade;
    if (cloud.style === 'stormy') {
      main = CP.settings.sky === 'night' ? '#4a5268' : '#737c8e';
      shade = CP.settings.sky === 'night' ? '#2b3040' : '#474e5d';
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (opts.strain) ctx.translate(Math.sin((opts.t || 0) * 50) * 1.2, 0);
    if (cloud.style === 'wispy') {
      ctx.globalAlpha = .55;
      ctx.fillStyle = main;
      for (const b of cloud.blobs) {
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.rx, b.ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      blobPass(ctx, cloud, shade, cloud.cells ? cloud.cell : 8);
      blobPass(ctx, cloud, main, 0);
    }
    if (opts.face) drawFace(ctx, cloud, opts.strain);
    ctx.restore();
  };

  function drawFace(ctx, cloud, strain) {
    const dark = cloud.style === 'stormy' ? '#14171f' : '#33415c';
    const y = cloud.style === 'wispy' ? 0 : 4;
    ctx.strokeStyle = dark; ctx.fillStyle = dark;
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (strain) {
      // > <  squeezing eyes
      ctx.beginPath();
      ctx.moveTo(-24, y - 6); ctx.lineTo(-15, y); ctx.lineTo(-24, y + 6);
      ctx.moveTo(24, y - 6); ctx.lineTo(15, y); ctx.lineTo(24, y + 6);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(0, y + 12, 4, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,120,120,.5)';
    } else {
      ctx.beginPath();
      ctx.arc(-18, y, 4, 0, Math.PI * 2);
      ctx.arc(18, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath(); ctx.arc(0, y + 5, 8, .15 * Math.PI, .85 * Math.PI); ctx.stroke();
      ctx.fillStyle = 'rgba(255,150,150,.4)';
    }
    ctx.beginPath();
    ctx.ellipse(-32, y + 10, 7, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(32, y + 10, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const starRng = CP.rng(42);
  const STARS = Array.from({ length: 140 }, () => ({ x: starRng(), y: starRng() * .8, r: .5 + starRng() * 1.3, p: starRng() * 6 }));

  CP.drawSky = function (ctx, w, h, t) {
    const sky = CP.SKIES[CP.settings.sky];
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, sky.top);
    g.addColorStop(1, sky.bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    if (sky.stars) {
      ctx.fillStyle = '#fff';
      for (const st of STARS) {
        ctx.globalAlpha = sky.stars * (.5 + .5 * Math.sin(t * 1.5 + st.p)) * (1 - st.y);
        ctx.beginPath();
        ctx.arc(st.x * w, st.y * h, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    const ox = sky.ox * w, oy = sky.oy * h, R = Math.min(w, h) * .07;
    const glow = ctx.createRadialGradient(ox, oy, R * .5, ox, oy, R * 4);
    glow.addColorStop(0, sky.orb + '88');
    glow.addColorStop(1, sky.orb + '00');
    ctx.fillStyle = glow;
    ctx.fillRect(ox - R * 4, oy - R * 4, R * 8, R * 8);
    ctx.fillStyle = sky.orb;
    ctx.beginPath(); ctx.arc(ox, oy, R, 0, Math.PI * 2); ctx.fill();
  };
})();
