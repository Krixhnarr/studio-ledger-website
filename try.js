/* Try it page (try.html): three small demos with sample data, nothing sent anywhere.
   01 check in · 02 check a drawing · 03 work out a salary. The tabs follow the
   address (#checkin, #drawing, #salary) so the email's buttons open the right one. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- tabs ---------------- */
  var tabs = $$('#ty-tabs [role="tab"]');
  var ids = tabs.map(function (t) { return t.getAttribute('aria-controls'); });

  function select(id, opts) {
    if (ids.indexOf(id) < 0) return;
    opts = opts || {};
    tabs.forEach(function (t) {
      var on = t.getAttribute('aria-controls') === id;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (opts.hash !== false && history.replaceState) history.replaceState(null, '', '#' + id);
    if (opts.scroll) {
      var top = $('#ty-tabs').getBoundingClientRect().top + window.pageYOffset - 96;
      window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
    }
    if (opts.focus) tabs[ids.indexOf(id)].focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(ids[i]); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') n = (i + 1) % ids.length;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') n = (i - 1 + ids.length) % ids.length;
      else if (k === 'Home') n = 0;
      else if (k === 'End') n = ids.length - 1;
      if (n === null) return;
      e.preventDefault();
      select(ids[n], { focus: true });
    });
  });
  $$('[data-goto]').forEach(function (b) {
    b.addEventListener('click', function () { select(b.dataset.goto, { scroll: true }); });
  });
  function fromHash() {
    var h = (location.hash || '').slice(1);
    if (ids.indexOf(h) >= 0) select(h, { hash: false, scroll: true });
  }
  fromHash();
  window.addEventListener('hashchange', fromHash);

  /* ---------------- 01 · check in ---------------- */
  var ci = {
    btn: $('#ci-btn'), time: $('#ci-time'), ampm: $('#ci-ampm'), msg: $('#ci-msg'),
    move: $('#ci-move'), done: $('#ci-done'), you: $('#ci-you'), pill: $('#ci-you-pill'), count: $('#ci-count'),
    state: 'idle', mins: 9 * 60 + 24
  };
  var START_MSG = ci.msg.innerHTML;

  function clock(m) {
    var h = Math.floor(m / 60), mm = m % 60;
    ci.time.textContent = (h % 12 || 12) + ':' + (mm < 10 ? '0' : '') + mm;
    ci.ampm.textContent = h >= 12 ? 'pm' : 'am';
  }
  function fmt(m) {
    var h = Math.floor(m / 60), mm = m % 60;
    return (h % 12 || 12) + ':' + (mm < 10 ? '0' : '') + mm + (h >= 12 ? ' pm' : ' am');
  }
  function runClock(to, done) {
    var from = ci.mins;
    if (reduce) { ci.mins = to; clock(to); done(); return; }
    var t0 = null, dur = 900, ended = false;
    var end = function () { if (ended) return; ended = true; ci.mins = to; clock(to); done(); };
    function step(ts) {
      if (ended) return;
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      clock(Math.round(from + (to - from) * e));
      if (p < 1) requestAnimationFrame(step); else end();
    }
    requestAnimationFrame(step);
    setTimeout(end, dur + 400);
  }
  function setPill(text, cls) {
    ci.pill.textContent = text;
    ci.pill.className = 'ty-pill' + (cls ? ' ' + cls : '');
    ci.you.classList.remove('flash'); void ci.you.offsetWidth; ci.you.classList.add('flash');
  }
  function pressWhere(where) {
    $$('#ci-move [data-where]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.where === where ? 'true' : 'false'); });
  }

  ci.btn.addEventListener('click', function () {
    if (ci.state === 'idle') {
      ci.state = 'in';
      ci.msg.innerHTML = 'Checked in at <b>9:24 am</b>, on time. The studio can see you’re in.';
      ci.btn.textContent = 'Check out';
      ci.btn.classList.add('is-out');
      ci.move.hidden = false;
      setPill('In office · 9:24', 'is-in');
      ci.count.textContent = '4 of 6 in';
    } else if (ci.state === 'in') {
      ci.state = 'out';
      ci.btn.disabled = true;
      runClock(18 * 60 + 52, function () {
        ci.msg.innerHTML = 'Checked out at <b>6:52 pm</b>. 9 h 28 m, less the lunch hour: <b>8 h 28 m worked</b>, 28 minutes past the regular day.';
        ci.btn.hidden = true;
        ci.btn.disabled = false;
        ci.move.hidden = true;
        ci.done.hidden = false;
        setPill('Checked out · 6:52 pm', 'is-gone');
        ci.count.textContent = '3 of 6 in';
        $('#ci-done .ty-linkbtn').focus();
      });
    }
  });
  $$('#ci-move [data-where]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (ci.state !== 'in') return;
      var w = b.dataset.where;
      pressWhere(w);
      var go = function () {
        if (w === 'site') { ci.msg.innerHTML = 'Moved to <b>site · Villa, Kasauli</b> at ' + fmt(ci.mins) + '. The office can see where you are.'; setPill('On site · Villa, Kasauli', 'is-site'); }
        else if (w === 'remote') { ci.msg.innerHTML = 'Working <b>from home</b> since ' + fmt(ci.mins) + '. It still counts as a day worked.'; setPill('From home', 'is-remote'); }
        else { ci.msg.innerHTML = 'Back <b>in the office</b> at ' + fmt(ci.mins) + '.'; setPill('In office · 9:24', 'is-in'); }
      };
      if (ci.mins < 11 * 60 + 10) runClock(11 * 60 + 10, go); else go();
    });
  });
  $('#ci-reset').addEventListener('click', function () {
    ci.state = 'idle'; ci.mins = 9 * 60 + 24; clock(ci.mins);
    ci.msg.innerHTML = START_MSG;
    ci.btn.hidden = false; ci.btn.textContent = 'Check in'; ci.btn.classList.remove('is-out');
    ci.move.hidden = true; ci.done.hidden = true; pressWhere('office');
    ci.pill.textContent = 'Not in yet'; ci.pill.className = 'ty-pill';
    ci.count.textContent = '3 of 6 in';
    ci.btn.focus();
  });

  /* ---------------- 02 · check a drawing ---------------- */
  var dw = { run: $('#dw-run'), status: $('#dw-status'), scan: $('#dw-scan'), out: $('#dw-out'), score: $('#dw-score'), verdict: $('#dw-verdict'), fixed: {}, checked: false, busy: false, shown: 0 };
  var rows = $$('#dw-panel .ty-rules li');
  var FIXED_TEXT = { checked: 'AR', door: 'all tagged', stair: 'UP · 16 R' };
  rows.forEach(function (li) {
    /* put the rule name and its detail in one box, so a long name wraps beside the Fix button */
    var box = document.createElement('span');
    box.className = 'ty-rl';
    var ic = li.querySelector('.ty-ic');
    while (ic.nextSibling && !(ic.nextSibling.classList && ic.nextSibling.classList.contains('ty-fix'))) box.appendChild(ic.nextSibling);
    ic.after(box);
    if (!li.dataset.issue) return;
    li.dataset.was = li.querySelector('small').textContent;
    var lvl = document.createElement('span');
    lvl.className = 'ty-lvl';
    lvl.textContent = li.dataset.level;
    li.insertBefore(lvl, li.querySelector('.ty-fix'));
  });
  var issues = rows.filter(function (li) { return li.dataset.issue; });

  function open() { return issues.filter(function (li) { return !dw.fixed[li.dataset.issue]; }); }
  function scoreNow() {
    return open().reduce(function (sc, li) { return sc - (li.dataset.level === 'MUST' ? 10 : 5); }, 100);
  }
  function countTo(n) {
    var from = dw.shown;
    if (reduce || from === n) { dw.score.textContent = n; dw.shown = n; return; }
    var t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / 600);
      dw.score.textContent = Math.round(from + (n - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step); else dw.shown = n;
    }
    requestAnimationFrame(step);
    /* a background tab may never run the animation frames: land on the right number anyway */
    setTimeout(function () { if (dw.shown !== n) { dw.score.textContent = n; dw.shown = n; } }, 700);
  }
  function verdict() {
    var left = open(), must = left.some(function (li) { return li.dataset.level === 'MUST'; });
    countTo(scoreNow());
    dw.verdict.classList.toggle('is-ok', !must);
    if (!left.length) {
      dw.verdict.textContent = 'Meets your studio standards. The sheet goes to the project architect for review.';
      dw.status.textContent = 'Meets standards'; dw.status.className = 'ty-status v2-mono is-ok';
      dw.run.textContent = 'Start again';
    } else if (must) {
      dw.verdict.textContent = 'A MUST rule fails, so this sheet goes back to its author with the fix list. Press Fix to sort it.';
      dw.status.textContent = left.length + (left.length === 1 ? ' problem' : ' problems'); dw.status.className = 'ty-status v2-mono is-bad';
    } else {
      dw.verdict.textContent = 'No MUST rule fails, so the sheet can go to the project architect, who sees the open SHOULD points.';
      dw.status.textContent = left.length + (left.length === 1 ? ' point open' : ' points open'); dw.status.className = 'ty-status v2-mono is-bad';
    }
  }
  function resetSheet() {
    dw.fixed = {}; dw.checked = false; dw.shown = 0;
    rows.forEach(function (li) { li.classList.remove('ok', 'bad'); if (li.dataset.was) li.querySelector('small').textContent = li.dataset.was; });
    $$('#dw .q-fix').forEach(function (g) { g.classList.remove('on'); });
    $$('#dw .q-iss').forEach(function (g) { g.classList.remove('on', 'fixed'); });
    $('#dw .q-empty').classList.remove('off');
    dw.out.hidden = true;
    dw.status.textContent = 'Not checked'; dw.status.className = 'ty-status v2-mono';
    dw.run.textContent = 'Check this sheet';
  }
  function runCheck() {
    if (dw.busy) return;
    if (dw.checked && !open().length) { resetSheet(); return; }
    dw.busy = true; dw.run.disabled = true;
    rows.forEach(function (li) { li.classList.remove('ok', 'bad'); });
    $$('#dw .q-iss').forEach(function (g) { g.classList.remove('on'); });
    dw.status.textContent = 'Checking…'; dw.status.className = 'ty-status v2-mono is-run';
    dw.scan.classList.remove('run'); void dw.scan.getBoundingClientRect(); dw.scan.classList.add('run');
    setTimeout(function () { dw.scan.classList.remove('run'); }, 1800);
    var gap = reduce ? 0 : 140;
    rows.forEach(function (li, i) {
      setTimeout(function () {
        var bad = li.dataset.issue && !dw.fixed[li.dataset.issue];
        li.classList.add(bad ? 'bad' : 'ok');
      }, 200 + i * gap);
    });
    setTimeout(function () {
      issues.forEach(function (li) {
        var g = $('#dw .q-iss[data-issue="' + li.dataset.issue + '"]');
        g.classList.add('on'); g.classList.toggle('fixed', !!dw.fixed[li.dataset.issue]);
      });
      dw.out.hidden = false; dw.checked = true; dw.busy = false; dw.run.disabled = false;
      dw.run.textContent = 'Check again';
      verdict();
    }, 300 + rows.length * gap);
  }
  dw.run.addEventListener('click', runCheck);
  $$('#dw-panel .ty-fix').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.dataset.fix, li = b.closest('li');
      dw.fixed[k] = true;
      li.classList.remove('bad'); li.classList.add('ok');
      li.querySelector('small').textContent = FIXED_TEXT[k];
      $$('#dw .q-fix[data-fixed="' + k + '"]').forEach(function (g) { g.classList.add('on'); });
      if (k === 'checked') $('#dw .q-empty').classList.add('off');
      $('#dw .q-iss[data-issue="' + k + '"]').classList.add('fixed');
      verdict();
      var next = $('#dw-panel li.bad .ty-fix');
      (next || dw.run).focus();
    });
  });

  /* ---------------- 03 · salary ---------------- */
  var s = { base: $('#s-base'), leave: $('#s-leave'), absent: $('#s-absent'), ot: $('#s-ot'), sat: $('#s-sat') };
  var Y = 2026, M = 10; /* November 2026 */
  var DAYS = new Date(Y, M + 1, 0).getDate();
  var rupee = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  var rupee2 = function (n) { return '₹' + (Math.round(n * 100) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 }); };
  var half = function (n) { var w = Math.floor(n); return n % 1 ? (w ? w : '') + '½' : String(w); };
  var dayWord = function (n) { return half(n) + (n === 1 ? ' day' : ' days'); };

  function fill(input) {
    var p = (input.value - input.min) / (input.max - input.min) * 100;
    input.style.setProperty('--p', p + '%');
  }
  function calc() {
    var base = +s.base.value, leave = +s.leave.value, absent = +s.absent.value, ot = +s.ot.value, sat = s.sat.checked;
    [s.base, s.leave, s.absent, s.ot].forEach(fill);
    $('#o-base').textContent = rupee(base);
    $('#o-leave').textContent = dayWord(leave);
    $('#o-absent').textContent = dayWord(absent);
    $('#o-ot').textContent = ot + (ot === 1 ? ' hour' : ' hours');

    var work = [];
    for (var d = 1; d <= DAYS; d++) {
      var wd = new Date(Y, M, d).getDay();
      if (wd !== 0 && (sat || wd !== 6)) work.push(d);
    }
    /* sample placement: leave from the 10th, missed days from the 24th */
    var mark = {};
    var fromLeave = work.filter(function (x) { return x >= 10; });
    for (var i = 0; i < Math.ceil(leave); i++) mark[fromLeave[i]] = (i + 1 > leave) ? 'half' : 'leave';
    var fromAbsent = work.filter(function (x) { return x >= 24 && !mark[x]; });
    for (var j = 0; j < absent; j++) mark[fromAbsent[j]] = 'absent';

    var wdays = work.length, dayPay = base / wdays, payable = wdays - leave - absent;
    var hour = dayPay / 8, otPay = ot * hour * 1.5, daysPay = dayPay * payable, total = daysPay + otPay;

    $('#p-total').textContent = rupee(total);
    var lines = [
      ['Working days in November', wdays + (sat ? ' (Mon–Sat)' : ' (Mon–Fri)')],
      ['One day’s pay', rupee(base) + ' ÷ ' + wdays + ' = ' + rupee2(dayPay)],
      ['Days payable', wdays + ' − ' + half(leave) + ' leave − ' + absent + ' missed = ' + half(payable), leave + absent ? 'is-minus' : ''],
      ['Pay for those days', rupee(daysPay)],
      ['Overtime', ot ? ot + ' h × ' + rupee2(hour) + ' × 1.5 = ' + rupee(otPay) : 'none']
    ];
    $('#p-break').innerHTML = lines.map(function (r) {
      return '<div' + (r[2] ? ' class="' + r[2] + '"' : '') + '><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>';
    }).join('');

    var cal = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(function (h) { return '<span class="h">' + h + '</span>'; });
    var lead = (new Date(Y, M, 1).getDay() + 6) % 7;
    for (var e = 0; e < lead; e++) cal.push('<span class="e"></span>');
    for (var k = 1; k <= DAYS; k++) {
      var cls = work.indexOf(k) < 0 ? 'off' : (mark[k] || 'work');
      cal.push('<span class="' + cls + '">' + k + '</span>');
    }
    $('#p-cal').innerHTML = cal.join('');
  }
  ['base', 'leave', 'absent', 'ot'].forEach(function (k) { s[k].addEventListener('input', calc); });
  s.sat.addEventListener('change', calc);
  calc();
})();
