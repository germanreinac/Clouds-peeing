// App shell: canvas loop, menus, HUD wiring.
(function () {
  const CP = window.CP, S = CP.Screensaver, G = CP.Game, st = CP.settings;
  const $ = id => document.getElementById(id);
  const canvas = $('stage'), ctx = canvas.getContext('2d');
  let W = 0, H = 0, view = 'home', last = performance.now(), idleTimer = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  const show = (id, on) => $(id).classList.toggle('hidden', !on);

  // --- views --------------------------------------------------------------
  function goHome() {
    view = 'home'; G.state = 'idle';
    show('home-ui', true); show('hud', false); show('results', false); show('scenes', false);
    poke();
  }
  function startGame(id) {
    view = 'game';
    G.start(id);
    show('home-ui', false); show('custom', false); show('scenes', false); show('results', false); show('hud', true);
    document.body.classList.remove('idle');
    syncMode();
  }
  function showResults() {
    const r = G.result;
    const ratio = r.soaked / r.total;
    $('res-title').textContent = r.targetHit ? (ratio === 1 ? 'Total washout! 🏆' : 'Target soaked! 🎯') : (ratio > .5 ? 'Messy, but you missed 🙈' : 'Barely a drizzle 🌤️');
    $('res-body').innerHTML =
      `<b>${r.scene}</b><br>Soaked ${r.soaked} of ${r.total} guests.<br>` +
      `${r.target}: ${r.targetHit ? 'drenched (+500)' : 'got away dry'}.` +
      (r.bonus ? `<br>Speed bonus +${r.bonus}.` : '') +
      `<br><span style="font-size:2rem;font-weight:800">${r.score}</span>`;
    show('results', true);
  }

  // --- screensaver idle fade ---------------------------------------------
  function poke() {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      const menuOpen = !$('custom').classList.contains('hidden') || !$('scenes').classList.contains('hidden');
      if (view === 'home' && !menuOpen) document.body.classList.add('idle');
    }, 4000);
  }
  ['pointermove', 'pointerdown', 'keydown'].forEach(e => window.addEventListener(e, poke));

  // --- customize panel ----------------------------------------------------
  const OPTIONS = {
    style: CP.STYLES,
    sky: Object.fromEntries(Object.entries(CP.SKIES).map(([k, v]) => [k, v.label])),
    mode: Object.fromEntries(Object.entries(CP.MODES).map(([k, v]) => [k, v.label])),
  };
  document.querySelectorAll('.seg').forEach(seg => {
    const key = seg.dataset.key;
    for (const [val, text] of Object.entries(OPTIONS[key])) {
      const b = document.createElement('button');
      b.textContent = text; b.dataset.val = val;
      b.onclick = () => { st[key] = val; CP.saveSettings(); syncPanel(); };
      seg.appendChild(b);
    }
  });
  function syncPanel() {
    document.querySelectorAll('.seg').forEach(seg => {
      seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.val === st[seg.dataset.key]));
    });
    $('rng-amount').value = st.amount; $('out-amount').textContent = st.amount;
    $('rng-wind').value = st.wind; $('out-wind').textContent = st.wind === 0 ? 'calm' : Number(st.wind).toFixed(1);
    $('chk-faces').checked = st.faces;
  }
  $('rng-amount').oninput = e => { st.amount = +e.target.value; CP.saveSettings(); syncPanel(); };
  $('rng-wind').oninput = e => { st.wind = +e.target.value; CP.saveSettings(); syncPanel(); };
  $('chk-faces').onchange = e => { st.faces = e.target.checked; CP.saveSettings(); };
  syncPanel();

  // --- scene list ---------------------------------------------------------
  for (const [id, sc] of Object.entries(G.scenes)) {
    const b = document.createElement('button');
    b.className = 'scene';
    b.innerHTML = `<span class="emoji">${sc.emoji}</span><b>${sc.name}</b><small>${sc.blurb}</small>`;
    b.onclick = () => startGame(id);
    $('scene-list').appendChild(b);
  }

  // --- buttons ------------------------------------------------------------
  $('btn-play').onclick = () => { show('custom', false); show('scenes', true); };
  $('btn-custom').onclick = () => show('custom', $('custom').classList.contains('hidden'));
  $('btn-full').onclick = toggleFull;
  $('btn-quit').onclick = goHome;
  $('btn-home').onclick = goHome;
  $('btn-again').onclick = () => startGame(G.sceneId);
  $('btn-scenes').onclick = () => { goHome(); show('scenes', true); };
  document.querySelectorAll('[data-close]').forEach(b => (b.onclick = () => show(b.dataset.close, false)));
  $('btn-mode').onclick = () => { st.mode = CP.wetMode() === 'pee' ? 'rain' : 'pee'; CP.saveSettings(); syncMode(); syncPanel(); };

  function syncMode() {
    const m = CP.MODES[CP.wetMode()];
    $('btn-mode').textContent = 'Mode: ' + m.label;
    $('hud-tank').style.background = m.color;
    $('hud-tank-label').textContent = m.tank;
  }
  function toggleFull() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
  }

  // --- game input ---------------------------------------------------------
  canvas.addEventListener('pointerdown', e => { if (view === 'game') { canvas.setPointerCapture(e.pointerId); G.pointerDown(e.clientX, e.clientY); } });
  canvas.addEventListener('pointermove', e => { if (view === 'game') G.pointerMove(e.clientX, e.clientY); });
  ['pointerup', 'pointercancel'].forEach(n => canvas.addEventListener(n, () => G.pointerUp()));
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && view === 'game' && G.state === 'play') { G.holding = true; e.preventDefault(); }
    if (e.key === 'f' || e.key === 'F') toggleFull();
    if (e.key === 'Escape' && view === 'game') goHome();
  });
  window.addEventListener('keyup', e => { if (e.code === 'Space') G.holding = false; });
  window.addEventListener('contextmenu', e => e.preventDefault());

  // --- loop ---------------------------------------------------------------
  let shownBanner = null, wasOver = false;
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000), t = now / 1000;
    last = now;
    CP.drawSky(ctx, W, H, t);
    if (view === 'home') {
      S.update(dt, W, H, false);
      S.draw(ctx, W, H, t);
    } else {
      S.update(dt, W, H, true);
      ctx.globalAlpha = .5; S.draw(ctx, W, H, t); ctx.globalAlpha = 1;
      G.update(dt);
      G.draw(ctx, W, H, t);
      $('hud-score').textContent = G.score;
      $('hud-time').textContent = Math.ceil(G.time);
      $('hud-tank').style.width = (G.tank * 100).toFixed(1) + '%';
      const banner = G.refilling ? '💧 Refilling…' : (G.state === 'play' && G.tank <= 0 ? 'Empty! Hover over water to refill' : G.banner);
      if (banner !== shownBanner) { $('banner').textContent = shownBanner = banner; }
      const over = G.state === 'over';
      if (over && !wasOver) showResults();
      wasOver = over;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  poke();
})();
