/* COUCH+ · vista de alumno */
function StudentApp({ view, go, sess }) {
  useStore();
  const s = Q.student(sess.id); if (!s) return null;
  if (view === 'train') return html`<${StudentTrain} s=${s} go=${go} />`;
  if (view === 'diet') return html`<${StudentDiet} s=${s} />`;
  if (view === 'progress') return html`<div class="page"><${StudentProgressHead} s=${s} /><${ProgressPanel} st=${s} role="student" /><section class="card"><div class="card-h"><h2>Mis revisiones</h2></div><${ReviewList} st=${s} /></section></div>`;
  if (view === 'cart') return html`<${StudentCart} s=${s} />`;
  return html`<${StudentHome} s=${s} go=${go} />`;
}

function setMeal(s, date, mealId, val, reason) {
  const id = `${s.id}_${date}`; const cur = Store.get('meals', id);
  const o = cur ? clone(cur) : { id, studentId: s.id, trainerId: s.trainerId, date, checks: {}, reasons: {} };
  o.trainerId = s.trainerId;
  o.checks = o.checks || {}; o.reasons = o.reasons || {};
  if (val) o.checks[mealId] = val; else delete o.checks[mealId];
  if (reason != null) o.reasons[mealId] = reason; else if (val !== 'skip') delete o.reasons[mealId];
  Store.put('meals', o);
}
function TodayMeals({ s, date = today() }) {
  const pm = dietDay(s, dow(date)); const log = Q.meal(s.id, date); const ch = log?.checks || {};
  const planned = pm.filter(x => slotHas(x.slot));
  if (!planned.length) return html`<${Empty} icon="food" title="Sin comidas para hoy" text="Tu entrenador aún no asigna la dieta de este día." />`;
  const done = planned.filter(x => ch[x.meal.id] === 'done').length;
  const skip = async m => {
    const r = await confirmBox({ title: `¿Omitir ${m.name.toLowerCase()}?`, text: 'Contará como comida no cumplida y tu entrenador lo verá.', ok: 'Omitir comida', danger: true, input: { label: 'Motivo (opcional)', placeholder: 'Ej. No tuve tiempo' } });
    if (r) setMeal(s, date, m.id, 'skip', typeof r === 'string' ? r : '');
  };
  return html`<div class="tmeals">
    <div class="row between mb"><span class="muted sm">${done} de ${planned.length} comidas cumplidas</span><div class="mb-track w120"><div class="mb-fill good" style=${`width:${done / planned.length * 100}%`}></div></div></div>
    ${planned.map(({ meal, slot }) => { const v = ch[meal.id]; return html`<div class=${'tmeal ' + (v || '')}>
      <button class="tm-check" aria-label=${v === 'done' ? 'Desmarcar comida' : 'Marcar como comida'} aria-pressed=${v === 'done'} onClick=${() => setMeal(s, date, meal.id, v === 'done' ? null : 'done')}>${v === 'done' ? html`<${Ic} n="check" s=${18} w=${3} />` : v === 'skip' ? html`<${Ic} n="x" s=${18} w=${3} />` : ''}</button>
      <div class="tm-b"><div class="row between"><strong>${meal.name}</strong>${meal.time && html`<span class="muted sm">${meal.time}</span>`}</div><${SlotView} slot=${slot} />
        ${v === 'skip' && html`<p class="sm bad-t">Omitida${(log.reasons || {})[meal.id] ? ': “' + log.reasons[meal.id] + '”' : ''} <button class="link sm" onClick=${() => setMeal(s, date, meal.id, null)}>Deshacer</button></p>`}</div>
      ${!v && html`<button class="btn ghost sm" onClick=${() => skip(meal)}>Omitir</button>`}
    </div>`; })}
  </div>`;
}

function skipDay(s, idx) {
  const d = s.routine.days[idx];
  confirmBox({ title: '¿Estás seguro que deseas omitir el día?', text: `Día ${idx + 1} · ${d.name}. Tu entrenador lo verá en tu progreso.`, ok: 'Enviar a entrenador', danger: true, input: { label: '¿Por qué estás omitiendo el día?', required: true, placeholder: 'Cuéntale a tu entrenador el motivo' } })
    .then(r => { if (!r) return; Store.put('logs', { id: uid(), studentId: s.id, trainerId: s.trainerId, date: today(), ts: Date.now(), dayIdx: idx, dayName: `Día ${idx + 1} · ${d.name}`, routineVer: s.routine.ver || 0, status: 'skipped', reason: r }); toast('Enviado a tu entrenador'); });
}
function startWorkout(s, idx) { openModal(WorkoutPlayer, { s, idx }, { full: true }); }

function NextDayCard({ s, compact }) {
  const r = s.routine;
  if (!r || !(r.days || []).length) return html`<div class="card"><${Empty} icon="dumbbell" title="Sin rutina todavía" text="Cuando tu entrenador la asigne, aquí verás qué te toca." /></div>`;
  const idx = nextDayIdx(s); const d = r.days[idx];
  const todayLogs = Q.logs(s.id).filter(l => l.date === today());
  const doneToday = todayLogs.find(l => l.status === 'done');
  const saved = lsGet('wo.' + s.id);
  const est = Math.round((d.exercises || []).reduce((a, e) => a + e.sets * (45 + (e.rest || 60)), 0) / 60);
  return html`<section class="card nextday">
    <div class="nd-top"><${Plate} i=${idx} label=${'D' + (idx + 1)} size=${54} /><div class="li-main"><span class="eyebrow">${doneToday ? 'Próximo entrenamiento' : 'Hoy te toca'}</span><h2 class="nd-title">Día ${idx + 1} · ${d.name}</h2>
      <span class="muted sm">${(d.exercises || []).length} ejercicios · ~${est} min</span></div></div>
    ${doneToday && html`<div class="note good"><${Ic} n="check" s=${16} /> Hoy ya completaste ${doneToday.dayName}. ¡Bien hecho!</div>`}
    ${saved && saved.dayIdx === idx && html`<div class="note warn"><${Ic} n="clock" s=${16} /> Tienes este entrenamiento en curso.</div>`}
    ${!compact && html`<ol class="exlist tight">${(d.exercises || []).map((e, j) => html`<li><span class="exn">${j + 1}</span><div class="exm"><strong>${e.name}</strong></div><span class="exs">${e.sets} × ${e.reps}</span></li>`)}</ol>`}
    <div class="row gap-s wrap"><button class="btn primary big" disabled=${!(d.exercises || []).length} onClick=${() => startWorkout(s, idx)}><${Ic} n="play" s=${16} />${saved && saved.dayIdx === idx ? 'Continuar' : 'Comenzar'}</button><button class="btn ghost big" onClick=${() => skipDay(s, idx)}><${Ic} n="skip" s=${16} />Omitir día</button></div>
  </section>`;
}

function StudentHome({ s, go }) {
  const t = today();
  const notes = notifications({ role: 'student', id: s.id });
  const wk = stats(s, weekStart(t), t);
  const target = (s.routine?.days || []).length;
  const w = weightSeries(s.id);
  const rec = Q.logs(s.id).filter(l => l.status === 'done').slice(-4).reverse();
  const imps = rec.length ? improvements(s.id, rec[0].exercises || [], rec[0].ts).filter(x => x.kind === 'up').slice(0, 3) : [];
  const str = streak(s);
  return html`<div class="page">
    <div class="hello"><span class="eyebrow">${fmtLong(t)}</span><h1>Hola, ${s.nombres}</h1></div>
    ${notes.map(n => html`<div class=${'note ' + (n.kind === 'bad' ? 'bad' : n.kind === 'warn' ? 'warn' : 'info')}><${Ic} n=${n.kind === 'info' ? 'calendar' : 'wallet'} s=${16} /><span><strong>${n.title}.</strong> ${n.text}</span></div>`)}
    <div class="home-grid">
      <div class="stack-l">
        <${NextDayCard} s=${s} compact />
        <section class="card"><div class="card-h"><h2>Tu dieta de hoy · ${DIAS[dow(t)]}</h2><button class="btn ghost sm" onClick=${() => go('diet')}>Semana <${Ic} n="chevR" s=${14} /></button></div><${TodayMeals} s=${s} /></section>
      </div>
      <div class="stack-l">
        <section class="card"><div class="card-h"><h2>Esta semana</h2></div>
          <div class="rings"><div class="ring-box"><${Ring} pct=${target ? Math.min(100, Math.round(wk.done / target * 100)) : null} color="var(--c-blue)" label=${`${wk.done}/${target || '—'} días`} /><span>Entrenamiento</span></div>
            <div class="ring-box"><${Ring} pct=${wk.dietPct} color="var(--c-green)" label=${`${wk.ate}/${wk.planned}`} /><span>Dieta</span></div>
            <div class="ring-box streak"><div class="streak-n"><${Ic} n="flame" s=${22} /><strong>${str}</strong></div><span>${str === 1 ? 'día seguido' : 'días seguidos'}</span></div></div>
          ${wk.skipped + wk.skippedMeals > 0 && html`<p class="sm bad-t mt"><${Ic} n="alert" s=${14} /> ${wk.skipped ? wk.skipped + ' días omitidos' : ''}${wk.skipped && wk.skippedMeals ? ' · ' : ''}${wk.skippedMeals ? wk.skippedMeals + ' comidas omitidas' : ''} esta semana.</p>`}
        </section>
        <section class="card"><div class="card-h"><h2>Peso</h2>${w.length > 1 && html`<${Pill} k=${w[w.length - 1].y <= w[0].y ? 'good' : 'neutral'}>${w[w.length - 1].y - w[0].y > 0 ? '+' : ''}${numStr(round1(w[w.length - 1].y - w[0].y))} kg desde el inicio<//>`}</div><${LineChart} data=${w} unit="kg" h=${160} />
          <p class="muted sm">Próxima revisión: <strong>${s.nextReview ? fmtLong(s.nextReview) : 'por definir'}</strong></p></section>
        ${imps.length > 0 && html`<section class="card"><div class="card-h"><h2>Tus mejoras recientes</h2><${Ic} n="trophy" s=${18} /></div><ul class="list">${imps.map(i => html`<li class="li"><span class="dot good"></span><div class="li-main"><strong>${i.name}</strong><span class="muted sm">${i.txt} vs ${i.label}</span></div></li>`)}</ul></section>`}
      </div>
    </div>
  </div>`;
}

function StudentTrain({ s }) {
  const t = today(); const r = s.routine; const ws = weekStart(t);
  const wlogs = Q.logs(s.id).filter(l => l.date >= ws);
  const recent = Q.logs(s.id).slice(-6).reverse();
  return html`<div class="page">
    <${NextDayCard} s=${s} />
    ${r && (r.days || []).length > 0 && html`<section class="card"><div class="card-h"><h2>Tu semana</h2><span class="muted sm">Desde el ${fmtDs(ws)}</span></div>
      <div class="week-days">${r.days.map((d, i) => { const L = wlogs.filter(l => l.dayIdx === i && (l.routineVer || 0) === (r.ver || 0)); const st = L.some(l => l.status === 'done') ? 'good' : L.some(l => l.status === 'skipped') ? 'bad' : ''; return html`<div class=${'wd ' + st}><${Plate} i=${i} label=${'D' + (i + 1)} size=${36} /><strong>${d.name}</strong><small>${st === 'good' ? 'Completado' : st === 'bad' ? 'Omitido' : 'Pendiente'}</small></div>`; })}</div></section>`}
    <section class="card"><div class="card-h"><h2>Rutina completa</h2></div><${RoutineView} st=${s} highlightIdx=${nextDayIdx(s)} /></section>
    ${recent.length > 0 && html`<section class="card"><div class="card-h"><h2>Últimos registros</h2></div><div class="timeline">${recent.map(l => html`<${LogItem} l=${l} />`)}</div></section>`}
  </div>`;
}

function StudentDiet({ s }) {
  const [m, setM] = useState('hoy');
  return html`<div class="page"><div class="toolbar"><${Seg} options=${[{ k: 'hoy', label: 'Hoy' }, { k: 'semana', label: 'Semana' }]} value=${m} onChange=${setM} /><span class="muted">${m === 'hoy' ? fmtLong(today()) : 'Plan de lunes a domingo'}</span></div>
    <section class="card">${m === 'hoy' ? html`<div class="card-h"><h2>${DIAS[dow(today())]}</h2></div><${TodayMeals} s=${s} />` : html`<${DietWeek} st=${s} />`}</section></div>`;
}

function StudentProgressHead({ s }) {
  const lr = lastReview(s.id);
  return html`<div class="hello"><span class="eyebrow">Mi progreso</span><h1>${lr ? 'Última revisión: ' + fmtD(lr.date) : 'Aún sin revisiones'}</h1><p class="muted">Próxima revisión: ${s.nextReview ? fmtLong(s.nextReview) : 'por definir con tu entrenador'}</p></div>`;
}

/* ---------- Carrito de compras ---------- */
function StudentCart({ s }) {
  const t = today();
  const [mode, setMode] = useState('semana');
  const [anchor, setAnchor] = useState(t);
  const [month, setMonth] = useState(t.slice(0, 7));
  let dates, label, key;
  if (mode === 'dia') { dates = [anchor]; label = fmtLong(anchor); key = 'd' + anchor; }
  else if (mode === 'semana') { const ws = weekStart(anchor); dates = rangeDates(ws, addDays(ws, 6)); label = `${fmtDs(ws)} – ${fmtDs(addDays(ws, 6))}`; key = 'w' + ws; }
  else { const f = month + '-01'; dates = rangeDates(f, addDays(addMonths(f, 1), -1)); label = `${MESL[parseD(f).getMonth()]} ${f.slice(0, 4)}`; key = 'm' + month; }
  const list = shoppingList(s, dates);
  const [got, setGot] = useState(() => lsGet('cart.' + s.id + '.' + key) || {});
  useEffect(() => setGot(lsGet('cart.' + s.id + '.' + key) || {}), [key]);
  const tog = k => { const n = { ...got, [k]: !got[k] }; setGot(n); lsPut('cart.' + s.id + '.' + key, n); };
  const shift = d => setAnchor(addDays(anchor, mode === 'dia' ? d : d * 7));
  const txt = `Lista de compras COUCH+ (${label})\n` + list.map(i => `• ${i.name}: ${i.label}`).join('\n');
  const left = list.filter(i => !got[i.name + i.base]).length;
  return html`<div class="page">
    <div class="toolbar"><${Seg} options=${[{ k: 'dia', label: 'Día' }, { k: 'semana', label: 'Semana' }, { k: 'mes', label: 'Mes' }]} value=${mode} onChange=${setMode} />
      ${mode === 'mes' ? html`<input id="cart-month" type="month" class="sel" value=${month} onInput=${e => e.target.value && setMonth(e.target.value)} />`
        : html`<div class="stepnav"><button class="icon-btn" aria-label="Anterior" onClick=${() => shift(-1)}><${Ic} n="chevL" /></button><span>${label}</span><button class="icon-btn" aria-label="Siguiente" onClick=${() => shift(1)}><${Ic} n="chevR" /></button></div>`}
    </div>
    <section class="card">
      <div class="card-h"><div><h2>Lo que necesitas comprar</h2><span class="muted sm">${list.length ? `${left} de ${list.length} productos pendientes · según tu dieta` : ''}</span></div>${list.length > 0 && html`<${CopyBtn} text=${txt} label="Copiar lista" />`}</div>
      ${list.length ? html`<ul class="cart">${list.map(i => { const k = i.name + i.base; return html`<li class=${got[k] ? 'got' : ''}><label><input type="checkbox" checked=${!!got[k]} onChange=${() => tog(k)} /><span class="c-name">${i.name}</span></label><span class="c-days muted sm">${i.days.length === 7 ? 'Todos los días' : i.days.join(' · ')}</span><strong class="c-q">${i.label}</strong></li>`; })}</ul>`
        : html`<${Empty} icon="cart" title="Nada que comprar en este periodo" text="La lista se arma sola con las cantidades de tu dieta." />`}
    </section>
  </div>`;
}

/* ---------- Reproductor de entrenamiento ---------- */
const MOTIV = ['¡Excelente trabajo, {n}!', '¡Entrenamiento completado, {n}! Cada serie cuenta.', '¡Así se hace, {n}! Hoy fuiste más fuerte que tus excusas.', '¡Brutal, {n}! Tu constancia se nota.'];
let audioCtx = null;
function beep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.22, 0.44].forEach((t, i) => { const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.frequency.value = i === 2 ? 1046 : 784; g.gain.setValueAtTime(0.0001, audioCtx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + t + 0.18); o.connect(g); g.connect(audioCtx.destination); o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + 0.2); });
  } catch (e) {}
  try { navigator.vibrate && navigator.vibrate([200, 80, 200]); } catch (e) {}
}
function lastUsed(sid, name) {
  const h = exHistory(sid, name); if (!h.length) return null;
  const sets = h[h.length - 1].ex.sets; const l = sets[sets.length - 1];
  return { w: l.w, u: l.u || 'kg' };
}
function Stepper({ id, value, onChange, step = 1, label, decimals }) {
  const n = parseNum(value) || 0;
  return html`<div class="stepper-in"><span class="eyebrow">${label}</span><div class="sti"><button type="button" aria-label=${'Menos ' + label} onClick=${() => onChange(String(Math.max(0, decimals ? round1(n - step) : n - step)))}>−</button>
    <input id=${id} inputmode=${decimals ? 'decimal' : 'numeric'} value=${value} onInput=${e => onChange(e.target.value.replace(',', '.'))} /><button type="button" aria-label=${'Más ' + label} onClick=${() => onChange(String(decimals ? round1(n + step) : n + step))}>+</button></div></div>`;
}
function WorkoutPlayer({ close, s, idx }) {
  const day = s.routine.days[idx];
  const exs = day.exercises || [];
  const saved = lsGet('wo.' + s.id);
  const [W, setW] = useState(() => saved && saved.dayIdx === idx && saved.ver === (s.routine.ver || 0) ? saved : { dayIdx: idx, ver: s.routine.ver || 0, ex: 0, sets: {}, phase: 'work', restEnd: 0, started: Date.now(), skipped: {} });
  const [now, setNow] = useState(Date.now());
  const cur = exs[W.ex] || exs[0];
  const pre = useMemo(() => lastUsed(s.id, cur.name), [W.ex]);
  const [reps, setReps] = useState(String(parseInt(cur.reps) || ''));
  const [wt, setWt] = useState(pre ? String(pre.w) : '');
  const [unit, setUnit] = useState(pre ? pre.u : 'kg');
  const [finished, setFinished] = useState(null);
  const done = W.sets[W.ex] || [];
  useEffect(() => { lsPut('wo.' + s.id, W); }, [W]);
  useEffect(() => { const c = exs[W.ex]; if (!c) return; const p = lastUsed(s.id, c.name); const prevSets = W.sets[W.ex] || []; const lp = prevSets[prevSets.length - 1]; setReps(String(lp ? lp.reps : parseInt(c.reps) || '')); setWt(lp ? String(lp.w) : p ? String(p.w) : ''); setUnit(lp ? lp.u : p ? p.u : 'kg'); }, [W.ex]);
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(i); }, []);
  useEffect(() => { if (W.phase === 'rest' && now >= W.restEnd) { beep(); endRest(); } }, [now]);
  let wl = null; useEffect(() => { (async () => { try { wl = navigator.wakeLock && await navigator.wakeLock.request('screen'); } catch (e) {} })(); return () => { try { wl && wl.release(); } catch (e) {} }; }, []);
  function endRest() {
    setW(w => {
      if (w.phase !== 'rest') return w;
      const ds = w.sets[w.ex] || [];
      if (ds.length >= exs[w.ex].sets) { const nx = nextEx(w, w.ex); return nx < 0 ? { ...w, phase: 'summary' } : { ...w, ex: nx, phase: 'work' }; }
      return { ...w, phase: 'work' };
    });
  }
  function nextEx(w, from) { for (let k = from + 1; k < exs.length; k++) if ((w.sets[k] || []).length < exs[k].sets && !w.skipped[k]) return k; for (let k = 0; k < from; k++) if ((w.sets[k] || []).length < exs[k].sets && !w.skipped[k]) return k; return -1; }
  function register() {
    const r = parseInt(reps); if (!r || r < 1) { toast('Escribe las repeticiones que hiciste', 'bad'); return; }
    try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume && audioCtx.resume(); } catch (e) {}
    const set = { reps: r, w: parseNum(wt) || 0, u: unit };
    setW(w => {
      const ds = [...(w.sets[w.ex] || []), set]; const sets = { ...w.sets, [w.ex]: ds };
      const nw = { ...w, sets };
      const lastSet = ds.length >= exs[w.ex].sets; const nx = nextEx(nw, w.ex);
      if (lastSet && nx < 0) return { ...nw, phase: 'summary' };
      const rest = (exs[w.ex].rest || 0) * 1000;
      return rest > 0 ? { ...nw, phase: 'rest', restEnd: Date.now() + rest } : (lastSet ? { ...nw, ex: nx, phase: 'work' } : nw);
    });
  }
  const undo = () => setW(w => { const ds = (w.sets[w.ex] || []).slice(0, -1); return { ...w, sets: { ...w.sets, [w.ex]: ds }, phase: 'work' }; });
  const skipEx = () => setW(w => { const sk = { ...w.skipped, [w.ex]: true }; const nw = { ...w, skipped: sk }; const nx = nextEx(nw, w.ex); return nx < 0 ? { ...nw, phase: 'summary' } : { ...nw, ex: nx, phase: 'work' }; });
  const exit = async () => {
    const any = Object.values(W.sets).some(a => a.length);
    if (!any) { lsDel('wo.' + s.id); close(); return; }
    const r = await confirmBox({ title: '¿Salir del entrenamiento?', text: 'Tu avance queda guardado en este dispositivo para continuar después.', ok: 'Salir', cancel: 'Seguir entrenando' });
    if (r) close();
  };
  const exercisesLog = () => exs.map((e, i) => ({ name: e.name, target: { sets: e.sets, reps: e.reps, rest: e.rest }, sets: W.sets[i] || [] }));
  function finish() {
    const ts = Date.now();
    const log = { id: uid(), studentId: s.id, trainerId: s.trainerId, date: today(), ts, dayIdx: idx, dayName: `Día ${idx + 1} · ${day.name}`, routineVer: s.routine.ver || 0, status: 'done', exercises: exercisesLog(), duration: Math.round((ts - W.started) / 1000) };
    Store.put('logs', log); lsDel('wo.' + s.id); close(); toast('Entrenamiento guardado');
  }
  const summary = W.phase === 'summary';
  const imps = useMemo(() => summary ? improvements(s.id, exercisesLog(), Date.now()) : [], [summary]);
  const motiv = useMemo(() => MOTIV[Math.floor(Math.random() * MOTIV.length)].replace('{n}', s.nombres), []);
  const totalSets = exs.reduce((a, e) => a + e.sets, 0), doneSets = Object.values(W.sets).reduce((a, x) => a + x.length, 0);
  const vol = Object.values(W.sets).flat().reduce((a, x) => a + toKg(x.w, x.u) * x.reps, 0);
  const restLeft = Math.max(0, Math.ceil((W.restEnd - now) / 1000)); const restTotal = (exs[W.ex]?.rest || 1);
  const nextName = (() => { if (done.length < cur.sets) return null; const nx = nextEx(W, W.ex); return nx >= 0 ? exs[nx].name : null; })();
  return html`<div class="overlay full player-ov"><div class="player" role="dialog" aria-modal="true" aria-label="Entrenamiento">
    <header class="pl-h"><div><span class="eyebrow">Día ${idx + 1} · ${day.name}</span><strong class="pl-time"><${Ic} n="clock" s=${14} /> ${fmtDur((now - W.started) / 1000)}</strong></div>
      <div class="pl-prog"><div style=${`width:${doneSets / totalSets * 100}%`}></div></div>
      <button class="btn ghost sm" onClick=${exit}>Salir</button></header>
    ${summary ? html`<div class="pl-sum">
      <div class="sum-hero"><div class="sum-ic"><${Ic} n="trophy" s=${34} /></div><h2>${motiv}</h2><p class="muted">Completaste ${doneSets} de ${totalSets} series · Día ${idx + 1}, ${day.name}.</p></div>
      <div class="kpis three"><${Kpi} label="Duración" value=${fmtDur((Date.now() - W.started) / 1000)} icon="clock" /><${Kpi} label="Series" value=${doneSets} icon="check" /><${Kpi} label="Volumen" value=${Math.round(vol) + ' kg'} icon="dumbbell" /></div>
      <section class="card"><div class="card-h"><h2>Comparado con antes</h2></div>
        ${imps.filter(i => i.kind === 'up').length ? html`<ul class="list">${imps.filter(i => i.kind === 'up').map(i => html`<li class="li"><span class="dot good"></span><div class="li-main"><strong>Mejoraste ${i.name}</strong><span class="muted sm">${i.txt} respecto a la ${i.label}</span></div><${Ic} n="up" s=${18} cls="good-t" /></li>`)}</ul>`
          : imps.some(i => i.kind === 'first') ? html`<p class="muted">Es tu primer registro de ${imps.filter(i => i.kind === 'first').length} ejercicios: estas son tus marcas base para la próxima semana.</p>` : html`<p class="muted">Mantuviste tus marcas. La próxima vez intenta sumar una repetición o un poco de peso.</p>`}
      </section>
      <button class="btn primary big full-w" onClick=${finish}><${Ic} n="check" s=${18} />Terminar entrenamiento</button>
    </div>` : html`<div class="pl-body">
      <div class="pl-stage">
        <${Stage3D} name=${cur.name} cls="pl" />
        ${W.phase === 'rest' && html`<div class="rest">
          <div class="rest-ring"><${RestRing} left=${restLeft} total=${restTotal} /></div>
          <strong>Descanso</strong>${nextName ? html`<span class="muted">Siguiente: ${nextName}</span>` : html`<span class="muted">Siguiente: serie ${done.length + 1} de ${cur.sets}</span>`}
          <div class="row gap-s"><button class="btn ghost sm" onClick=${() => setW(w => ({ ...w, restEnd: w.restEnd + 15000 }))}>+15 s</button><button class="btn primary sm" onClick=${endRest}>Saltar descanso</button></div>
        </div>`}
      </div>
      <div class="pl-panel">
        <div class="pl-exnav">${exs.map((e, i) => html`<button aria-label=${'Ejercicio ' + (i + 1)} class=${'pl-dot ' + (i === W.ex ? 'on ' : '') + ((W.sets[i] || []).length >= e.sets ? 'done' : W.skipped[i] ? 'skip' : '')} onClick=${() => setW(w => ({ ...w, ex: i, phase: 'work' }))}>${i + 1}</button>`)}</div>
        <span class="eyebrow">Ejercicio ${W.ex + 1} de ${exs.length}</span>
        <h2 class="pl-name">${cur.name}</h2>
        ${cur.note && html`<p class="pl-note">${cur.note}</p>`}
        <div class="chips"><span class="chip ro">${cur.sets} series</span><span class="chip ro">${cur.reps} reps</span><span class="chip ro"><${Ic} n="clock" s=${13} /> ${cur.rest}s descanso</span></div>
        <ol class="setlist">${Array.from({ length: cur.sets }, (_, k) => { const d = done[k]; return html`<li class=${d ? 'done' : k === done.length ? 'cur' : ''}><span>Serie ${k + 1}</span>${d ? html`<strong>${d.reps} reps × ${numStr(d.w)} ${d.u}</strong><${Ic} n="check" s=${16} w=${3} />` : html`<span class="muted">${k === done.length ? 'Ahora' : 'Pendiente'}</span>`}</li>`; })}</ol>
        ${done.length < cur.sets ? html`<div class="pl-input">
          <${Stepper} id="pl-reps" label="Repeticiones" value=${reps} onChange=${setReps} />
          <${Stepper} id="pl-w" label="Peso" value=${wt} onChange=${setWt} step=${unit === 'kg' ? 2.5 : 5} decimals />
          <div class="stepper-in"><span class="eyebrow">Unidad</span><${Seg} options=${[{ k: 'kg', label: 'kg' }, { k: 'lb', label: 'lb' }]} value=${unit} onChange=${setUnit} /></div>
        </div>
        <button class="btn primary big full-w" disabled=${W.phase === 'rest'} onClick=${register}><${Ic} n="plus" s=${18} />Agregar serie ${done.length + 1} de ${cur.sets}</button>`
        : html`<div class="note good"><${Ic} n="check" s=${16} /> Ejercicio completado.</div>${nextName && W.phase !== 'rest' && html`<button class="btn primary big full-w" onClick=${() => setW(w => ({ ...w, ex: nextEx(w, w.ex) }))}>Siguiente ejercicio<${Ic} n="chevR" s=${18} /></button>`}`}
        <div class="row between mt">${done.length > 0 ? html`<button class="link sm" onClick=${undo}><${Ic} n="undo" s=${14} /> Deshacer última serie</button>` : html`<span></span>`}
          ${done.length < cur.sets && html`<button class="link sm muted" onClick=${skipEx}>Saltar ejercicio</button>`}</div>
        ${Object.values(W.sets).some(a => a.length) && html`<button class="link sm mt" onClick=${() => setW(w => ({ ...w, phase: 'summary' }))}>Terminar antes</button>`}
      </div>
    </div>`}
  </div></div>`;
}
function RestRing({ left, total }) {
  const size = 150, st = 10, r = (size - st) / 2, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, left / total));
  return html`<svg width=${size} height=${size} viewBox=${`0 0 ${size} ${size}`}><circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke="var(--line)" stroke-width=${st} />
    <circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke="var(--c-yellow)" stroke-width=${st} stroke-linecap="round" stroke-dasharray=${`${c * f} ${c}`} transform=${`rotate(-90 ${size / 2} ${size / 2})`} />
    <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" class="rest-n">${Math.floor(left / 60)}:${pad(left % 60)}</text></svg>`;
}
