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

// ---- Hero: live dashboard that hands A-104 to AI review ----
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
