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

// ---- Entrance: the studio builds itself as you scroll; Ledger keeps you company ----
(() => {
  const root = $('#entrance');
  if (!root) return;
  const canvas = $('#en-canvas'), ctx = canvas.getContext('2d'), poster = $('#en-poster');
  const intro = $('#en-intro'), slides = $$('.s-slide', root), rail = $('#story-rail'), dots = $$('button', rail);
  const code = $('#s-code'), title = $('#s-title'), coord = $('#s-coord'), fill = $('#story-fill');
  const stage = $('#mascot'), fig = $('#m-figure'), mimg = $('#m-img'), bubble = $('#m-bubble'), hit = $('#m-hit');

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

  // Frames: portrait screens get the centre-cropped phone set
  const set = innerWidth / innerHeight < 0.75 ? 'm' : 'd';
  const imgs = new Array(FRAMES);
  let target = 0, shown = -1;
  const order = [];
  for (const step of [FRAMES, 10, 5, 2, 1]) for (let i = 0; i < FRAMES; i += step) if (!order.includes(i)) order.push(i);
  let next = 0;
  function loadMore() {
    if (next >= order.length) return;
    const i = order[next++], im = new Image();
    im.decoding = 'async';
    im.onload = () => { imgs[i] = im; if (shown < 0 || Math.abs(i - target) < Math.abs(shown - target)) draw(); loadMore(); };
    im.onerror = loadMore;
    im.src = `assets/entrance/${set}/${String(i).padStart(3, '0')}.webp`;
  }
  for (let k = 0; k < 6; k++) loadMore();

  function size() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    shown = -1; draw();
  }
  function draw() {
    let best = -1;
    for (let d = 0; d < FRAMES; d++) {
      if (imgs[target - d]) { best = target - d; break; }
      if (imgs[target + d]) { best = target + d; break; }
    }
    if (best < 0 || best === shown) return;
    const im = imgs[best], cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
    const w = im.naturalWidth * s, h = im.naturalHeight * s;
    ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
    shown = best;
    poster.classList.add('hide');
  }

  // Ledger: tilts toward the cursor; in the intro his pose follows what you point at
  const LINES = {
    happy: 'Hi! I’m Ledger. Scroll, and I’ll build your studio.',
    idea: 'Click me and we’ll start building.',
    pointing: 'Thirty days free, with every feature open.',
    thinking: 'Still deciding? Scroll down and watch the studio come together.',
    confused: 'Hey, where did you go?',
    celebrating: 'Let’s build it!',
    final: 'That’s your studio, built. Have a look inside.',
  };
  const ALT = {
    happy: 'waving hello', idea: 'with an idea', pointing: 'pointing', thinking: 'thinking', confused: 'looking puzzled',
    celebrating: 'celebrating', running: 'rushing between tasks', focused: 'working calmly at a laptop',
    tired: 'asleep on a stack of drawings', approved: 'giving a thumbs up', checking: 'checking a drawing',
  };
  Object.keys(ALT).forEach(p => { new Image().src = `assets/mascot/${p}.webp`; });
  let pose = 'happy', swapT, mode = 'intro', busy = false;
  function setPose(p, line) {
    if (p !== pose) {
      pose = p;
      clearTimeout(swapT);
      mimg.classList.add('swap');
      swapT = setTimeout(() => {
        mimg.src = `assets/mascot/${p}.webp`; mimg.alt = `Ledger, the Studio Ledger mascot, ${ALT[p] || p}`;
        mimg.classList.remove('swap');
      }, 200);
    }
    if (line && bubble.textContent !== line) {
      bubble.textContent = line;
      bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
    }
  }
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  function tilt() {
    cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
    fig.style.setProperty('--ry', `${(cx * 16).toFixed(2)}deg`);
    fig.style.setProperty('--rx', `${(-cy * 8).toFixed(2)}deg`);
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(tilt) : 0;
  }
  const kick = () => { if (!raf && !calm) raf = requestAnimationFrame(tilt); };
  let idle;
  const rest = () => { clearTimeout(idle); idle = setTimeout(() => { if (mode === 'intro' && !busy) setPose('thinking', LINES.thinking); }, 6500); };
  if (matchMedia('(hover: hover)').matches) {
    addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2)));
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (innerHeight / 2)));
      kick();
      if (mode !== 'intro' || busy) return;
      const t = e.target && e.target.closest ? e.target : null;
      const p = t && t.closest('#m-hit') ? 'idea' : t && t.closest('#intro-cta') ? 'pointing' : 'happy';
      setPose(p, LINES[p]);
      rest();
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => { if (mode === 'intro' && !busy) setPose('confused', LINES.confused); tx = ty = 0; kick(); });
    rest();
  } else {
    const cycle = ['happy', 'idea', 'pointing'];
    let k = 0;
    setInterval(() => { if (mode === 'intro' && !busy) { const p = cycle[++k % cycle.length]; setPose(p, LINES[p]); } }, 4200);
  }

  // Scroll → frame, captions, Ledger's pose, rail and sheet bar
  let last = '';
  function update() {
    const r = root.getBoundingClientRect(), total = root.offsetHeight - innerHeight;
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = Math.max(0, Math.min(1, -r.top / total));
    const { phase, q, time } = locate(p);
    target = Math.min(FRAMES - 1, Math.round(time / LENGTH * (FRAMES - 1)));
    draw();

    const beat = phase - 1, final = phase === PHASES.length - 1;
    const solved = beat >= 0 && !final && q > 0.5;
    const state = `${phase}|${solved}`;
    if (state !== last) {
      last = state;
      mode = phase === 0 ? 'intro' : final ? 'final' : 'beat';
      intro.classList.toggle('gone', phase > 0);
      root.classList.toggle('at-intro', phase === 0);
      slides.forEach((s, k) => s.classList.toggle('on', final ? k === slides.length - 1 : k === beat));
      if (beat >= 0 && !final) slides[beat].classList.toggle('solved', solved);
      dots.forEach((d, k) => { d.classList.toggle('on', k === beat && !final); d.classList.toggle('done', final || k < beat); });
      stage.classList.toggle('quiet', mode === 'beat');
      if (mode === 'beat') setPose(solved ? slides[beat].dataset.solved : slides[beat].dataset.struggle);
      else if (mode === 'final') setPose('pointing', LINES.final);
      else if (!busy) setPose('happy', LINES.happy);
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
  // Clicking Ledger moves the build on to its next stage
  hit.addEventListener('click', () => {
    const total = root.offsetHeight - innerHeight, p = Math.max(0, Math.min(1, -root.getBoundingClientRect().top / total));
    const nextEnd = PHASES.find(([b]) => b > p + 0.001);
    if (!nextEnd || nextEnd[0] >= 1) { $('#workspace').scrollIntoView({ behavior: calm ? 'auto' : 'smooth' }); return; }
    if (mode === 'intro') { busy = true; setPose('celebrating', LINES.celebrating); setTimeout(() => { busy = false; }, 1600); }
    goTo(nextEnd[0] + 0.02);
  });
})();

// ---- Workspace: live dashboard that hands A-104 to AI review ----
(() => {
  const app = $('#app'), overlay = $('#app-review'), row = $('#row-a104');
  const items = $$('.ar-list li', overlay), boxes = $$('.ar-plan .bb', overlay), score = $('#ar-score');
  const stats = $$('.app-stats [data-count]', app);
  const seen = watch(app);
  if (!calm) stats.forEach(s => { s.textContent = '0'; });
  onView(app, async () => {
    app.classList.add('in');
    stats.forEach(s => countUp(s, +s.dataset.count, 2000));
    if (calm) return;
    await sleep(2400);
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

// ---- System diagram ----
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
  let pos = {}, buttons = {}, current = 'drawings', auto = true;

  NODES.forEach(([id, label], i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sys-node' + (id === 'ai' ? ' is-ai' : '');
    b.innerHTML = `<span>SL-${String(i + 1).padStart(2, '0')}</span>${label}`;
    b.addEventListener('mouseenter', () => { auto = false; select(id); });
    b.addEventListener('focus', () => { auto = false; select(id); });
    b.addEventListener('click', () => { auto = false; select(id); });
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
      + NODES.map(([id]) => `<line class="core" data-a="core" data-b="${id}" x1="500" y1="310" x2="${pos[id][0]}" y2="${pos[id][1]}"/>`).join('')
      + LINKS.map(([a, b]) => `<line data-a="${a}" data-b="${b}" x1="${pos[a][0]}" y1="${pos[a][1]}" x2="${pos[b][0]}" y2="${pos[b][1]}"/>`).join('');
    select(current, true);
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
  sys.addEventListener('mouseleave', () => { auto = true; });
  layout();
  addEventListener('resize', layout);
  const seen = watch(sys);
  if (!calm) setInterval(() => {
    if (!auto || !seen.visible || document.hidden) return;
    const i = NODES.findIndex(n => n[0] === current);
    select(NODES[(i + 1) % NODES.length][0]);
  }, 4200);
})();

// ---- AI drawing review sequence ----
(() => {
  const ai = $('#ai'), status = $('#ai-status'), score = $('#ai-score');
  const items = $$('.checks li', ai), boxes = Object.fromEntries($$('.bbx', ai).map(b => [b.dataset.issue, b]));
  let run = 0;
  async function review() {
    const me = ++run;
    ai.classList.remove('drawn', 'scanning', 'done');
    items.forEach(li => li.classList.remove('on'));
    Object.values(boxes).forEach(b => b.classList.remove('show', 'pulse'));
    score.textContent = '0';
    status.classList.remove('warn');
    if (calm) {
      ai.classList.add('drawn', 'done'); items.forEach(li => li.classList.add('on'));
      Object.values(boxes).forEach(b => b.classList.add('show')); score.textContent = '87';
      status.textContent = '3 issues'; status.classList.add('warn'); return;
    }
    status.textContent = 'Loading drawing';
    await sleep(60); if (me !== run) return;
    ai.classList.add('drawn');
    await sleep(2400); if (me !== run) return;
    status.textContent = 'Analysing';
    ai.classList.add('scanning');
    for (const li of items) {
      await sleep(380); if (me !== run) return;
      li.classList.add('on');
      if (li.dataset.issue) boxes[li.dataset.issue].classList.add('show');
    }
    await countUp(score, 87, 2000); if (me !== run) return;
    ai.classList.add('done');
    Object.values(boxes).forEach(b => b.classList.add('pulse'));
    status.textContent = '3 issues'; status.classList.add('warn');
  }
  onView($('.ai-sheet', ai), review, 0.3);
  $('#ai-replay').addEventListener('click', review);
})();

// ---- Project journey ----
(() => {
  const jn = $('#jn'), tabs = $$('.jn-steps button', jn), cards = $$('.jn-card', jn), fill = $('#jn-fill');
  let cur = 0, auto = true;
  const seen = watch(jn);
  function show(i) {
    cur = i;
    tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(j === i)); t.tabIndex = j === i ? 0 : -1; });
    cards.forEach((c, j) => c.classList.toggle('on', j === i));
    fill.style.width = `${(i / (tabs.length - 1)) * 100}%`;
    const strip = tabs[i].closest('.jn-steps');
    if (strip.scrollWidth > strip.clientWidth) strip.scrollTo({ left: tabs[i].parentElement.offsetLeft - 16, behavior: calm ? 'auto' : 'smooth' });
  }
  tabs.forEach((t, i) => t.addEventListener('click', () => { auto = false; show(i); }));
  jn.querySelector('.jn-steps').addEventListener('keydown', e => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) { e.preventDefault(); auto = false; show((cur + step + tabs.length) % tabs.length); tabs[cur].focus(); }
  });
  show(0);
  if (!calm) setInterval(() => { if (auto && seen.visible && !document.hidden) show((cur + 1) % tabs.length); }, 6800);
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
        wipe.classList.remove('go'); fig.classList.remove('live-zoom'); void wipe.offsetWidth;
        wipe.classList.add('go'); requestAnimationFrame(() => fig.classList.add('live-zoom'));
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

// ---- Reveal sections as they scroll in ----
if ('IntersectionObserver' in window && !calm) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.sec .wrap > *, .sec .built > div, .sec .flow-intro > *, .sec .faq-wrap > div > *, .final .wrap > *').forEach(el => {
    if (el.closest('.flow') || el.id === 'ai' || el.classList.contains('built') || el.classList.contains('faq-wrap') || el.classList.contains('flow-wrap')) return;
    el.classList.add('reveal'); io.observe(el);
  });
}
