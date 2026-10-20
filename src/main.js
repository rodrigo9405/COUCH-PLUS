/* COUCH+ · aplicación: acceso, estructura y navegación */
const NAV = {
  super: [['home', 'Inicio', 'home'], ['trainers', 'Entrenadores', 'users'], ['students', 'Alumnos', 'user'], ['security', 'Seguridad', 'lock']],
  trainer: [['home', 'Inicio', 'home'], ['students', 'Alumnos', 'users'], ['agenda', 'Revisiones', 'ruler'], ['templates', 'Plantillas', 'layers'], ['account', 'Mi cuenta', 'wallet']],
  student: [['home', 'Inicio', 'home'], ['train', 'Entrenar', 'dumbbell'], ['diet', 'Dieta', 'food'], ['progress', 'Progreso', 'chart'], ['cart', 'Carrito', 'cart']]
};
const ROLE_LABEL = { super: 'Superadministrador', trainer: 'Entrenador', student: 'Alumno' };
const TITLES = {
  super: { home: ['Panel general', 'Entrenadores, alumnos y pagos de la plataforma'], trainers: ['Entrenadores', 'Cuentas, accesos y suscripciones'], students: ['Alumnos', 'Todos los alumnos y su entrenador asignado'], security: ['Seguridad', 'Contraseña y código de acceso'] },
  trainer: { home: ['Resumen', 'Tus alumnos y lo que requiere atención'], students: ['Alumnos', 'Crea cuentas y gestiona a cada alumno'], student: ['Alumno', ''], agenda: ['Revisiones', 'Controles de fotos y medidas'], templates: ['Plantillas', 'Medidas, esquemas de dieta, platos y rutinas predeterminados'], account: ['Mi cuenta', 'Tu suscripción a COUCH+'] },
  student: { home: ['Inicio', ''], train: ['Entrenar', 'Lo que te toca y tu rutina'], diet: ['Dieta', 'Tus comidas de hoy y de la semana'], progress: ['Progreso', 'Medidas, fotos e historial'], cart: ['Carrito', 'Lista de compras según tu dieta'] }
};

function Brand({ big }) { return html`<span class=${'brand ' + (big ? 'big' : '')}>COUCH<span class="plus">+</span></span>`; }

function Login({ onIn, initialStage = 'cred' }) {
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [show, setShow] = useState(false);
  const [stage, setStage] = useState(initialStage); const [pin, setPin] = useState(['', '', '', '']);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const pinRefs = [useRef(), useRef(), useRef(), useRef()];
  useEffect(() => { if (stage === 'pin') setTimeout(() => pinRefs[0].current && pinRefs[0].current.focus(), 60); }, [stage]);
  async function submit(e) {
    e.preventDefault(); setErr('');
    if (!u.trim() || !p) { setErr('Escribe tu usuario y contraseña'); return; }
    setBusy(true);
    const r = await Accounts.login(u, p);
    setBusy(false);
    if (r.err) { setErr(r.err); return; }
    if (r.needPin) { setStage('pin'); return; }
    onIn(r.sess);
  }
  async function pinInput(i, v) {
    const d = v.replace(/\D/g, '').slice(-1); const n = pin.slice(); n[i] = d; setPin(n); setErr('');
    if (d && i < 3) pinRefs[i + 1].current.focus();
    if (n.every(x => x)) {
      setBusy(true); const r = await Accounts.pin(n.join('')); setBusy(false);
      if (r.sess) { onIn(r.sess); return; }
      setErr(r.err || 'Código incorrecto'); setPin(['', '', '', '']); setTimeout(() => pinRefs[0].current && pinRefs[0].current.focus(), 30);
    }
  }
  const pinKey = (i, e) => { if (e.key === 'Backspace' && !pin[i] && i > 0) pinRefs[i - 1].current.focus(); };
  const paste = e => { const t = (e.clipboardData && e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 4); if (t.length === 4) { e.preventDefault(); t.split('').forEach((d, i) => setTimeout(() => pinInput(i, d), i * 10)); } };
  return html`<div class="login">
    <aside class="login-art" aria-hidden="true">
      <div class="plates"><i style="--s:340px;--c:var(--c-red)"></i><i style="--s:270px;--c:var(--c-blue)"></i><i style="--s:205px;--c:var(--c-yellow)"></i><i style="--s:145px;--c:var(--c-green)"></i><i class="hub"></i></div>
      <div class="art-copy"><${Brand} big /><p>Entrena. Mide. Progresa.</p><ul><li>Rutinas guiadas en 3D</li><li>Dietas y lista de compras</li><li>Revisiones con fotos y medidas</li></ul></div>
    </aside>
    <main class="login-main">
      <form class="login-card" onSubmit=${submit} autocomplete="on">
        <div class="lc-brand"><${Brand} /></div>
        <h1>${stage === 'pin' ? 'Código de seguridad' : 'Inicia sesión'}</h1>
        <p class="muted">${stage === 'pin' ? 'Ingresa el código de 4 dígitos del superadministrador.' : 'Entra con la cuenta que te dieron. La app se abre en tu vista según tu rol.'}</p>
        ${stage === 'cred' ? html`
          <${Field} label="Usuario"><input id="lg-user" name="username" autocomplete="username" autocapitalize="characters" spellcheck="false" value=${u} onInput=${e => setU(e.target.value)} /><//>
          <${Field} label="Contraseña"><div class="affix r"><input id="lg-pass" name="password" type=${show ? 'text' : 'password'} autocomplete="current-password" value=${p} onInput=${e => setP(e.target.value)} /><button type="button" class="link sm" onClick=${() => setShow(!show)}>${show ? 'Ocultar' : 'Mostrar'}</button></div><//>
          ${err && html`<p class="err" role="alert">${err}</p>`}
          <button class="btn primary big full-w" disabled=${busy}>${busy ? 'Verificando…' : 'Ingresar'}</button>
          ${Accounts.kind === 'artifact' && !Store.ready && html`<p class="muted sm center">Conectando con tus datos…</p>`}`
        : html`<div class="pin" onPaste=${paste}>${pin.map((d, i) => html`<input ref=${pinRefs[i]} id=${'pin' + i} aria-label=${'Dígito ' + (i + 1)} inputmode="numeric" type="password" maxlength="1" value=${d} onInput=${e => pinInput(i, e.target.value)} onKeyDown=${e => pinKey(i, e)} />`)}</div>
          ${busy && html`<p class="muted sm center">Verificando…</p>`}
          ${err && html`<p class="err center" role="alert">${err}</p>`}
          <button type="button" class="link center-b" onClick=${async () => { if (Accounts.kind === 'web') await Accounts.logout(); setStage('cred'); setPin(['', '', '', '']); setErr(''); }}>← Volver</button>`}
      </form>
      <p class="login-foot muted sm">${Accounts.kind === 'web' ? 'Conexión segura · tus datos se guardan en la nube.' : Store.mode === 'local' ? 'Los datos se guardan en este navegador.' : 'Tus datos se sincronizan entre dispositivos.'}</p>
    </main>
  </div>`;
}

function Bell({ sess, go }) {
  useStore();
  const [open, setOpen] = useState(false);
  const list = notifications(sess);
  useEffect(() => { if (!open) return; const f = e => { if (!e.target.closest('.bell')) setOpen(false); }; document.addEventListener('click', f); return () => document.removeEventListener('click', f); }, [open]);
  return html`<div class="bell"><button class="icon-btn" aria-label=${`Notificaciones (${list.length})`} onClick=${() => setOpen(!open)}><${Ic} n="bell" />${list.length > 0 && html`<span class="bell-n">${list.length}</span>`}</button>
    ${open && html`<div class="pop"><div class="pop-h"><strong>Recordatorios</strong><span class="muted sm">${list.length}</span></div>
      ${list.length ? html`<ul>${list.map(n => html`<li><button class="pop-i" onClick=${() => { setOpen(false); go(n.go.view, n.go); }}><span class=${'dot ' + n.kind}></span><span><strong>${n.title}</strong><small class="muted">${n.text}</small></span></button></li>`)}</ul>` : html`<p class="muted sm pad">No tienes recordatorios pendientes.</p>`}</div>`}</div>`;
}

function Shell({ sess, onOut }) {
  useStore();
  const [route, setRoute] = useState({ view: 'home', params: {} });
  const go = (view, params = {}) => { setRoute({ view, params: Object.assign({}, params, { _: Date.now() }) }); try { document.querySelector('.main-scroll') && document.querySelector('.main-scroll').scrollTo(0, 0); window.scrollTo(0, 0); } catch (e) {} };
  const nav = NAV[sess.role];
  const me = sess.role === 'super' ? { nombres: 'Super', apellidos: 'Admin' } : sess.role === 'trainer' ? Q.trainer(sess.id) : Q.student(sess.id);
  let [title, sub] = (TITLES[sess.role] || {})[route.view] || ['', ''];
  if (route.view === 'student') { const s = Q.student(route.params.id); title = s ? fullName(s) : 'Alumno'; sub = 'Perfil, revisiones, dieta, rutina y progreso'; }
  if (sess.role === 'student' && route.view === 'home') { title = ''; sub = ''; }
  const active = route.view === 'student' ? 'students' : route.view;
  const body = sess.role === 'super' ? html`<${AdminApp} view=${route.view} go=${go} params=${route.params} />` : sess.role === 'trainer' ? html`<${TrainerApp} view=${route.view} go=${go} params=${route.params} sess=${sess} />` : html`<${StudentApp} view=${route.view} go=${go} sess=${sess} />`;
  const logout = async () => { if (await confirmBox({ title: 'Cerrar sesión', text: '¿Quieres salir de COUCH+?', ok: 'Cerrar sesión' })) onOut(); };
  return html`<div class=${'shell role-' + sess.role}>
    <aside class="side">
      <div class="side-brand"><${Brand} /><span class="role-tag">${ROLE_LABEL[sess.role]}</span></div>
      <nav class="side-nav">${nav.map(([k, l, i]) => html`<button class=${'nav-i ' + (active === k ? 'on' : '')} aria-current=${active === k ? 'page' : null} onClick=${() => go(k)}><${Ic} n=${i} />${l}</button>`)}</nav>
      <div class="side-foot"><div class="me"><${Avatar} p=${me} size=${34} tone=${1} /><span><strong>${me ? fullName(me) : ''}</strong><small class="muted">${ROLE_LABEL[sess.role]}</small></span></div>
        <button class="nav-i" onClick=${logout}><${Ic} n="logout" />Cerrar sesión</button>
        <span class=${'sync ' + Store.mode} title=${Store.mode === 'cloud' ? 'Los cambios se guardan y se ven en cualquier dispositivo con acceso a esta página.' : 'Sin conexión a la base compartida: los datos quedan solo en este navegador.'}>${Store.mode === 'cloud' ? 'Sincronizado' : 'Solo en este navegador'}</span></div>
    </aside>
    <div class="main">
      <header class="top"><div class="top-brand"><${Brand} /></div><div class="top-t">${title && html`<h1>${title}</h1>`}${sub && html`<p class="muted sm">${sub}</p>`}</div>
        <div class="top-a"><${Bell} sess=${sess} go=${go} /><button class="icon-btn only-m" aria-label="Cerrar sesión" onClick=${logout}><${Ic} n="logout" /></button></div></header>
      <div class="main-scroll">${body}</div>
    </div>
    <nav class="tabbar">${nav.map(([k, l, i]) => html`<button class=${active === k ? 'on' : ''} aria-current=${active === k ? 'page' : null} onClick=${() => go(k)}><${Ic} n=${i} s=${20} /><span>${l}</span></button>`)}</nav>
  </div>`;
}

class Boundary extends Component {
  constructor() { super(); this.state = { err: null }; }
  componentDidCatch(err) { console.error(err); this.setState({ err }); }
  render() {
    if (this.state.err) return html`<div class="crash"><${Brand} /><h2>Algo no salió bien</h2><p class="muted">${String(this.state.err && this.state.err.message || this.state.err)}</p><button class="btn primary" onClick=${() => { this.setState({ err: null }); }}>Reintentar</button></div>`;
    return this.props.children;
  }
}

function App() {
  useStore();
  const [sess, setSess] = useState(null);
  const [boot, setBoot] = useState(true);
  const [stage0, setStage0] = useState('cred');
  useEffect(() => {
    Accounts.restore().then(r => { if (r && r.sess) setSess(r.sess); else if (r && r.needPin) setStage0('pin'); setBoot(false); }).catch(() => setBoot(false));
    if (typeof Seed !== 'undefined') Store.whenReady().then(() => Seed.run());
  }, []);
  useEffect(() => {
    if (!sess || !Store.ready) return;
    if (!Accounts.check(sess)) { Accounts.logout(); setSess(null); setStage0('cred'); toast('Tu acceso no está disponible. Vuelve a iniciar sesión.', 'bad'); }
  }, [Store.ver, sess]);
  const onIn = s => setSess(s);
  const onOut = async () => { await Accounts.logout(); setStage0('cred'); setSess(null); };
  let body;
  if (boot) body = html`<div class="splash"><${Brand} big /><p class="muted">Cargando…</p></div>`;
  else if (sess && Store.ready) body = html`<${Shell} sess=${sess} onOut=${onOut} key=${sess.role + sess.id} />`;
  else if (sess) body = html`<div class="splash"><${Brand} big /><p class="muted">Cargando tus datos…</p></div>`;
  else body = html`<${Login} onIn=${onIn} initialStage=${stage0} key=${stage0} />`;
  return html`<${Boundary}>${body}<${ModalHost} /><//>`;
}

Store.onError(e => {
  const c = e && e.code;
  if (c === 'quota_exceeded') toast('Se llenó el espacio disponible. Elimina fotos o revisiones antiguas.', 'bad');
  else if (c === 'invalid_argument' || c === '42501' || /row-level security|permission/i.test((e && e.message) || '')) toast('No tienes permiso para guardar este cambio.', 'bad');
  else toast('No se pudo guardar un cambio. Revisa tu conexión.', 'bad');
});
Store.init();
render(html`<${App} />`, document.getElementById('app'));
