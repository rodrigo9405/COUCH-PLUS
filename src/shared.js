/* COUCH+ · formularios y acciones compartidas */
async function delStudentCascade(sid) {
  const st = Q.student(sid);
  if (st) { const r = await Accounts.remove('student', st); if (r.err) { toast(r.err, 'bad'); return false; } }
  Q.reviews(sid).forEach(r => { (r.photos || []).forEach(p => Store.delPhoto(p.pid)); Store.del('reviews', r.id); });
  Q.logs(sid).forEach(l => Store.del('logs', l.id));
  Q.meals(sid).forEach(m => Store.del('meals', m.id));
  Store.del('students', sid);
  return true;
}
async function delTrainerCascade(tid, reassignTo) {
  for (const s of Q.students(tid)) {
    if (reassignTo) { const r = await Accounts.reassign(s.id, reassignTo); if (r.err) { toast(r.err, 'bad'); return false; } }
    else if (!(await delStudentCascade(s.id))) return false;
  }
  const t = Q.trainer(tid);
  if (t) { const r = await Accounts.remove('trainer', t); if (r.err) { toast(r.err, 'bad'); return false; } }
  Store.all('tpl').filter(x => x.trainerId === tid).forEach(x => Store.del('tpl', x.id));
  Store.del('trainers', tid);
  return true;
}

function credsText(p, pass, role) {
  return `Hola ${p.nombres}, ya tienes tu cuenta en COUCH+${role === 'trainer' ? ' como entrenador' : ''}.\nUsuario: ${p.user}\nContraseña: ${pass}\nGuárdala en un lugar seguro.`;
}
function CredsModal({ close, p, pass, role }) {
  const txt = credsText(p, pass, role);
  return html`<${Modal} title="Cuenta creada" sub=${fullName(p)} onClose=${close} size="sm" footer=${html`<button class="btn primary" onClick=${close}>Listo</button>`}>
    <div class="creds"><div><span class="eyebrow">Usuario</span><code>${p.user}</code></div><div><span class="eyebrow">Contraseña</span><code>${pass}</code></div></div>
    <p class="muted sm">Comparte estos datos con ${p.nombres}. Por seguridad, la contraseña no se vuelve a mostrar; puedes restablecerla desde su perfil.</p>
    <div class="row gap-s wrap"><${CopyBtn} text=${txt} label="Copiar mensaje" /><${WaBtn} phone=${p.telefono} text=${txt} label="Enviar por WhatsApp" /></div>
  <//>`;
}

function PersonForm({ close, kind, rec, trainerId, onSaved }) {
  const isT = kind === 'trainer', edit = !!rec;
  const t0 = today();
  const [f, setF] = useState(() => rec ? Object.assign({ pass: '' }, clone(rec)) : {
    nombres: '', apellidos: '', dni: '', telefono: '', user: '', pass: '', inicio: t0, freq: 'mensual', nextPay: nextFrom(t0, 'mensual'), monto: '',
    active: true, remind: true, trainerId: trainerId || (Q.trainers()[0] || {}).id || '', nextReview: ''
  });
  const [touched, setTouched] = useState(!!rec);
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(o => {
    const n = Object.assign({}, o, { [k]: v });
    if ((k === 'inicio' || k === 'freq') && !touched && n.inicio) n.nextPay = nextFrom(n.inicio, n.freq);
    return n;
  });
  const b = k => ({ value: f[k] ?? '', onInput: e => set(k, e.target.value) });
  async function save(e) {
    e && e.preventDefault();
    if (saving) return;
    const er = {};
    if (!f.nombres.trim()) er.nombres = 'Escribe los nombres';
    if (!f.apellidos.trim()) er.apellidos = 'Escribe los apellidos';
    if (f.dni && !/^\d{8,12}$/.test(f.dni.trim())) er.dni = 'El DNI debe tener solo números (8 dígitos)';
    if (!f.user.trim()) er.user = 'Define un usuario';
    else if (f.user.trim().length > 30) er.user = 'Máximo 30 caracteres';
    else if (Q.userTaken(f.user, rec && rec.id)) er.user = 'Ese usuario ya existe';
    if (!edit && f.pass.length < 6) er.pass = 'Mínimo 6 caracteres';
    if (edit && f.pass && f.pass.length < 6) er.pass = 'Mínimo 6 caracteres';
    if (!f.inicio) er.inicio = 'Elige la fecha de inicio';
    if (!isT && !f.trainerId) er.trainerId = 'Asigna un entrenador';
    if ((isT || f.remind) && !f.nextPay) er.nextPay = 'Elige la fecha';
    setErr(er); if (Object.keys(er).length) return;
    const pass = f.pass;
    const o = Object.assign({}, rec || {}, f);
    delete o.pass;
    o.user = f.user.trim(); o.nombres = f.nombres.trim(); o.apellidos = f.apellidos.trim(); o.dni = (f.dni || '').trim();
    const ak = isT ? 'trainer' : 'student';
    setSaving(true);
    if (!edit) {
      o.id = uid();
      const r = await Accounts.create(ak, o, pass);
      if (r.err) { setSaving(false); setErr(/usuario/i.test(r.err) ? { user: r.err } : { pass: r.err }); return; }
      Object.assign(o, r.patch || {});
      o.createdAt = Date.now(); o.payments = (isT || f.remind) ? [{ date: f.inicio, paidOn: f.inicio, note: 'Pago inicial', monto: f.monto }] : [];
    } else {
      if (o.user !== rec.user) { const r = await Accounts.rename(ak, rec, o.user); if (r.err) { setSaving(false); setErr({ user: r.err }); return; } }
      if (pass) { const r = await Accounts.setPassword(ak, rec, pass); if (r.err) { setSaving(false); setErr({ pass: r.err }); return; } Object.assign(o, r.patch || {}); }
      if (!isT && rec.trainerId !== o.trainerId) { const r = await Accounts.reassign(rec.id, o.trainerId); if (r.err) { setSaving(false); setErr({ trainerId: r.err }); return; } }
    }
    if (!isT && !o.nextReview) o.nextReview = null;
    const saved = Store.put(isT ? 'trainers' : 'students', o);
    close();
    toast(edit ? 'Cambios guardados' : (isT ? 'Entrenador creado' : 'Alumno creado'));
    if (!edit) openModal(CredsModal, { p: saved, pass, role: ak });
    onSaved && onSaved(saved);
  }
  const trainers = Q.trainers();
  return html`<${Modal} title=${edit ? 'Editar ' + (isT ? 'entrenador' : 'alumno') : (isT ? 'Nuevo entrenador' : 'Nuevo alumno')} onClose=${close} size="md"
    footer=${html`<button class="btn ghost" onClick=${close}>Cancelar</button><button class="btn primary" disabled=${saving} onClick=${save}>${saving ? 'Guardando…' : edit ? 'Guardar cambios' : 'Crear cuenta'}</button>`}>
    <form class="form" onSubmit=${save}>
      <div class="grid2">
        <${Field} label="Nombres" error=${err.nombres}><input id="pf-nombres" ...${b('nombres')} autocomplete="off" /><//>
        <${Field} label="Apellidos" error=${err.apellidos}><input id="pf-apellidos" ...${b('apellidos')} autocomplete="off" /><//>
        <${Field} label="DNI" error=${err.dni}><input id="pf-dni" inputmode="numeric" maxlength="12" ...${b('dni')} /><//>
        <${Field} label="Teléfono" hint="Para recordatorios por WhatsApp"><input id="pf-tel" type="tel" inputmode="tel" placeholder="987 654 321" ...${b('telefono')} /><//>
      </div>
      ${!isT && trainerId == null && html`<${Field} label="Entrenador asignado" error=${err.trainerId}><select id="pf-trainer" value=${f.trainerId} onChange=${e => set('trainerId', e.target.value)}>
        <option value="" selected=${!f.trainerId}>Selecciona…</option>${trainers.map(t => html`<option value=${t.id} selected=${t.id === f.trainerId}>${fullName(t)}${t.active === false ? ' (inactivo)' : ''}</option>`)}</select><//>`}
      <div class="sect-t">Acceso</div>
      <div class="grid2">
        <${Field} label="Usuario" error=${err.user}><input id="pf-user" autocomplete="off" autocapitalize="characters" ...${b('user')} /><//>
        <${Field} label=${edit ? 'Nueva contraseña' : 'Contraseña'} hint=${edit ? 'Déjala vacía para mantener la actual' : 'Mínimo 6 caracteres'} error=${err.pass}><input id="pf-pass" type="text" autocomplete="new-password" ...${b('pass')} /><//>
      </div>
      <div class="sect-t">${isT ? 'Suscripción a COUCH+' : 'Servicio y pagos'}</div>
      <div class="grid2">
        <${Field} label=${isT ? 'Fecha de pago (inicio)' : 'Inicio del servicio'} error=${err.inicio}><input id="pf-inicio" type="date" ...${b('inicio')} onChange=${e => set('inicio', e.target.value)} /><//>
        ${!isT && html`<div class="field"><span>Recordatorio de pago</span><${Toggle} id="pf-remind" checked=${f.remind} onChange=${v => set('remind', v)} label=${f.remind ? 'Activado' : 'Desactivado'} /></div>`}
      </div>
      ${(isT || f.remind) && html`<div class="grid3">
        <${Field} label="Frecuencia"><select id="pf-freq" value=${f.freq} onChange=${e => set('freq', e.target.value)}>${Object.entries(FREQ).map(([k, v]) => html`<option value=${k} selected=${k === f.freq}>${v.label}</option>`)}</select><//>
        <${Field} label="Próximo pago" hint="Se calcula solo; puedes editarlo" error=${err.nextPay}><input id="pf-next" type="date" value=${f.nextPay || ''} onInput=${e => { setTouched(true); set('nextPay', e.target.value); }} /><//>
        <${Field} label="Monto (opcional)"><div class="affix"><span>S/</span><input id="pf-monto" inputmode="decimal" ...${b('monto')} /></div><//>
      </div>`}
      ${!isT && !edit && html`<${Field} label="Primera revisión (opcional)"><input id="pf-review" type="date" value=${f.nextReview || ''} onInput=${e => set('nextReview', e.target.value)} /><//>`}
      ${isT && html`<div class="field"><span>Estado</span><${Toggle} id="pf-active" checked=${f.active !== false} onChange=${v => set('active', v)} label=${f.active !== false ? 'Activo: puede ingresar con sus alumnos' : 'Inactivo: sin acceso para él ni sus alumnos'} /></div>`}
      <button type="submit" hidden></button>
    </form>
  <//>`;
}

function PayModal({ close, col, rec }) {
  const [paidOn, setPaidOn] = useState(today());
  const [monto, setMonto] = useState(rec.monto || '');
  const next = addMonths(rec.nextPay || today(), FREQ[rec.freq || 'mensual'].m);
  const ok = () => {
    const o = clone(rec);
    o.payments = [...(o.payments || []), { date: rec.nextPay, paidOn, monto }];
    o.nextPay = next;
    Store.put(col, o); close(); toast('Pago registrado. Próximo: ' + fmtD(next));
  };
  return html`<${Modal} title="Registrar pago" sub=${fullName(rec)} onClose=${close} size="sm" footer=${html`<button class="btn ghost" onClick=${close}>Cancelar</button><button class="btn primary" onClick=${ok}>Registrar</button>`}>
    <div class="kv"><span>Periodo que se paga</span><strong>${fmtD(rec.nextPay)}</strong></div>
    <div class="kv"><span>Frecuencia</span><strong>${FREQ[rec.freq || 'mensual'].label}</strong></div>
    <div class="grid2 mt">
      <${Field} label="Fecha en que pagó"><input id="pay-date" type="date" value=${paidOn} onInput=${e => setPaidOn(e.target.value)} /><//>
      <${Field} label="Monto (opcional)"><div class="affix"><span>S/</span><input id="pay-monto" inputmode="decimal" value=${monto} onInput=${e => setMonto(e.target.value)} /></div><//>
    </div>
    <p class="muted sm">El siguiente recordatorio quedará para el <strong>${fmtD(next)}</strong>.</p>
  <//>`;
}

function ResetPassModal({ close, col, rec }) {
  const [p, setP] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const bad = p.length < 6;
  const ok = async () => {
    setBusy(true);
    const r = await Accounts.setPassword(col === 'trainers' ? 'trainer' : 'student', rec, p);
    if (r.err) { setBusy(false); setErr(r.err); return; }
    if (r.patch && Object.keys(r.patch).length) Store.put(col, Object.assign({}, rec, r.patch));
    close(); openModal(CredsModal, { p: rec, pass: p, role: col === 'trainers' ? 'trainer' : 'student' });
  };
  return html`<${Modal} title="Restablecer contraseña" sub=${fullName(rec)} onClose=${close} size="sm" footer=${html`<button class="btn ghost" onClick=${close}>Cancelar</button><button class="btn primary" disabled=${bad || busy} onClick=${ok}>${busy ? 'Guardando…' : 'Guardar'}</button>`}>
    <${Field} label="Nueva contraseña" hint="Mínimo 6 caracteres" error=${err}><input id="rp-pass" type="text" autocomplete="new-password" value=${p} onInput=${e => { setP(e.target.value); setErr(''); }} /><//>
  <//>`;
}

function payReminderText(p, forStudent) {
  return forStudent ? `Hola ${p.nombres}, te recuerdo que tu próximo pago del servicio de entrenamiento es el ${fmtD(p.nextPay)}. ¡Gracias!`
    : `Hola ${p.nombres}, te recordamos que el pago de tu suscripción COUCH+ vence el ${fmtD(p.nextPay)}.`;
}
function PayHistory({ rec }) {
  const list = (rec.payments || []).slice().reverse();
  if (!list.length) return html`<p class="muted sm">Sin pagos registrados.</p>`;
  return html`<ul class="hist">${list.map(p => html`<li><span>${fmtD(p.date)}</span><span class="muted">${p.note || 'Pagado el ' + fmtD(p.paidOn)}</span><strong>${p.monto ? 'S/ ' + p.monto : ''}</strong></li>`)}</ul>`;
}
