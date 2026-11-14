// ---- Site settings: change these when something moves ----
const SITE = {
  // Installer link. The GitHub release always serves the newest upload under this name.
  downloadUrl: 'https://github.com/Krixhnarr/studio-ledger-website/releases/latest/download/Studio-Ledger-Setup.exe',
  // Google Apps Script web app that adds each download form to the "Downloads" sheet.
  leadsUrl: 'https://script.google.com/macros/s/AKfycbxdibj8QEd8AEUxKYFFEFeysbT9pHsi_Y2I3DjqTkicfwmxfTK-6hzIMQiOEG9XXszR/exec',
  // Launch: 12 am India time on 15 November 2026. Before this, downloads are closed and the
  // buttons collect a launch list instead. Nothing needs changing on the day; the page opens itself.
  launchAt: Date.parse('2026-11-15T00:00:00+05:30'),
  version: '3.0.0',
  email: 'thepincstudio@gmail.com',
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
// below the hero, hidden starting states for animations apply only once this script runs (see site.css)
document.documentElement.classList.add('js');
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

// ---- Links: download, contact ----
const mail = (subject, body) => `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
$$('[data-contact], [data-contact-text]').forEach(a => { a.href = mail('Studio Ledger', ''); });
$$('[data-contact-text]').forEach(a => { a.textContent = SITE.email; });
$$('[data-version]').forEach(el => { el.textContent = SITE.version; });

// ---- Download: ask who they are once, then start the installer ----
// Before launch the same form fills a launch list, and every download link (Windows and Android) waits.
const getDlg = $('#get-dlg'), getForm = $('#get-form'), getErr = $('#get-err');
const VISITOR = 'sl-visitor';
const visitor = {
  get() { try { return JSON.parse(localStorage.getItem(VISITOR)); } catch { return null; } },
  set(v) { try { localStorage.setItem(VISITOR, JSON.stringify(v)); } catch {} },
};
const launched = () => Date.now() >= SITE.launchAt;
const submitBtn = $('#get-submit'), submitLabel = submitBtn.innerHTML;

function openGet(mode) {
  const soon = !launched();
  getDlg.classList.toggle('soon', soon);
  $('#get-title').textContent = soon ? 'Launching 15 November' : 'Get Studio Ledger';
  submitBtn.innerHTML = soon ? 'Tell me when it’s out' : submitLabel;
  getDlg.dataset.mode = mode;
  getErr.hidden = true;
  tick();
  if (!getDlg.open) getDlg.showModal();
}
function startDownload() {
  openGet('done');
  location.href = SITE.downloadUrl;
}
$$('[data-direct]').forEach(a => { a.href = SITE.downloadUrl; });
document.addEventListener('click', e => {
  const t = e.target.closest('[data-download], [data-app], [data-notify]');
  if (!t) return;
  if (t.matches('[data-app]') && launched()) return;   // the Android link works as a plain link once live
  e.preventDefault();
  if (launched() && visitor.get()) return startDownload();
  openGet(!launched() && visitor.get() ? 'done' : 'ask');
});
getForm.addEventListener('change', e => {
  if (e.target.name === 'type') getForm.firm.required = e.target.value === 'Firm';
});
getForm.addEventListener('submit', e => {
  e.preventDefault();
  const f = Object.fromEntries(['name', 'email', 'type', 'firm'].map(k => [k, (getForm[k].value || '').trim()]));
  const problem = !f.name ? 'Enter your name.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) ? 'Enter a valid email address.'
    : !f.type ? 'Choose solo or firm.'
    : f.type === 'Firm' && !f.firm ? 'Enter your firm name.' : '';
  if (problem) { getErr.textContent = problem; getErr.hidden = false; return; }
  const soon = !launched();
  if (SITE.leadsUrl) {
    const page = (soon ? 'Pre-launch list · ' : '') + location.href;
    fetch(SITE.leadsUrl, { method: 'POST', mode: 'no-cors', keepalive: true, body: new URLSearchParams({ ...f, page }) }).catch(() => {});
  }
  visitor.set(f);
  soon ? openGet('done') : startDownload();
});

// ---- Launch countdown: the bar under the nav and the big one in the dialog ----
const pad = n => String(n).padStart(2, '0');
function tick() {
  const left = SITE.launchAt - Date.now();
  if (left <= 0) {
    $('#launch-bar').hidden = true;
    getDlg.classList.remove('soon');
    return false;
  }
  const s = Math.floor(left / 1000), d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60, sec = s % 60;
  $$('[data-cd="short"]').forEach(el => { el.textContent = `${d}d ${pad(h)}h ${pad(m)}m ${pad(sec)}s`; });
  $$('[data-cd="big"]').forEach(el => {
    el.innerHTML = [[d, d === 1 ? 'day' : 'days'], [pad(h), 'hours'], [pad(m), 'min'], [pad(sec), 'sec']]
      .map(([v, l]) => `<span><b>${v}</b><small>${l}</small></span>`).join('');
  });
  return true;
}
if (tick()) {
  $('#launch-bar').hidden = false;
  const timer = setInterval(() => {
    if (tick()) return;
    clearInterval(timer);
    // Launch moment while the page is open: an open "soon" dialog turns into the real download form
    if (getDlg.open) openGet('ask');
  }, 1000);
}
$('#get-close').addEventListener('click', () => getDlg.close());
$('#get-ok').addEventListener('click', () => getDlg.close());
getDlg.addEventListener('click', e => { if (e.target === getDlg) getDlg.close(); });

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

// ---- Hero: Villa Savoye lies under the Pantheon, uncovered by the pointer ----
// A soft lens follows a mouse or pen, with two smaller blots trailing it so a moving edge bleeds like wet wash
// and settles back to a circle. A tap, a click or the plate buttons uncover the whole sheet from that point.
(() => {
  const art = $('#plate-art');
  if (!art) return;
  const plate = $('#plate'), top = $('.plate-top', art), cur = $('#plate-cursor'), eras = $$('[data-era]', plate);
  const S = { x: 0, y: 0, r: 0 }, A = { x: 0, y: 0 }, B = { x: 0, y: 0 };   // lens, trailing blots
  let want = 0, w = 0, h = 0, raf = 0, lastTs = 0, full = false, hover = false;
  const lens = () => Math.max(110, Math.min(210, w * 0.2));
  // the gradient is solid to 45% of its radius, so a full uncover needs the far corner inside that
  const cover = (x, y) => Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) / 0.45;
  const measure = () => { const b = art.getBoundingClientRect(); w = b.width; h = b.height; return b; };
  const blot = (p, r) => `radial-gradient(circle ${r.toFixed(1)}px at ${p.x.toFixed(1)}px ${p.y.toFixed(1)}px, #000 45%, rgba(0,0,0,.62) 66%, rgba(0,0,0,.22) 84%, transparent)`;

  function paint() {
    if (S.r < 0.5) { top.style.visibility = 'hidden'; return; }
    top.style.visibility = 'visible';
    const m = full && S.r === want ? 'none' : `${blot(S, S.r)}, ${blot(A, S.r * 0.8)}, ${blot(B, S.r * 0.62)}`;
    top.style.webkitMaskImage = m;
    top.style.maskImage = m;
  }
  function frame(ts) {
    const dt = lastTs ? Math.min(64, ts - lastTs) : 16;
    lastTs = ts;
    const k = tau => calm ? 1 : 1 - Math.exp(-dt / tau);
    S.r += (want - S.r) * k(full ? 260 : 140);
    const a = k(70), b = k(150);
    A.x += (S.x - A.x) * a; A.y += (S.y - A.y) * a;
    B.x += (S.x - B.x) * b; B.y += (S.y - B.y) * b;
    const settled = Math.abs(want - S.r) < 0.5 && Math.hypot(S.x - B.x, S.y - B.y) < 0.5;
    if (settled) { S.r = want; A.x = B.x = S.x; A.y = B.y = S.y; }
    paint();
    if (settled) { raf = 0; lastTs = 0; } else raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const jump = (x, y) => { S.x = A.x = B.x = x; S.y = A.y = B.y = y; };

  // While the sheet is fully uncovered the centre can move unseen, so it always moves to the new point
  function uncover(on, x = w / 2, y = h / 2) {
    full = on;
    jump(x, y);
    want = on ? cover(x, y) : hover ? lens() : 0;
    plate.classList.toggle('full', on);
    eras.forEach(b => b.setAttribute('aria-pressed', String((b.dataset.era === '1') === on)));
    kick();
  }

  const lift = () => { hover = false; plate.classList.remove('peek'); if (!full) { want = 0; kick(); } };
  const follow = e => {
    const r = measure(), x = e.clientX - r.left, y = e.clientY - r.top;
    cur.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    if (!hover) { hover = true; plate.classList.add('peek'); if (!full) jump(x, y); }   // start at the pointer, not where it last left
    if (full) return;
    S.x = x; S.y = y; want = lens();
    kick();
  };
  // A finger works like the mouse while it is down: the lens appears under it and follows a sideways drag.
  // The plate only claims horizontal moves (touch-action: pan-y), so a vertical swipe still scrolls the page;
  // the browser then cancels the pointer and the lens fades. A tap (no real movement) uncovers the whole sheet.
  let down = null;
  art.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch') return;
    down = { x: e.clientX, y: e.clientY, moved: false };
    follow(e);
  });
  art.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') {
      if (!down) return;
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) down.moved = true;
    }
    follow(e);
  });
  art.addEventListener('pointerup', e => { if (e.pointerType === 'touch') lift(); });
  art.addEventListener('pointercancel', () => { down = null; lift(); });
  art.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') lift(); });
  art.addEventListener('click', e => {
    if (down?.moved) { down = null; return; }   // the end of a drag, not a tap
    down = null;
    const r = measure();
    uncover(!full, e.clientX - r.left, e.clientY - r.top);
  });
  eras.forEach(b => b.addEventListener('click', () => { measure(); uncover(b.dataset.era === '1'); }));
  addEventListener('resize', () => { measure(); if (full) { want = cover(S.x, S.y); kick(); } });
  measure(); paint();
})();

// ---- Ledger waves from the closing section: once on arrival, again on hover ----
// The sprite rises (0–12), waves (13–28), then sinks back by replaying the rise in reverse (12–0).
// Frames 29–47 (a long still stand, then a hard cut) are skipped, so he never stalls or pops.
(() => {
  const wave = $('#wave');
  if (!wave) return;
  const FW = 176, FPS = 12, SEQ = [];
  for (let f = 0; f <= 28; f++) SEQ.push(f);
  for (let f = 12; f >= 0; f--) SEQ.push(f);
  let playing = false;
  const show = f => { wave.style.backgroundPosition = `${-f * FW}px 0`; };
  function play() {
    if (calm || playing) return;
    playing = true;
    const t0 = performance.now();
    const step = now => {
      const i = Math.floor((now - t0) * FPS / 1000);
      if (i >= SEQ.length) { show(0); playing = false; return; }
      show(SEQ[i]);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  wave.addEventListener('pointerenter', play);
  onView(wave, () => setTimeout(play, 300), 0.6);
})();

// ---- Video tour dialog ----
(() => {
  const CHAPTERS = [
    ['0:00', 'What this video covers'], ['0:29', 'Overview'], ['1:30', 'Attendance'], ['2:50', 'Messages'],
    ['4:49', 'Contacts'], ['5:32', 'Leave'], ['6:46', 'What comes next'],
  ];

  const secs = t => { const [m, s] = t.split(':'); return +m * 60 + +s; };
  const dlg = $('#tour-dlg'), video = $('#tour-video'), list = $('#chapters');
  if (!dlg) return;
  list.innerHTML = CHAPTERS.map(([t, n]) => `<li><button type="button" data-t="${secs(t)}"><span>${t}</span>${n}</button></li>`).join('');
  list.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; video.currentTime = +b.dataset.t; video.play().catch(() => {}); });
  video.addEventListener('timeupdate', () => {
    let on = -1; CHAPTERS.forEach(([c], i) => { if (video.currentTime >= secs(c)) on = i; });
    $$('button', list).forEach((b, i) => b.classList.toggle('on', i === on));
  });
  $('#open-tour').addEventListener('click', () => {
    if (typeof dlg.showModal === 'function') { dlg.showModal(); video.play().catch(() => {}); }
    else window.open('assets/tour.mp4', '_blank');
  });
  $('#close-tour').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => video.pause());
})();

// ---- Referral countdown (section hides itself once the offer has ended) ----
(() => {
  if (!$('#refer')) return;
  const left = Math.ceil((new Date('2026-12-31T23:59:59') - new Date()) / 864e5);
  if (left < 0) { $('#refer').hidden = true; $$('a[href="#refer"]').forEach(a => a.remove()); return; }
  $('#offer-left').textContent = `Ends 31 Dec 2026 · ${left} day${left === 1 ? '' : 's'} left`;
})();

// ---- Launch feedback offer: opens with the launch, closes 31 January 2027 (same dates as FEEDBACK in the app) ----
(() => {
  const card = $('#offer-feedback'), when = $('#fb-when');
  if (!card) return;
  const now = Date.now(), ends = Date.parse('2027-01-31T23:59:59+05:30');
  if (now > ends) { card.hidden = true; return; }
  if (now < SITE.launchAt) { when.textContent = 'Opens with the launch · until 31 January 2027'; return; }
  const left = Math.ceil((ends - now) / 864e5);
  when.textContent = `Open until 31 Jan 2027 · ${left} day${left === 1 ? '' : 's'} left`;
})();

// ---- Restored from the previous site: story chapters, system diagram, journey, built-for-architecture, network ----
// ---- Story: each chapter plays once as it arrives (number, heading, problems crossed out, answer, screen, note) ----
// On wide screens the screen drifts a few pixels against the scroll; only chapters on screen are updated.
// Each chapter screen is a 1600-wide layout scaled to its frame (--k = frame width / 1600).
(() => {
  const pics = $$('.ch-pic');
  const fit = p => p.style.setProperty('--k', (p.clientWidth / 1600).toFixed(4));
  pics.forEach(fit);
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(es => es.forEach(e => fit(e.target))); pics.forEach(p => ro.observe(p)); }
  else addEventListener('resize', () => pics.forEach(fit));
})();
(() => {
  const chs = $$('.ch');
  if (calm) { chs.forEach(ch => ch.classList.add('in')); return; }
  chs.forEach(ch => onView(ch, () => ch.classList.add('in'), 0.22));
  const wide = matchMedia('(min-width: 861px)'), live = new Set();
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? live.add(e.target) : live.delete(e.target)));
  chs.forEach(ch => io.observe(ch));
  let ticking = false;
  const drift = () => {
    ticking = false;
    live.forEach(ch => {
      const r = ch.getBoundingClientRect(), p = (r.top + r.height / 2 - innerHeight / 2) / (innerHeight + r.height);
      $('.ch-shot', ch).style.transform = wide.matches ? `translate3d(0, ${(p * 60).toFixed(1)}px, 0)` : '';
    });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
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
  if (!$('#sys')) return;
  const sys = $('#sys'), svg = $('#sys-lines'), core = $('.sys-core', sys);
  const name = Object.fromEntries(NODES.map(n => [n[0], n[1]]));
  const nbrs = id => LINKS.filter(l => l.includes(id)).map(l => l[0] === id ? l[1] : l[0]);
  let pos = {}, buttons = {}, current = 'drawings', auto = true, built = false;

  NODES.forEach(([id, label], i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sys-node' + (id === 'ai' ? ' is-ai' : '');
    b.textContent = label;
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
    $('#sys-code').textContent = `Connected to ${near.length} other parts`;
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

// ---- How it works: one project travels through the six stages as you scroll ----
(() => {
  if (!$('#jn')) return;
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

// Blueprint draw: a drafting line traces the border of a few key panels as they arrive
function drawBorder(el, threshold = 0.25) {
  if (!el || calm) return;
  el.classList.add('bp');
  el.insertAdjacentHTML('beforeend', '<svg class="bp-line" aria-hidden="true"><rect x="0" y="0" width="100%" height="100%" rx="4" pathLength="1"/></svg>');
  onView(el, () => el.classList.add('drawn'), threshold);
}
['.rv-sheet', '.rv-panel', '#sys', '#net'].forEach(s => drawBorder($(s)));

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

// Showcase: a drafting wipe crosses each new screen as it arrives
(() => {
  const frame = $('#sc-frame'), img = $('#sc-img');
  if (!frame || !img || calm) return;
  const wipe = document.createElement('i');
  wipe.className = 'shot-wipe'; wipe.setAttribute('aria-hidden', 'true');
  frame.appendChild(wipe);
  let first = true;
  new MutationObserver(() => { if (first) { first = false; return; } wipe.classList.remove('go'); void wipe.offsetWidth; wipe.classList.add('go'); }).observe(img, { attributes: true, attributeFilter: ['src'] });
})();

// =====================================================================
// Below the hero (index.html .v2, styles in site.css)
// =====================================================================

// ---- Reveals: blocks rise in once, headings arrive word by word, drawings draw themselves ----
(() => {
  const v2 = $('#v2');
  if (!v2) return;
  // headings: wrap each word so it can be staggered (the text itself is unchanged for screen readers)
  $$('[data-split]', v2).forEach(h => {
    const words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true" style="--wi:${i}">${w}</span>`).join(' ');
  });
  // siblings that reveal together are staggered in order
  const groups = new Map();
  $$('[data-rv]', v2).forEach(el => {
    const p = el.parentElement;
    const i = groups.get(p) || 0;
    groups.set(p, i + 1);
    el.style.setProperty('--d', Math.min(i, 6));
  });
  const targets = $$('[data-rv], [data-split], .v2-draw, [data-zoom], .hub, .tr-map, .v2-final', v2);
  if (calm || !('IntersectionObserver' in window)) { targets.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  targets.forEach(el => io.observe(el));
})();

// ---- One workspace: the parts of the practice, each with what it does and what it connects to ----
(() => {
  const hub = $('#hub');
  if (!hub) return;
  const NODES = {
    projects: ['Projects', 'Phase from Concept to Completed, lead, team, progress, approved drawings and fee stages for every project.'],
    drawings: ['Drawings', 'Every sheet from submission through senior and principal review to Approved, with revisions, redlines and history.'],
    ai: ['AI review', 'Reads each drawing against your standards, marks where the issues are and scores the sheet before a person opens it.'],
    standards: ['Standards', 'Your studio’s drawing rules and principles, written once and checked on every sheet.'],
    tasks: ['Tasks', 'Work assigned with due dates, priority and progress, filed under its project.'],
    people: ['People', 'Team roles, attendance, leave, mentoring and a weekly check-in that shows who is stretched.'],
    timesheets: ['Timesheets', 'Weekly hours per project with Friday reminders, turned into real project costs.'],
    finance: ['Finance', 'Fee stages, ready-to-invoice reminders when a phase finishes, overdue payments and profitability.'],
    reports: ['Reports', 'Weekly and monthly reports on drawings, people, hours and fees, with an AI summary, saved as PDF.'],
  };
  const LINKS = [
    ['projects', 'drawings'], ['projects', 'tasks'], ['projects', 'finance'], ['projects', 'reports'], ['projects', 'people'],
    ['drawings', 'ai'], ['drawings', 'standards'], ['drawings', 'tasks'], ['ai', 'standards'], ['ai', 'people'], ['ai', 'reports'],
    ['tasks', 'people'], ['people', 'timesheets'], ['timesheets', 'finance'], ['timesheets', 'projects'], ['finance', 'reports'],
  ];
  const order = Object.keys(NODES);
  const btns = $$('[data-node]', hub);
  btns.forEach((b, i) => b.style.setProperty('--i', i));
  const nbrs = id => LINKS.filter(l => l.includes(id)).map(l => (l[0] === id ? l[1] : l[0]));
  let cur = 'drawings', auto = true;
  function select(id) {
    cur = id;
    const near = nbrs(id);
    btns.forEach(b => { b.classList.toggle('on', b.dataset.node === id); b.classList.toggle('near', near.includes(b.dataset.node)); b.setAttribute('aria-pressed', String(b.dataset.node === id)); });
    $('#hub-k').textContent = NODES[id][0];
    $('#hub-t').textContent = NODES[id][1];
    $('#hub-l').innerHTML = 'Connected to ' + near.map(n => `<span>${NODES[n][0]}</span>`).join(', ');
  }
  btns.forEach(b => {
    const pick = () => { auto = false; select(b.dataset.node); };
    b.addEventListener('click', pick);
    b.addEventListener('mouseenter', pick);
    b.addEventListener('focus', pick);
  });
  hub.addEventListener('mouseleave', () => { auto = true; });
  select(cur);
  if (calm) return;
  const seen = watch(hub);
  setInterval(() => {
    if (!auto || !seen.visible || document.hidden) return;
    select(order[(order.indexOf(cur) + 1) % order.length]);
  }, 4200);
})();

// ---- AI drawing review: the sheet is drawn, scanned, the issues marked, then the fix list ----
(() => {
  const rv = $('#rv');
  if (!rv) return;
  const status = $('#rv-status'), score = $('#rv-score'), dets = $('#rv-dets'), scan = $('#rv-scan');
  const steps = $$('#rv-steps li');
  const items = $$('.rv-checks li', rv), issues = Object.fromEntries($$('.p-iss', rv).map(g => [g.dataset.issue, g]));
  const W = 640, NS = 'http://www.w3.org/2000/svg';
  // what the scan line picks up, keyed to the checklist: [x, y, w, h, label]
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
    g.dataset.x = x;
    const ly = y > 430 ? y + h + 8 : y - 3;
    g.innerHTML = `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>${label ? `<text x="${x + 2}" y="${ly}">${label}</text>` : ''}`;
    dets.appendChild(g);
    return g;
  });
  const allDets = Object.values(byKey).flat();
  const issueX = Object.fromEntries(Object.entries(issues).map(([k, g]) => [k, +g.querySelector('rect').getAttribute('x')]));
  const step = n => steps.forEach((li, i) => li.classList.toggle('on', i <= n));

  let run = 0;
  const alive = me => me === run;
  function reset() {
    rv.classList.remove('drawn', 'scanning', 'done');
    items.forEach(li => li.classList.remove('on'));
    allDets.forEach(d => d.classList.remove('hit', 'settled', 'focus'));
    Object.values(issues).forEach(g => g.classList.remove('show', 'pulse'));
    score.textContent = '0';
    status.classList.remove('warn');
    scan.setAttribute('transform', 'translate(0 0)');
    step(-1);
  }
  function finalState() {
    rv.classList.add('drawn', 'done');
    items.forEach(li => li.classList.add('on'));
    allDets.forEach(d => d.classList.add('settled'));
    Object.values(issues).forEach(g => g.classList.add('show'));
    score.textContent = '87';
    status.textContent = '3 issues'; status.classList.add('warn');
    step(3);
  }
  function sweep(me, ms) {
    return new Promise(res => {
      const t0 = performance.now();
      const frame = t => {
        if (!alive(me)) return res();
        const k = Math.min(1, (t - t0) / ms), x = k * W;
        scan.setAttribute('transform', `translate(${x.toFixed(1)} 0)`);
        status.textContent = `Analysing · ${Math.round(k * 100)}%`;
        allDets.forEach(d => {
          if (!d.classList.contains('hit') && x >= +d.dataset.x) {
            d.classList.add('hit');
            setTimeout(() => { if (alive(me)) d.classList.add('settled'); }, 650);
          }
        });
        for (const [key, ix] of Object.entries(issueX)) if (x >= ix && !issues[key].classList.contains('show')) { issues[key].classList.add('show'); step(2); }
        k < 1 ? requestAnimationFrame(frame) : res();
      };
      requestAnimationFrame(frame);
    });
  }
  async function review() {
    const me = ++run;
    reset();
    if (calm) return finalState();
    step(0);
    status.textContent = 'Uploaded · A-104.pdf';
    await sleep(60); if (!alive(me)) return;
    rv.classList.add('drawn');
    await sleep(1500); if (!alive(me)) return;
    step(1);
    rv.classList.add('scanning');
    await sweep(me, 2800); if (!alive(me)) return;
    rv.classList.remove('scanning');
    status.textContent = 'Checking the standards';
    for (const li of items) {
      await sleep(170); if (!alive(me)) return;
      li.classList.add('on');
      const lit = byKey[li.dataset.k] || [];
      lit.forEach(d => d.classList.add('focus'));
      setTimeout(() => lit.forEach(d => d.classList.remove('focus')), 420);
      if (li.dataset.issue) issues[li.dataset.issue].classList.add('pulse');
    }
    await sleep(250); if (!alive(me)) return;
    await countUp(score, 87, 1000); if (!alive(me)) return;
    rv.classList.add('done');
    step(3);
    status.textContent = '3 issues'; status.classList.add('warn');
  }
  onView($('.rv-sheet', rv), review, 0.35);
  $('#rv-replay').addEventListener('click', review);
})();

// ---- Inside Studio Ledger: real screens, with a slow pan across each ----
(() => {
  const SHOTS = [
    ['overview', 'Overview', 'Who is in today, what is waiting for your review, overdue tasks and the first-pass rate, on the first screen you open.', 900],
    ['projects', 'Projects', 'Every project with its phase, location, lead, open tasks, approved drawings and next milestone.', 813],
    ['check', 'Tasks & submitting a drawing', 'The task list beside a junior architect submitting a sheet: the file is read, and each visual standard is confirmed before it goes to review.', 813],
    ['schedule', 'Schedule', 'Meetings, site visits, deadlines and tasks due, week by week, for you or the whole studio.', 813],
    ['register', 'Drawing register', 'Every sheet per project with its revision and last issue, and transmittals that export the files with a transmittal sheet.', 813],
    ['review', 'AI review', 'The check report beside the drawing board: each standard marked, a score, and the sheet waiting on its reviewer.', 813],
    ['standards', 'Standards', 'Core principles and drawing rules for title blocks, sheet layout, line work, dimensions and naming, each MUST or SHOULD.', 813],
    ['team', 'Team', 'Each person’s role, where they are today, open tasks, progress, approved drawings and first-pass rate.', 813],
    ['attendance', 'Attendance', 'Check in, log a site visit or work remotely, and see the whole studio’s month in one register.', 900],
    ['finances', 'Finance', 'Fee stages, what is ready to invoice, what is overdue and what each project really costs.', 813],
  ];
  const tabs = $('#sc-tabs'), frame = $('#sc-frame'), img = $('#sc-img'), cap = $('#sc-cap');
  if (!tabs) return;
  tabs.innerHTML = SHOTS.map(([id, name], i) =>
    `<button role="tab" id="sc-tab-${id}" aria-controls="sc-frame" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-i="${i}"><span>${String(i + 1).padStart(2, '0')}</span>${name}</button>`).join('');
  frame.setAttribute('role', 'tabpanel');
  let cur = -1, t = 0;
  function show(i, focus) {
    if (i === cur) return;
    cur = i;
    const [id, name, text, h] = SHOTS[i];
    $$('button', tabs).forEach((b, j) => { b.setAttribute('aria-selected', String(j === i)); b.tabIndex = j === i ? 0 : -1; });
    const btn = tabs.children[i];
    if (focus) btn.focus();
    if (tabs.scrollWidth > tabs.clientWidth) tabs.scrollTo({ left: btn.offsetLeft - 16, behavior: calm ? 'auto' : 'smooth' });
    frame.setAttribute('aria-labelledby', `sc-tab-${id}`);
    cap.innerHTML = `<b>${name}</b><span>${text}</span>`;
    const next = new Image();
    next.onload = () => {
      const me = ++t;
      if (calm) { img.src = next.src; img.alt = `Studio Ledger ${name} screen`; return; }
      frame.classList.add('swap');
      setTimeout(() => {
        if (me !== t) return;
        img.src = next.src; img.alt = `Studio Ledger ${name} screen`; img.height = h;
        frame.classList.remove('pan'); void frame.offsetWidth; frame.classList.add('pan');
        frame.classList.remove('swap');
      }, 260);
    };
    next.src = `assets/app/${id}.jpg`;
  }
  tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(+b.dataset.i); });
  tabs.addEventListener('keydown', e => {
    const s = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (s) { e.preventDefault(); show((cur + s + SHOTS.length) % SHOTS.length, true); }
  });
  show(0);
  if (!calm) onView(frame, () => frame.classList.add('pan'), 0.2);
  onView(frame, () => SHOTS.forEach(([id]) => { new Image().src = `assets/app/${id}.jpg`; }), 0.01);
})();

// ---- Pricing (same plans and prices as backend/src/billing/plans.ts) ----
// Four ways to pay (1, 3, 6 or 12 months), rupees or dollars, and the early bird: the first ten studios to pay get 30% off
// every payment for twelve months. The places left come from the server; if it can't be reached the offer is still shown.
(() => {
  if (!$('#plans')) return;
  const PLANS = [
    { name: 'Solo', who: 'For one architect', people: 1 },
    { name: 'Studio', who: 'For studios of 2–5 people', people: 5, pop: true, inr: [2999, 29990, 499, 4990], usd: [69, 690, 12, 120], all: { inr: [1999, 19990], usd: [45, 450] } },
    { name: 'Practice', who: 'For practices of 6–15 people', people: 15, inr: [6999, 69990, 449, 4490], usd: [149, 1490, 10, 100] },
    { name: 'Firm', who: 'For firms of 16–40 people', people: 30, inr: [12999, 129990, 399, 3990], usd: [279, 2790, 9, 90] },
  ];
  const PERIOD = {
    month: { months: 1, off: 0, per: '/mo', every: 'every month' },
    quarter: { months: 3, off: 5, per: '/3 mo', every: 'every 3 months' },
    half: { months: 6, off: 10, per: '/6 mo', every: 'every 6 months' },
    year: { months: 12, off: 0, per: '/yr', every: 'every year' },
  };
  const EB = { places: 10, percent: 30, months: 12, left: null, open: true };
  // what one payment costs for this period, from a [monthly, yearly] pair (3 and 6 months: monthly less 5% / 10%)
  const forPeriod = (m, y, period) => period === 'year' ? y : period === 'month' ? m : Math.round(m * PERIOD[period].months * (100 - PERIOD[period].off) / 100);
  const ebPrice = n => Math.round(n * (100 - EB.percent) / 100);

  const Y = true, N = false, X = 'extra';
  // [label, values for Solo / Studio / Practice / Firm, footnote]; a function gets the period's prices; [title] starts a group
  const ROWS = [
    ['People included', ['1', '5', '15', '30']],
    ['Each extra person', f => ['—', f.extra(1), f.extra(2), f.extra(3)]],
    ['Active projects', ['1', 'Unlimited', 'Unlimited', 'Unlimited']],
    ['AI drawing reviews', ['10 a month', 'No cap', 'No cap', 'No cap'], true],
    ['Every feature unlocked', f => ['—', f.all(), 'Included', 'Included']],
    ['Drawings and standards'],
    ['Drawing review and approvals', [Y, Y, Y, Y]],
    ['Automatic sheet checks', [Y, Y, Y, Y]],
    ['Drawing register and transmittals', [Y, Y, Y, Y]],
    ['Custom studio standards', [Y, Y, Y, Y]],
    ['Project guidelines and office layouts', [Y, Y, Y, Y]],
    ['Everyday work'],
    ['Tasks, schedule and timesheets', [Y, Y, Y, Y]],
    ['Weekly reports', [Y, Y, Y, Y]],
    ['Studio companion: Andrew, help on every screen', [Y, Y, Y, Y]],
    ['Android app for principals and seniors', [Y, Y, Y, Y]],
    ['Google Drive for files from site', [Y, Y, Y, Y]],
    ['People and the studio'],
    ['Team, attendance and leave', [N, Y, Y, Y]],
    ['Messages and meetings', [N, Y, Y, Y]],
    ['Mentoring, reflections and happiness', [N, Y, Y, Y]],
    ['Hiring and the studio mailbox', [N, Y, Y, Y]],
    ['Office events', [N, Y, Y, Y]],
    ['Office refunds', [N, Y, Y, Y]],
    ['Feedback and complaints box', [N, Y, Y, Y]],
    ['Running the business'],
    ['Finances: fees, invoices and project costs', [N, X, Y, Y]],
    ['Performance', [N, X, Y, Y]],
    ['Monthly reports', [N, X, Y, Y]],
    ['Instagram growth analysis', [N, X, Y, Y]],
    ['Studio assistant: Ask Claude and weekly client updates', [N, X, Y, Y]],
  ];

  const fine = $('#pr-fine');
  if (!fine) return;
  const FINE = {
    inr: 'Prices in rupees, plus GST. Studios outside India pay in US dollars with no GST.',
    usd: 'Prices in US dollars, with no GST, for studios outside India, paid by card. Studios in India pay in rupees plus GST.',
  };
  const fineRest = fine ? fine.textContent.replace(FINE.inr, '') : '';
  let period = 'month', usd = false;
  const money = n => usd ? '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 }) : inr(n);

  function render() {
    const P = PERIOD[period], gstNote = usd ? '' : ' + GST';
    const ebOn = EB.open && EB.left !== 0;
    $('#plans').innerHTML = PLANS.map(p => {
      const t = usd ? p.usd : p.inr;
      if (!t) return `<article class="pr-plan">
        <h3>${p.name}</h3><p class="pr-who">${p.who}</p>
        <p class="pr-price"><b>${money(0)}</b><small>/ month</small></p>
        <p class="pr-sub">Free, for as long as you like · 1 person, 1 active project</p>
        <a class="v2-btn v2-btn-ghost" href="#start" data-download>Download free</a>
      </article>`;
      const pay = forPeriod(t[0], t[1], period);
      const perMonth = pay / P.months;
      const sub = period === 'month' ? `Billed monthly${gstNote} · ${p.people} people included` : `Billed ${money(pay)} ${P.every}${gstNote} · ${p.people} people included`;
      const ebLine = ebOn ? `<p class="pr-eb">Early bird: <b>${money(ebPrice(pay))}${P.per}</b>${period === 'month' ? '' : ` (${money(Math.round(ebPrice(pay) / P.months))}/mo)`}</p>` : '';
      const allNote = p.all ? (() => { const a = usd ? p.all.usd : p.all.inr; return `<p class="pr-all">Unlock every feature for <b>${money(forPeriod(a[0], a[1], period))}${P.per}</b> more</p>`; })() : '<p class="pr-all pr-all-in">Every feature included</p>';
      return `<article class="pr-plan ${p.pop ? 'pop' : ''}">
        <h3>${p.name}</h3><p class="pr-who">${p.who}</p>
        <p class="pr-price"><b>${money(Math.round(perMonth))}</b><small>/ month</small></p>
        <p class="pr-sub">${sub}</p>
        ${ebLine}
        ${allNote}
        <a class="v2-btn ${p.pop ? '' : 'v2-btn-ghost'}" href="#start" data-download>Start 30-day trial</a>
      </article>`;
    }).join('');

    const f = {
      extra: i => { const t = usd ? PLANS[i].usd : PLANS[i].inr; return `${money(forPeriod(t[2], t[3], period))}${P.per}`; },
      all: () => { const a = usd ? PLANS[1].all.usd : PLANS[1].all.inr; return `Optional, +${money(forPeriod(a[0], a[1], period))}${P.per}`; },
    };
    const tbl = $('#pr-table');
    $('thead', tbl).innerHTML = `<tr><th scope="col">Plan</th>${PLANS.map(p => `<th scope="col" class="${p.pop ? 'pop' : ''}">${p.name}</th>`).join('')}</tr>`;
    $('tbody', tbl).innerHTML = ROWS.map(([label, v, note]) => {
      if (!v) return `<tr class="pr-group"><th scope="rowgroup" colspan="5">${label}</th></tr>`;
      const vals = typeof v === 'function' ? v(f) : v;
      return `<tr><th scope="row">${label}${note ? '<sup><a href="#pricing-ai" aria-label="How AI reviews are counted">*</a></sup>' : ''}</th>${vals.map((x, i) =>
        `<td class="${x === Y ? 'y' : x === N ? 'n' : x === X ? 'x' : ''}${PLANS[i].pop ? ' pop' : ''}">${x === Y ? 'Included' : x === N ? '—' : x === X ? 'With the extra' : x}</td>`).join('')}</tr>`;
    }).join('');
    if (fine) fine.textContent = (usd ? FINE.usd : FINE.inr) + fineRest;

    const banner = $('#pr-eb');
    if (banner) {
      banner.hidden = !ebOn;
      const left = $('#pr-eb-left');
      if (left) left.textContent = EB.left == null ? `First ${EB.places} studios` : `${EB.left} of ${EB.places} places left`;
    }
  }

  const periods = { 'b-month': 'month', 'b-quarter': 'quarter', 'b-half': 'half', 'b-year': 'year' };
  for (const [id, p] of Object.entries(periods)) $('#' + id)?.addEventListener('click', () => {
    period = p;
    for (const k of Object.keys(periods)) $('#' + k)?.setAttribute('aria-pressed', String(k === id));
    render();
  });
  const press = (on, off) => { $('#' + on).setAttribute('aria-pressed', 'true'); $('#' + off).setAttribute('aria-pressed', 'false'); };
  $('#c-inr').addEventListener('click', () => { usd = false; press('c-inr', 'c-usd'); render(); });
  $('#c-usd').addEventListener('click', () => { usd = true; press('c-usd', 'c-inr'); render(); });
  render();

  // places left: counted on the server only when a studio pays
  fetch('https://api.studioledger.in/v1/public/early-bird', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if (!d || typeof d.left !== 'number') return;
      Object.assign(EB, { places: d.places, percent: d.percent, months: d.months, left: d.left, open: d.places > 0 });
      render();
      $$('[data-eb-left]').forEach(el => { el.textContent = d.left > 0 ? `${d.left} of ${d.places} places left` : 'All places taken'; });
      if (d.left === 0 || d.places === 0) $$('[data-eb-card]').forEach(el => { el.hidden = true; });
    })
    .catch(() => {});
})();

// ---- FAQ: answers open and close with a short height animation; the topic in view is marked ----
(() => {
  $$('.fq-g details').forEach(d => {
    const s = $('summary', d), a = $('.fq-a', d);
    s.addEventListener('click', e => {
      if (calm || !a.animate) return;
      e.preventDefault();
      if (d.open) {
        const anim = a.animate([{ height: a.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 260, easing: 'cubic-bezier(.22,1,.36,1)' });
        anim.onfinish = () => { d.open = false; };
      } else {
        d.open = true;
        a.animate([{ height: '0px', opacity: 0 }, { height: a.offsetHeight + 'px', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
    });
  });
  const nav = $$('.fq-nav a');
  if (!nav.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) nav.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-40% 0px -55% 0px' });
  $$('.fq-g').forEach(g => io.observe(g));
})();

// ---- Navigation: the link for the section in view carries a datum line ----
(() => {
  const navLinks = $$('#links a[href^="#"]');
  const map = new Map(navLinks.map(a => [a.getAttribute('href').slice(1), a]));
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    const a = map.get(e.target.id);
    if (!a) return;
    if (e.isIntersecting) navLinks.forEach(l => l.classList.toggle('on', l === a));
    else if (a.classList.contains('on')) a.classList.remove('on');
  }), { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
})();

// ---- Contact: a mailto link does nothing on a PC with no mail app set up, so Contact opens a small panel
// with the address, a copy button, Gmail in the browser, and the mail app ----
(() => {
  const dlg = $('#ct-dlg');
  if (!dlg || typeof dlg.showModal !== 'function') return;   // old browsers keep the plain mailto link
  const subject = 'Studio Ledger';
  $('#ct-addr').textContent = SITE.email;
  $('#ct-gmail').href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SITE.email)}&su=${encodeURIComponent(subject)}`;
  $('#ct-app').href = mail(subject, '');
  const copy = $('#ct-copy');
  copy.addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(SITE.email); ok = true; } catch {
      const r = document.createRange(); r.selectNodeContents($('#ct-addr'));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      try { ok = document.execCommand('copy'); } catch {}
    }
    copy.textContent = ok ? 'Copied' : 'Select and copy';
    setTimeout(() => { copy.textContent = 'Copy'; }, 1800);
  });
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-contact], [data-contact-text]');
    if (!a || dlg.contains(a)) return;
    e.preventDefault();
    dlg.showModal();
  });
  $('#ct-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
})();

// ---- Back to top: the logo links to #top, which is the sticky header itself, so the browser never scrolls ----
document.addEventListener('click', e => {
  const a = e.target.closest('a[href="#top"]');
  if (!a) return;
  e.preventDefault();
  scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
});
