// Isometric game mode: pick a target, soak the scene.
(function () {
  const CP = window.CP;
  const N = 12;            // grid size in tiles
  const ROUND = 45;        // seconds
  const CLOUD_H = 150;     // cloud height above ground (unscaled px)

  const BLACK = '#23232b', SKIN = ['#f1c9a5', '#d9a57c', '#a8734f', '#7a4f33'];
  const P = (name, x, y, body, extra) => Object.assign({ name, x, y, body, skin: SKIN[(name.length + Math.round(x)) % 4] }, extra);

  const SCENES = {
    funeral: {
      name: 'The Funeral', emoji: '⚰️', blurb: 'A solemn goodbye. Everyone is in their best black. Shame about the weather.',
      ground: ['#6fae5a', '#69a654'], side: '#4d7a3f',
      props: [
        { t: 'hole', x: 6, y: 6 }, { t: 'coffin', x: 6, y: 7.3 }, { t: 'pond', x: 10, y: 9.5, refill: true },
        { t: 'stone', x: 2, y: 1.5 }, { t: 'stone', x: 4, y: 1.5 }, { t: 'stone', x: 6, y: 1.5 }, { t: 'stone', x: 8, y: 1.5 }, { t: 'stone', x: 10, y: 1.5 },
        { t: 'tree', x: 1, y: 4 }, { t: 'tree', x: 11, y: 3.5 }, { t: 'tree', x: 1.5, y: 10.5 },
        { t: 'flowers', x: 5, y: 5 }, { t: 'flowers', x: 7.2, y: 5.2 }, { t: 'flowers', x: 3, y: 2.3 },
      ],
      people: [
        P('The Priest', 6, 4.6, BLACK, { hat: 'collar' }),
        P('Grieving Widow', 4.6, 6, BLACK, { hat: 'veil' }),
        P('Uncle Bob', 4.5, 7.2, BLACK, { hat: 'tophat' }),
        P('The Lawyer', 7.5, 6, '#30303c', { hat: 'tophat' }),
        P('Cousin Here For The Buffet', 7.6, 7.2, BLACK),
        P('Gravedigger', 8.6, 4.4, '#5b4a3a', { hat: 'cap', cap: '#3d3229' }),
        P('Mysterious Stranger', 5.2, 9, '#1a1a20', { hat: 'veil' }),
        P('Bored Nephew', 6.6, 8.9, BLACK, { size: .72 }),
      ],
    },
    beer: {
      name: 'Beer Garden', emoji: '🍺', blurb: 'Sunny afternoon, cold pints. Top up their glasses with something special.',
      ground: ['#dcc79e', '#d3bd92'], side: '#a48d64',
      props: [
        { t: 'table', x: 3.5, y: 3.5 }, { t: 'table', x: 8.5, y: 3.5 }, { t: 'table', x: 3.5, y: 8.5 }, { t: 'table', x: 8.5, y: 8.5 },
        { t: 'keg', x: 10.8, y: 1.2, refill: true }, { t: 'keg', x: 11.2, y: 2.2, refill: true },
        { t: 'tree', x: 1, y: 1 }, { t: 'tree', x: 1, y: 11 }, { t: 'tree', x: 11, y: 11 },
      ],
      people: [
        P('The Bartender', 9.8, 1.8, '#f2f2f2', { hat: 'cap', cap: '#222' }),
        P('Guy On Pint Five', 2.6, 3.4, '#e4572e'),
        P('Designated Driver', 4.4, 3.6, '#17bebb'),
        P('Lost Tourist', 7.6, 3.4, '#ffc914', { hat: 'cap', cap: '#e4572e' }),
        P('Stag Party Captain', 9.4, 3.7, '#ff5fa2', { hat: 'tophat' }),
        P('Karaoke Volunteer', 2.6, 8.5, '#76b041'),
        P('Craft Beer Expert', 4.5, 8.6, '#7d5ba6', { hat: 'cap', cap: '#333' }),
        P('First Date (Him)', 7.6, 8.4, '#3a86ff'),
        P('First Date (Her)', 9.4, 8.6, '#ef476f'),
      ],
    },
    wedding: {
      name: 'The Wedding', emoji: '💒', blurb: 'The happiest day of their lives. That dress cost a fortune.',
      ground: ['#8fcf7a', '#88c873'], side: '#5c9150',
      props: [
        { t: 'arch', x: 6, y: 2.2 }, { t: 'cake', x: 10, y: 6 }, { t: 'fountain', x: 2, y: 9.5, refill: true },
        { t: 'bench', x: 4, y: 6 }, { t: 'bench', x: 8, y: 6 }, { t: 'bench', x: 4, y: 8 }, { t: 'bench', x: 8, y: 8 },
        { t: 'flowers', x: 5, y: 4 }, { t: 'flowers', x: 7, y: 4 }, { t: 'flowers', x: 5, y: 9.5 }, { t: 'flowers', x: 7, y: 9.5 },
        { t: 'tree', x: 1, y: 1.5 }, { t: 'tree', x: 11, y: 1.5 },
      ],
      people: [
        P('The Bride', 5.4, 3.4, '#ffffff', { hat: 'bride' }),
        P('The Groom', 6.6, 3.4, BLACK, { hat: 'tophat' }),
        P('Officiant', 6, 2.6, '#5b3f8c', { hat: 'collar' }),
        P('Best Man (Hungover)', 7.8, 3.6, '#3a3a48'),
        P('Mother-In-Law', 3.6, 5.3, '#c0397b', { hat: 'veil', veil: '#c0397b' }),
        P('Flower Girl', 6, 5.2, '#ffc2d9', { size: .7 }),
        P('Photographer', 8.4, 5.2, '#2b6f77', { hat: 'cap', cap: '#111' }),
        P('The Ex', 4.2, 8.6, '#b3261e'),
        P('Uncle With Opinions', 8, 8.7, '#8a6a3a'),
      ],
    },
  };

  const G = (CP.Game = { state: 'idle', scenes: SCENES, banner: '' });
  let scene, people, cloud, aim, drops, splashes, lay, shape, acc, toastT;

  G.start = function (id) {
    G.sceneId = id;
    scene = SCENES[id];
    people = scene.people.map((p, i) => Object.assign({}, p, { hx: p.x, hy: p.y, wet: 0, soaked: false, moving: false, bubble: '', bubbleT: 0, phase: i * 1.7 }));
    cloud = { x: 6, y: 6 }; aim = { x: 6, y: 6 };
    drops = []; splashes = []; acc = 0; toastT = 0;
    shape = CP.makeCloud(7, CP.settings.style);
    G.score = 0; G.time = ROUND; G.tank = 1; G.target = null; G.hover = null;
    G.holding = false; G.refilling = false; G.result = null;
    G.people = people;
    G.state = 'pick';
    G.banner = '🎯 Choose your target — tap someone';
  };

  // --- projection ---------------------------------------------------------
  function layout(w, h) {
    const s = Math.min(w / 840, h / 620);
    lay = { s, tw: 32 * s, th: 16 * s, ox: w / 2, oy: h * .6 - N * 16 * s };
  }
  const iso = (x, y) => [lay.ox + (x - y) * lay.tw, lay.oy + (x + y) * lay.th];
  function unIso(px, py) {
    const a = (px - lay.ox) / lay.tw, b = (py - lay.oy) / lay.th;
    return [(a + b) / 2, (b - a) / 2];
  }

  // --- input --------------------------------------------------------------
  function personAt(px, py) {
    let best = null, bd = 34 * lay.s;
    for (const p of people) {
      const [sx, sy] = iso(p.x, p.y);
      const d = Math.hypot(px - sx, py - (sy - 20 * lay.s));
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }
  G.pointerMove = function (px, py) {
    if (!lay) return;
    if (G.state === 'pick') { G.hover = personAt(px, py); return; }
    const [x, y] = unIso(px, py);
    aim.x = Math.max(-1, Math.min(N + 1, x));
    aim.y = Math.max(-1, Math.min(N + 1, y));
  };
  G.pointerDown = function (px, py) {
    if (!lay) return;
    if (G.state === 'pick') {
      const p = personAt(px, py);
      if (p) {
        G.target = p; G.hover = null; G.state = 'play';
        toast('Target: ' + p.name + '. Go!', 2.5);
      }
      return;
    }
    G.pointerMove(px, py);
    G.holding = true;
  };
  G.pointerUp = function () { G.holding = false; };

  function toast(msg, secs) { G.banner = msg; toastT = secs || 2; }

  // --- simulation ---------------------------------------------------------
  const REACTIONS = ['😡', '😱', '🤬', '😭', '🤢', '😤'];

  G.update = function (dt) {
    if (G.state !== 'play') { G.holding = false; return; }
    G.time -= dt;
    if (toastT > 0 && (toastT -= dt) <= 0) G.banner = '';

    // cloud chases the aim point
    const dx = aim.x - cloud.x, dy = aim.y - cloud.y, dist = Math.hypot(dx, dy);
    if (dist > .001) {
      const step = Math.min(dist, 7 * dt);
      cloud.x += dx / dist * step; cloud.y += dy / dist * step;
    }

    const active = G.holding && G.tank > 0;
    const pee = CP.wetMode() === 'pee';
    G.active = active;
    G.refilling = false;
    if (active) {
      G.tank = Math.max(0, G.tank - dt / 5);
      acc += dt * (pee ? 90 : 70);
      const spread = pee ? .35 : 1.5;
      while (acc > 1) {
        acc -= 1;
        drops.push({ x: cloud.x + (Math.random() - .5) * spread, y: cloud.y + (Math.random() - .5) * spread, h: CLOUD_H - 25, v: 120 });
      }
    } else {
      const near = scene.props.some(p => p.refill && Math.hypot(p.x - cloud.x, p.y - cloud.y) < 1.4);
      G.refilling = near && G.tank < 1;
      G.tank = Math.min(1, G.tank + dt * (near ? .9 : .08));
    }

    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.v += 700 * dt; d.h -= d.v * dt;
      if (d.h <= 0) { splashes.push({ x: d.x, y: d.y, t: 0 }); drops.splice(i, 1); }
    }
    for (let i = splashes.length - 1; i >= 0; i--) if ((splashes[i].t += dt) > .35) splashes.splice(i, 1);

    let left = 0;
    for (const p of people) {
      const d = Math.hypot(p.x - cloud.x, p.y - cloud.y);
      const isTarget = p === G.target;
      if (p.bubbleT > 0) p.bubbleT -= dt;
      p.moving = false;
      if (!p.soaked) {
        left++;
        if (active && d < 1.25) {
          p.wet += dt / (isTarget ? 1.0 : .6);
          if (p.wet >= 1) {
            p.wet = 1; p.soaked = true; left--;
            p.bubble = REACTIONS[Math.floor(Math.random() * REACTIONS.length)]; p.bubbleT = 3;
            const pts = isTarget ? 500 : 100;
            G.score += pts;
            toast((isTarget ? '🎯 TARGET HIT! ' : '') + p.name + ' soaked +' + pts, 2);
          }
        } else {
          p.wet = Math.max(0, p.wet - dt * .1);
        }
      }
      // run from the stream, otherwise wander back
      if (active && d < 1.9 && !p.soaked) {
        const sp = (isTarget ? 2.0 : 1.3) * dt;
        const ax = d > .01 ? (p.x - cloud.x) / d : Math.cos(p.phase), ay = d > .01 ? (p.y - cloud.y) / d : Math.sin(p.phase);
        p.x = Math.max(.4, Math.min(N - .4, p.x + ax * sp));
        p.y = Math.max(.4, Math.min(N - .4, p.y + ay * sp));
        p.moving = true;
        if (p.bubbleT <= 0) { p.bubble = '❗'; p.bubbleT = .4; }
      } else {
        const hx = p.hx - p.x, hy = p.hy - p.y, hd = Math.hypot(hx, hy);
        if (hd > .05) {
          const sp = Math.min(hd, (p.soaked ? .5 : .9) * dt);
          p.x += hx / hd * sp; p.y += hy / hd * sp; p.moving = true;
        }
      }
    }

    if (G.time <= 0 || left === 0) finish(left);
  };

  function finish(left) {
    const total = people.length, soaked = total - left;
    const bonus = left === 0 ? Math.ceil(Math.max(0, G.time)) * 10 : 0;
    G.score += bonus;
    G.time = Math.max(0, G.time);
    G.result = { total, soaked, bonus, score: G.score, targetHit: G.target.soaked, target: G.target.name, scene: scene.name };
    G.state = 'over';
    G.banner = '';
  }

  // --- drawing ------------------------------------------------------------
  function diamond(ctx, x, y, w, h) {
    const [ax, ay] = iso(x, y), [bx, by] = iso(x + w, y), [cx, cy] = iso(x + w, y + h), [dx, dy] = iso(x, y + h);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.lineTo(dx, dy); ctx.closePath();
  }
  function ell(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }

  const PROPS = {
    hole(ctx, x, y, s, p) { ctx.fillStyle = '#3b2a1c'; diamond(ctx, p.x - .5, p.y - .9, 1, 1.8); ctx.fill(); },
    pond(ctx, x, y, s) {
      ctx.fillStyle = '#4b9fd8'; ell(ctx, x, y, 62 * s, 31 * s); ctx.fill();
      ctx.fillStyle = '#7cc4f0'; ell(ctx, x - 10 * s, y - 5 * s, 30 * s, 12 * s); ctx.fill();
    },
    coffin(ctx, x, y, s) {
      ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.roundRect(x - 26 * s, y - 16 * s, 52 * s, 20 * s, 4 * s); ctx.fill();
      ctx.fillStyle = '#7b5231'; ctx.beginPath(); ctx.roundRect(x - 26 * s, y - 22 * s, 52 * s, 14 * s, 4 * s); ctx.fill();
      ctx.fillStyle = '#d9b36a'; ctx.fillRect(x - 1.5 * s, y - 20 * s, 3 * s, 10 * s); ctx.fillRect(x - 5 * s, y - 17 * s, 10 * s, 3 * s);
    },
    stone(ctx, x, y, s) {
      ctx.fillStyle = '#8d939c'; ctx.beginPath(); ctx.roundRect(x - 11 * s, y - 30 * s, 22 * s, 32 * s, [11 * s, 11 * s, 2 * s, 2 * s]); ctx.fill();
      ctx.fillStyle = '#b3b9c2'; ctx.beginPath(); ctx.roundRect(x - 11 * s, y - 30 * s, 18 * s, 32 * s, [11 * s, 11 * s, 2 * s, 2 * s]); ctx.fill();
      ctx.fillStyle = '#5f646c'; ctx.font = `bold ${7 * s}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('RIP', x - 2 * s, y - 13 * s);
    },
    tree(ctx, x, y, s) {
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ell(ctx, x, y, 24 * s, 11 * s); ctx.fill();
      ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 4 * s, y - 34 * s, 8 * s, 36 * s);
      ctx.fillStyle = '#2f7d3b'; ell(ctx, x, y - 52 * s, 26 * s, 28 * s); ctx.fill();
      ctx.fillStyle = '#48a04f'; ell(ctx, x - 6 * s, y - 60 * s, 16 * s, 17 * s); ctx.fill();
    },
    flowers(ctx, x, y, s) {
      const c = ['#ff6b9d', '#ffd166', '#ffffff', '#c77dff', '#ff8552'];
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = c[i];
        ell(ctx, x + Math.cos(i * 1.9) * 9 * s, y - 4 * s + Math.sin(i * 2.7) * 5 * s, 3.4 * s, 3.4 * s); ctx.fill();
      }
    },
    table(ctx, x, y, s) {
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ell(ctx, x, y + 2 * s, 30 * s, 14 * s); ctx.fill();
      ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 3 * s, y - 18 * s, 6 * s, 20 * s);
      ctx.fillStyle = '#8a6239'; ell(ctx, x, y - 16 * s, 28 * s, 13 * s); ctx.fill();
      ctx.fillStyle = '#a97c4c'; ell(ctx, x, y - 19 * s, 28 * s, 13 * s); ctx.fill();
      for (const o of [-13, 2, 14]) {
        const my = y - 22 * s + (o === 2 ? 4 : 0) * s;
        ctx.fillStyle = '#f2b632'; ctx.fillRect(x + o * s - 3.5 * s, my - 9 * s, 7 * s, 9 * s);
        ctx.fillStyle = '#fff'; ctx.fillRect(x + o * s - 4 * s, my - 12 * s, 8 * s, 4 * s);
      }
    },
    keg(ctx, x, y, s) {
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ell(ctx, x, y, 17 * s, 8 * s); ctx.fill();
      ctx.fillStyle = '#8a5a2e'; ctx.beginPath(); ctx.roundRect(x - 14 * s, y - 34 * s, 28 * s, 36 * s, 7 * s); ctx.fill();
      ctx.fillStyle = '#4a4a52'; ctx.fillRect(x - 14 * s, y - 27 * s, 28 * s, 4 * s); ctx.fillRect(x - 14 * s, y - 9 * s, 28 * s, 4 * s);
      ctx.fillStyle = '#a8713d'; ell(ctx, x, y - 34 * s, 14 * s, 6 * s); ctx.fill();
    },
    arch(ctx, x, y, s) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 6 * s;
      ctx.beginPath(); ctx.moveTo(x - 34 * s, y); ctx.lineTo(x - 34 * s, y - 50 * s);
      ctx.arc(x, y - 50 * s, 34 * s, Math.PI, 0); ctx.lineTo(x + 34 * s, y); ctx.stroke();
      const c = ['#ff6b9d', '#ffd1e3', '#ffffff'];
      for (let i = 0; i <= 8; i++) {
        const a = Math.PI + (i / 8) * Math.PI;
        ctx.fillStyle = c[i % 3]; ell(ctx, x + Math.cos(a) * 34 * s, y - 50 * s + Math.sin(a) * 34 * s, 6 * s, 6 * s); ctx.fill();
      }
    },
    cake(ctx, x, y, s) {
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ell(ctx, x, y + 2 * s, 24 * s, 11 * s); ctx.fill();
      ctx.fillStyle = '#f4f4f4'; ell(ctx, x, y - 16 * s, 24 * s, 11 * s); ctx.fill();
      ctx.fillStyle = '#d8d8d8'; ctx.fillRect(x - 3 * s, y - 14 * s, 6 * s, 16 * s);
      const tiers = [[16, 10, 0], [11, 9, 10], [7, 8, 19]];
      for (const [w, hh, up] of tiers) {
        ctx.fillStyle = '#fff7fb'; ctx.beginPath(); ctx.roundRect(x - w * s, y - (20 + up + hh) * s, w * 2 * s, hh * s, 3 * s); ctx.fill();
        ctx.fillStyle = '#ff9ec4'; ctx.fillRect(x - w * s, y - (20 + up + 3) * s, w * 2 * s, 2 * s);
      }
    },
    fountain(ctx, x, y, s, p, t) {
      ctx.fillStyle = '#9aa3ad'; ell(ctx, x, y, 50 * s, 25 * s); ctx.fill();
      ctx.fillStyle = '#4b9fd8'; ell(ctx, x, y - 3 * s, 42 * s, 20 * s); ctx.fill();
      ctx.fillStyle = '#b5bcc5'; ctx.fillRect(x - 4 * s, y - 34 * s, 8 * s, 32 * s);
      ctx.strokeStyle = '#bfe6ff'; ctx.lineWidth = 3 * s; ctx.lineCap = 'round';
      for (const dir of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(x, y - 34 * s);
        ctx.quadraticCurveTo(x + dir * 14 * s, y - (50 + Math.sin(t * 6) * 3) * s, x + dir * 24 * s, y - 6 * s); ctx.stroke();
      }
    },
    bench(ctx, x, y, s) {
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ell(ctx, x, y + 2 * s, 26 * s, 9 * s); ctx.fill();
      ctx.fillStyle = '#7b5231'; ctx.beginPath(); ctx.roundRect(x - 24 * s, y - 10 * s, 48 * s, 8 * s, 3 * s); ctx.fill();
      ctx.fillStyle = '#5a3a22'; ctx.fillRect(x - 20 * s, y - 3 * s, 4 * s, 6 * s); ctx.fillRect(x + 16 * s, y - 3 * s, 4 * s, 6 * s);
    },
  };
  const FLAT = { hole: 1, pond: 1 };

  function drawPerson(ctx, p, t, wetColor) {
    const [sx, gy] = iso(p.x, p.y);
    const s = lay.s * (p.size || 1);
    const bob = p.moving ? Math.abs(Math.sin(t * 14 + p.phase)) * 4 * s : 0;
    const shiver = p.soaked ? Math.sin(t * 40 + p.phase) * .8 * s : 0;
    const x = sx + shiver, y = gy - bob;

    if (p.soaked) { ctx.fillStyle = wetColor; ctx.globalAlpha = .55; ell(ctx, sx, gy, 17 * s, 8 * s); ctx.fill(); ctx.globalAlpha = 1; }
    else { ctx.fillStyle = 'rgba(0,0,0,.18)'; ell(ctx, sx, gy, 11 * s, 5 * s); ctx.fill(); }

    ctx.fillStyle = '#1b1b22';
    ctx.fillRect(x - 6 * s, y - 8 * s, 4.5 * s, 8 * s); ctx.fillRect(x + 1.5 * s, y - 8 * s, 4.5 * s, 8 * s);
    const body = () => { ctx.beginPath(); ctx.roundRect(x - 9 * s, y - 31 * s, 18 * s, 25 * s, 7 * s); };
    ctx.fillStyle = p.body; body(); ctx.fill();
    if (p.hat === 'bride') { ctx.beginPath(); ctx.moveTo(x - 9 * s, y - 20 * s); ctx.lineTo(x + 9 * s, y - 20 * s); ctx.lineTo(x + 14 * s, y - 2 * s); ctx.lineTo(x - 14 * s, y - 2 * s); ctx.closePath(); ctx.fill(); }
    if (p.wet > 0) { ctx.globalAlpha = p.wet * .55; ctx.fillStyle = wetColor; body(); ctx.fill(); ctx.globalAlpha = 1; }
    if (p.hat === 'collar') { ctx.fillStyle = '#fff'; ctx.fillRect(x - 4 * s, y - 31 * s, 8 * s, 3 * s); }

    ctx.fillStyle = p.skin; ell(ctx, x, y - 38 * s, 8.5 * s, 8.5 * s); ctx.fill();
    ctx.fillStyle = '#1b1b22';
    ell(ctx, x - 3 * s, y - 38 * s, 1.2 * s, 1.2 * s); ctx.fill(); ell(ctx, x + 3 * s, y - 38 * s, 1.2 * s, 1.2 * s); ctx.fill();
    if (p.soaked) { ctx.strokeStyle = '#1b1b22'; ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.arc(x, y - 32 * s, 3 * s, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); }

    if (p.hat === 'tophat') {
      ctx.fillStyle = '#111'; ctx.fillRect(x - 6 * s, y - 58 * s, 12 * s, 14 * s); ctx.fillRect(x - 10 * s, y - 46 * s, 20 * s, 3 * s);
    } else if (p.hat === 'cap') {
      ctx.fillStyle = p.cap || '#333'; ctx.beginPath(); ctx.arc(x, y - 40 * s, 8.8 * s, Math.PI, 0); ctx.fill(); ctx.fillRect(x, y - 42 * s, 13 * s, 2.5 * s);
    } else if (p.hat === 'veil' || p.hat === 'bride') {
      ctx.fillStyle = p.hat === 'bride' ? '#fff' : (p.veil || '#111');
      ctx.beginPath(); ctx.arc(x, y - 40 * s, 9 * s, Math.PI, 0); ctx.fill();
      ctx.globalAlpha = .45; ctx.beginPath(); ctx.moveTo(x - 9 * s, y - 40 * s); ctx.lineTo(x - 13 * s, y - 16 * s); ctx.lineTo(x - 5 * s, y - 28 * s); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 9 * s, y - 40 * s); ctx.lineTo(x + 13 * s, y - 16 * s); ctx.lineTo(x + 5 * s, y - 28 * s); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#3a2a1e'; ctx.beginPath(); ctx.arc(x, y - 40 * s, 8.6 * s, Math.PI, 0); ctx.fill();
    }

    if (p.bubbleT > 0) {
      ctx.font = `${18 * lay.s}px sans-serif`; ctx.textAlign = 'center';
      ctx.fillText(p.bubble, x, y - (56 + (p.hat === 'tophat' ? 8 : 0)) * s);
    }
  }

  function label(ctx, text, x, y) {
    ctx.font = `bold ${Math.max(12, 13 * lay.s)}px ui-rounded, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    const w = ctx.measureText(text).width + 16, h = 22;
    ctx.fillStyle = 'rgba(20,30,60,.85)'; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h, w, h, 11); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(text, x, y - 6);
  }

  G.draw = function (ctx, w, h, t) {
    layout(w, h);
    const s = lay.s;
    const wetColor = CP.MODES[CP.wetMode()].color;

    // island
    const [lx, ly] = iso(0, N), [fx, fy] = iso(N, N), [rx, ry] = iso(N, 0), depth = 46 * s;
    ctx.fillStyle = scene.side;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(fx, fy); ctx.lineTo(rx, ry); ctx.lineTo(rx, ry + depth); ctx.lineTo(fx, fy + depth); ctx.lineTo(lx, ly + depth); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(rx, ry); ctx.lineTo(rx, ry + depth); ctx.lineTo(fx, fy + depth); ctx.closePath(); ctx.fill();
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      ctx.fillStyle = scene.ground[(x + y) % 2]; diamond(ctx, x, y, 1, 1); ctx.fill();
    }

    for (const p of scene.props) if (FLAT[p.t]) { const [x, y] = iso(p.x, p.y); PROPS[p.t](ctx, x, y, s, p, t); }

    // splashes + cloud shadow / aim marker on the ground
    ctx.strokeStyle = wetColor; ctx.lineWidth = 1.5 * s;
    for (const sp of splashes) {
      const [x, y] = iso(sp.x, sp.y), k = sp.t / .35;
      ctx.globalAlpha = 1 - k; ell(ctx, x, y, 10 * s * k + 2, 5 * s * k + 1); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const [cx, cy] = iso(cloud.x, cloud.y);
    ctx.fillStyle = 'rgba(0,0,30,.2)'; ell(ctx, cx, cy, 58 * s, 27 * s); ctx.fill();

    if (G.target) {
      const [tx, ty] = iso(G.target.x, G.target.y);
      ctx.strokeStyle = '#ff3b3b'; ctx.lineWidth = 3 * s; ctx.setLineDash([8 * s, 6 * s]); ctx.lineDashOffset = -t * 30;
      ell(ctx, tx, ty, 20 * s, 10 * s); ctx.stroke(); ctx.setLineDash([]);
    }
    if (G.hover) {
      const [tx, ty] = iso(G.hover.x, G.hover.y);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * s; ell(ctx, tx, ty, 20 * s, 10 * s); ctx.stroke();
    }

    // depth-sorted props and people
    const items = [];
    for (const p of scene.props) if (!FLAT[p.t]) items.push({ d: p.x + p.y, prop: p });
    for (const p of people) items.push({ d: p.x + p.y, person: p });
    items.sort((a, b) => a.d - b.d);
    for (const it of items) {
      if (it.person) drawPerson(ctx, it.person, t, wetColor);
      else { const [x, y] = iso(it.prop.x, it.prop.y); PROPS[it.prop.t](ctx, x, y, s, it.prop, t); }
    }

    if (G.target && G.state !== 'pick') {
      const [tx, ty] = iso(G.target.x, G.target.y);
      ctx.font = `${16 * s}px sans-serif`; ctx.textAlign = 'center';
      ctx.fillText('🎯', tx, ty - (66 + Math.sin(t * 4) * 3) * s * (G.target.size || 1));
    }
    if (G.hover) { const [tx, ty] = iso(G.hover.x, G.hover.y); label(ctx, G.hover.name, tx, ty - 70 * s * (G.hover.size || 1)); }

    // falling drops
    ctx.strokeStyle = wetColor; ctx.lineCap = 'round'; ctx.lineWidth = 2.6 * s;
    ctx.beginPath();
    for (const d of drops) {
      const [x, y] = iso(d.x, d.y), yy = y - d.h * s;
      ctx.moveTo(x, yy); ctx.lineTo(x, yy - Math.min(14, d.v * .03) * s);
    }
    ctx.stroke();

    // refill slurp
    if (G.refilling) {
      ctx.strokeStyle = '#bfe6ff'; ctx.lineWidth = 2 * s; ctx.setLineDash([4 * s, 8 * s]); ctx.lineDashOffset = t * 80;
      for (const o of [-10, 0, 10]) { ctx.beginPath(); ctx.moveTo(cx + o * s, cy); ctx.lineTo(cx + o * s * .4, cy - (CLOUD_H - 30) * s); ctx.stroke(); }
      ctx.setLineDash([]);
    }

    // the player's cloud
    const hover = Math.sin(t * 2) * 4 * s;
    CP.drawCloud(ctx, shape, cx, cy - CLOUD_H * s + hover, s * .78, { face: true, strain: G.active && G.state === 'play', t });
  };
})();
