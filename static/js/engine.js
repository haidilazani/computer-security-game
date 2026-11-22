/* ============================================================
   CyberQuest engine — level select, tutorial, question types,
   scoring, results. Game content lives in static/js/games/*.js
   which sets window.GAME_DEF.
   ============================================================ */
window.CQEngine = (function () {
  'use strict';

  const stage = () => document.getElementById('stage');
  const state = {
    level: null,        // current level index (0-based)
    qIndex: 0,
    correct: 0,
    total: 0,
    streak: 0,
    bestStreak: 0,
    progress: {},       // level(1-based) -> {stars, score}
  };

  /* ---------------------------------------------------------- utils */
  function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    for (const c of children) {
      if (c == null) continue;
      el.append(c.nodeType ? c : document.createTextNode(c));
    }
    return el;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  async function api(path, body) {
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return await res.json();
    } catch (e) {
      return { error: String(e) };
    }
  }

  /* ---------------------------------------------------------- tutorial */
  const tut = { slide: 0, onClose: null };

  function openTutorial(onClose) {
    const def = window.GAME_DEF.tutorial;
    tut.slide = 0;
    tut.onClose = onClose || null;
    document.getElementById('tutTitle').textContent = def.title;
    const dots = document.getElementById('tutDots');
    dots.innerHTML = '';
    def.slides.forEach(() => dots.append(h('span')));
    renderTutSlide();
    document.getElementById('tutorialModal').classList.remove('hidden');
  }

  function renderTutSlide() {
    const def = window.GAME_DEF.tutorial;
    document.getElementById('tutBody').innerHTML = def.slides[tut.slide];
    [...document.getElementById('tutDots').children].forEach(
      (d, i) => d.classList.toggle('on', i === tut.slide)
    );
    document.getElementById('tutPrev').style.visibility = tut.slide === 0 ? 'hidden' : 'visible';
    document.getElementById('tutNext').textContent =
      tut.slide === def.slides.length - 1 ? 'Start playing →' : 'Next →';
  }

  function closeTutorial(skipped) {
    document.getElementById('tutorialModal').classList.add('hidden');
    api('/api/tutorial-seen', { game_id: CQ.gameId });
    api('/api/activity', {
      action: 'tutorial',
      detail: `${CQ.gameTitle} — tutorial ${skipped ? 'skipped' : 'completed'}`,
    });
    if (tut.onClose) { const f = tut.onClose; tut.onClose = null; f(); }
  }

  function wireTutorial() {
    document.getElementById('tutNext').onclick = () => {
      if (tut.slide < window.GAME_DEF.tutorial.slides.length - 1) {
        tut.slide++; renderTutSlide();
      } else closeTutorial(false);
    };
    document.getElementById('tutPrev').onclick = () => {
      if (tut.slide > 0) { tut.slide--; renderTutSlide(); }
    };
    document.getElementById('tutSkip').onclick = () => closeTutorial(true);
    document.getElementById('btnTutorial').onclick = () => openTutorial();
  }

  /* ---------------------------------------------------------- level select */
  function unitCount(q) {
    if (q.type === 'sort') return q.items.length;
    if (q.type === 'match') return q.pairs.length;
    if (q.type === 'custom') return q.units || 1;
    return 1;
  }

  function levelUnlocked(i) { // 0-based
    return i === 0 || !!state.progress[i]; // progress keyed 1-based: level i unlocked if level i (1-based i) done
  }

  function showLevelSelect() {
    const def = window.GAME_DEF;
    const grid = h('div', { class: 'level-grid' });
    def.levels.forEach((lv, i) => {
      const done = state.progress[i + 1];
      const locked = !levelUnlocked(i);
      const stars = done ? done.stars : 0;
      const starsHtml = [1, 2, 3].map(s =>
        `<span class="${s <= stars ? 'on' : 'off'}">★</span>`).join('');
      const card = h('button', {
        class: 'level-card' + (locked ? ' locked' : ''),
        onclick: () => { if (!locked) startLevel(i); },
      },
        h('div', { class: 'level-num' },
          `LEVEL ${String(i + 1).padStart(2, '0')}`,
          locked ? h('span', { class: 'level-lock' }, '🔒') : ''),
        h('h3', {}, lv.title),
        h('p', { class: 'level-desc' }, lv.desc),
        h('div', { class: 'level-stars', html: starsHtml }),
        done ? h('div', { class: 'level-best' }, `Best: ${done.score} pts`) :
          h('div', { class: 'level-best' }, locked ? 'Complete the previous level to unlock' : 'Not attempted'),
      );
      grid.append(card);
    });
    stage().innerHTML = '';
    stage().append(
      h('p', { class: 'eyebrow', style: 'text-align:center' }, '// Select a level'),
      grid
    );
  }

  /* ---------------------------------------------------------- play flow */
  let questions = [];

  function startLevel(i) {
    const def = window.GAME_DEF;
    const lv = def.levels[i];
    state.level = i;
    state.qIndex = 0;
    state.correct = 0;
    state.penalty = 0;
    state.streak = 0;
    state.bestStreak = 0;
    questions = typeof lv.questions === 'function' ? lv.questions() : lv.questions;
    state.total = questions.reduce((n, q) => n + unitCount(q), 0);
    state.earned = 0;
    api('/api/activity', { action: 'level_start', detail: `${CQ.gameTitle} — Level ${i + 1}: ${lv.title}` });

    // briefing card
    stage().innerHTML = '';
    const card = h('div', { class: 'q-card', style: 'text-align:center' },
      h('p', { class: 'q-type-tag' }, `LEVEL ${i + 1} BRIEFING`),
      h('h2', { style: 'font-size:22px;margin-bottom:8px' }, lv.title),
      h('p', { class: 'muted', style: 'max-width:520px;margin:0 auto' }, lv.brief || lv.desc),
      h('div', { class: 'widget-actions', style: 'justify-content:center;margin-top:24px' },
        h('button', { class: 'btn btn-ghost', onclick: showLevelSelect }, '← Levels'),
        h('button', { class: 'btn btn-primary', onclick: renderQuestion }, 'Begin →'),
      ),
    );
    stage().append(card);
  }

  function hud() {
    const donePct = Math.round(
      questions.slice(0, state.qIndex).reduce((n, q) => n + unitCount(q), 0) / state.total * 100
    );
    return h('div', { class: 'hud' },
      h('span', {}, `Q ${Math.min(state.qIndex + 1, questions.length)}/${questions.length}`),
      h('div', { class: 'hud-progress' }, h('div', { style: `width:${donePct}%` })),
      h('span', { class: 'hud-streak' }, state.streak >= 2 ? `🔥 ${state.streak} streak` : ''),
      h('span', { class: 'hud-score' }, `${scoreNow()} pts`),
      h('button', {
        class: 'btn btn-ghost btn-sm hud-quit',
        onclick: () => { if (confirm('Abandon this run? Progress in this level will be lost.')) showLevelSelect(); },
      }, 'Quit'),
    );
  }

  function scoreNow() {
    return Math.round(300 * state.correct / (state.total + (state.penalty || 0)));
  }

  function registerResult(ok) {
    if (ok) { state.correct++; state.streak++; state.bestStreak = Math.max(state.bestStreak, state.streak); }
    else state.streak = 0;
  }

  // Extra miss on top of the fixed unit total (used by match: each wrong
  // pairing lowers accuracy even though every pair ends up matched).
  function penalize() {
    state.penalty++;
    state.streak = 0;
  }

  function nextQuestion() {
    state.qIndex++;
    if (state.qIndex >= questions.length) showResults();
    else renderQuestion();
  }

  function renderQuestion() {
    const q = questions[state.qIndex];
    stage().innerHTML = '';
    stage().append(hud());
    const card = h('div', { class: 'q-card' });
    stage().append(card);
    RENDERERS[q.type](q, card);
  }

  /* feedback block shared by renderers */
  function showFeedback(card, ok, explain, onContinue, correctLabel) {
    const fb = h('div', { class: 'feedback ' + (ok ? 'good' : 'bad') },
      h('div', { class: 'feedback-verdict' },
        ok ? '✓ CORRECT' + (state.streak >= 3 ? ` — ${state.streak} in a row!` : '')
           : '✗ ' + (correctLabel ? `INCORRECT — answer: ${correctLabel}` : 'INCORRECT')),
      h('div', { class: 'feedback-expl', html: explain || '' }),
      h('button', { class: 'btn btn-primary', onclick: onContinue }, 'Continue →'),
    );
    card.append(fb);
    fb.querySelector('.btn').focus();
    fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------------------------------------------------------- renderers */
  const RENDERERS = {

    mc(q, card) {
      card.append(h('p', { class: 'q-type-tag' }, q.tag || 'Multiple choice'));
      card.append(h('p', { class: 'q-prompt' }, q.prompt));
      if (q.scenario) card.append(h('div', { class: 'q-scenario', html: q.scenario }));

      const order = q.noShuffle ? q.choices.map((_, i) => i) : shuffle(q.choices.map((_, i) => i));
      const wrap = h('div', { class: 'choices' + (q.choices.every(c => c.length < 30) && q.choices.length === 4 ? ' two-col' : '') });
      const btns = [];
      order.forEach((origIdx, pos) => {
        const b = h('button', { class: 'choice' },
          h('kbd', {}, pos + 1), q.choices[origIdx]);
        b.onclick = () => pick(origIdx, b);
        btns.push(b);
        wrap.append(b);
      });
      card.append(wrap);

      const keyHandler = (e) => {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= btns.length) btns[n - 1].click();
      };
      document.addEventListener('keydown', keyHandler);

      function pick(origIdx, btn) {
        document.removeEventListener('keydown', keyHandler);
        btns.forEach(b => { b.disabled = true; if (b !== btn) b.classList.add('dim'); });
        const ok = origIdx === q.answer;
        registerResult(ok);
        btn.classList.add(ok ? 'correct' : 'wrong');
        if (!ok) {
          const rightPos = order.indexOf(q.answer);
          btns[rightPos].classList.remove('dim');
          btns[rightPos].classList.add('correct');
        }
        showFeedback(card, ok, q.explain, () => { document.removeEventListener('keydown', keyHandler); nextQuestion(); });
      }
    },

    decision(q, card) {
      card.append(h('p', { class: 'q-type-tag' }, q.tag || 'Access decision'));
      card.append(h('p', { class: 'q-prompt' }, q.prompt));
      if (q.scenario) card.append(h('div', { class: 'q-scenario', html: q.scenario }));

      const row = h('div', { class: 'decision-row' });
      const mk = (key, cls, label) => {
        const b = h('button', { class: 'decision ' + cls }, label);
        b.onclick = () => {
          row.querySelectorAll('.decision').forEach(x => x.disabled = true);
          const ok = q.answer === key;
          registerResult(ok);
          b.classList.add(ok ? 'picked-right' : 'picked-wrong');
          showFeedback(card, ok, q.explain, nextQuestion,
            q.answer === 'allow' ? (q.allowLabel || 'ALLOW') : (q.denyLabel || 'DENY'));
        };
        return b;
      };
      row.append(
        mk('allow', 'decision-allow', q.allowLabel || '✓ ALLOW'),
        mk('deny', 'decision-deny', q.denyLabel || '✕ DENY'),
      );
      card.append(row);
    },

    sort(q, card) {
      let idx = 0;
      const items = q.shuffleItems === false ? q.items.slice() : shuffle(q.items);

      card.append(h('p', { class: 'q-type-tag' }, q.tag || 'Classify'));
      card.append(h('p', { class: 'q-prompt' }, q.prompt));
      const counter = h('p', { class: 'muted', style: 'font-family:var(--mono);font-size:12px' });
      const itemBox = h('div', { class: 'sort-item' });
      const cats = h('div', { class: 'sort-cats' });
      card.append(counter, itemBox, cats);

      q.cats.forEach((c) => {
        const b = h('button', { class: 'choice', style: 'text-align:center;font-weight:600' }, c);
        b.onclick = () => pick(c, b);
        cats.append(b);
      });

      function render() {
        counter.textContent = `Item ${idx + 1} of ${items.length}`;
        itemBox.textContent = items[idx].text;
        cats.querySelectorAll('.choice').forEach(b => {
          b.disabled = false;
          b.classList.remove('correct', 'wrong', 'dim');
        });
        card.querySelector('.feedback')?.remove();
      }

      function pick(cat, btn) {
        cats.querySelectorAll('.choice').forEach(b => b.disabled = true);
        const ok = cat === items[idx].cat;
        registerResult(ok);
        btn.classList.add(ok ? 'correct' : 'wrong');
        if (!ok) {
          [...cats.querySelectorAll('.choice')]
            .find(b => b.textContent === items[idx].cat)?.classList.add('correct');
        }
        const explain = items[idx].explain || '';
        showFeedback(card, ok, explain, () => {
          idx++;
          if (idx >= items.length) nextQuestion();
          else render();
        }, items[idx].cat);
      }

      render();
    },

    order(q, card) {
      card.append(h('p', { class: 'q-type-tag' }, q.tag || 'Put in order'));
      card.append(h('p', { class: 'q-prompt' }, q.prompt));
      if (q.scenario) card.append(h('div', { class: 'q-scenario', html: q.scenario }));
      card.append(h('p', { class: 'muted', style: 'font-size:12.5px;margin-top:6px' },
        'Click the steps in the correct order. Click a picked step to un-pick it.'));

      const display = shuffle(q.items.map((_, i) => i));
      const list = h('div', { class: 'order-list' });
      card.append(list);
      const picked = []; // original indices in click order
      const rows = [];

      display.forEach(origIdx => {
        const badge = h('span', { class: 'order-badge' }, '•');
        const row = h('button', { class: 'order-item' }, badge, q.items[origIdx]);
        row.onclick = () => toggle(origIdx, row, badge);
        rows.push({ row, badge, origIdx });
        list.append(row);
      });

      const check = h('button', { class: 'btn btn-primary', disabled: 'true' }, 'Check order');
      card.append(h('div', { class: 'widget-actions' }, check));

      function toggle(origIdx, row, badge) {
        const at = picked.indexOf(origIdx);
        if (at === -1) {
          picked.push(origIdx);
          row.classList.add('picked');
        } else {
          picked.splice(at, 1);
          row.classList.remove('picked');
        }
        rows.forEach(r => {
          const p = picked.indexOf(r.origIdx);
          r.badge.textContent = p === -1 ? '•' : String(p + 1);
        });
        check.disabled = picked.length !== q.items.length;
      }

      check.onclick = () => {
        rows.forEach(r => r.row.disabled = true);
        check.disabled = true;
        const ok = picked.every((orig, pos) => orig === pos);
        registerResult(ok);
        rows.forEach(r => {
          const pos = picked.indexOf(r.origIdx);
          r.row.classList.add(pos === r.origIdx ? 'ok' : 'bad');
          r.badge.textContent = String(r.origIdx + 1); // reveal true order
        });
        showFeedback(card, ok,
          (ok ? '' : `<p style="margin-bottom:8px">Correct order: <strong>${q.items.map(esc).join(' → ')}</strong></p>`) + (q.explain || ''),
          nextQuestion);
      };
    },

    match(q, card) {
      card.append(h('p', { class: 'q-type-tag' }, q.tag || 'Match the pairs'));
      card.append(h('p', { class: 'q-prompt' }, q.prompt));
      card.append(h('p', { class: 'muted', style: 'font-size:12.5px;margin-top:6px' },
        'Click an item on the left, then its match on the right.'));

      const leftOrder = shuffle(q.pairs.map((_, i) => i));
      const rightOrder = shuffle(q.pairs.map((_, i) => i));
      const grid = h('div', { class: 'match-grid' });
      const colL = h('div', { class: 'match-col' });
      const colR = h('div', { class: 'match-col' });
      grid.append(colL, colR);
      card.append(grid);

      let selectedL = null;   // {idx, el}
      let matched = 0;
      let errors = 0;

      leftOrder.forEach(i => {
        const el = h('button', { class: 'match-item' }, q.pairs[i][0]);
        el.onclick = () => {
          if (el.classList.contains('paired')) return;
          colL.querySelectorAll('.match-item').forEach(x => x.classList.remove('selected'));
          el.classList.add('selected');
          selectedL = { idx: i, el };
        };
        colL.append(el);
      });

      rightOrder.forEach(i => {
        const el = h('button', { class: 'match-item' }, q.pairs[i][1]);
        el.onclick = () => {
          if (el.classList.contains('paired') || !selectedL) return;
          if (selectedL.idx === i) {
            el.classList.add('paired', 'paired-ok');
            selectedL.el.classList.remove('selected');
            selectedL.el.classList.add('paired', 'paired-ok');
            registerResult(true);
            matched++;
            selectedL = null;
            if (matched === q.pairs.length) finish();
          } else {
            errors++;
            penalize();
            el.classList.add('flash-bad');
            setTimeout(() => el.classList.remove('flash-bad'), 350);
          }
        };
        colR.append(el);
      });

      function finish() {
        // matched units were already counted as correct; errors already counted as misses
        showFeedback(card, errors === 0,
          (errors === 0 ? 'Flawless matching.' : `You made ${errors} wrong pairing${errors > 1 ? 's' : ''} along the way.`) +
          (q.explain ? '<br><br>' + q.explain : ''),
          nextQuestion);
      }
    },

    custom(q, card) {
      RENDERERS._customApi = null;
      q.render(card, {
        h, shuffle, esc,
        correct: (n = 1) => { for (let k = 0; k < n; k++) registerResult(true); },
        wrong: (n = 1) => { for (let k = 0; k < n; k++) registerResult(false); },
        feedback: (ok, explain, cb, label) => showFeedback(card, ok, explain, cb || nextQuestion, label),
        next: nextQuestion,
      });
    },
  };

  /* ---------------------------------------------------------- results */
  async function showResults() {
    const def = window.GAME_DEF;
    const lv = def.levels[state.level];
    const attempted = state.total + (state.penalty || 0);
    const acc = state.correct / attempted;
    const stars = acc >= 0.85 ? 3 : acc >= 0.6 ? 2 : 1;
    const score = Math.round(300 * acc);

    const prev = state.progress[state.level + 1];
    const improved = !prev || score > prev.score;

    const res = await api('/api/progress', {
      game_id: CQ.gameId, level: state.level + 1, stars, score,
    });

    if (!prev || stars > prev.stars || score > prev.score) {
      state.progress[state.level + 1] = {
        stars: Math.max(stars, prev ? prev.stars : 0),
        score: Math.max(score, prev ? prev.score : 0),
      };
    }

    const starsHtml = [1, 2, 3].map(s =>
      `<span class="${s <= stars ? 'on' : 'off'}">★</span>`).join('');
    const msgs = {
      3: 'Outstanding. Exam-ready on this topic.',
      2: 'Solid work. One more run for full marks?',
      1: 'Level cleared — review the tutorial and try again for more stars.',
    };

    const hasNext = state.level + 1 < def.levels.length;
    stage().innerHTML = '';
    const box = h('div', { class: 'results' },
      h('p', { class: 'q-type-tag' }, 'LEVEL COMPLETE'),
      h('h2', {}, lv.title),
      h('div', { class: 'results-stars', html: starsHtml }),
      h('p', { class: 'results-score', html: `<strong>${score}</strong> / 300 pts &nbsp;·&nbsp; ${state.correct}/${attempted} correct &nbsp;·&nbsp; best streak ${state.bestStreak}` }),
      h('p', { class: 'results-msg' }, msgs[stars] + (improved ? '' : ' (Previous best kept.)')),
      h('div', { class: 'results-actions' },
        h('button', { class: 'btn btn-ghost', onclick: () => startLevel(state.level) }, '↻ Replay'),
        h('button', { class: 'btn btn-ghost', onclick: showLevelSelect }, 'Levels'),
        hasNext
          ? h('button', { class: 'btn btn-primary', onclick: () => startLevel(state.level + 1) }, 'Next level →')
          : h('a', { class: 'btn btn-primary', href: '/dashboard' }, 'Back to missions →'),
      ),
    );
    if (res && res.stats) {
      box.append(h('p', { class: 'muted', style: 'margin-top:20px;font-family:var(--mono);font-size:12px' },
        `Total: ${res.stats.xp} XP · rank ${res.stats.rank}`));
    }
    stage().append(box);
  }

  /* ---------------------------------------------------------- boot */
  function boot() {
    // progress from server: {"1": {stars, score}, ...}
    for (const [k, v] of Object.entries(CQ.progress || {})) state.progress[parseInt(k, 10)] = v;
    wireTutorial();
    api('/api/activity', { action: 'game_start', detail: `${CQ.gameTitle} — mission opened` });
    showLevelSelect();
    if (!CQ.tutorialSeen) openTutorial();
  }

  return { boot, h, shuffle, esc };
})();
