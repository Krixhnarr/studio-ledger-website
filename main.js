// ---- Site settings: change these when something moves ----
const SITE = {
  // Installer link. The GitHub release always serves the newest upload under this name.
  downloadUrl: 'https://github.com/Krixhnarr/studio-ledger-website/releases/latest/download/Studio-Ledger-Setup.exe',
  version: '1.9.6',
  email: 'thepincstudio@gmail.com',
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');

// Run cb once when el scrolls into view
function onView(el, cb, threshold = 0.25) {
  if (!el) return;
  if (!('IntersectionObserver' in window)) return cb();
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.disconnect(); cb(); } }), { threshold });
  io.observe(el);
}
// Track whether el is on screen (for loops that should pause off screen)
function watch(el, threshold = 0.2) {
  const state = { visible: false };
  if (!('IntersectionObserver' in window)) { state.visible = true; return state; }
  new IntersectionObserver(es => es.forEach(e => { state.visible = e.isIntersecting; }), { threshold }).observe(el);
  return state;
}
function countUp(el, to, ms = 1100) {
  if (calm) { el.textContent = to; return Promise.resolve(); }
  return new Promise(res => {
    const t0 = performance.now();
    const step = t => {
      const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * e);
      k < 1 ? requestAnimationFrame(step) : res();
    };
    requestAnimationFrame(step);
  });
}

// ---- Links: download, demo, contact ----
const mail = (subject, body) => `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
const demoLink = mail('Studio Ledger demo request',
  'Hi,\n\nWe would like a demo of Studio Ledger.\n\nStudio name:\nCity:\nNumber of people:\nPreferred days and times:\n\nThanks');
$$('[data-download]').forEach(a => { a.href = SITE.downloadUrl; a.setAttribute('download', ''); });
$$('[data-demo]').forEach(a => { a.href = demoLink; });
$$('[data-contact]').forEach(a => { a.href = mail('Studio Ledger', ''); });
$$('[data-version]').forEach(el => { el.textContent = SITE.version; });

// ---- Mobile menu ----
const menu = $('#menu'), links = $('#links');
menu.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
});
links.addEventListener('click', e => {
  if (e.target.closest('a')) { links.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }
});

// ---- Background grid drifts slightly with scroll; workflow line follows scroll ----
const flow = $('#flow'), flowItems = $$('#flow li');
let ticking = false;
function onScroll() {
  ticking = false;
  if (!calm) document.documentElement.style.setProperty('--gy', `${-(scrollY * 0.06) % 40}px`);
  if (flow) {
    const r = flow.getBoundingClientRect(), mark = innerHeight * 0.62;
    const p = calm ? 1 : Math.max(0, Math.min(1, (mark - r.top) / (r.height - 30)));
    flow.style.setProperty('--p', p.toFixed(3));
    flowItems.forEach(li => li.classList.toggle('lit', calm || li.getBoundingClientRect().top < mark));
  }
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener('resize', onScroll);
onScroll();

// ---- Entrance: the studio builds itself as you scroll ----
(() => {
  const root = $('#entrance');
  if (!root) return;
  const canvas = $('#en-canvas'), ctx = canvas.getContext('2d'), poster = $('#en-poster');
  const intro = $('#en-intro'), slides = $$('.s-slide', root), rail = $('#story-rail'), dots = $$('button', rail);
  const code = $('#s-code'), title = $('#s-title'), coord = $('#s-coord'), fill = $('#story-fill');
  const draft = $('#en-draft');
  const NAV = 64, BG = '#090c0b';

  // Scroll progress → video time. Each beat builds one part of the studio; the intro holds the empty shell.
  const FRAMES = 100, LENGTH = 10;
  const PHASES = [            // [ends at progress, video time reached (s)]
    [0.10, 0],                // intro: empty shell
    [0.30, 2.2],              // 01 desks and lamps arrive
    [0.50, 4.6],              // 02 drawings go up
    [0.68, 6.6],              // 03 models, samples, mezzanine
    [0.86, 8.6],              // 04 the team arrives
    [1.00, LENGTH],           // finale: dusk, lights on
  ];
  const BEATS = PHASES.length - 2;
  function locate(p) {
    let a = 0, t0 = 0;
    for (let k = 0; k < PHASES.length; k++) {
      const [b, t1] = PHASES[k];
      if (p <= b || k === PHASES.length - 1) {
        const q = b > a ? Math.max(0, Math.min(1, (p - a) / (b - a))) : 1;
        return { phase: k, q, time: t0 + (t1 - t0) * q };
      }
      a = b; t0 = t1;
    }
  }

  // Frames: full 16:9 frames; phones get a lighter 960px set
  const portrait = () => innerWidth < innerHeight;
  const set = innerWidth <= 860 ? 'm' : 'd';
  const imgs = new Array(FRAMES);
  // The picture glides toward the scroll position (tWant) and blends neighbouring frames, so it never steps
  let tWant = 0, tShown = 0, raf = 0, lastTs = 0;
  const order = [];
  for (const step of [FRAMES, 10, 5, 2, 1]) for (let i = 0; i < FRAMES; i += step) if (!order.includes(i)) order.push(i);
  let next = 0;
  function loadMore() {
    if (next >= order.length) return;
    const i = order[next++], im = new Image();
    im.decoding = 'async';
    im.onload = () => { imgs[i] = im; if (!raf) render(tShown); loadMore(); };
    im.onerror = loadMore;
    im.src = `assets/entrance/${set}/${String(i).padStart(3, '0')}.webp`;
  }
  for (let k = 0; k < 8; k++) loadMore();

  function size() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    render(tShown);
  }
  const below = i => { for (let j = Math.min(i, FRAMES - 1); j >= 0; j--) if (imgs[j]) return j; return -1; };
  const above = i => { for (let j = Math.max(i, 0); j < FRAMES; j++) if (imgs[j]) return j; return -1; };
  // Show the whole room: fit the frame under the navigation (cropping at most ~6%), feathering any gap into the page.
  // On portrait screens the room sits across the lower part, under the text.
  function render(t) {
    const f = Math.max(0, Math.min(FRAMES - 1, t / LENGTH * (FRAMES - 1)));
    let a = below(Math.floor(f)), b = above(Math.ceil(f));
    if (a < 0) a = b; if (b < 0) b = a;
    if (a < 0) return;
    const blend = b > a ? (f - a) / (b - a) : 0;
    const im = imgs[a], cw = canvas.width, ch = canvas.height, k = cw / canvas.clientWidth;
    const top = NAV * k, ah = ch - top, iw = im.naturalWidth, ih = im.naturalHeight;
    let s, x, y;
    if (portrait()) {
      s = cw / iw; x = 0; y = ch - ih * s - Math.max(28 * k, ah * 0.07);
    } else {
      const cover = Math.max(cw / iw, ah / ih), contain = Math.min(cw / iw, ah / ih);
      s = Math.min(cover, contain * 1.06);
      x = (cw - iw * s) / 2; y = top + (ah - ih * s) / 2;
    }
    const w = iw * s, h = ih * s;
    ctx.globalAlpha = 1;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(im, x, y, w, h);
    if (blend > 0.01) { ctx.globalAlpha = blend; ctx.drawImage(imgs[b], x, y, w, h); ctx.globalAlpha = 1; }
    // feather the frame edges into the background wherever the frame doesn't reach
    const fade = (x0, y0, x1, y1, rx, ry, rw, rh) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, BG); g.addColorStop(1, 'rgba(9,12,11,0)');
      ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh);
    };
    const fe = 90 * k;
    if (x > 1) { fade(x, 0, x + fe, 0, x, 0, fe, ch); fade(x + w, 0, x + w - fe, 0, x + w - fe, 0, fe, ch); }
    if (y > top + 1) fade(0, y, 0, y + fe, 0, y, cw, fe);
    if (y + h < ch - 1) fade(0, y + h, 0, y + h - fe, 0, y + h - fe, cw, fe);
    poster.classList.add('hide');
  }
  // ~110ms time constant: smooth enough to hide wheel steps, quick enough to feel attached to the scroll
  function glide(ts) {
    const dt = lastTs ? Math.min(64, ts - lastTs) : 16;
    lastTs = ts;
    tShown += (tWant - tShown) * (1 - Math.exp(-dt / 110));
    if (Math.abs(tWant - tShown) < 0.003) tShown = tWant;
    render(tShown);
    if (tShown !== tWant) raf = requestAnimationFrame(glide);
    else { raf = 0; lastTs = 0; }
  }
  let first = true;
  function seek(t) {
    tWant = t;
    if (first) { first = false; tShown = t; render(t); return; }   // arriving mid-page: start where the page is
    if (calm) { tShown = t; render(t); return; }
    if (!raf) raf = requestAnimationFrame(glide);
  }

  // Scroll → frame, captions, rail and sheet bar
  let last = '';
  function update() {
    const r = root.getBoundingClientRect(), total = root.offsetHeight - innerHeight;
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = Math.max(0, Math.min(1, -r.top / total));
    const { phase, q, time } = locate(p);
    seek(time);
    if (draft && !calm) draft.style.transform = `translate3d(0, ${(-Math.min(p, 0.1) * 100).toFixed(1)}px, 0)`;

    const beat = phase - 1, final = phase === PHASES.length - 1;
    const solved = beat >= 0 && !final && q > 0.5;
    const state = `${phase}|${solved}`;
    if (state !== last) {
      last = state;
      intro.classList.toggle('gone', phase > 0);
      root.classList.toggle('at-intro', phase === 0);
      slides.forEach((s, k) => s.classList.toggle('on', final ? k === slides.length - 1 : k === beat));
      if (beat >= 0 && !final) slides[beat].classList.toggle('solved', solved);
      dots.forEach((d, k) => { d.classList.toggle('on', k === beat && !final); d.classList.toggle('done', final || k < beat); });
      code.textContent = `A-${String(phase).padStart(3, '0')}`;
      title.textContent = phase === 0 ? 'Existing conditions · empty shell'
        : final ? 'Proposed · complete' : solved ? 'Proposed · with Studio Ledger' : 'Existing conditions';
    }
    rail.style.setProperty('--rp', Math.max(0, Math.min(1, (p - PHASES[0][0]) / (PHASES[BEATS][0] - PHASES[0][0]))).toFixed(3));
    fill.style.width = `${(p * 100).toFixed(2)}%`;
    coord.textContent = `X ${(p * 48).toFixed(2).padStart(5, '0')} · Y ${(time * 1.2).toFixed(2).padStart(5, '0')}`;
  }
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } }, { passive: true });
  addEventListener('resize', () => { size(); update(); });
  size(); update();

  const goTo = p => scrollTo({ top: root.offsetTop + p * (root.offsetHeight - innerHeight), behavior: calm ? 'auto' : 'smooth' });
  dots.forEach((d, k) => d.addEventListener('click', () => goTo(PHASES[k][0] + 0.02)));
})();

// ---- Ledger waves from the closing section: once on arrival, again on hover ----
(() => {
  const wave = $('#wave');
  if (!wave) return;
  const play = () => { if (calm || wave.classList.contains('play')) return; wave.classList.add('play'); };
  wave.addEventListener('animationend', () => wave.classList.remove('play'));
  wave.addEventListener('pointerenter', play);
  onView(wave, () => setTimeout(play, 300), 0.6);
})();

// ---- Workspace: the dashboard loads like an application, then hands A-104 to AI review ----
(() => {
  const app = $('#app'), overlay = $('#app-review'), row = $('#row-a104');
  const items = $$('.ar-list li', overlay), boxes = $$('.ar-plan .bb', overlay), score = $('#ar-score');
  const stats = $$('.app-stats [data-count]', app);
  $$('.app-stats .stat', app).forEach((s, i) => s.style.setProperty('--i', i));
  $$('.reg tbody tr', app).forEach((r, i) => r.style.setProperty('--i', i));
  $$('.reg .chip', app).forEach((c, i) => c.style.setProperty('--i', i));
  $$('.app-prog li i', app).forEach((b, i) => b.style.setProperty('--i', i));
  const seen = watch(app);
  if (!calm) stats.forEach(s => { s.textContent = '0'; });
  onView(app, async () => {
    app.classList.add('in');
    stats.forEach((s, i) => setTimeout(() => countUp(s, +s.dataset.count, 1000), calm ? 0 : 150 + i * 70));
    setTimeout(() => app.classList.add('rows-in'), calm ? 0 : 1150);
    if (calm) return;
    await sleep(3000);
    // warn items map to boxes: Checked by → title block, Door tags → door, Stair → stair
    const boxFor = { 'Checked by': 1, 'Door tags': 2, 'Stair annotation': 0 };
    for (;;) {
      while (!seen.visible || document.hidden) await sleep(500);
      row.classList.add('focus');
      await sleep(1700);
      items.forEach(li => li.classList.remove('on')); boxes.forEach(b => b.classList.remove('show'));
      score.textContent = '0';
      overlay.classList.add('open');
      await sleep(1100);
      overlay.classList.remove('scanning'); void overlay.offsetWidth; overlay.classList.add('scanning');
      for (const li of items) {
        await sleep(450);
        li.classList.add('on');
        if (li.dataset.r === 'warn') boxes[boxFor[li.textContent.trim()]]?.classList.add('show');
      }
      await countUp(score, 87, 1500);
      await sleep(7000);
      overlay.classList.remove('open', 'scanning');
      row.classList.remove('focus');
      await sleep(5000);
    }
  }, 0.3);
})();

// ---- System diagram: built connector by connector, then each node can be explored ----
(() => {
  const NODES = [
    ['projects', 'Projects', 'Phase from Concept to Completed, lead, team, progress, approved drawings and fee stages for every project.'],
    ['drawings', 'Drawings', 'Every sheet from submission through senior and principal review to Approved, with revisions, redlines and history.'],
    ['ai', 'AI Review', 'Reads each drawing against your standards, marks where the issues are and scores the sheet before a person opens it.'],
    ['standards', 'Standards', 'Your studio’s drawing rules and principles, written once and checked on every sheet.'],
    ['tasks', 'Tasks', 'Work assigned with due dates, priority and progress, filed under its project.'],
    ['people', 'People', 'Team roles, attendance, leave, mentoring and a weekly check-in that shows who is stretched.'],
    ['timesheets', 'Timesheets', 'Weekly hours per project with Friday reminders, turned into real project costs.'],
    ['finance', 'Finance', 'Fee stages, ready-to-invoice reminders when a phase finishes, overdue payments and profitability.'],
    ['reports', 'Reports', 'Weekly and monthly reports on drawings, people, hours and fees, with an AI summary, saved as PDF.'],
  ];
  const LINKS = [
    ['projects', 'drawings'], ['projects', 'tasks'], ['projects', 'finance'], ['projects', 'reports'], ['projects', 'people'],
    ['drawings', 'ai'], ['drawings', 'standards'], ['drawings', 'tasks'], ['ai', 'standards'], ['ai', 'people'], ['ai', 'reports'],
    ['tasks', 'people'], ['people', 'timesheets'], ['timesheets', 'finance'], ['timesheets', 'projects'], ['finance', 'reports'],
  ];
  const sys = $('#sys'), svg = $('#sys-lines'), core = $('.sys-core', sys);
  const name = Object.fromEntries(NODES.map(n => [n[0], n[1]]));
  const nbrs = id => LINKS.filter(l => l.includes(id)).map(l => l[0] === id ? l[1] : l[0]);
  let pos = {}, buttons = {}, current = 'drawings', auto = true, built = false;

  NODES.forEach(([id, label], i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sys-node' + (id === 'ai' ? ' is-ai' : '');
    b.innerHTML = `<span>SL-${String(i + 1).padStart(2, '0')}</span>${label}`;
    const pick = () => { if (!built) return; auto = false; select(id); };
    b.addEventListener('mouseenter', pick); b.addEventListener('focus', pick); b.addEventListener('click', pick);
    sys.insertBefore(b, core);
    buttons[id] = b;
  });

  function layout() {
    const narrow = sys.clientWidth < 560;
    const rx = narrow ? 300 : 395, ry = narrow ? 250 : 228;
    NODES.forEach(([id], i) => {
      const a = -Math.PI / 2 + i * (2 * Math.PI / NODES.length);
      pos[id] = [500 + rx * Math.cos(a), 310 + ry * Math.sin(a)];
      buttons[id].style.left = (pos[id][0] / 10) + '%';
      buttons[id].style.top = (pos[id][1] / 6.2) + '%';
    });
    svg.innerHTML = `<ellipse class="ring" cx="500" cy="310" rx="${rx}" ry="${ry}"/>`
      + NODES.map(([id]) => `<line class="core" pathLength="1" data-a="core" data-b="${id}" x1="500" y1="310" x2="${pos[id][0]}" y2="${pos[id][1]}"/>`).join('')
      + LINKS.map(([a, b]) => `<line pathLength="1" data-a="${a}" data-b="${b}" x1="${pos[a][0]}" y1="${pos[a][1]}" x2="${pos[b][0]}" y2="${pos[b][1]}"/>`).join('');
    if (built) select(current, true);
  }
  function select(id, quiet) {
    current = id;
    const near = nbrs(id);
    sys.classList.add('focus');
    $$('line', svg).forEach(l => l.classList.toggle('hot', l.dataset.a === id || l.dataset.b === id));
    Object.entries(buttons).forEach(([k, b]) => { b.classList.toggle('on', k === id); b.classList.toggle('near', near.includes(k)); });
    if (quiet && $('#sys-title').textContent === name[id] && $('#sys-text').textContent) return;
    const i = NODES.findIndex(n => n[0] === id);
    $('#sys-code').textContent = `SL-${String(i + 1).padStart(2, '0')} · ${near.length} connections`;
    $('#sys-title').textContent = name[id];
    $('#sys-text').textContent = NODES[i][2];
    $('#sys-chips').innerHTML = near.map(n => `<span>${name[n]}</span>`).join('');
  }
  function finish() { built = true; sys.classList.remove('pre'); sys.classList.add('built'); select(current); }

  sys.classList.add('pre');
  layout();
  addEventListener('resize', layout);
  if (calm || !('IntersectionObserver' in window)) finish();
  else onView(sys, async () => {
    // core → (connector, node) × 9 → cross links → the ring
    sys.classList.remove('pre');
    await sleep(350);
    for (const [id] of NODES) {
      $(`line.core[data-b="${id}"]`, svg)?.classList.add('drawn');
      await sleep(150);
      buttons[id].classList.add('lit');
      await sleep(60);
    }
    await sleep(200);
    $$('line:not(.core)', svg).forEach(l => l.classList.add('drawn'));
    await sleep(700);
    Object.values(buttons).forEach(b => b.classList.remove('lit'));
    finish();
  }, 0.35);

  sys.addEventListener('mouseleave', () => { auto = true; });
  const seen = watch(sys);
  if (!calm) setInterval(() => {
    if (!built || !auto || !seen.visible || document.hidden) return;
    const i = NODES.findIndex(n => n[0] === current);
    select(NODES[(i + 1) % NODES.length][0]);
  }, 4200);
})();

// ---- AI drawing review: draw the sheet, scan it, detect its parts, then report ----
(() => {
  const ai = $('#ai'), status = $('#ai-status'), score = $('#ai-score');
  const plan = $('.plan', ai), dets = $('#ai-dets'), scan = $('#ai-scan');
  const items = $$('.checks li', ai), issues = Object.fromEntries($$('.bbx', ai).map(b => [b.dataset.issue, b]));
  const W = 640;

  // a soft trailing gradient behind the scan line
  const NS = 'http://www.w3.org/2000/svg';
  plan.insertAdjacentHTML('afterbegin', '<defs><linearGradient id="scanfade" x1="0" x2="1"><stop offset="0" stop-color="#a9d6e2" stop-opacity="0"/><stop offset="1" stop-color="#a9d6e2" stop-opacity=".14"/></linearGradient></defs>');

  // What the scan detects, keyed to the checklist: [x, y, w, h, label]
  const DETECT = {
    dims: [[66, 3, 508, 18, 'DIMENSIONS']],
    project: [[70, 432, 100, 34, 'PROJECT CODE']],
    sheet: [[170, 432, 100, 34, 'SHEET NO.']],
    scale: [[270, 432, 80, 34, 'SCALE']],
    revision: [[350, 432, 70, 34, 'REV']],
    title: [[70, 398, 160, 30, 'DRAWING TITLE']],
    doors: [[260, 184, 34, 18, ''], [164, 280, 34, 18, ''], [456, 266, 34, 18, '']],
    rooms: [[130, 144, 60, 32, ''], [306, 144, 58, 32, ''], [470, 189, 50, 32, ''], [130, 304, 60, 32, ''], [466, 334, 58, 32, '']],
  };
  const byKey = {};
  for (const [k, list] of Object.entries(DETECT)) byKey[k] = list.map(([x, y, w, h, label]) => {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'det');
    g.dataset.x = x;
    const ly = y > 430 ? y + h + 8 : y - 3;   // title-block cells are labelled underneath, so labels never collide
    g.innerHTML = `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>${label ? `<text x="${x + 2}" y="${ly}">${label}</text>` : ''}`;
    dets.appendChild(g);
    return g;
  });
  const allDets = Object.values(byKey).flat();
  const issueX = Object.fromEntries(Object.entries(issues).map(([k, g]) => [k, +g.querySelector('rect').getAttribute('x')]));

  let run = 0;
  const alive = me => me === run;
  function reset() {
    ai.classList.remove('drawn', 'scanning', 'done');
    items.forEach(li => li.classList.remove('on'));
    allDets.forEach(d => d.classList.remove('hit', 'settled', 'focus'));
    Object.values(issues).forEach(b => b.classList.remove('show', 'pulse'));
    score.textContent = '0';
    status.classList.remove('warn');
    scan.setAttribute('transform', 'translate(0 0)');
  }
  function finalState() {
    ai.classList.add('drawn', 'done');
    items.forEach(li => li.classList.add('on'));
    allDets.forEach(d => d.classList.add('settled'));
    Object.values(issues).forEach(b => b.classList.add('show'));
    score.textContent = '87';
    status.textContent = '3 issues'; status.classList.add('warn');
  }
  // one sweep across the sheet; anything the line passes is detected
  function sweep(me, ms) {
    return new Promise(res => {
      const t0 = performance.now();
      const step = t => {
        if (!alive(me)) return res();
        const k = Math.min(1, (t - t0) / ms), x = k * W;
        scan.setAttribute('transform', `translate(${x.toFixed(1)} 0)`);
        status.textContent = `Analysing A-104 · ${Math.round(k * 100)}%`;
        allDets.forEach(d => {
          if (!d.classList.contains('hit') && x >= +d.dataset.x) {
            d.classList.add('hit');
            setTimeout(() => { if (alive(me)) d.classList.add('settled'); }, 650);
          }
        });
        for (const [key, ix] of Object.entries(issueX)) if (x >= ix) issues[key].classList.add('show');
        k < 1 ? requestAnimationFrame(step) : res();
      };
      requestAnimationFrame(step);
    });
  }
  async function review() {
    const me = ++run;
    reset();
    if (calm) return finalState();
    status.textContent = 'Loading A-104';
    await sleep(60); if (!alive(me)) return;
    ai.classList.add('drawn');                       // 1 · the drawing is drafted
    await sleep(1500); if (!alive(me)) return;
    ai.classList.add('scanning');                    // 2-4 · scan, highlight, detect
    await sweep(me, 2600); if (!alive(me)) return;
    ai.classList.remove('scanning');
    status.textContent = 'Checking standards v3.4';  // 5-6 · checklist resolves, each line re-lighting what it checked
    for (const li of items) {
      await sleep(190); if (!alive(me)) return;
      li.classList.add('on');
      const lit = byKey[li.dataset.k] || [];
      lit.forEach(d => d.classList.add('focus'));
      setTimeout(() => lit.forEach(d => d.classList.remove('focus')), 420);
      if (li.dataset.issue) issues[li.dataset.issue].classList.add('pulse');
    }
    await sleep(250); if (!alive(me)) return;
    await countUp(score, 87, 1100); if (!alive(me)) return;  // 7 · the score, then the issues
    ai.classList.add('done');
    status.textContent = '3 issues'; status.classList.add('warn');
  }
  onView($('.ai-sheet', ai), review, 0.3);
  $('#ai-replay').addEventListener('click', review);
})();

// ---- How it works: one project travels through the six stages as you scroll ----
(() => {
  const sec = $('#journey'), jn = $('#jn'), tabs = $$('.jn-steps button', jn), cards = $$('.jn-card', jn);
  const fill = $('#jn-fill'), track = $('.jn-track', jn), strip = $('.jn-steps', jn);
  const N = tabs.length;
  const token = document.createElement('span');
  token.className = 'jn-token'; token.setAttribute('aria-hidden', 'true'); token.textContent = 'CH-24 · A-104';
  track.appendChild(token);
  let cur = -1;
  function show(i) {
    if (i === cur) return;
    cur = i;
    tabs.forEach((t, j) => {
      t.setAttribute('aria-selected', String(j === i)); t.tabIndex = j === i ? 0 : -1;
      t.classList.toggle('done', j < i);
    });
    cards.forEach((c, j) => c.classList.toggle('on', j === i));
    if (strip.scrollWidth > strip.clientWidth) strip.scrollTo({ left: tabs[i].parentElement.offsetLeft - 16, behavior: calm ? 'auto' : 'smooth' });
  }
  const span = () => sec.offsetHeight - (innerHeight - 64);
  function update() {
    const r = sec.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = Math.max(0, Math.min(1, (64 - r.top) / span()));
    const at = Math.max(0, Math.min(1, (p * N - 0.5) / (N - 1)));   // stage centres sit at 0, 1/5 … 1 on the line
    fill.style.width = `${(at * 100).toFixed(2)}%`;
    token.style.left = `${(at * 100).toFixed(2)}%`;
    show(Math.min(N - 1, Math.floor(p * N)));
  }
  const goTo = i => scrollTo({ top: sec.offsetTop - 64 + ((i + 0.5) / N) * span(), behavior: calm ? 'auto' : 'smooth' });
  tabs.forEach((t, i) => t.addEventListener('click', () => goTo(i)));
  strip.addEventListener('keydown', e => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) { e.preventDefault(); const i = Math.max(0, Math.min(N - 1, cur + step)); goTo(i); tabs[i].focus(); }
  });
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } }, { passive: true });
  addEventListener('resize', update);
  show(0); update();
})();

// ---- Product screens ----
(() => {
  const SHOTS = [
    ['overview', 'Dashboard', 'Who is in today, what needs your attention, active projects and upcoming deadlines, on one screen.'],
    ['register', 'Drawing register', 'Every sheet per project with its revision and last issue, and transmittals that export the files with a transmittal sheet.'],
    ['standards', 'Standards', 'Core principles and drawing rules for title blocks, sheet layout, line work, dimensions and naming. Nine are checked automatically.'],
    ['projects', 'Projects', 'Every project with its phase, lead, team, progress and approved drawings.'],
    ['team', 'Team', 'Roles, who is in today, open tasks, progress and each person’s first-pass rate.'],
    ['finances', 'Finance', 'Fee stages, what is ready to invoice, what is overdue and what each project really costs. Principal only.'],
    ['review', 'AI review', 'The check report beside the drawing board: each standard marked, a score, and the sheet waiting on its reviewer.'],
  ];
  const tabs = $('#tabs'), img = $('#shot-img'), wipe = $('.shot-wipe'), fig = $('.shot');
  tabs.innerHTML = SHOTS.map(([id, name], i) =>
    `<button role="tab" id="tab-${id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-i="${i}"><span>${String(i + 1).padStart(2, '0')}</span>${name}</button>`).join('');
  img.setAttribute('role', 'tabpanel');
  function show(i, focus) {
    const [id, name, text] = SHOTS[i];
    $$('button', tabs).forEach((b, j) => { b.setAttribute('aria-selected', String(j === i)); b.tabIndex = j === i ? 0 : -1; });
    if (focus) tabs.children[i].focus();
    const next = new Image();
    next.onload = () => {
      img.src = next.src; img.alt = `Studio Ledger ${name} screen`;
      if (!calm) {
        wipe.classList.remove('go'); void wipe.offsetWidth; wipe.classList.add('go');
      }
    };
    next.src = `assets/app/${id}.jpg`;
    img.setAttribute('aria-labelledby', `tab-${id}`);
    $('#shot-code').textContent = `A-${String(i + 1).padStart(2, '0')}`;
    $('#shot-title').textContent = name;
    $('#shot-cap').innerHTML = `<b>${name}.</b> ${text}`;
  }
  tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(+b.dataset.i); });
  tabs.addEventListener('keydown', e => {
    const cur = $$('button', tabs).findIndex(b => b.getAttribute('aria-selected') === 'true');
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) { e.preventDefault(); show((cur + step + SHOTS.length) % SHOTS.length, true); }
  });
  show(0);
  onView(fig, () => SHOTS.forEach(([id]) => { new Image().src = `assets/app/${id}.jpg`; }), 0.01);
})();

// ---- Video tour dialog ----
(() => {
  const CHAPTERS = [
    ['0:08', 'Overview'], ['0:24', 'Projects'], ['0:42', 'Tasks and notifications'], ['1:14', 'Drawing checks'],
    ['1:59', 'Review and approval'], ['2:29', 'Drawing register'], ['2:36', 'Studio standards'], ['2:44', 'Schedule'],
    ['2:52', 'Leave'], ['3:15', 'Timesheets'], ['3:38', 'Attendance'], ['3:46', 'Team'], ['3:54', 'Mentoring'],
    ['4:04', 'Performance'], ['4:12', 'Meetings'], ['4:22', 'Reflections'], ['4:43', 'Happiness'], ['5:07', 'Finances'],
    ['5:18', 'Reports'], ['5:30', 'Instagram'], ['5:41', 'Claude'], ['5:52', 'Plans and settings'], ['6:03', 'The companion'],
  ];
  const secs = t => { const [m, s] = t.split(':'); return +m * 60 + +s; };
  const dlg = $('#tour-dlg'), video = $('#tour-video'), list = $('#chapters');
  list.innerHTML = CHAPTERS.map(([t, n]) => `<li><button type="button" data-t="${secs(t)}"><span>${t}</span>${n}</button></li>`).join('');
  list.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; video.currentTime = +b.dataset.t; video.play().catch(() => {}); });
  video.addEventListener('timeupdate', () => {
    let on = -1; CHAPTERS.forEach(([c], i) => { if (video.currentTime >= secs(c)) on = i; });
    $$('button', list).forEach((b, i) => b.classList.toggle('on', i === on));
  });
  $('#open-tour').addEventListener('click', () => {
    if (typeof dlg.showModal === 'function') { dlg.showModal(); video.play().catch(() => {}); }
    else window.open('assets/demo.mp4', '_blank');
  });
  $('#close-tour').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => video.pause());
})();

// ---- Pricing (same plans as src/main/license.js and docs/pricing.html) ----
(() => {
  const PLANS = [
    { code: 'P-00', name: 'Solo', who: 'For one architect', m: 0, y: 0, note: 'Free forever · 1 person, 1 active project' },
    { code: 'P-01', name: 'Studio', who: 'For studios of 2–5 people', m: 2999, y: 29990, people: 5, extra: 499, extraY: 4990, pop: true },
    { code: 'P-02', name: 'Practice', who: 'For practices of 6–15 people', m: 6999, y: 69990, people: 15, extra: 449, extraY: 4490 },
    { code: 'P-03', name: 'Firm', who: 'For firms of 16–40 people', m: 12999, y: 129990, people: 30, extra: 399, extraY: 3990 },
  ];
  const Y = true, N = false;
  const ROWS = [
    ['AI drawing reviews', ['10 / mo', 'Unlimited', 'Unlimited', 'Unlimited']],
    ['Drawing register', [Y, Y, Y, Y]],
    ['Custom studio standards', [Y, Y, Y, Y]],
    ['Projects', ['1', 'Unlimited', 'Unlimited', 'Unlimited']],
    ['Team, attendance & leave', [N, Y, Y, Y]],
    ['Finance & profitability', [N, N, Y, Y]],
    ['Advanced reports', [N, N, Y, Y]],
    ['AI studio intelligence', [N, N, N, Y]],
  ];
  let yearly = false;
  function render() {
    $('#plans').innerHTML = PLANS.map((p, i) => {
      const price = p.m ? (yearly ? p.y / 12 : p.m) : 0;
      const sub = !p.m ? p.note
        : yearly ? `Billed yearly at ${inr(p.y)} · ${p.people} people included · ${inr(p.extraY)}/yr per extra person`
        : `${p.people} people included · ${inr(p.extra)}/mo per extra person`;
      return `<article class="tb ${p.pop ? 'pop' : ''}">
        ${p.pop ? '<span class="tb-badge">Most popular</span>' : ''}
        <span class="tb-code">${p.code}</span>
        <h3>${p.name}</h3><p class="tb-who">${p.who}</p>
        <div class="tb-price"><b>${inr(price)}</b><small>/ month</small><p>${sub}</p></div>
        <a class="btn ${p.pop ? '' : 'ghost'}" href="${SITE.downloadUrl}" download>${p.m ? 'Start 30-day trial' : 'Download free'}</a>
        <ul>${ROWS.map(([label, v]) => {
          const x = v[i];
          return `<li class="${x === N ? 'no' : ''}"><span>${label}</span><b>${x === Y ? '✓' : x === N ? '—' : x}</b>${x === N ? '<span class="sr">Not included</span>' : x === Y ? '<span class="sr">Included</span>' : ''}</li>`;
        }).join('')}</ul>
      </article>`;
    }).join('');
  }
  for (const [id, y] of [['b-month', false], ['b-year', true]]) $('#' + id).addEventListener('click', () => {
    yearly = y;
    $('#b-month').setAttribute('aria-pressed', String(!y));
    $('#b-year').setAttribute('aria-pressed', String(y));
    render();
  });
  render();
})();

// ---- Referral countdown (section hides itself once the offer has ended) ----
(() => {
  const left = Math.ceil((new Date('2026-12-31T23:59:59') - new Date()) / 864e5);
  if (left < 0) { $('#refer').hidden = true; $$('a[href="#refer"]').forEach(a => a.remove()); return; }
  $('#offer-left').textContent = `Ends 31 Dec 2026 · ${left} day${left === 1 ? '' : 's'} left`;
})();

// ---- Motion utilities: reveals, blueprint borders and small sequences ----

// Reveal: each section's blocks rise 12px in order (heading, copy, then the piece)
if ('IntersectionObserver' in window && !calm) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  const skip = el => el.closest('.flow') || el.id === 'ai' || el.id === 'net' || el.matches('.built, .faq-wrap, .flow-wrap');
  $$('.sec .wrap, .sec .built > div, .sec .flow-intro, .sec .faq-wrap > div, .final .wrap').forEach(group => {
    [...group.children].filter(el => !skip(el)).forEach((el, i) => {
      el.classList.add('reveal'); el.style.setProperty('--rd', Math.min(i, 5)); io.observe(el);
    });
  });
}

// Blueprint draw: a drafting line traces the border of a few key panels as they arrive
function drawBorder(el, threshold = 0.25) {
  if (!el || calm) return;
  el.classList.add('bp');
  el.insertAdjacentHTML('beforeend', '<svg class="bp-line" aria-hidden="true"><rect x="0" y="0" width="100%" height="100%" rx="4" pathLength="1"/></svg>');
  onView(el, () => el.classList.add('drawn'), threshold);
}
['#app', '.ai-sheet', '.ai-panel', '#sys', '#net'].forEach(s => drawBorder($(s)));

// Built for architecture: scattered generic tools settle into one aligned system
(() => {
  const vs = $('.vs');
  if (!vs || calm) return;
  const OFF = [[-14, -5, -2.5], [10, 4, 2], [-8, 6, 1.5], [14, -4, -2], [-10, 3, 2.5]];   // fixed, so it never looks random
  $$('.vs-row:not(.vs-head)', vs).forEach((r, i) => {
    const [x, y, a] = OFF[i % OFF.length];
    r.style.setProperty('--i', i);
    r.style.setProperty('--fx', `${x}px`); r.style.setProperty('--fy', `${y}px`); r.style.setProperty('--fr', `${a}deg`);
  });
  vs.classList.add('pre');
  onView(vs, () => setTimeout(() => vs.classList.remove('pre'), 250), 0.35);
})();

// Data: the studio network draws itself; the internet indicator only pulses while on screen
(() => {
  const net = $('#net');
  if (!net) return;
  if (calm || !('IntersectionObserver' in window)) { net.classList.add('in'); return; }
  onView(net, () => net.classList.add('in'), 0.3);
  new IntersectionObserver(es => es.forEach(e => net.classList.toggle('vis', e.isIntersecting))).observe(net);
})();

// Navigation: the link for the section in view carries a datum line
(() => {
  const navLinks = $$('#links a[href^="#"]');
  const map = new Map(navLinks.map(a => [a.getAttribute('href').slice(1), a]));
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    const a = map.get(e.target.id);
    if (!a) return;
    if (e.isIntersecting) { navLinks.forEach(l => l.classList.toggle('on', l === a)); }
    else if (a.classList.contains('on')) a.classList.remove('on');
  }), { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
})();

// Jumping to a section: a single hairline sweeps under the navigation
(() => {
  if (calm) return;
  const line = document.createElement('i');
  line.className = 'sweep'; line.setAttribute('aria-hidden', 'true');
  document.body.appendChild(line);
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    line.classList.remove('go'); void line.offsetWidth; line.classList.add('go');
  });
})();
