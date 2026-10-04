// ---- Site settings: change these three when something moves ----
const SITE = {
  // Installer link. The GitHub release always serves the newest upload under this name.
  downloadUrl: 'https://github.com/Krixhnarr/studio-ledger-website/releases/latest/download/Studio-Ledger-Setup.exe',
  version: '1.9.5',
  email: 'thepincstudio@gmail.com',
};

// ---- Links: download, demo, contact ----
const mail = (subject, body) => `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
const demoLink = mail('Studio Ledger demo request',
  'Hi,\n\nWe would like a demo of Studio Ledger.\n\nStudio name:\nCity:\nNumber of people:\nPreferred days and times:\n\nThanks');
document.querySelectorAll('[data-download]').forEach(a => { a.href = SITE.downloadUrl; a.setAttribute('download', ''); });
document.querySelectorAll('[data-demo]').forEach(a => { a.href = demoLink; });
document.querySelectorAll('[data-contact]').forEach(a => { a.href = mail('Studio Ledger', ''); });
document.querySelectorAll('[data-version]').forEach(el => { el.textContent = SITE.version; });

// ---- Mobile menu ----
const menu = document.getElementById('menu'), links = document.getElementById('links');
menu.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
});
links.addEventListener('click', e => {
  if (e.target.closest('a')) { links.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }
});

// ---- Product screens ----
const SHOTS = [
  ['overview', 'Overview', 'Who is in today, what needs your attention, active projects and upcoming deadlines, on one screen.'],
  ['review', 'Drawings', 'The senior sees the check report and the board of every sheet, from Returned to Approved, side by side with the principal.'],
  ['check', 'Submit a sheet', 'Paper size, sheet number, scale and title block are read from the PDF; the author confirms each visual standard.'],
  ['projects', 'Projects', 'Every project with its phase, lead, team, progress and approved drawings.'],
  ['register', 'Register', 'The sheet list per project with revisions, issues and transmittals.'],
  ['schedule', 'Schedule', 'Meetings, site visits, design reviews, deadlines and leave in one week view.'],
  ['attendance', 'Attendance', 'A monthly register of on time, late, site, remote and leave for everyone, exported to Excel for payroll.'],
  ['finances', 'Finances', 'Fee stages, what is ready to invoice, what is overdue and what each project really costs. Principal only.'],
  ['reports', 'Reports', 'Weekly and monthly reports with drawings, hours, attendance and the week ahead, saved as PDF.'],
  ['performance', 'Performance', 'First-pass rate, revisions per sheet and output per person, drawn from real work.'],
  ['mentoring', 'Mentoring', 'The standards each junior misses most, their trend, goals and mentor notes.'],
  ['happiness', 'Happiness', 'A 30-second weekly check-in, combined with hours and late nights, shows who needs care.'],
  ['meetings', 'Meetings', 'Minutes with attendees and actions; every action with an owner becomes a task.'],
  ['instagram', 'Instagram', 'Follower growth, engagement and which projects and post types perform best.'],
];
const tabs = document.getElementById('tabs'), img = document.getElementById('shot-img');
const cap = document.getElementById('shot-cap'), code = document.getElementById('shot-code'), title = document.getElementById('shot-title');
tabs.innerHTML = SHOTS.map(([id, name], i) =>
  `<button role="tab" id="tab-${id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-i="${i}"><span>${String(i + 1).padStart(2, '0')}</span>${name}</button>`).join('');
img.setAttribute('role', 'tabpanel');
function showShot(i, focus) {
  const [id, name, text] = SHOTS[i];
  tabs.querySelectorAll('button').forEach((b, j) => { b.setAttribute('aria-selected', String(j === i)); b.tabIndex = j === i ? 0 : -1; });
  if (focus) tabs.children[i].focus();
  img.classList.add('fade');
  const next = new Image();
  next.onload = () => { img.src = next.src; img.alt = `Studio Ledger ${name} screen`; img.classList.remove('fade'); };
  next.src = `assets/app/${id}.jpg`;
  img.setAttribute('aria-labelledby', `tab-${id}`);
  code.textContent = `A-${String(i + 1).padStart(2, '0')}`;
  title.textContent = name;
  cap.innerHTML = `<b>${name}.</b> ${text}`;
}
tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) showShot(+b.dataset.i); });
tabs.addEventListener('keydown', e => {
  const cur = [...tabs.children].findIndex(b => b.getAttribute('aria-selected') === 'true');
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  if (step) { e.preventDefault(); showShot((cur + step + SHOTS.length) % SHOTS.length, true); }
});
showShot(0);
// warm the cache so switching tabs is instant
addEventListener('load', () => setTimeout(() => SHOTS.forEach(([id]) => { new Image().src = `assets/app/${id}.jpg`; }), 1500));

// ---- Video chapters ----
const CHAPTERS = [
  ['0:08', 'Overview'], ['0:24', 'Projects'], ['0:42', 'Tasks and notifications'], ['1:14', 'Drawing checks'],
  ['1:59', 'Review and approval'], ['2:29', 'Drawing register'], ['2:36', 'Studio standards'], ['2:44', 'Schedule'],
  ['2:52', 'Leave'], ['3:15', 'Timesheets'], ['3:38', 'Attendance'], ['3:46', 'Team'], ['3:54', 'Mentoring'],
  ['4:04', 'Performance'], ['4:12', 'Meetings'], ['4:22', 'Reflections'], ['4:43', 'Happiness'], ['5:07', 'Finances'],
  ['5:18', 'Reports'], ['5:30', 'Instagram'], ['5:41', 'Claude'], ['5:52', 'Plans and settings'], ['6:03', 'The companion'],
];
const secs = t => { const [m, s] = t.split(':'); return +m * 60 + +s; };
const video = document.getElementById('tour-video'), chapters = document.getElementById('chapters');
chapters.innerHTML = CHAPTERS.map(([t, name]) => `<li><button type="button" data-t="${secs(t)}"><span>${t}</span>${name}</button></li>`).join('');
chapters.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  video.currentTime = +b.dataset.t; video.play().catch(() => {});
});
video.addEventListener('timeupdate', () => {
  const t = video.currentTime; let on = -1;
  CHAPTERS.forEach(([c], i) => { if (t >= secs(c)) on = i; });
  chapters.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === on));
});

// ---- Pricing (same plans as docs/pricing.html and src/main/license.js) ----
const PLANS = [
  { id: 'free', name: 'Solo', sheet: 'P-00', pitch: 'For one architect trying Studio Ledger.', m: 0, y: 0, people: 1,
    feats: ['1 person, 1 active project', 'Drawings, register and standards', 'Automatic sheet checks', '10 Claude checks a month', 'Tasks, schedule and timesheets', 'Weekly report'] },
  { id: 'studio', name: 'Studio', sheet: 'P-01', pitch: 'For small studios of 2–5 people.', m: 2999, y: 29990, people: 5, extra: 499, extraY: 4990,
    feats: ['Unlimited projects', 'Claude drawing checks, no monthly cap', 'Attendance and leave', 'Meetings with Claude action items', 'Mentoring, reflections and happiness'] },
  { id: 'practice', name: 'Practice', sheet: 'P-02', pitch: 'For practices of 6–15 people that track fees.', m: 6999, y: 69990, people: 15, extra: 449, extraY: 4490,
    feats: ['Fees, invoices and project costs', 'Monthly report', 'Performance', 'Instagram growth analysis'] },
  { id: 'firm', name: 'Firm', sheet: 'P-03', pitch: 'For firms of 16–40 people.', m: 12999, y: 129990, people: 30, extra: 399, extraY: 3990,
    feats: ['Ask Claude about the whole studio', 'Lowest price per extra person'] },
];
// [group] or [label, lowest plan index, Solo note]; 9 = on the way
const ROWS = [
  ['Drawings'],
  ['Drawing register and transmittals', 0], ['Studio standards and automatic sheet checks', 0], ['Claude drawing checks', 0, '10 a month'], ['Approvals, redlining and revision history', 0],
  ['Work'],
  ['Projects', 0, '1 active'], ['Tasks, schedule and timesheets', 0], ['Weekly report', 0], ['Meetings', 1],
  ['People'],
  ['Attendance and leave', 1], ['Mentoring', 1], ['Reflections and happiness check-ins', 1], ['Performance', 2],
  ['Office'],
  ['Finances: fees, invoices, costs', 2], ['Monthly report', 2], ['Instagram growth analysis', 2], ['Ask Claude about the studio', 3],
  ['On the way'],
  ['Multiple offices · resource planning · API · single sign-on', 9],
];
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
let yearly = false;
const cost = (p, n) => n > p.people && !p.extra ? null : (yearly ? p.y : p.m) + Math.max(0, n - p.people) * ((yearly ? p.extraY : p.extra) || 0);
const bestFor = n => PLANS.filter(p => cost(p, n) != null).reduce((a, p) => !a || cost(p, n) < cost(a, n) ? p : a, null);

function renderPlans(n) {
  const best = n > 40 ? null : bestFor(n);
  document.getElementById('plans').innerHTML = PLANS.map((p, i) => {
    const pick = best && best.id === p.id;
    return `<article class="tb ${pick ? 'pick' : ''}">
      <div class="tb-top"><span>${p.sheet}</span><span>${pick ? 'Fits your studio' : 'Plan'}</span></div>
      <div class="tb-name"><h3>${p.name}</h3><p>${p.pitch}</p></div>
      <div class="tb-price">${p.m ? `<b>${inr(yearly ? p.y : p.m)}</b><small>/${yearly ? 'year' : 'month'}</small>` : '<b>Free</b>'}
        <div class="x">${p.extra ? `${p.people} people included<br>${inr(yearly ? p.extraY : p.extra)} per extra person` : '1 person, always free'}</div></div>
      <ul>${i ? `<li class="plus">Everything in ${PLANS[i - 1].name}, plus</li>` : ''}${p.feats.map(f => `<li>${f}</li>`).join('')}</ul>
      <a class="btn ${pick ? '' : 'ghost'}" href="${SITE.downloadUrl}" download>${p.m ? 'Start 30-day trial' : 'Download free'}</a>
    </article>`;
  }).join('');
}
function renderCalc() {
  const n = +document.getElementById('people').value;
  document.getElementById('people-out').textContent = n === 60 ? '60+' : n;
  const plan = document.getElementById('r-plan'), price = document.getElementById('r-price');
  const note = document.getElementById('r-note'), per = document.getElementById('r-per');
  if (n > 40) {
    plan.textContent = 'Enterprise'; price.textContent = "Let's talk";
    note.textContent = 'Custom terms for larger practices'; per.textContent = '';
  } else {
    const p = bestFor(n), c = cost(p, n);
    plan.textContent = p.name; price.textContent = c ? inr(c) + (yearly ? '/yr' : '/mo') : 'Free';
    note.textContent = p.extra ? `${p.people} people included${n > p.people ? ` + ${n - p.people} extra` : ''}` : 'For one architect';
    per.textContent = c ? `${inr(c / n / (yearly ? 12 : 1))} a person a month` : '';
  }
  renderPlans(n);
}
document.getElementById('sched').innerHTML = ROWS.map(r => r.length === 1
  ? `<tr class="grp"><th colspan="5" scope="rowgroup">${r[0]}</th></tr>`
  : `<tr class="${r[1] === 9 ? 'soon' : ''}"><th scope="row">${r[0]}</th>${[0, 1, 2, 3].map(i =>
      r[1] === 9 ? '<td>Soon</td>'
      : i === 0 && r[2] ? `<td class="y">${r[2]}</td>`
      : i >= r[1] ? '<td class="y"><span aria-hidden="true">●</span><span class="sr">Included</span></td>'
      : '<td class="n"><span aria-hidden="true">—</span><span class="sr">Not included</span></td>').join('')}</tr>`).join('');
document.getElementById('people').addEventListener('input', renderCalc);
for (const [id, y] of [['b-month', false], ['b-year', true]]) document.getElementById(id).addEventListener('click', () => {
  yearly = y;
  document.getElementById('b-month').setAttribute('aria-pressed', String(!y));
  document.getElementById('b-year').setAttribute('aria-pressed', String(y));
  renderCalc();
});
renderCalc();

// ---- Referral countdown (section hides itself once the offer has ended) ----
(() => {
  const left = Math.ceil((new Date('2026-12-31T23:59:59') - new Date()) / 864e5);
  if (left < 0) { document.getElementById('refer').hidden = true; document.querySelectorAll('a[href="#refer"]').forEach(a => a.remove()); return; }
  document.getElementById('offer-left').textContent = `Ends 31 Dec 2026 · ${left} day${left === 1 ? '' : 's'} left`;
})();

// ---- Reveal sections as they scroll in ----
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.sec .wrap > *:not(.sec-h)').forEach(el => { el.classList.add('reveal'); io.observe(el); });
}
