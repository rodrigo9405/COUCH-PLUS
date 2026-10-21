/* COUCH+ · vista de superadministrador */
function AdminApp({ view, go, params }) {
  useStore();
  if (view === 'trainers') return html`<${AdminTrainers} go=${go} params=${params} />`;
  if (view === 'students') return html`<${AdminStudents} go=${go} params=${params} />`;
  if (view === 'security') return html`<${AdminSecurity} />`;
  return html`<${AdminHome} go=${go} />`;
}

function Kpi({ label, value, sub, tone, icon }) {
  return html`<div class=${'kpi ' + (tone || '')}><div class="kpi-h"><span>${label}</span>${icon && html`<${Ic} n=${icon} s=${16} />`}</div><strong>${value}</strong>${sub && html`<small>${sub}</small>`}</div>`;
}

function AdminHome({ go }) {
  const trs = Q.trainers(), sts = Q.students();
  const act = trs.filter(t => t.active !== false).length;
  const due = trs.filter(t => ['soon', 'today'].includes(payState(t.nextPay).k)), late = trs.filter(t => payState(t.nextPay).k === 'late');
  const upcoming = trs.slice().sort((a, b) => (a.nextPay || '9') < (b.nextPay || '9') ? -1 : 1).slice(0, 6);
  return html`<div class="page">
    <div class="kpis">
      <${Kpi} label="Entrenadores" value=${trs.length} sub=${`${act} activos · ${trs.length - act} inactivos`} icon="users" />
      <${Kpi} label="Alumnos" value=${sts.length} sub=${trs.length ? `${round1(sts.length / Math.max(1, trs.length))} por entrenador` : ''} icon="user" />
      <${Kpi} label="Pagos por vencer" value=${due.length} sub=${`En los próximos ${REMIND_DAYS} días`} tone=${due.length ? 'warn' : ''} icon="clock" />
      <${Kpi} label="Pagos vencidos" value=${late.length} sub=${late.length ? 'Requieren seguimiento' : 'Todo al día'} tone=${late.length ? 'bad' : 'good'} icon="alert" />
    </div>
    <div class="cols">
      <section class="card">
        <div class="card-h"><h2>Próximos pagos</h2><button class="btn ghost sm" onClick=${() => go('trainers')}>Ver entrenadores <${Ic} n="chevR" s=${14} /></button></div>
        ${upcoming.length ? html`<ul class="list">${upcoming.map(t => html`<li class="li">
          <${Avatar} p=${t} tone=${hashTone(t.id)} />
          <div class="li-main"><strong>${fullName(t)}</strong><span class="muted sm">${FREQ[t.freq || 'mensual'].label} · ${fmtD(t.nextPay)}</span></div>
          <${PayPill} next=${t.nextPay} />
          <div class="li-act"><${WaBtn} phone=${t.telefono} text=${payReminderText(t)} label="Recordar" /><button class="btn ghost sm" onClick=${() => openModal(PayModal, { col: 'trainers', rec: t })}>Registrar pago</button></div>
        </li>`)}</ul>` : html`<${Empty} icon="users" title="Aún no hay entrenadores" text="Crea el primero desde la sección Entrenadores." />`}
      </section>
      <section class="card">
        <div class="card-h"><h2>Alumnos por entrenador</h2></div>
        ${trs.length ? html`<${Bars} items=${trs.slice(0, 8).map((t, i) => ({ label: t.nombres, v: Q.students(t.id).length, color: t.active === false ? 'var(--ink-3)' : PLATE[i % 4] }))} h=${170} />` : html`<p class="muted">Sin datos.</p>`}
        <p class="muted sm mt">En gris, entrenadores inactivos: ni ellos ni sus alumnos pueden ingresar.</p>
      </section>
    </div>
  </div>`;
}

function TrainerDetail({ close, id, go }) {
  useStore();
  const t = Q.trainer(id); if (!t) { close(); return null; }
  const sts = Q.students(t.id);
  const toggle = () => { Store.put('trainers', Object.assign({}, t, { active: t.active === false })); toast(t.active === false ? 'Entrenador activado' : 'Entrenador desactivado'); };
  return html`<${Modal} title=${fullName(t)} sub=${`Entrenador · ${t.user}`} onClose=${close} size="lg"
    footer=${html`<button class="btn ghost danger-t" onClick=${() => { close(); askDeleteTrainer(t); }}><${Ic} n="trash" s=${15} />Eliminar</button><span class="grow"></span>
      <button class="btn ghost" onClick=${() => openModal(ResetPassModal, { col: 'trainers', rec: t })}><${Ic} n="lock" s=${15} />Contraseña</button>
      <button class="btn primary" onClick=${() => openModal(PersonForm, { kind: 'trainer', rec: t })}><${Ic} n="edit" s=${15} />Editar</button>`}>
    <div class=${'status-bar ' + (t.active === false ? 'off' : 'on')}>
      <${Toggle} id="td-active" checked=${t.active !== false} onChange=${toggle} label=${t.active !== false ? 'Activo' : 'Inactivo'} />
      <span class="muted sm">${t.active !== false ? `Él y sus ${sts.length} alumnos pueden ingresar.` : `Sin acceso para él y sus ${sts.length} alumnos hasta que lo reactives.`}</span>
    </div>
    <div class="grid2 mt">
      <div class="panel"><div class="eyebrow">Datos</div>
        <div class="kv"><span>DNI</span><strong>${t.dni || '—'}</strong></div>
        <div class="kv"><span>Teléfono</span><strong>${t.telefono || '—'}</strong></div>
        <div class="kv"><span>Usuario</span><strong><code>${t.user}</code></strong></div>
        <div class="kv"><span>Alta</span><strong>${t.createdAt ? fmtD(isoOfTs(t.createdAt)) : '—'}</strong></div>
      </div>
      <div class="panel"><div class="eyebrow">Suscripción</div>
        <div class="kv"><span>Frecuencia</span><strong>${FREQ[t.freq || 'mensual'].label}</strong></div>
        <div class="kv"><span>Próximo pago</span><strong>${fmtD(t.nextPay)}</strong></div>
        <div class="kv"><span>Estado</span><${PayPill} next=${t.nextPay} /></div>
        ${t.monto && html`<div class="kv"><span>Monto</span><strong>S/ ${t.monto}</strong></div>`}
        <div class="row gap-s wrap mt"><button class="btn sm" onClick=${() => openModal(PayModal, { col: 'trainers', rec: t })}><${Ic} n="wallet" s=${15} />Registrar pago</button><${WaBtn} phone=${t.telefono} text=${payReminderText(t)} label="Enviar recordatorio" /></div>
      </div>
    </div>
    <div class="grid2 mt">
      <div class="panel"><div class="eyebrow">Historial de pagos</div><${PayHistory} rec=${t} /></div>
      <div class="panel"><div class="eyebrow">Alumnos (${sts.length})</div>
        ${sts.length ? html`<ul class="mini-list">${sts.map(s => html`<li><button class="link" onClick=${() => { close(); go('students', { open: s.id }); }}>${fullName(s)}</button><span class="muted sm">${s.user}</span></li>`)}</ul>` : html`<p class="muted sm">Todavía no tiene alumnos.</p>`}
      </div>
    </div>
  <//>`;
}

function askDeleteTrainer(t) {
  openModal(({ close }) => {
    const sts = Q.students(t.id), others = Q.trainers().filter(x => x.id !== t.id);
    const [mode, setMode] = useState(sts.length && others.length ? 'move' : 'all');
    const [to, setTo] = useState(others[0] ? others[0].id : '');
    const [busy, setBusy] = useState(false);
    const ok = async () => { setBusy(true); const done = await delTrainerCascade(t.id, mode === 'move' ? to : null); setBusy(false); if (done) { close(); toast('Entrenador eliminado'); } };
    return html`<${Modal} title="Eliminar entrenador" sub=${fullName(t)} onClose=${close} size="sm" footer=${html`<button class="btn ghost" onClick=${close}>Cancelar</button><button class="btn danger" disabled=${busy} onClick=${ok}>${busy ? 'Eliminando…' : 'Eliminar'}</button>`}>
      ${sts.length ? html`<p>Tiene <strong>${sts.length} alumnos</strong>. ¿Qué hacemos con ellos?</p>
        <div class="radios">
          ${others.length > 0 && html`<label class="radio"><input type="radio" name="dm" checked=${mode === 'move'} onChange=${() => setMode('move')} /><span>Reasignarlos a otro entrenador</span></label>`}
          ${mode === 'move' && html`<select id="dt-to" value=${to} onChange=${e => setTo(e.target.value)}>${others.map(o => html`<option value=${o.id} selected=${o.id === to}>${fullName(o)}</option>`)}</select>`}
          <label class="radio"><input type="radio" name="dm" checked=${mode === 'all'} onChange=${() => setMode('all')} /><span>Eliminar también sus alumnos y todo su historial</span></label>
        </div>` : html`<p class="muted">Esta acción no se puede deshacer.</p>`}
    <//>`;
  });
}

function AdminTrainers({ go, params }) {
  const [q, setQ] = useState('');
  useEffect(() => { if (params && params.id) openModal(TrainerDetail, { id: params.id, go }); }, [params && params.id]);
  const list = Q.trainers().filter(t => !q || normTxt(fullName(t) + ' ' + t.dni + ' ' + t.user).includes(normTxt(q)));
  return html`<div class="page">
    <div class="toolbar"><div class="search"><${Ic} n="search" s=${16} /><input id="at-q" placeholder="Buscar por nombre, DNI o usuario" value=${q} onInput=${e => setQ(e.target.value)} /></div>
      <button class="btn primary" onClick=${() => openModal(PersonForm, { kind: 'trainer' })}><${Ic} n="plus" s=${16} />Nuevo entrenador</button></div>
    ${list.length ? html`<div class="table-wrap"><table class="tbl stack">
      <thead><tr><th>Entrenador</th><th>Teléfono</th><th>Plan</th><th>Próximo pago</th><th class="num">Alumnos</th><th>Acceso</th><th></th></tr></thead>
      <tbody>${list.map(t => html`<tr class=${t.active === false ? 'dim' : ''}>
        <td class="full"><button class="cell-person" onClick=${() => openModal(TrainerDetail, { id: t.id, go })}><${Avatar} p=${t} size=${32} tone=${hashTone(t.id)} /><span><strong>${fullName(t)}</strong><small class="muted">DNI ${t.dni || '—'} · ${t.user}</small></span></button></td>
        <td data-label="Teléfono">${t.telefono || '—'}</td><td data-label="Plan">${FREQ[t.freq || 'mensual'].label}</td>
        <td data-label="Próximo pago"><div class="stack"><span>${fmtD(t.nextPay)}</span><${PayPill} next=${t.nextPay} /></div></td>
        <td class="num" data-label="Alumnos">${Q.students(t.id).length}</td>
        <td data-label="Acceso"><${Toggle} id=${'tg-' + t.id} checked=${t.active !== false} onChange=${v => { Store.put('trainers', Object.assign({}, t, { active: v })); toast(v ? 'Entrenador activado' : 'Entrenador desactivado'); }} /></td>
        <td class="act"><button class="icon-btn" aria-label="Ver detalle" onClick=${() => openModal(TrainerDetail, { id: t.id, go })}><${Ic} n="eye" /></button><button class="icon-btn" aria-label="Editar" onClick=${() => openModal(PersonForm, { kind: 'trainer', rec: t })}><${Ic} n="edit" /></button><button class="icon-btn danger-t" aria-label="Eliminar" onClick=${() => askDeleteTrainer(t)}><${Ic} n="trash" /></button></td>
      </tr>`)}</tbody></table></div>` : html`<${Empty} icon="users" title=${q ? 'Sin resultados' : 'Aún no hay entrenadores'} text=${q ? 'Prueba con otro nombre o DNI.' : 'Crea la primera cuenta de entrenador.'} />`}
  </div>`;
}

function StudentInfo({ close, id }) {
  useStore();
  const s = Q.student(id); if (!s) { close(); return null; }
  const t = Q.trainer(s.trainerId);
  const st30 = stats(s, addDays(today(), -30), today());
  const w = weightSeries(s.id);
  return html`<${Modal} title=${fullName(s)} sub=${`Alumno · ${s.user}`} onClose=${close} size="lg"
    footer=${html`<button class="btn ghost danger-t" onClick=${async () => { if (await confirmBox({ title: 'Eliminar alumno', text: `Se borrará a ${fullName(s)} con todo su historial. No se puede deshacer.`, ok: 'Eliminar', danger: true })) { if (await delStudentCascade(s.id)) { close(); toast('Alumno eliminado'); } } }}><${Ic} n="trash" s=${15} />Eliminar</button><span class="grow"></span>
      <button class="btn ghost" onClick=${() => openModal(ResetPassModal, { col: 'students', rec: s })}><${Ic} n="lock" s=${15} />Contraseña</button>
      <button class="btn primary" onClick=${() => openModal(PersonForm, { kind: 'student', rec: s })}><${Ic} n="edit" s=${15} />Editar</button>`}>
    ${t && t.active === false && html`<div class="note bad"><${Ic} n="alert" s=${16} /> Su entrenador está inactivo: este alumno no puede ingresar.</div>`}
    <div class="grid2">
      <div class="panel"><div class="eyebrow">Datos</div>
        <div class="kv"><span>Entrenador</span><strong>${t ? fullName(t) : 'Sin asignar'}</strong></div>
        <div class="kv"><span>DNI</span><strong>${s.dni || '—'}</strong></div>
        <div class="kv"><span>Teléfono</span><strong>${s.telefono || '—'}</strong></div>
        <div class="kv"><span>Inicio del servicio</span><strong>${fmtD(s.inicio)}</strong></div>
        <div class="kv"><span>Próxima revisión</span><strong>${s.nextReview ? fmtD(s.nextReview) : 'Sin fecha'}</strong></div>
      </div>
      <div class="panel"><div class="eyebrow">Últimos 30 días</div>
        <div class="kv"><span>Entrenamientos completados</span><strong>${st30.done}</strong></div>
        <div class="kv"><span>Días omitidos</span><strong class=${st30.skipped ? 'bad-t' : ''}>${st30.skipped}</strong></div>
        <div class="kv"><span>Cumplimiento de dieta</span><strong>${st30.dietPct == null ? '—' : st30.dietPct + '%'}</strong></div>
        <div class="kv"><span>Peso</span><strong>${w.length ? `${numStr(w[w.length - 1].y)} kg` : '—'}${w.length > 1 ? ` (${w[w.length - 1].y - w[0].y > 0 ? '+' : ''}${numStr(round1(w[w.length - 1].y - w[0].y))})` : ''}</strong></div>
        ${s.remind && html`<div class="kv"><span>Próximo pago</span><${PayPill} next=${s.nextPay} /></div>`}
      </div>
    </div>
  <//>`;
}

function AdminStudents({ go, params }) {
  const [q, setQ] = useState(''); const [tf, setTf] = useState('');
  useEffect(() => { if (params && params.open) openModal(StudentInfo, { id: params.open }); }, [params && params.open]);
  const trs = Q.trainers();
  const list = Q.students(tf || null).filter(s => !q || normTxt(fullName(s) + ' ' + s.dni + ' ' + s.user).includes(normTxt(q)));
  return html`<div class="page">
    <div class="toolbar"><div class="search"><${Ic} n="search" s=${16} /><input id="as-q" placeholder="Buscar alumno" value=${q} onInput=${e => setQ(e.target.value)} /></div>
      <select id="as-tf" class="sel" value=${tf} onChange=${e => setTf(e.target.value)}><option value="" selected=${!tf}>Todos los entrenadores</option>${trs.map(t => html`<option value=${t.id} selected=${t.id === tf}>${fullName(t)}</option>`)}</select>
      <button class="btn primary" disabled=${!trs.length} onClick=${() => openModal(PersonForm, { kind: 'student' })}><${Ic} n="plus" s=${16} />Nuevo alumno</button></div>
    ${list.length ? html`<div class="table-wrap"><table class="tbl stack">
      <thead><tr><th>Alumno</th><th>Entrenador</th><th>Teléfono</th><th>Inicio</th><th>Próximo pago</th><th></th></tr></thead>
      <tbody>${list.map(s => { const t = Q.trainer(s.trainerId); return html`<tr class=${t && t.active === false ? 'dim' : ''}>
        <td class="full"><button class="cell-person" onClick=${() => openModal(StudentInfo, { id: s.id })}><${Avatar} p=${s} size=${32} tone=${hashTone(s.id)} /><span><strong>${fullName(s)}</strong><small class="muted">DNI ${s.dni || '—'} · ${s.user}</small></span></button></td>
        <td data-label="Entrenador">${t ? html`<span>${fullName(t)}</span>${t.active === false ? html` <${Pill} k="bad">Inactivo<//>` : ''}` : html`<span class="muted">Sin asignar</span>`}</td>
        <td data-label="Teléfono">${s.telefono || '—'}</td><td data-label="Inicio">${fmtD(s.inicio)}</td>
        <td data-label="Próximo pago">${s.remind ? html`<div class="stack"><span>${fmtD(s.nextPay)}</span><${PayPill} next=${s.nextPay} /></div>` : html`<span class="muted">Sin recordatorio</span>`}</td>
        <td class="act"><button class="icon-btn" aria-label="Ver detalle" onClick=${() => openModal(StudentInfo, { id: s.id })}><${Ic} n="eye" /></button><button class="icon-btn" aria-label="Editar" onClick=${() => openModal(PersonForm, { kind: 'student', rec: s })}><${Ic} n="edit" /></button></td>
      </tr>`; })}</tbody></table></div>` : html`<${Empty} icon="user" title="Sin alumnos" text=${trs.length ? 'Los entrenadores crean a sus alumnos; también puedes crearlos aquí.' : 'Primero crea un entrenador.'} />`}
  </div>`;
}

function AdminSecurity() {
  const [f, setF] = useState({ cur: '', pass: '', pin: '' }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const save = async e => {
    e.preventDefault(); setErr('');
    if (!f.cur) { setErr('Escribe tu contraseña actual'); return; }
    if (f.pass && f.pass.length < 8) { setErr('La nueva contraseña debe tener al menos 8 caracteres'); return; }
    if (f.pin && !/^\d{4}$/.test(f.pin)) { setErr('El código debe tener exactamente 4 dígitos'); return; }
    if (!f.pass && !f.pin) { setErr('Escribe una nueva contraseña o un nuevo código'); return; }
    setBusy(true); const r = await Accounts.changeAdmin(f); setBusy(false);
    if (r.err) { setErr(r.err); return; }
    setF({ cur: '', pass: '', pin: '' }); toast('Credenciales actualizadas');
  };
  return html`<div class="page narrow"><section class="card">
    <div class="card-h"><h2>Acceso de superadministrador</h2></div>
    <p class="muted">El usuario <code>${Accounts.username()}</code> entra con contraseña y un código de 4 dígitos.</p>
    <form class="form" onSubmit=${save}>
      <${Field} label="Contraseña actual"><input id="sec-cur" type="password" autocomplete="current-password" value=${f.cur} onInput=${e => setF({ ...f, cur: e.target.value })} /><//>
      <div class="grid2"><${Field} label="Nueva contraseña" hint="Opcional · mínimo 8 caracteres"><input id="sec-pass" type="password" autocomplete="new-password" value=${f.pass} onInput=${e => setF({ ...f, pass: e.target.value })} /><//>
      <${Field} label="Nuevo código de 4 dígitos" hint="Opcional"><input id="sec-pin" inputmode="numeric" maxlength="4" value=${f.pin} onInput=${e => setF({ ...f, pin: e.target.value.replace(/\D/g, '') })} /><//></div>
      ${err && html`<p class="err">${err}</p>`}
      <div><button class="btn primary" disabled=${busy}>${busy ? 'Guardando…' : 'Guardar'}</button></div>
    </form></section></div>`;
}
