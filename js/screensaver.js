// Home view: a sky of drifting clouds that occasionally let go.
(function () {
  const CP = window.CP;
  const S = (CP.Screensaver = { clouds: [], drops: [], key: '' });

  function sync(w) {
    const st = CP.settings;
    const key = st.style + ':' + st.amount;
    if (key === S.key) return;
    S.key = key;
    S.clouds = [];
    for (let i = 0; i < st.amount; i++) {
      const seed = 1000 + i * 77;
      const r = CP.rng(seed);
      S.clouds.push({
        shape: CP.makeCloud(seed, st.style),
        x: r() * w, yf: .06 + r() * .6, depth: .45 + r() * .9,
        pee: 0, cool: 1 + r() * 8, acc: 0,
      });
    }
    S.clouds.sort((a, b) => a.depth - b.depth);
  }

  // quiet = no drops (used as the game backdrop)
  S.update = function (dt, w, h, quiet) {
    sync(w);
    const st = CP.settings;
    for (const c of S.clouds) {
      const half = 130 * c.depth;
      c.x += (10 + 28 * c.depth) * st.wind * dt;
      if (c.x - half > w) c.x = -half;
      if (quiet || st.mode === 'dry') { c.pee = 0; continue; }
      c.cool -= dt;
      if (c.cool <= 0 && c.pee <= 0) {
        c.pee = 2 + Math.random() * 3;
        c.cool = c.pee + 3 + Math.random() * 9;
      }
      if (c.pee > 0) {
        c.pee -= dt;
        const pee = st.mode === 'pee';
        c.acc += dt * (pee ? 70 : 45);
        const y = c.yf * h + 30 * c.depth;
        while (c.acc > 1) {
          c.acc -= 1;
          S.drops.push(pee
            ? { x: c.x + (Math.random() - .5) * 4, y, vx: (50 + Math.random() * 12) * c.depth, vy: 30, s: c.depth }
            : { x: c.x + (Math.random() - .5) * 150 * c.depth, y, vx: 0, vy: 260 * c.depth, s: c.depth });
        }
      }
    }
    if (quiet) S.drops.length = 0;
    for (let i = S.drops.length - 1; i >= 0; i--) {
      const d = S.drops[i];
      d.vy += 520 * dt;
      d.x += (d.vx + st.wind * 10) * dt;
      d.y += d.vy * dt;
      if (d.y > h + 20) S.drops.splice(i, 1);
    }
  };

  S.draw = function (ctx, w, h, t) {
    const st = CP.settings;
    const color = CP.MODES[st.mode].color;
    if (color) {
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      for (const d of S.drops) {
        ctx.lineWidth = 2.6 * d.s;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.vx * .03, d.y - d.vy * .03);
        ctx.stroke();
      }
    }
    for (const c of S.clouds) {
      CP.drawCloud(ctx, c.shape, c.x, c.yf * h, c.depth, { face: st.faces, strain: c.pee > 0, t });
    }
  };
})();
