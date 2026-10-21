/* COUCH+ · vista de entrenador */
function TrainerApp({ view, go, params, sess }) {
  useStore();
  const tr = Q.trainer(sess.id);
  if (!tr) return null;
  if (view === 'students') return html`<${TrainerStudents} tr=${tr} go=${go} />`;
  if (view === 'student') return html`<${StudentDetail} tr=${tr} id=${params.id} tab=${params.tab} go=${go} />`;
  if (view === 'agenda') return html`<${TrainerAgenda} tr=${tr} go=${go} />`;
  if (view === 'templates') return html`<${Templates} tr=${tr} />`;
  if (view === 'account') return html`<${TrainerAccount} tr=${tr} />`;
  return html`<${TrainerHome} tr=${tr} go=${go} />`;
}

function studentSummary(s) {
  const t = today();
  const s30 = stats(s, addDays(t, -29), t), s7 = stats(s, addDays(t, -6), t);
  const lr = lastReview(s.id); const om = omissionsSince(s, lr ? lr.date : s.inicio);
  const w = weightSeries(s.id);
  const logs = Q.logs(s.id); const last = logs[logs.length - 1];
  return { s30, s7, om, w, last, nOm: om.days.length + om.meals.length, dW: w.length > 1 ? round1(w[w.length - 1].y - w[0].y) : null };
}
const pctTone = p => p == null ? '' : p >= 80 ? 'good' : p >= 55 ? 'warn' : 'bad';
function MiniBar({ pct, label }) {
  return html`<div class="minibar"><div class="row between"><span>${label}</span><strong>${pct == null ? '—' : pct + '%'}</strong></div><div class="mb-track"><div class=${'mb-fill ' + pctTone(pct)} style=${`width:${pct || 0}%`}></div></div></div>`;
}

function TrainerHome({ tr, go }) {
  const sts = Q.students(tr.id); const t = today();
  const sum = sts.map(s => ({ s, ...studentSummary(s) }));
  const reviewsDue = sts.filter(s => s.nextReview && s.nextReview <= t);
  const pays = sts.filter(s => s.remind && ['late', 'today', 'soon'].includes(payState(s.nextPay).k));
  const alerts = sts.flatMap(s => Q.logs(s.id).filter(l => l.status === 'skipped' && diffDays(l.date, t) <= 7).map(l => ({ s, l }))).sort((a, b) => b.l.ts - a.l.ts);
  const mealAlerts = sum.reduce((a, x) => a + x.s7.skippedMeals, 0);
  const ps = payState(tr.nextPay);
  return html`<div class="page">
    ${['late', 'today', 'soon'].includes(ps.k) && html`<div class=${'note ' + (ps.k === 'late' ? 'bad' : 'warn')}><${Ic} n="wallet" s=${16} /> Tu suscripción COUCH+: ${ps.label.toLowerCase()} (${fmtD(tr.nextPay)}). Coordina el pago con el administrador.</div>`}
    <div class="kpis">
      <${Kpi} label="Alumnos" value=${sts.length} sub=${`${sts.filter(s => s.routine && s.routine.days && s.routine.days.length).length} con rutina asignada`} icon="users" />
      <${Kpi} label="Revisiones pendientes" value=${reviewsDue.length} sub="Hoy o atrasadas" tone=${reviewsDue.length ? 'warn' : ''} icon="ruler" />
      <${Kpi} label="Días omitidos" value=${alerts.length} sub=${`Últimos 7 días · ${mealAlerts} comidas omitidas`} tone=${alerts.length ? 'bad' : mealAlerts ? 'warn' : 'good'} icon="alert" />
      <${Kpi} label="Pagos por cobrar" value=${pays.length} sub=${`Vencen en ≤ ${REMIND_DAYS} días`} tone=${pays.length ? 'warn' : ''} icon="wallet" />
    </div>
    <section class="card">
      <div class="card-h"><h2>Avance de tus alumnos</h2><button class="btn ghost sm" onClick=${() => go('students')}>Ver todos <${Ic} n="chevR" s=${14} /></button></div>
      ${sum.length ? html`<div class="table-wrap"><table class="tbl stack">
        <thead><tr><th>Alumno</th><th>Entrenamiento (30 d)</th><th>Dieta (7 d)</th><th class="num">Peso</th><th>Omisiones</th><th>Próx. revisión</th></tr></thead>
        <tbody>${sum.map(x => html`<tr class="clickable" onClick=${() => go('student', { id: x.s.id })}>
          <td class="full"><span class="cell-person"><${Avatar} p=${x.s} size=${30} tone=${hashTone(x.s.id)} /><span><strong>${fullName(x.s)}</strong><small class="muted">${x.last ? 'Última actividad ' + fmtDs(x.last.date) : 'Sin actividad'}</small></span></span></td>
          <td data-label="Entrenamiento (30 d)"><${MiniBar} pct=${x.s30.trainPct} label=${`${x.s30.done} sesiones`} /></td>
          <td data-label="Dieta (7 d)"><${MiniBar} pct=${x.s7.dietPct} label=${`${x.s7.ate}/${x.s7.planned}`} /></td>
          <td class="num" data-label="Peso">${x.w.length ? html`<strong>${numStr(x.w[x.w.length - 1].y)}</strong>${x.dW != null && html`<small class=${x.dW <= 0 ? 'good-t' : 'muted'}> ${x.dW > 0 ? '+' : ''}${numStr(x.dW)}</small>`}` : '—'}</td>
          <td data-label="Omisiones">${x.nOm ? html`<${Pill} k="bad">${x.nOm} desde la última revisión<//>` : html`<${Pill} k="good">Sin omisiones<//>`}</td>
          <td data-label="Próx. revisión">${x.s.nextReview ? html`<span class=${x.s.nextReview <= today() ? 'warn-t' : ''}>${fmtD(x.s.nextReview)}</span>` : html`<span class="muted">Sin fecha</span>`}</td>
        </tr>`)}</tbody></table></div>` : html`<${Empty} icon="users" title="Aún no tienes alumnos" text="Crea la cuenta de tu primer alumno para asignarle dieta, rutina y revisiones."><button class="btn primary mt" onClick=${() => openModal(PersonForm, { kind: 'student', trainerId: tr.id, onSaved: s => go('student', { id: s.id }) })}><${Ic} n="plus" s=${16} />Nuevo alumno</button><//>`}
    </section>
    <div class="cols">
      <section class="card"><div class="card-h"><h2>Alertas recientes</h2></div>
        ${alerts.length ? html`<ul class="list">${alerts.slice(0, 8).map(({ s, l }) => html`<li class="li bad-row clickable" onClick=${() => go('student', { id: s.id, tab: 'progreso' })}>
          <span class="dot bad"></span><div class="li-main"><strong>${s.nombres} omitió ${l.dayName}</strong><span class="muted sm">${fmtD(l.date)}${l.reason ? ' · “' + l.reason + '”' : ''}</span></div><${Ic} n="chevR" s=${16} /></li>`)}</ul>` : html`<p class="muted">Nadie ha omitido entrenamientos esta semana.</p>`}
      </section>
      <section class="card"><div class="card-h"><h2>Pendientes</h2></div>
        ${reviewsDue.length || pays.length ? html`<ul class="list">
          ${reviewsDue.map(s => html`<li class="li"><span class="dot warn"></span><div class="li-main"><strong>Revisión de ${fullName(s)}</strong><span class="muted sm">${s.nextReview === t ? 'Hoy' : 'Desde ' + fmtD(s.nextReview)}</span></div><button class="btn sm" onClick=${() => openModal(ReviewWizard, { st: s })}>Empezar</button></li>`)}
          ${pays.map(s => html`<li class="li"><span class="dot warn"></span><div class="li-main"><strong>Pago de ${fullName(s)}</strong><span class="muted sm">${payState(s.nextPay).label} · ${fmtD(s.nextPay)}</span></div><${WaBtn} phone=${s.telefono} text=${payReminderText(s, true)} label="Recordar" /></li>`)}
        </ul>` : html`<p class="muted">No tienes revisiones ni cobros pendientes.</p>`}
      </section>
    </div>
  </div>`;
}

function TrainerStudents({ tr, go }) {
  const [q, setQ] = useState('');
  const sts = Q.students(tr.id).filter(s => !q || normTxt(fullName(s) + ' ' + s.dni).includes(normTxt(q)));
  return html`<div class="page">
    <div class="toolbar"><div class="search"><${Ic} n="search" s=${16} /><input id="ts-q" placeholder="Buscar alumno" value=${q} onInput=${e => setQ(e.target.value)} /></div>
      <button class="btn primary" onClick=${() => openModal(PersonForm, { kind: 'student', trainerId: tr.id, onSaved: s => go('student', { id: s.id }) })}><${Ic} n="plus" s=${16} />Nuevo alumno</button></div>
    ${sts.length ? html`<div class="scards">${sts.map(s => { const x = studentSummary(s); const nd = (s.routine?.days || []).length; return html`<button class="scard" onClick=${() => go('student', { id: s.id })}>
      <div class="row gap-s"><${Avatar} p=${s} size=${42} tone=${hashTone(s.id)} /><div class="li-main"><strong>${fullName(s)}</strong><span class="muted sm">${s.user}</span></div>${x.nOm > 0 && html`<span class="badge bad" title="Omisiones desde la última revisión">${x.nOm}</span>`}</div>
      <div class="tags"><${Pill}>${nd ? `Rutina ${nd} días` : 'Sin rutina'}<//><${Pill}>${s.diet && (s.diet.meals || []).length ? `Dieta ${s.diet.meals.length} comidas` : 'Sin dieta'}<//>${s.demo && html`<${Pill} k="accent">Ejemplo<//>`}</div>
      <${MiniBar} pct=${x.s30.trainPct} label="Entrenamiento 30 d" /><${MiniBar} pct=${x.s7.dietPct} label="Dieta 7 d" />
      <div class="row between sm"><span class="muted">Revisión: <strong class=${s.nextReview && s.nextReview <= today() ? 'warn-t' : ''}>${s.nextReview ? fmtDs(s.nextReview) : 'sin fecha'}</strong></span>${s.remind && html`<${PayPill} next=${s.nextPay} />`}</div>
    </button>`; })}</div>` : html`<${Empty} icon="users" title=${q ? 'Sin resultados' : 'Aún no tienes alumnos'} text=${q ? '' : 'Crea su cuenta: tú defines su usuario y contraseña.'} />`}
  </div>`;
}

function StudentDetail({ tr, id, tab = 'perfil', go }) {
  const s = Q.student(id);
  const [t, setT] = useState(tab);
  useEffect(() => setT(tab || 'perfil'), [id, tab]);
  if (!s || s.trainerId !== tr.id) return html`<div class="page"><${Empty} icon="user" title="Alumno no encontrado"><button class="btn mt" onClick=${() => go('students')}>Volver a alumnos</button><//></div>`;
  const x = studentSummary(s);
  return html`<div class="page">
    <div class="phead">
      <button class="icon-btn" aria-label="Volver" onClick=${() => go('students')}><${Ic} n="chevL" /></button>
      <${Avatar} p=${s} size=${52} tone=${hashTone(s.id)} />
      <div class="li-main"><h1 class="h-name">${fullName(s)}</h1><span class="muted sm">Usuario ${s.user} · desde ${fmtD(s.inicio)}${s.demo ? ' · cuenta de ejemplo' : ''}</span></div>
      <div class="row gap-s wrap">
        ${s.nextReview && s.nextReview <= today() && html`<button class="btn primary" onClick=${() => openModal(ReviewWizard, { st: s })}><${Ic} n="ruler" s=${16} />Empezar revisión</button>`}
        <button class="btn ghost" onClick=${() => openModal(PersonForm, { kind: 'student', rec: s, trainerId: tr.id })}><${Ic} n="edit" s=${15} />Editar</button>
      </div>
    </div>
    <${Tabs} value=${t} onChange=${setT} tabs=${[{ k: 'perfil', label: 'Perfil', icon: 'user' }, { k: 'revisiones', label: 'Revisiones', icon: 'ruler' }, { k: 'dieta', label: 'Dieta', icon: 'food' }, { k: 'rutina', label: 'Rutina', icon: 'dumbbell' }, { k: 'progreso', label: 'Progreso', icon: 'chart', badge: x.nOm || 0 }]} />
    ${t === 'perfil' && html`<${StudentProfile} s=${s} go=${go} />`}
    ${t === 'revisiones' && html`<${StudentReviews} s=${s} />`}
    ${t === 'dieta' && html`<section class="card"><div class="card-h"><h2>Dieta semanal</h2><button class="btn primary sm" onClick=${() => openModal(DietEditor, { st: s, tr }, { full: true })}><${Ic} n="edit" s=${15} />${s.diet && (s.diet.meals || []).length ? 'Editar dieta' : 'Crear dieta'}</button></div><${DietWeek} st=${s} /></section>`}
    ${t === 'rutina' && html`<section class="card"><div class="card-h"><h2>Rutina de entrenamiento</h2><button class="btn primary sm" onClick=${() => openModal(RoutineEditor, { st: s, tr })}><${Ic} n="edit" s=${15} />${s.routine && (s.routine.days || []).length ? 'Editar rutina' : 'Crear rutina'}</button></div><${RoutineView} st=${s} highlightIdx=${nextDayIdx(s)} /></section>`}
    ${t === 'progreso' && html`<${ProgressPanel} st=${s} role="trainer" />`}
  </div>`;
}

function StudentProfile({ s, go }) {
  const setRemind = v => { const o = clone(s); o.remind = v; if (v && !o.nextPay) { o.freq = o.freq || 'mensual'; o.nextPay = nextFrom(o.inicio || today(), o.freq); } Store.put('students', o); };
  return html`<div class="cols">
    <section class="card"><div class="card-h"><h2>Datos del alumno</h2></div>
      <div class="kv"><span>Nombres</span><strong>${s.nombres}</strong></div><div class="kv"><span>Apellidos</span><strong>${s.apellidos}</strong></div>
      <div class="kv"><span>DNI</span><strong>${s.dni || '—'}</strong></div><div class="kv"><span>Teléfono</span><strong>${s.telefono || '—'}</strong></div>
      <div class="kv"><span>Inicio del servicio</span><strong>${fmtD(s.inicio)}</strong></div>
      <div class="kv"><span>Usuario</span><strong><code>${s.user}</code></strong></div>
      <div class="row gap-s wrap mt"><button class="btn ghost sm" onClick=${() => openModal(ResetPassModal, { col: 'students', rec: s })}><${Ic} n="lock" s=${15} />Restablecer contraseña</button>
        <button class="btn ghost sm danger-t" onClick=${async () => { if (await confirmBox({ title: 'Eliminar alumno', text: `Se borrará a ${fullName(s)} con su dieta, rutina, revisiones e historial.`, ok: 'Eliminar', danger: true })) { if (await delStudentCascade(s.id)) { toast('Alumno eliminado'); go('students'); } } }}><${Ic} n="trash" s=${15} />Eliminar alumno</button></div>
    </section>
    <section class="card"><div class="card-h"><h2>Pagos del alumno</h2><${Toggle} id="sp-remind" checked=${!!s.remind} onChange=${setRemind} label="Recordatorio" /></div>
      ${s.remind ? html`<div class="kv"><span>Frecuencia</span><strong>${FREQ[s.freq || 'mensual'].label}</strong></div>
        <div class="kv"><span>Próximo pago</span><strong>${fmtD(s.nextPay)}</strong></div>
        <div class="kv"><span>Estado</span><${PayPill} next=${s.nextPay} /></div>
        ${s.monto && html`<div class="kv"><span>Monto</span><strong>S/ ${s.monto}</strong></div>`}
        <p class="muted sm">${s.nombres} verá el recordatorio en su inicio ${REMIND_DAYS} días antes del pago.</p>
        <div class="row gap-s wrap"><button class="btn sm" onClick=${() => openModal(PayModal, { col: 'students', rec: s })}><${Ic} n="wallet" s=${15} />Registrar pago</button><${WaBtn} phone=${s.telefono} text=${payReminderText(s, true)} label="Enviar recordatorio" /></div>
        <div class="eyebrow mt">Historial</div><${PayHistory} rec=${s} />` : html`<p class="muted">Activa el recordatorio para llevar el control de pagos mensual, trimestral o anual.</p>`}
    </section>
  </div>`;
}

function StudentReviews({ s }) {
  const [date, setDate] = useState(s.nextReview || '');
  useEffect(() => setDate(s.nextReview || ''), [s.nextReview]);
  const saveDate = v => { Store.put('students', Object.assign({}, s, { nextReview: v || null })); toast(v ? 'Revisión programada para el ' + fmtD(v) : 'Revisión sin fecha'); };
  const due = s.nextReview && s.nextReview <= today();
  return html`<div class="stack-l">
    <section class=${'card review-next ' + (due ? 'due' : '')}>
      <div class="rn-main"><span class="eyebrow">Próxima revisión</span><h2>${s.nextReview ? fmtLong(s.nextReview) : 'Sin fecha asignada'}</h2>
        <p class="muted sm">${s.nextReview ? (s.nextReview === today() ? 'Es hoy.' : s.nextReview < today() ? 'Está atrasada.' : `Faltan ${diffDays(today(), s.nextReview)} días.`) : 'Puedes asignarla ahora o iniciar una revisión cuando quieras.'}</p></div>
      <div class="rn-act"><input id="rv-date" type="date" class="sel" value=${date} onChange=${e => { setDate(e.target.value); saveDate(e.target.value); }} />
        ${s.nextReview && html`<button class="btn ghost sm" onClick=${() => saveDate('')}>Quitar fecha</button>`}
        <button class=${'btn ' + (due ? 'primary' : '')} onClick=${() => openModal(ReviewWizard, { st: s })}><${Ic} n="play" s=${15} />Empezar revisión</button></div>
    </section>
    <${ReviewList} st=${s} canDelete=${true} />
  </div>`;
}

/* ---------- Asistente de revisión ---------- */
const PHOTO_NAMES = ['Frontal', 'Posterior', 'Perfil derecho', 'Perfil izquierdo', 'Espalda', 'Pecho', 'Abdomen'];
function ReviewWizard({ close, st }) {
  const tr = Q.trainer(st.trainerId);
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [pending, setPending] = useState(null);
  const [useTpl, setUseTpl] = useState(null);
  const [rows, setRows] = useState([]);
  const [notes, setNotes] = useState('');
  const [next, setNext] = useState(addDays(today(), 14));
  const [later, setLater] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();
  const tpls = Q.tpls(st.trainerId, 'measure');
  const lr = lastReview(st.id);
  const om = omissionsSince(st, lr ? lr.date : st.inicio);
  const prevVal = name => { if (!lr) return null; const m = (lr.measures || []).find(x => normTxt(x.name) === normTxt(name)); return m ? `${m.value} ${m.unit}` : null; };
  const pick = async e => {
    const file = e.target.files && e.target.files[0]; e.target.value = '';
    if (!file) return;
    try { const src = await compressImage(file); setPending({ src, name: PHOTO_NAMES[photos.length] || 'Foto ' + (photos.length + 1) }); } catch (er) { toast('No se pudo leer la imagen', 'bad'); }
  };
  const applyTpl = tp => { setUseTpl(true); setRows(tp.fields.map(f => ({ name: f.name, unit: f.unit, value: '' }))); };
  const steps = ['Fotos', 'Medidas', 'Observaciones', 'Próxima revisión'];
  async function save() {
    setSaving(true);
    try {
      const ph = [];
      for (const p of photos) ph.push({ pid: await Store.putPhoto(p.src, { studentId: st.id, trainerId: st.trainerId }), name: p.name });
      const t = today();
      Store.put('reviews', { id: uid(), studentId: st.id, trainerId: st.trainerId, date: t, photos: ph, measures: rows.filter(r => r.name.trim()).map(r => ({ name: r.name.trim(), unit: r.unit, value: r.value })), notes, omissions: { days: om.days, meals: om.meals }, createdAt: Date.now() });
      Store.put('students', Object.assign({}, Q.student(st.id), { nextReview: later ? null : next }));
      close(); toast('Revisión guardada' + (later ? '' : ' · próxima: ' + fmtD(next)));
    } catch (e) { setSaving(false); toast('No se pudieron guardar las fotos. Intenta con menos imágenes.', 'bad'); }
  }
  return html`<${Modal} title=${`Revisión de ${fullName(st)}`} sub=${fmtLong(today())} onClose=${async () => { if (photos.length || rows.some(r => r.value)) { if (!(await confirmBox({ title: '¿Salir de la revisión?', text: 'Perderás las fotos y medidas que no guardaste.', ok: 'Salir', danger: true }))) return; } close(); }} size="full"
    footer=${html`<button class="btn ghost" disabled=${step === 0} onClick=${() => setStep(step - 1)}><${Ic} n="chevL" s=${15} />Atrás</button><span class="grow"></span>
      ${step < 3 ? html`<button class="btn primary" onClick=${() => setStep(step + 1)}>Continuar<${Ic} n="chevR" s=${15} /></button>` : html`<button class="btn primary" disabled=${saving} onClick=${save}>${saving ? 'Guardando…' : 'Guardar revisión'}</button>`}`}>
    <ol class="stepper">${steps.map((x, i) => html`<li class=${i === step ? 'on' : i < step ? 'done' : ''}><button onClick=${() => setStep(i)}><span>${i < step ? html`<${Ic} n="check" s=${13} w=${3} />` : i + 1}</span>${x}</button></li>`)}</ol>
    <div class="wiz">
    ${step === 0 && html`<div>
      <h3 class="wiz-t">Fotos del cuerpo actual</h3><p class="muted">Agrega una o varias fotos y ponle nombre a cada una.</p>
      <input type="file" accept="image/*" ref=${fileRef} hidden onChange=${pick} />
      ${pending ? html`<div class="ph-pending"><img src=${pending.src} alt="Vista previa" />
        <div class="stack-s"><${Field} label="Nombre de la foto"><input id="ph-name" value=${pending.name} onInput=${e => setPending({ ...pending, name: e.target.value })} /><//>
          <div class="chips">${PHOTO_NAMES.map(n => html`<button type="button" class=${'chip ' + (pending.name === n ? 'on' : '')} onClick=${() => setPending({ ...pending, name: n })}>${n}</button>`)}</div>
          <div class="row gap-s"><button class="btn primary" onClick=${() => { setPhotos([...photos, pending]); setPending(null); }}><${Ic} n="check" s=${15} />Guardar foto</button><button class="btn ghost" onClick=${() => setPending(null)}>Descartar</button></div></div></div>`
      : html`<button class="dropzone" onClick=${() => fileRef.current.click()}><${Ic} n="camera" s=${26} /><strong>Agregar foto</strong><span class="muted sm">Desde la cámara o la galería</span></button>`}
      ${photos.length > 0 && html`<div class="thumbs mt">${photos.map((p, i) => html`<div class="thumb"><img src=${p.src} alt=${p.name} /><input aria-label="Nombre de la foto" value=${p.name} onInput=${e => { const n = photos.slice(); n[i] = { ...p, name: e.target.value }; setPhotos(n); }} /><button class="icon-btn sm x" aria-label="Quitar foto" onClick=${() => setPhotos(photos.filter((_, j) => j !== i))}><${Ic} n="x" s=${14} /></button></div>`)}</div>`}
      ${!photos.length && !pending && html`<p class="muted sm mt">Las fotos son opcionales: puedes continuar sin ellas.</p>`}
    </div>`}
    ${step === 1 && html`<div>
      <h3 class="wiz-t">Medidas</h3>
      ${useTpl === null ? html`<p>¿Usar medidas predeterminadas?</p>
        <div class="choice2"><button class="choice" disabled=${!tpls.length} onClick=${() => tpls.length === 1 ? applyTpl(tpls[0]) : setUseTpl('pick')}><${Ic} n="layers" s=${22} /><strong>Sí, usar una plantilla</strong><span class="muted sm">${tpls.length ? tpls.length + ' disponibles' : 'Aún no tienes plantillas de medidas'}</span></button>
          <button class="choice" onClick=${() => { setUseTpl(false); setRows([{ name: '', unit: 'cm', value: '' }]); }}><${Ic} n="plus" s=${22} /><strong>No, agregar mis medidas</strong><span class="muted sm">Defines cada medida y su unidad</span></button></div>`
      : useTpl === 'pick' ? html`<p>Elige la plantilla:</p><div class="choice2">${tpls.map(tp => html`<button class="choice" onClick=${() => applyTpl(tp)}><strong>${tp.name}</strong><span class="muted sm">${tp.fields.map(f => f.name).join(', ')}</span></button>`)}</div>`
      : html`<div class="mrows">${rows.map((r, i) => html`<div class="mrow">
          <input class="m-name" aria-label="Medida" placeholder="Medida (ej. Cintura)" value=${r.name} onInput=${e => { const n = rows.slice(); n[i] = { ...r, name: e.target.value }; setRows(n); }} />
          <input class="m-val" aria-label="Valor" inputmode="decimal" placeholder="Valor" value=${r.value} onInput=${e => { const n = rows.slice(); n[i] = { ...r, value: e.target.value.replace(',', '.') }; setRows(n); }} />
          <input class="m-unit" aria-label="Unidad" placeholder="cm" value=${r.unit} onInput=${e => { const n = rows.slice(); n[i] = { ...r, unit: e.target.value }; setRows(n); }} />
          <span class="m-prev muted sm">${prevVal(r.name) ? 'Antes: ' + prevVal(r.name) : ''}</span>
          <button class="icon-btn sm" aria-label="Quitar medida" onClick=${() => setRows(rows.filter((_, j) => j !== i))}><${Ic} n="x" s=${15} /></button></div>`)}
        <div class="row gap-s wrap"><button class="btn ghost sm" onClick=${() => setRows([...rows, { name: '', unit: 'cm', value: '' }])}><${Ic} n="plus" s=${15} />Agregar medida</button><button class="link sm" onClick=${() => { setUseTpl(null); setRows([]); }}>Cambiar de plantilla</button></div></div>`}
    </div>`}
    ${step === 2 && html`<div>
      <h3 class="wiz-t">Desde la última revisión${lr ? ' (' + fmtD(lr.date) + ')' : ''}</h3>
      <div class="kpis three"><${Kpi} label="Entrenamientos" value=${om.s.done} icon="dumbbell" /><${Kpi} label="Días omitidos" value=${om.days.length} tone=${om.days.length ? 'bad' : 'good'} icon="alert" /><${Kpi} label="Dieta cumplida" value=${om.s.dietPct == null ? '—' : om.s.dietPct + '%'} sub=${`${om.meals.length} comidas omitidas`} tone=${om.meals.length ? 'bad' : ''} icon="food" /></div>
      ${(om.days.length > 0 || om.meals.length > 0) && html`<div class="omit-box">
        ${om.days.map(d => html`<div class="omit-i"><${Pill} k="bad">Entrenamiento<//><strong>${fmtD(d.date)} · ${d.day}</strong><em>${d.reason ? '“' + d.reason + '”' : 'Sin motivo'}</em></div>`)}
        ${om.meals.map(m => html`<div class="omit-i"><${Pill} k="bad">Comida<//><strong>${fmtD(m.date)} · ${m.meal}</strong><em>${m.reason ? '“' + m.reason + '”' : 'Sin motivo'}</em></div>`)}
      </div>`}
      <${Field} label="Observaciones de la revisión"><textarea id="rv-notes" rows="4" placeholder="Cómo lo ves, qué ajustar en la dieta o la rutina…" value=${notes} onInput=${e => setNotes(e.target.value)}></textarea><//>
    </div>`}
    ${step === 3 && html`<div>
      <h3 class="wiz-t">Fijar próxima revisión</h3>
      <div class="choice2"><label class=${'choice ' + (!later ? 'on' : '')}><input type="radio" name="nx" checked=${!later} onChange=${() => setLater(false)} /><strong>Asignar fecha</strong>
          <input id="rv-next" type="date" value=${next} min=${today()} onInput=${e => setNext(e.target.value)} onClick=${() => setLater(false)} />
          <div class="chips">${[7, 14, 21, 30].map(d => html`<button type="button" class=${'chip ' + (!later && next === addDays(today(), d) ? 'on' : '')} onClick=${() => { setLater(false); setNext(addDays(today(), d)); }}>+${d} días</button>`)}</div></label>
        <label class=${'choice ' + (later ? 'on' : '')}><input type="radio" name="nx" checked=${later} onChange=${() => setLater(true)} /><strong>Asignar después</strong><span class="muted sm">Quedará sin fecha hasta que la definas.</span></label></div>
      <div class="panel mt"><div class="eyebrow">Resumen</div><div class="kv"><span>Fotos</span><strong>${photos.length}</strong></div><div class="kv"><span>Medidas registradas</span><strong>${rows.filter(r => r.name && r.value).length}</strong></div><div class="kv"><span>Próxima revisión</span><strong>${later ? 'Sin fecha' : fmtD(next)}</strong></div></div>
    </div>`}
    </div>
  <//>`;
}

/* ---------- Editor de dieta ---------- */
function productNames(tid) {
  const s = new Set(['Avena', 'Arroz cocido', 'Pechuga de pollo', 'Carne de res', 'Huevo', 'Clara de huevo', 'Pan integral', 'Plátano', 'Manzana', 'Palta', 'Atún en agua', 'Pescado', 'Camote', 'Papa', 'Quinua cocida', 'Yogur griego', 'Leche descremada', 'Queso fresco', 'Almendras', 'Mantequilla de maní', 'Aceite de oliva', 'Verduras salteadas', 'Ensalada mixta', 'Proteína en polvo', 'Granola', 'Cacao en polvo', 'Agua', 'Tomate', 'Cebolla roja', 'Lentejas cocidas', 'Frejoles cocidos', 'Fideos integrales']);
  Q.tpls(tid, 'recipe').forEach(r => (r.items || []).forEach(i => i.name && s.add(i.name)));
  Q.students(tid).forEach(st => Object.values(st.diet?.days || {}).forEach(d => Object.values(d).forEach(sl => [...(sl.items || []), ...(sl.dishes || []).flatMap(x => x.items || [])].forEach(i => i.name && s.add(i.name)))));
  return Array.from(s).sort();
}
function ItemRows({ items, onChange, lockNames }) {
  const upd = (i, k, v) => { const n = items.slice(); n[i] = { ...n[i], [k]: v }; onChange(n); };
  return html`<div class="irows">${items.map((it, i) => html`<div class="irow">
    <input class="i-q" aria-label="Cantidad" inputmode="decimal" value=${it.q} onInput=${e => upd(i, 'q', e.target.value.replace(',', '.'))} />
    ${lockNames ? html`<span class="i-u ro">${it.u}</span><span class="i-n ro">${it.name}</span>` : html`
    <select class="i-u" aria-label="Unidad" value=${it.u} onChange=${e => upd(i, 'u', e.target.value)}>${UNITS.map(u => html`<option value=${u} selected=${u === it.u}>${u}</option>`)}</select>
    <input class="i-n" aria-label="Producto" list="dl-products" placeholder="Producto" value=${it.name} onInput=${e => upd(i, 'name', e.target.value)} />
    <button class="icon-btn sm" aria-label="Quitar producto" onClick=${() => onChange(items.filter((_, j) => j !== i))}><${Ic} n="x" s=${15} /></button>`}
  </div>`)}</div>`;
}
function StepRows({ steps, onChange }) {
  return html`<div class="srows">${steps.map((s, i) => html`<div class="srow"><span class="sn">Paso ${i + 1}</span><input aria-label=${'Paso ' + (i + 1)} value=${s} placeholder="Describe el paso" onInput=${e => { const n = steps.slice(); n[i] = e.target.value; onChange(n); }} /><button class="icon-btn sm" aria-label="Quitar paso" onClick=${() => onChange(steps.filter((_, j) => j !== i))}><${Ic} n="x" s=${15} /></button></div>`)}
    <button class="link sm" onClick=${() => onChange([...steps, ''])}>+ Agregar paso</button></div>`;
}
function MealsEditor({ meals, onChange }) {
  const upd = (i, k, v) => { const n = meals.slice(); n[i] = { ...n[i], [k]: v }; onChange(n); };
  const mv = (i, d) => { const n = meals.slice(); const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  return html`<div class="mealsed">${meals.map((m, i) => html`<div class="mrow2">
    <span class="exn">${i + 1}</span><input aria-label="Nombre de la comida" value=${m.name} placeholder="Nombre de la comida" onInput=${e => upd(i, 'name', e.target.value)} />
    <input type="time" aria-label="Hora" value=${m.time || ''} onInput=${e => upd(i, 'time', e.target.value)} />
    <button class="icon-btn sm" aria-label="Subir" onClick=${() => mv(i, -1)}><${Ic} n="up" s=${15} /></button><button class="icon-btn sm" aria-label="Bajar" onClick=${() => mv(i, 1)}><${Ic} n="down" s=${15} /></button>
    <button class="icon-btn sm" aria-label="Quitar comida" onClick=${() => onChange(meals.filter((_, j) => j !== i))}><${Ic} n="x" s=${15} /></button></div>`)}
    <button class="btn ghost sm" onClick=${() => onChange([...meals, { id: 'm' + uid(), name: '', time: '' }])}><${Ic} n="plus" s=${15} />Agregar comida</button></div>`;
}
function DishPicker({ close, tid, onPick }) {
  const list = Q.tpls(tid, 'recipe'); const [q, setQ] = useState('');
  const f = list.filter(r => !q || normTxt(r.name).includes(normTxt(q)));
  return html`<${Modal} title="Agregar plato guardado" onClose=${close} size="sm">
    <div class="search mb"><${Ic} n="search" s=${16} /><input id="dp-q" placeholder="Buscar plato" value=${q} onInput=${e => setQ(e.target.value)} /></div>
    ${f.length ? html`<ul class="list">${f.map(r => html`<li class="li clickable" onClick=${() => { onPick(r); close(); }}><${Ic} n="book" s=${18} /><div class="li-main"><strong>${r.name}</strong><span class="muted sm">${(r.items || []).map(itemShort).join(' + ')}</span></div><${Ic} n="plus" s=${16} /></li>`)}</ul>`
      : html`<${Empty} icon="book" title="Sin platos guardados" text="Crea platos con su preparación en Plantillas → Platos." />`}
  <//>`;
}

function DietEditor({ close, st, tr }) {
  const [diet, setDiet] = useState(() => st.diet && (st.diet.meals || []).length ? clone(st.diet) : null);
  const [setup, setSetup] = useState(diet ? null : 'ask');
  const [newMeals, setNewMeals] = useState([{ id: 'm1', name: 'Desayuno', time: '07:00' }, { id: 'm3', name: 'Almuerzo', time: '13:00' }, { id: 'm5', name: 'Cena', time: '20:00' }]);
  const [day, setDay] = useState(dow(today()));
  const [mealsOpen, setMealsOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyTo, setCopyTo] = useState([]);
  const [stepsOpen, setStepsOpen] = useState({});
  const [dirty, setDirty] = useState(false);
  const schemes = Q.tpls(tr.id, 'scheme');
  const names = useMemo(() => productNames(tr.id), []);
  const upd = fn => { setDiet(d => { const n = clone(d); fn(n); return n; }); setDirty(true); };
  const slot = (d, mid) => ((diet.days || {})[d] || {})[mid] || emptySlot();
  const setSlot = (d, mid, s) => upd(n => { n.days = n.days || {}; n.days[d] = n.days[d] || {}; n.days[d][mid] = s; });
  const startWith = meals => { setDiet({ meals: meals.map(m => ({ id: m.id || 'm' + uid(), name: m.name, time: m.time || '' })), days: {} }); setSetup(null); setDirty(true); };
  const applyScheme = sc => upd(n => { const old = n.meals; n.meals = sc.meals.map(m => { const match = old.find(o => normTxt(o.name) === normTxt(m.name)); return { id: match ? match.id : 'm' + uid(), name: m.name, time: m.time || '' }; }); });
  const save = () => { const o = clone(Q.student(st.id)); o.diet = diet; Store.put('students', o); toast('Dieta guardada'); close(); };
  const tryClose = async () => { if (dirty && !(await confirmBox({ title: '¿Salir sin guardar?', text: 'Perderás los cambios de la dieta.', ok: 'Salir', danger: true }))) return; close(); };
  const saveAsDish = async (sl, mealName) => {
    const name = await confirmBox({ title: 'Guardar como plato', text: 'Quedará en tus platos para usarlo con otros alumnos.', ok: 'Guardar', input: { label: 'Nombre del plato', required: true, placeholder: mealName } });
    if (!name || name === true) return;
    Store.put('tpl', { id: uid(), trainerId: tr.id, kind: 'recipe', name, items: clone(sl.items), steps: (sl.steps || []).filter(Boolean), createdAt: Date.now() });
    toast('Plato guardado');
  };
  return html`<${Modal} title=${`Dieta de ${fullName(st)}`} sub=${setup ? 'Configuración inicial' : 'Agrega productos o platos a cada comida'} onClose=${tryClose} size="full"
    footer=${setup ? html`<button class="btn ghost" onClick=${tryClose}>Cancelar</button>` : html`<button class="btn ghost" onClick=${tryClose}>Cancelar</button><span class="grow"></span><button class="btn primary" onClick=${save}><${Ic} n="check" s=${15} />Guardar dieta</button>`}>
    <datalist id="dl-products">${names.map(n => html`<option value=${n} />`)}</datalist>
    ${setup === 'ask' && html`<div class="wiz"><h3 class="wiz-t">¿Usar un esquema de dieta predeterminado?</h3>
      <div class="choice2"><button class="choice" disabled=${!schemes.length} onClick=${() => setSetup('pick')}><${Ic} n="layers" s=${22} /><strong>Sí, elegir un esquema</strong><span class="muted sm">${schemes.length ? schemes.map(s => s.name).join(' · ') : 'Aún no tienes esquemas'}</span></button>
        <button class="choice" onClick=${() => setSetup('new')}><${Ic} n="plus" s=${22} /><strong>No, crear desde cero</strong><span class="muted sm">Defines cuántas comidas y sus nombres</span></button></div></div>`}
    ${setup === 'pick' && html`<div class="wiz"><h3 class="wiz-t">Elige el esquema</h3><div class="choice2">${schemes.map(sc => html`<button class="choice" onClick=${() => startWith(sc.meals)}><strong>${sc.name}</strong><span class="muted sm">${sc.meals.map(m => m.name).join(' · ')}</span></button>`)}</div><button class="link mt" onClick=${() => setSetup('ask')}>← Volver</button></div>`}
    ${setup === 'new' && html`<div class="wiz"><h3 class="wiz-t">Comidas del día</h3><p class="muted">Se aplican a los 7 días; luego llenas cada una.</p><${MealsEditor} meals=${newMeals} onChange=${setNewMeals} />
      <div class="row gap-s mt"><button class="btn primary" disabled=${!newMeals.filter(m => m.name.trim()).length} onClick=${() => startWith(newMeals.filter(m => m.name.trim()))}>Continuar</button><button class="link" onClick=${() => setSetup('ask')}>← Volver</button></div></div>`}
    ${!setup && diet && html`<div class="ded">
      <div class="ded-bar">
        <div class="daychips">${DIAS3.map((d, i) => { const has = diet.meals.some(m => slotHas(slot(i, m.id))); return html`<button class=${'dchip ' + (day === i ? 'on' : '')} onClick=${() => setDay(i)}>${d}${has && html`<i class="dot-s"></i>`}</button>`; })}</div>
        <div class="row gap-s wrap">
          <button class="btn ghost sm" onClick=${() => setMealsOpen(!mealsOpen)}><${Ic} n="edit" s=${15} />Comidas (${diet.meals.length})</button>
          ${schemes.length > 0 && html`<select id="de-scheme" class="sel sm" value="" onChange=${e => { const sc = schemes.find(x => x.id === e.target.value); if (sc) applyScheme(sc); e.target.value = ''; }}><option value="">Aplicar esquema…</option>${schemes.map(s => html`<option value=${s.id}>${s.name}</option>`)}</select>`}
          <button class="btn ghost sm" onClick=${() => { setCopyOpen(!copyOpen); setCopyTo([]); }}><${Ic} n="copy" s=${15} />Copiar ${DIAS[day].toLowerCase()} a…</button>
        </div>
      </div>
      ${mealsOpen && html`<div class="panel"><div class="eyebrow">Comidas del día (todas las jornadas)</div><${MealsEditor} meals=${diet.meals} onChange=${m => upd(n => { n.meals = m; })} /></div>`}
      ${copyOpen && html`<div class="panel row gap-s wrap"><span>Copiar el ${DIAS[day].toLowerCase()} a:</span>${DIAS3.map((d, i) => i !== day && html`<label class="chk"><input type="checkbox" checked=${copyTo.includes(i)} onChange=${e => setCopyTo(e.target.checked ? [...copyTo, i] : copyTo.filter(x => x !== i))} />${d}</label>`)}
        <button class="btn sm" disabled=${!copyTo.length} onClick=${() => { upd(n => { copyTo.forEach(i => { n.days[i] = clone((n.days || {})[day] || {}); }); }); setCopyOpen(false); toast('Día copiado'); }}>Copiar</button></div>`}
      <h3 class="day-title">${DIAS[day]}</h3>
      <div class="meal-eds">${diet.meals.map(m => { const sl = slot(day, m.id); const key = day + '_' + m.id; const stOpen = stepsOpen[key] || (sl.steps || []).length > 0; return html`<section class="meal-ed">
        <header><strong>${m.name || 'Comida'}</strong>${m.time && html`<span class="muted sm">${m.time}</span>`}</header>
        ${(sl.dishes || []).map((d, di) => html`<div class="dish-ed"><div class="row between"><span class="dish-n"><${Ic} n="book" s=${14} /> ${d.name}</span><button class="icon-btn sm" aria-label="Quitar plato" onClick=${() => setSlot(day, m.id, { ...sl, dishes: sl.dishes.filter((_, j) => j !== di) })}><${Ic} n="x" s=${15} /></button></div>
          <${ItemRows} items=${d.items || []} lockNames onChange=${items => { const ds = sl.dishes.slice(); ds[di] = { ...d, items }; setSlot(day, m.id, { ...sl, dishes: ds }); }} />
          ${(d.steps || []).length > 0 && html`<ol class="steps sm">${d.steps.map(x => html`<li>${x}</li>`)}</ol>`}</div>`)}
        <${ItemRows} items=${sl.items || []} onChange=${items => setSlot(day, m.id, { ...sl, items })} />
        <div class="row gap-s wrap">
          <button class="btn ghost sm" onClick=${() => setSlot(day, m.id, { ...sl, items: [...(sl.items || []), { q: '', u: 'g', name: '' }] })}><${Ic} n="plus" s=${15} />Producto</button>
          <button class="btn ghost sm" onClick=${() => openModal(DishPicker, { tid: tr.id, onPick: r => setSlot(day, m.id, { ...sl, dishes: [...(sl.dishes || []), { rid: r.id, name: r.name, items: clone(r.items || []), steps: clone(r.steps || []) }] }) })}><${Ic} n="book" s=${15} />Plato guardado</button>
          ${!stOpen && (sl.items || []).length > 0 && html`<button class="link sm" onClick=${() => setStepsOpen({ ...stepsOpen, [key]: true })}>+ Receta (opcional)</button>`}
          ${(sl.items || []).filter(i => i.name).length > 1 && html`<button class="link sm" onClick=${() => saveAsDish(sl, m.name)}>Guardar como plato</button>`}
        </div>
        ${stOpen && html`<div class="recipe-ed"><div class="eyebrow">Preparación (opcional)</div><${StepRows} steps=${sl.steps && sl.steps.length ? sl.steps : ['']} onChange=${steps => setSlot(day, m.id, { ...sl, steps })} /></div>`}
      </section>`; })}</div>
    </div>`}
  <//>`;
}

/* ---------- Editor de rutina ---------- */
const DAY_SUGGEST = ['Pecho', 'Espalda', 'Pierna', 'Piernas', 'Hombros', 'Brazos', 'Glúteos', 'Torso', 'Full body', 'Core', 'Cardio', 'Empuje', 'Jalón'];
function ExRows({ list, onChange }) {
  const upd = (i, k, v) => { const n = list.slice(); n[i] = { ...n[i], [k]: v }; onChange(n); };
  const mv = (i, d) => { const n = list.slice(); const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  return html`<div class="exrows">${list.map((e, i) => html`<div class="exrow">
    <div class="ex-top"><span class="exn">${i + 1}</span><input class="ex-name" aria-label="Nombre del ejercicio" list="dl-ex" placeholder="Nombre del ejercicio" value=${e.name} onInput=${ev => upd(i, 'name', ev.target.value)} />
      <button class="icon-btn sm" aria-label="Ver en 3D" title="Ver en 3D" onClick=${() => preview3D(e.name)}><${Ic} n="cube" s=${16} /></button>
      <button class="icon-btn sm" aria-label="Subir" onClick=${() => mv(i, -1)}><${Ic} n="up" s=${15} /></button><button class="icon-btn sm" aria-label="Bajar" onClick=${() => mv(i, 1)}><${Ic} n="down" s=${15} /></button>
      <button class="icon-btn sm danger-t" aria-label="Quitar ejercicio" onClick=${() => onChange(list.filter((_, j) => j !== i))}><${Ic} n="trash" s=${15} /></button></div>
    <div class="ex-grid">
      <label><span>Series</span><input inputmode="numeric" value=${e.sets} onInput=${ev => upd(i, 'sets', Math.max(1, Math.min(20, parseInt(ev.target.value) || 1)))} /></label>
      <label><span>Repeticiones</span><input value=${e.reps} placeholder="10 o 8-12" onInput=${ev => upd(i, 'reps', ev.target.value)} /></label>
      <label><span>Descanso (s)</span><input inputmode="numeric" value=${e.rest} onInput=${ev => upd(i, 'rest', Math.max(0, parseInt(ev.target.value) || 0))} /></label>
      <label class="span"><span>Acotación o instrucción</span><input value=${e.note || ''} placeholder="Ej. baja en 2 segundos" onInput=${ev => upd(i, 'note', ev.target.value)} /></label>
    </div></div>`)}
    <button class="btn ghost sm" onClick=${() => onChange([...list, { id: uid(), name: '', sets: 3, reps: '12', rest: 60, note: '' }])}><${Ic} n="plus" s=${15} />Agregar ejercicio</button></div>`;
}
function DaysSetup({ onDone, initial }) {
  const [n, setN] = useState(initial ? initial.length : 5);
  const [names, setNames] = useState(initial ? initial.map(d => d.name) : ['Pecho', 'Espalda', 'Pierna', 'Hombros', 'Piernas', 'Brazos', 'Cardio']);
  return html`<div class="wiz"><h3 class="wiz-t">¿Cuántos días a la semana?</h3>
    <div class="chips big">${[1, 2, 3, 4, 5, 6, 7].map(k => html`<button type="button" class=${'chip ' + (n === k ? 'on' : '')} onClick=${() => setN(k)}>${k}</button>`)}</div>
    <h3 class="wiz-t mt">Nombre de cada día</h3>
    <div class="days-names">${Array.from({ length: n }, (_, i) => html`<label class="dn"><${Plate} i=${i} label=${'D' + (i + 1)} size=${34} /><input list="dl-days" aria-label=${'Día ' + (i + 1)} value=${names[i] || ''} placeholder="Ej. Pecho" onInput=${e => { const c = names.slice(); c[i] = e.target.value; setNames(c); }} /></label>`)}</div>
    <datalist id="dl-days">${DAY_SUGGEST.map(d => html`<option value=${d} />`)}</datalist>
    <button class="btn primary mt" onClick=${() => onDone(Array.from({ length: n }, (_, i) => ({ name: (names[i] || '').trim() || 'Día ' + (i + 1), exercises: (initial && initial[i] && initial[i].exercises) || [] })))}>Confirmar días</button></div>`;
}
function RoutineEditor({ close, st, tr, tpl }) {
  const isTpl = !!tpl;
  const src = isTpl ? (tpl.days || null) : (st.routine && (st.routine.days || []).length ? st.routine.days : null);
  const [days, setDays] = useState(() => src && src.length ? clone(src).map(d => ({ ...d, exercises: (d.exercises || []).map(e => ({ id: e.id || uid(), ...e })) })) : null);
  const [setup, setSetup] = useState(days ? null : (isTpl ? 'days' : 'ask'));
  const [sel, setSel] = useState(0);
  const [tname, setTname] = useState(tpl ? tpl.name || '' : '');
  const [dirty, setDirty] = useState(false);
  const tpls = Q.tpls(tr.id, 'routine');
  const updDay = (i, d) => { const n = days.slice(); n[i] = d; setDays(n); setDirty(true); };
  const exNames = useMemo(() => { const s = new Set(Fig3D.LIBRARY); Q.tpls(tr.id, 'routine').forEach(t => (t.days || []).forEach(d => (d.exercises || []).forEach(e => e.name && s.add(e.name)))); return Array.from(s).sort(); }, []);
  const save = () => {
    if (isTpl) {
      if (!tname.trim()) { toast('Ponle un nombre a la plantilla', 'bad'); return; }
      Store.put('tpl', Object.assign({}, tpl.id ? tpl : { id: uid(), trainerId: tr.id, kind: 'routine', createdAt: Date.now() }, { name: tname.trim(), days }));
      toast('Plantilla guardada'); close(); return;
    }
    const o = clone(Q.student(st.id));
    const old = o.routine || {}; const sig = d => (d || []).map(x => x.name).join('|');
    o.routine = { days, ver: sig(old.days) === sig(days) ? (old.ver || 1) : (old.ver || 0) + 1, updatedAt: Date.now() };
    Store.put('students', o); toast('Rutina guardada'); close();
  };
  const saveAsTpl = async () => {
    const name = await confirmBox({ title: 'Guardar como plantilla', text: 'Podrás usarla con otros alumnos.', ok: 'Guardar', input: { label: 'Nombre de la plantilla', required: true, placeholder: `Rutina ${days.length} días` } });
    if (!name || name === true) return;
    Store.put('tpl', { id: uid(), trainerId: tr.id, kind: 'routine', name, days: clone(days), createdAt: Date.now() }); toast('Plantilla guardada');
  };
  const tryClose = async () => { if (dirty && !(await confirmBox({ title: '¿Salir sin guardar?', text: 'Perderás los cambios.', ok: 'Salir', danger: true }))) return; close(); };
  return html`<${Modal} title=${isTpl ? (tpl.id ? 'Editar plantilla de rutina' : 'Nueva plantilla de rutina') : `Rutina de ${fullName(st)}`} onClose=${tryClose} size="full"
    footer=${html`<button class="btn ghost" onClick=${tryClose}>Cancelar</button><span class="grow"></span>${!setup && days && html`${!isTpl && html`<button class="btn ghost" onClick=${saveAsTpl}><${Ic} n="layers" s=${15} />Guardar como plantilla</button>`}<button class="btn primary" onClick=${save}><${Ic} n="check" s=${15} />Guardar ${isTpl ? 'plantilla' : 'rutina'}</button>`}`}>
    <datalist id="dl-ex">${exNames.map(n => html`<option value=${n} />`)}</datalist>
    ${isTpl && html`<${Field} label="Nombre de la plantilla" cls="mb"><input id="rt-name" value=${tname} placeholder="Ej. Hipertrofia 4 días" onInput=${e => { setTname(e.target.value); setDirty(true); }} /><//>`}
    ${setup === 'ask' && html`<div class="wiz"><h3 class="wiz-t">¿Usar una de tus plantillas?</h3>
      <div class="choice2">${tpls.map(t => html`<button class="choice" onClick=${() => { setDays(clone(t.days).map(d => ({ ...d, exercises: (d.exercises || []).map(e => ({ ...e, id: uid() })) }))); setSetup(null); setDirty(true); }}><${Ic} n="layers" s=${20} /><strong>${t.name}</strong><span class="muted sm">${t.days.length} días · ${t.days.map(d => d.name).join(', ')}</span></button>`)}
        <button class="choice" onClick=${() => setSetup('days')}><${Ic} n="plus" s=${20} /><strong>Crear desde cero</strong><span class="muted sm">Eliges los días y agregas los ejercicios</span></button></div></div>`}
    ${setup === 'days' && html`<${DaysSetup} initial=${days} onDone=${d => { setDays(d); setSetup(null); setSel(0); setDirty(true); }} />`}
    ${!setup && days && html`<div class="red">
      <div class="red-days">${days.map((d, i) => html`<button class=${'red-day ' + (sel === i ? 'on' : '')} onClick=${() => setSel(i)}><${Plate} i=${i} label=${'D' + (i + 1)} size=${28} /><span><strong>${d.name}</strong><small>${(d.exercises || []).length} ejercicios</small></span></button>`)}
        <button class="btn ghost sm" onClick=${() => setSetup('days')}><${Ic} n="edit" s=${15} />Cambiar días</button></div>
      ${days[sel] && html`<div class="red-main">
        <${Field} label=${`Día ${sel + 1}`}><input id="rd-name" list="dl-days" value=${days[sel].name} onInput=${e => updDay(sel, { ...days[sel], name: e.target.value })} /><//>
        <datalist id="dl-days">${DAY_SUGGEST.map(d => html`<option value=${d} />`)}</datalist>
        <${ExRows} list=${days[sel].exercises || []} onChange=${ex => updDay(sel, { ...days[sel], exercises: ex })} />
      </div>`}
    </div>`}
  <//>`;
}

/* ---------- Agenda ---------- */
function TrainerAgenda({ tr, go }) {
  const t = today(); const sts = Q.students(tr.id);
  const g = [['Hoy o atrasadas', sts.filter(s => s.nextReview && s.nextReview <= t)], ['Próximos 7 días', sts.filter(s => s.nextReview && s.nextReview > t && diffDays(t, s.nextReview) <= 7)], ['Más adelante', sts.filter(s => s.nextReview && diffDays(t, s.nextReview) > 7)], ['Sin fecha', sts.filter(s => !s.nextReview)]];
  return html`<div class="page">${g.map(([title, list], gi) => html`<section class="card"><div class="card-h"><h2>${title}</h2><span class="muted sm">${list.length}</span></div>
    ${list.length ? html`<ul class="list">${list.sort((a, b) => (a.nextReview || '') < (b.nextReview || '') ? -1 : 1).map(s => html`<li class="li">
      <${Avatar} p=${s} size=${34} tone=${hashTone(s.id)} /><div class="li-main"><strong>${fullName(s)}</strong><span class="muted sm">${s.nextReview ? fmtLong(s.nextReview) : 'Asigna una fecha desde su perfil'}${lastReview(s.id) ? ' · última: ' + fmtDs(lastReview(s.id).date) : ''}</span></div>
      <div class="li-act"><button class="btn ghost sm" onClick=${() => go('student', { id: s.id, tab: 'revisiones' })}>Ver</button><button class=${'btn sm ' + (gi === 0 ? 'primary' : '')} onClick=${() => openModal(ReviewWizard, { st: s })}>Empezar revisión</button></div></li>`)}</ul>` : html`<p class="muted sm">Nadie en este grupo.</p>`}
  </section>`)}</div>`;
}

/* ---------- Plantillas ---------- */
function Templates({ tr }) {
  const [tab, setTab] = useState('measure');
  const list = Q.tpls(tr.id, tab);
  const info = { measure: ['Medidas', 'Conjuntos de medidas para tus revisiones.', 'ruler'], scheme: ['Esquemas de dieta', 'Solo la estructura: qué comidas tiene el día.', 'food'], recipe: ['Platos', 'Platos con ingredientes y preparación para agregar a cualquier dieta.', 'book'], routine: ['Rutinas', 'Días de la semana con sus ejercicios.', 'dumbbell'] };
  const openEd = rec => tab === 'routine' ? openModal(RoutineEditor, { tr, st: null, tpl: rec || { days: null } }) : openModal(TplEditor, { tr, kind: tab, rec });
  const desc = r => tab === 'measure' ? (r.fields || []).map(f => `${f.name} (${f.unit})`).join(' · ') : tab === 'scheme' ? (r.meals || []).map(m => m.name).join(' · ') : tab === 'recipe' ? (r.items || []).map(itemShort).join(' + ') : `${(r.days || []).length} días · ${(r.days || []).map(d => d.name).join(', ')}`;
  return html`<div class="page">
    <${Tabs} value=${tab} onChange=${setTab} tabs=${Object.entries(info).map(([k, v]) => ({ k, label: v[0], icon: v[2] }))} />
    <div class="toolbar"><p class="muted">${info[tab][1]}</p><button class="btn primary" onClick=${() => openEd(null)}><${Ic} n="plus" s=${16} />Nueva</button></div>
    ${list.length ? html`<div class="tcards">${list.map(r => html`<article class="tcard">
      <div class="row between"><strong>${r.name}</strong><div class="row"><button class="icon-btn sm" aria-label="Editar" onClick=${() => openEd(r)}><${Ic} n="edit" s=${16} /></button>
        <button class="icon-btn sm danger-t" aria-label="Eliminar" onClick=${async () => { if (await confirmBox({ title: 'Eliminar plantilla', text: `“${r.name}” dejará de estar disponible. Lo ya asignado a tus alumnos no cambia.`, ok: 'Eliminar', danger: true })) Store.del('tpl', r.id); }}><${Ic} n="trash" s=${16} /></button></div></div>
      <p class="muted sm">${desc(r)}</p>
      ${tab === 'recipe' && (r.steps || []).length > 0 && html`<ol class="steps sm">${r.steps.map(s => html`<li>${s}</li>`)}</ol>`}
    </article>`)}</div>` : html`<${Empty} icon=${info[tab][2]} title="Sin plantillas" text="Crea la primera para reutilizarla con tus alumnos." />`}
  </div>`;
}
function TplEditor({ close, tr, kind, rec }) {
  const [name, setName] = useState(rec ? rec.name : '');
  const [fields, setFields] = useState(rec && rec.fields ? clone(rec.fields) : [{ name: 'Peso', unit: 'kg' }, { name: 'Cintura', unit: 'cm' }]);
  const [meals, setMeals] = useState(rec && rec.meals ? clone(rec.meals) : [{ id: 'm1', name: 'Desayuno', time: '07:00' }, { id: 'm2', name: 'Media mañana', time: '10:00' }, { id: 'm3', name: 'Almuerzo', time: '13:00' }, { id: 'm4', name: 'Merienda', time: '16:30' }, { id: 'm5', name: 'Cena', time: '20:00' }]);
  const [items, setItems] = useState(rec && rec.items ? clone(rec.items) : [{ q: '', u: 'g', name: '' }]);
  const [steps, setSteps] = useState(rec && rec.steps ? clone(rec.steps) : ['']);
  const names = useMemo(() => productNames(tr.id), []);
  const title = { measure: 'plantilla de medidas', scheme: 'esquema de dieta', recipe: 'plato' }[kind];
  const save = () => {
    if (!name.trim()) { toast('Escribe un nombre', 'bad'); return; }
    const data = kind === 'measure' ? { fields: fields.filter(f => f.name.trim()) } : kind === 'scheme' ? { meals: meals.filter(m => m.name.trim()) } : { items: items.filter(i => i.name.trim()), steps: steps.filter(s => s.trim()) };
    Store.put('tpl', Object.assign({}, rec || { id: uid(), trainerId: tr.id, kind, createdAt: Date.now() }, { name: name.trim() }, data));
    toast('Guardado'); close();
  };
  const updF = (i, k, v) => { const n = fields.slice(); n[i] = { ...n[i], [k]: v }; setFields(n); };
  return html`<${Modal} title=${(rec ? 'Editar ' : 'Nuevo ') + title} onClose=${close} size="md" footer=${html`<button class="btn ghost" onClick=${close}>Cancelar</button><button class="btn primary" onClick=${save}>Guardar</button>`}>
    <datalist id="dl-products">${names.map(n => html`<option value=${n} />`)}</datalist>
    <${Field} label="Nombre"><input id="tpl-name" value=${name} placeholder=${kind === 'recipe' ? 'Ej. Lomo saltado' : kind === 'scheme' ? 'Ej. 5 comidas' : 'Ej. Control mensual'} onInput=${e => setName(e.target.value)} /><//>
    ${kind === 'measure' && html`<div class="eyebrow mt">Medidas</div><div class="mrows">${fields.map((f, i) => html`<div class="mrow two"><input aria-label="Medida" placeholder="Ej. Pecho" value=${f.name} onInput=${e => updF(i, 'name', e.target.value)} />
      <select aria-label="Unidad" value=${f.unit} onChange=${e => updF(i, 'unit', e.target.value)}>${['cm', 'kg', 'lb', '%', 'mm', 'in', 'kcal', 'lpm'].map(u => html`<option value=${u} selected=${u === f.unit}>${u}</option>`)}</select>
      <button class="icon-btn sm" aria-label="Quitar" onClick=${() => setFields(fields.filter((_, j) => j !== i))}><${Ic} n="x" s=${15} /></button></div>`)}
      <button class="btn ghost sm" onClick=${() => setFields([...fields, { name: '', unit: 'cm' }])}><${Ic} n="plus" s=${15} />Agregar medida</button></div>`}
    ${kind === 'scheme' && html`<div class="eyebrow mt">Comidas del día</div><${MealsEditor} meals=${meals} onChange=${setMeals} />`}
    ${kind === 'recipe' && html`<div class="eyebrow mt">Ingredientes</div><${ItemRows} items=${items} onChange=${setItems} /><button class="btn ghost sm" onClick=${() => setItems([...items, { q: '', u: 'g', name: '' }])}><${Ic} n="plus" s=${15} />Ingrediente</button>
      <div class="eyebrow mt">Preparación</div><${StepRows} steps=${steps} onChange=${setSteps} />`}
  <//>`;
}

function TrainerAccount({ tr }) {
  return html`<div class="page narrow"><section class="card"><div class="card-h"><h2>Mi suscripción a COUCH+</h2><${PayPill} next=${tr.nextPay} /></div>
    <div class="kv"><span>Titular</span><strong>${fullName(tr)}</strong></div>
    <div class="kv"><span>Usuario</span><strong><code>${tr.user}</code></strong></div>
    <div class="kv"><span>Frecuencia</span><strong>${FREQ[tr.freq || 'mensual'].label}</strong></div>
    <div class="kv"><span>Próximo pago</span><strong>${fmtD(tr.nextPay)}</strong></div>
    ${tr.monto && html`<div class="kv"><span>Monto</span><strong>S/ ${tr.monto}</strong></div>`}
    <p class="muted sm">Recibirás un aviso aquí ${REMIND_DAYS} días antes de cada pago. Para cambios en tu plan, comunícate con el administrador.</p>
    <div class="eyebrow mt">Historial</div><${PayHistory} rec=${tr} /></section></div>`;
}
