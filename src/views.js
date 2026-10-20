/* COUCH+ · vistas compartidas: dieta, rutina, revisiones y progreso */
function SlotView({ slot, compact }) {
  const [open, setOpen] = useState(false);
  if (!slotHas(slot)) return html`<span class="muted sm">—</span>`;
  const steps = [...(slot.steps || []).filter(Boolean).map(s => ({ s })), ...(slot.dishes || []).flatMap(d => (d.steps || []).filter(Boolean).map(s => ({ s, d: d.name })))];
  return html`<div class=${'slot ' + (compact ? 'compact' : '')}>
    ${(slot.dishes || []).map(d => html`<div class="dish"><span class="dish-n"><${Ic} n="book" s=${13} /> ${d.name}</span><span class="dish-i">${(d.items || []).map(itemShort).join(' + ')}</span></div>`)}
    ${(slot.items || []).length > 0 && html`<div class="items">${slot.items.map(itemShort).join(' + ')}</div>`}
    ${steps.length > 0 && html`<button type="button" class="link sm" onClick=${e => { e.stopPropagation(); setOpen(!open); }}>${open ? 'Ocultar preparación' : 'Ver preparación'}</button>
      ${open && html`<ol class="steps">${steps.map(x => html`<li>${x.s}</li>`)}</ol>`}`}
  </div>`;
}

function DietWeek({ st, highlight = today() }) {
  const wide = useWide('(min-width: 1100px)');
  const [sel, setSel] = useState(dow(highlight));
  const diet = st.diet;
  if (!diet || !(diet.meals || []).length) return html`<${Empty} icon="food" title="Sin dieta asignada" text="Cuando el entrenador la cree, aparecerá organizada por día." />`;
  const td = dow(highlight);
  if (wide) return html`<div class="table-wrap"><div class="dgrid" style=${`grid-template-columns: 120px repeat(7, minmax(112px, 1fr))`}>
    <div class="dg-h corner"></div>
    ${DIAS.map((d, i) => html`<div class=${'dg-h ' + (i === td ? 'today' : '')}>${d}${i === td ? html`<small>Hoy</small>` : ''}</div>`)}
    ${diet.meals.map(m => html`<div class="dg-m"><strong>${m.name}</strong>${m.time && html`<small>${m.time}</small>`}</div>
      ${DIAS.map((_, i) => html`<div class=${'dg-c ' + (i === td ? 'today' : '')}><${SlotView} slot=${((diet.days || {})[i] || {})[m.id]} compact /></div>`)}`)}
  </div></div>`;
  return html`<div>
    <div class="daychips">${DIAS3.map((d, i) => html`<button class=${'dchip ' + (sel === i ? 'on' : '') + (i === td ? ' today' : '')} onClick=${() => setSel(i)}>${d}</button>`)}</div>
    <div class="meal-list">${diet.meals.map(m => html`<div class="meal-card"><div class="meal-h"><strong>${m.name}</strong>${m.time && html`<span class="muted sm">${m.time}</span>`}</div><${SlotView} slot=${((diet.days || {})[sel] || {})[m.id]} /></div>`)}</div>
  </div>`;
}

function RoutineView({ st, highlightIdx = -1 }) {
  const r = st.routine;
  if (!r || !(r.days || []).length) return html`<${Empty} icon="dumbbell" title="Sin rutina asignada" text="La rutina aparecerá aquí con sus días y ejercicios." />`;
  return html`<div class="rdays">${r.days.map((d, i) => html`<section class=${'rday ' + (i === highlightIdx ? 'next' : '')}>
    <header><${Plate} i=${i} label=${'D' + (i + 1)} /><div><strong>Día ${i + 1} · ${d.name}</strong><small class="muted">${(d.exercises || []).length} ejercicios</small></div>${i === highlightIdx && html`<${Pill} k="accent">Siguiente<//>`}</header>
    ${(d.exercises || []).length ? html`<ol class="exlist">${d.exercises.map((e, j) => html`<li>
      <span class="exn">${j + 1}</span><div class="exm"><strong>${e.name}</strong>${e.note && html`<small class="muted">${e.note}</small>`}</div>
      <span class="exs">${e.sets} × ${e.reps}</span><span class="exr"><${Ic} n="clock" s=${13} /> ${e.rest}s</span>
      <button class="icon-btn sm" aria-label="Ver movimiento en 3D" title="Ver movimiento en 3D" onClick=${() => preview3D(e.name)}><${Ic} n="cube" s=${16} /></button>
    </li>`)}</ol>` : html`<p class="muted sm pad">Sin ejercicios todavía.</p>`}
  </section>`)}</div>`;
}

function Lightbox({ close, items, start = 0 }) {
  const [i, setI] = useState(start); const it = items[i];
  return html`<${Modal} title=${it.name || 'Foto'} sub=${it.date ? fmtD(it.date) : ''} onClose=${close} size="lg">
    <div class="lightbox"><${PhotoImg} pid=${it.pid} alt=${it.name} />
      ${items.length > 1 && html`<div class="row between mt"><button class="btn ghost sm" disabled=${i === 0} onClick=${() => setI(i - 1)}><${Ic} n="chevL" s=${15} />Anterior</button><span class="muted sm">${i + 1} de ${items.length}</span><button class="btn ghost sm" disabled=${i === items.length - 1} onClick=${() => setI(i + 1)}>Siguiente<${Ic} n="chevR" s=${15} /></button></div>`}
    </div>
  <//>`;
}

function ReviewList({ st, canDelete }) {
  const list = Q.reviews(st.id).slice().reverse();
  if (!list.length) return html`<${Empty} icon="ruler" title="Sin revisiones todavía" text="Las fotos y medidas de cada control quedarán guardadas aquí." />`;
  const chron = Q.reviews(st.id);
  return html`<div class="rv-list">${list.map(r => {
    const prev = chron[chron.indexOf(r) - 1];
    return html`<article class="rv">
      <header><div><span class="eyebrow">Revisión</span><h3>${fmtLong(r.date)}, ${parseD(r.date).getFullYear()}</h3></div>
        ${canDelete && html`<button class="icon-btn danger-t" aria-label="Eliminar revisión" onClick=${async () => { if (await confirmBox({ title: 'Eliminar revisión', text: 'Se borrarán sus fotos y medidas.', ok: 'Eliminar', danger: true })) { (r.photos || []).forEach(p => Store.delPhoto(p.pid)); Store.del('reviews', r.id); } }}><${Ic} n="trash" /></button>`}</header>
      ${(r.measures || []).length > 0 && html`<div class="mchips">${r.measures.map(m => {
        const pv = prev && (prev.measures || []).find(x => x.name === m.name);
        const dv = pv && parseNum(m.value) != null && parseNum(pv.value) != null ? round1(parseNum(m.value) - parseNum(pv.value)) : null;
        return html`<div class="mchip"><span>${m.name}</span><strong>${m.value || '—'}<small>${m.unit}</small></strong>${dv != null && dv !== 0 && html`<em class=${dv < 0 ? 'down' : 'up'}>${dv > 0 ? '+' : ''}${numStr(dv)}</em>`}</div>`;
      })}</div>`}
      ${(r.photos || []).length > 0 && html`<div class="thumbs">${r.photos.map((p, k) => html`<button class="thumb" onClick=${() => openModal(Lightbox, { items: r.photos.map(x => ({ ...x, date: r.date })), start: k })}><${PhotoImg} pid=${p.pid} alt=${p.name} /><span>${p.name}</span></button>`)}</div>`}
      ${r.notes && html`<p class="rv-notes">${r.notes}</p>`}
      ${r.omissions && (r.omissions.days.length > 0 || r.omissions.meals.length > 0) && html`<p class="sm bad-t"><${Ic} n="alert" s=${14} /> En este periodo: ${r.omissions.days.length} días de entrenamiento omitidos y ${r.omissions.meals.length} comidas omitidas.</p>`}
    </article>`;
  })}</div>`;
}

/* ---------- Progreso ---------- */
function ProgressPanel({ st, role }) {
  useStore();
  const t = today();
  const [mode, setMode] = useState('mes');
  const [day, setDay] = useState(t);
  const [month, setMonth] = useState(t.slice(0, 7));
  const [year, setYear] = useState(t.slice(0, 4));
  const range = mode === 'dia' ? [day, day] : mode === 'mes' ? [month + '-01', addDays(addMonths(month + '-01', 1), -1)] : mode === 'anio' ? [year + '-01-01', year + '-12-31'] : [st.inicio || '2000-01-01', t];
  const S = stats(st, range[0], range[1]);
  const mnames = measureNames(st.id);
  const [mSel, setMSel] = useState(() => (mnames.find(m => /peso/i.test(m.name)) || mnames[0] || {}).name || '');
  const exNames = useMemo(() => { const m = new Map(); Q.logs(st.id).forEach(l => (l.exercises || []).forEach(e => { if ((e.sets || []).length) m.set(normTxt(e.name), e.name); })); return Array.from(m.values()); }, [Store.ver]);
  const [exSel, setExSel] = useState(exNames[0] || '');
  const exSeries = exSel ? exHistory(st.id, exSel).map(h => ({ x: h.l.date, y: round1(bestOf(h.ex).mw) })) : [];
  const years = []; for (let y = Number(t.slice(0, 4)); y >= Number((st.inicio || t).slice(0, 4)); y--) years.push(String(y));
  const dayLogs = S.logs.slice().reverse();
  return html`<div class="progress">
    <div class="toolbar"><${Seg} options=${[{ k: 'dia', label: 'Día' }, { k: 'mes', label: 'Mes' }, { k: 'anio', label: 'Año' }, { k: 'todo', label: 'Todo' }]} value=${mode} onChange=${setMode} />
      ${mode === 'dia' && html`<input id="pg-day" type="date" class="sel" value=${day} max=${t} onInput=${e => e.target.value && setDay(e.target.value)} />`}
      ${mode === 'mes' && html`<input id="pg-month" type="month" class="sel" value=${month} onInput=${e => e.target.value && setMonth(e.target.value)} />`}
      ${mode === 'anio' && html`<select id="pg-year" class="sel" value=${year} onChange=${e => setYear(e.target.value)}>${years.map(y => html`<option value=${y} selected=${y === year}>${y}</option>`)}</select>`}
    </div>
    <div class="kpis">
      <${Kpi} label="Entrenamientos" value=${S.done} sub=${S.trainPct != null ? `${S.trainPct}% de cumplimiento` : 'Sin registros'} icon="dumbbell" tone=${S.done ? 'good' : ''} />
      <${Kpi} label="Días omitidos" value=${S.skipped} sub=${S.skipped ? 'Con motivo enviado al entrenador' : 'Ninguno'} icon="alert" tone=${S.skipped ? 'bad' : ''} />
      <${Kpi} label="Dieta cumplida" value=${S.dietPct == null ? '—' : S.dietPct + '%'} sub=${`${S.ate} de ${S.planned} comidas${S.noLog ? ` · ${S.noLog} días sin registro` : ''}`} icon="food" />
      <${Kpi} label="Comidas omitidas" value=${S.skippedMeals} sub=${S.skippedMeals ? 'Marcadas como no realizadas' : 'Ninguna'} icon="x" tone=${S.skippedMeals ? 'bad' : ''} />
      <${Kpi} label="Volumen levantado" value=${S.vol >= 1000 ? numStr(round1(S.vol / 1000)) + ' t' : Math.round(S.vol) + ' kg'} sub="Peso × repeticiones" icon="trophy" />
    </div>
    ${mode === 'mes' && html`<${MonthCal} st=${st} month=${month} />`}
    <div class="cols">
      <section class="card"><div class="card-h"><h2>Medidas</h2>${mnames.length > 0 && html`<select id="pg-measure" class="sel sm" value=${mSel} onChange=${e => setMSel(e.target.value)}>${mnames.map(m => html`<option value=${m.name} selected=${m.name === mSel}>${m.name} (${m.unit})</option>`)}</select>`}</div>
        <${LineChart} data=${mSel ? measureSeries(st.id, mSel) : []} unit=${(mnames.find(m => m.name === mSel) || {}).unit || ''} /></section>
      <section class="card"><div class="card-h"><h2>Fuerza por ejercicio</h2>${exNames.length > 0 && html`<select id="pg-ex" class="sel sm" value=${exSel} onChange=${e => setExSel(e.target.value)}>${exNames.map(n => html`<option value=${n} selected=${n === exSel}>${n}</option>`)}</select>`}</div>
        <${LineChart} data=${exSeries} unit="kg" color="var(--c-blue)" /><p class="muted sm">Peso máximo por sesión.</p></section>
    </div>
    <section class="card"><div class="card-h"><h2>Historial del periodo</h2><span class="muted sm">${fmtD(range[0])} – ${fmtD(range[1] > t ? t : range[1])}</span></div>
      ${dayLogs.length || S.mealSkips.length ? html`<div class="timeline">
        ${dayLogs.map(l => html`<${LogItem} l=${l} />`)}
        ${S.mealSkips.length > 0 && html`<div class="tl-item bad"><div class="tl-dot"></div><div class="tl-b"><strong>Comidas omitidas (${S.mealSkips.length})</strong>
          <ul class="omit">${S.mealSkips.slice().reverse().map(m => html`<li><span>${fmtDs(m.date)} · ${m.meal}</span>${m.reason ? html`<em>“${m.reason}”</em>` : html`<em class="muted">Sin motivo</em>`}</li>`)}</ul></div></div>`}
      </div>` : html`<p class="muted">No hay registros en este periodo.</p>`}
    </section>
  </div>`;
}

function LogItem({ l }) {
  const [open, setOpen] = useState(false);
  if (l.status === 'skipped') return html`<div class="tl-item bad"><div class="tl-dot"></div><div class="tl-b"><div class="row between"><strong>${l.dayName}</strong><span class="muted sm">${fmtD(l.date)}</span></div><${Pill} k="bad">Día omitido<//>${l.reason && html`<p class="reason">“${l.reason}”</p>`}</div></div>`;
  const nSets = (l.exercises || []).reduce((a, e) => a + (e.sets || []).length, 0);
  return html`<div class="tl-item good"><div class="tl-dot"></div><div class="tl-b">
    <button class="row between full link-row" onClick=${() => setOpen(!open)}><strong>${l.dayName}</strong><span class="muted sm">${fmtD(l.date)} · ${fmtTime(l.ts)}</span></button>
    <div class="row gap-s wrap"><${Pill} k="good">Completado<//><span class="muted sm">${(l.exercises || []).length} ejercicios · ${nSets} series${l.duration ? ' · ' + fmtDur(l.duration) : ''}</span><button class="link sm" onClick=${() => setOpen(!open)}>${open ? 'Ocultar detalle' : 'Ver detalle'}</button></div>
    ${open && html`<div class="table-wrap"><table class="tbl sm"><thead><tr><th>Ejercicio</th><th>Series registradas</th></tr></thead><tbody>
      ${(l.exercises || []).map(e => html`<tr><td>${e.name}</td><td>${(e.sets || []).length ? e.sets.map(s => `${s.reps}×${numStr(s.w)}${s.u}`).join(' · ') : html`<span class="muted">No realizado</span>`}</td></tr>`)}
    </tbody></table></div>`}
  </div></div>`;
}

function MonthCal({ st, month }) {
  const first = month + '-01'; const start = weekStart(first); const t = today();
  const last = addDays(addMonths(first, 1), -1);
  const cells = []; let d = start; while (d <= last || dow(d) !== 0) { cells.push(d); d = addDays(d, 1); if (cells.length > 42) break; }
  const logs = Q.logs(st.id);
  return html`<section class="card"><div class="card-h"><h2>${MESL[parseD(first).getMonth()]} ${first.slice(0, 4)}</h2>
    <div class="legend"><span><i class="lg good"></i>Entrenó</span><span><i class="lg bad"></i>Omitió</span><span><i class="lg diet"></i>Dieta completa</span></div></div>
    <div class="cal">${DIAS3.map(x => html`<div class="cal-h">${x}</div>`)}
      ${cells.map(c => {
        const inM = c.slice(0, 7) === month; const L = logs.filter(l => l.date === c);
        const done = L.some(l => l.status === 'done'), sk = L.some(l => l.status === 'skipped');
        const pm = plannedMeals(st, dow(c)); const ml = Q.meal(st.id, c); const ch = ml?.checks || {};
        const ate = pm.filter(x => ch[x.meal.id] === 'done').length, skm = pm.filter(x => ch[x.meal.id] === 'skip').length;
        return html`<div class=${'cal-c ' + (inM ? '' : 'out ') + (c === t ? 'today ' : '') + (done ? 'good ' : sk ? 'bad ' : '')} title=${`${fmtD(c)}${done ? ' · entrenó' : ''}${sk ? ' · omitió' : ''}${pm.length ? ` · comidas ${ate}/${pm.length}` : ''}`}>
          <span>${parseD(c).getDate()}</span>${pm.length > 0 && c <= t && (ate || skm) ? html`<i class=${'cal-diet ' + (ate === pm.length ? 'full' : skm ? 'bad' : '')}></i>` : ''}</div>`;
      })}</div></section>`;
}
