/* COUCH+ · datos y cuentas con Supabase (versión web) */
const SUPA = { url: 'https://bugiyuqhxbsztefdlzpu.supabase.co', key: 'sb_publishable_XbplgaLAntl6V_af8OAtMw_oI-Y33UF' };
const SB = window.supabase.createClient(SUPA.url, SUPA.key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'couchplus-auth' } });
const emailOf = u => 'u' + Array.from(new TextEncoder().encode(String(u || '').trim().toLowerCase())).map(b => b.toString(16).padStart(2, '0')).join('') + '@couchplus.app';
function cleanErr(e) {
  const m = (e && (e.message || e.error_description)) || '';
  if (/row-level security|permission denied/i.test(m)) return 'No tienes permiso para hacer este cambio';
  if (/fetch|network|Failed to/i.test(m)) return 'Sin conexión. Revisa tu internet e intenta de nuevo.';
  return m || 'Ocurrió un error inesperado';
}

const Store = (() => {
  const COLS = ['trainers', 'students', 'reviews', 'logs', 'meals', 'tpl'];
  let mem = {}; const reset = () => { mem = {}; COLS.forEach(c => mem[c] = new Map()); }; reset();
  let ready = false, ver = 0, errorHandler = null, channel = null, loading = null;
  const subs = new Set(), waiters = [], photoCache = new Map(), pending = new Map(), busy = new Set();
  const emit = () => { ver++; subs.forEach(f => f(ver)); };
  function keys(col, d) {
    if (col === 'trainers') return { trainer_id: d.id, student_id: null };
    if (col === 'students') return { trainer_id: d.trainerId, student_id: d.id };
    if (col === 'tpl') return { trainer_id: d.trainerId, student_id: null };
    if (col === 'meals') return { trainer_id: d.trainerId || (Q.student(d.studentId) || {}).trainerId || null, student_id: d.studentId };
    return { trainer_id: d.trainerId || null, student_id: d.studentId || null };
  }
  async function pump(k) {
    busy.add(k);
    while (pending.has(k)) {
      const job = pending.get(k); pending.delete(k);
      for (let a = 0; a < 2; a++) {
        const r = job.body === null
          ? await SB.from('docs').delete().eq('col', job.col).eq('id', job.id)
          : await SB.from('docs').upsert(Object.assign({ col: job.col, id: job.id, data: job.body, updated_at: new Date().toISOString() }, keys(job.col, job.body)));
        if (!r.error) break;
        if (a === 0 && /fetch|network/i.test(r.error.message || '')) { await new Promise(res => setTimeout(res, 900)); continue; }
        errorHandler && errorHandler(r.error); break;
      }
    }
    busy.delete(k);
  }
  const queue = (col, id, body) => { const k = col + '/' + id; pending.set(k, { col, id, body }); if (!busy.has(k)) pump(k); };
  function onChange(p) {
    if (p.eventType === 'DELETE') { const o = p.old || {}; if (mem[o.col]) { mem[o.col] = new Map(mem[o.col]); mem[o.col].delete(o.id); emit(); } return; }
    const r = p.new; if (!r || !mem[r.col]) return;
    const cur = mem[r.col].get(r.id);
    if (cur && cur.updatedAt && r.data && r.data.updatedAt && r.data.updatedAt < cur.updatedAt) return;
    mem[r.col] = new Map(mem[r.col]); mem[r.col].set(r.id, Object.assign({}, r.data, { id: r.id })); emit();
  }
  async function load() {
    if (loading) return loading;
    loading = (async () => {
      reset(); ready = false; emit();
      for (let from = 0; ; from += 1000) {
        const { data, error } = await SB.from('docs').select('col,id,data').neq('col', 'photos').order('col').order('id').range(from, from + 999);
        if (error) throw error;
        data.forEach(r => { if (mem[r.col]) mem[r.col].set(r.id, Object.assign({}, r.data, { id: r.id })); });
        if (data.length < 1000) break;
      }
      if (channel) SB.removeChannel(channel);
      channel = SB.channel('docs-' + uid()).on('postgres_changes', { event: '*', schema: 'public', table: 'docs' }, onChange).subscribe();
      ready = true; waiters.splice(0).forEach(f => f()); emit();
    })();
    try { await loading; } finally { loading = null; }
  }
  return {
    init() {}, load,
    unload() { if (channel) SB.removeChannel(channel); channel = null; reset(); ready = false; photoCache.clear(); emit(); },
    touch: emit,
    get mode() { return 'cloud'; }, get ready() { return ready; }, get readOnly() { return false; }, get ver() { return ver; },
    onError(f) { errorHandler = f; },
    whenReady() { return ready ? Promise.resolve() : new Promise(r => waiters.push(r)); },
    subscribe(f) { subs.add(f); return () => subs.delete(f); },
    all(col) { return Array.from((mem[col] || new Map()).values()); },
    get(col, id) { return id && mem[col] ? mem[col].get(id) || null : null; },
    put(col, obj) {
      if (!obj.id) obj.id = uid();
      const body = clone(obj); body.updatedAt = Date.now(); delete body.ph;
      mem[col] = new Map(mem[col]); mem[col].set(body.id, body); emit();
      queue(col, body.id, body); return body;
    },
    del(col, id) { mem[col] = new Map(mem[col]); mem[col].delete(id); emit(); queue(col, id, null); },
    async putPhoto(src, meta = {}) {
      const id = uid(); photoCache.set(id, src);
      const { error } = await SB.from('docs').insert({ col: 'photos', id, trainer_id: meta.trainerId, student_id: meta.studentId, data: { src, at: Date.now() } });
      if (error) { errorHandler && errorHandler(error); throw error; }
      return id;
    },
    async getPhoto(id) {
      if (photoCache.has(id)) return photoCache.get(id);
      const { data } = await SB.from('docs').select('data').eq('col', 'photos').eq('id', id).maybeSingle();
      const src = data && data.data ? data.data.src : null; if (src) photoCache.set(id, src); return src;
    },
    delPhoto(id) { photoCache.delete(id); queue('photos', id, null); },
    async acquireBoot() { return false; }
  };
})();

const Accounts = (() => {
  let who = null, timer = null;
  async function whoami() { const { data, error } = await SB.rpc('cp_whoami'); if (error) throw error; who = data || { invalid: true }; return data; }
  async function refresh() { try { await whoami(); Store.touch(); } catch (e) {} }
  const onVis = () => { if (document.visibilityState === 'visible') refresh(); };
  async function enter(w) {
    if (w.role !== 'super' && !w.active) {
      await SB.auth.signOut(); who = null;
      return { err: w.role === 'trainer' ? 'Tu cuenta está desactivada. Comunícate con el administrador de COUCH+.' : 'El acceso de tu entrenador está suspendido por ahora. Comunícate con él.' };
    }
    if (w.role === 'super' && !w.pin_ok) return { needPin: true };
    await Store.load();
    clearInterval(timer); timer = setInterval(refresh, 60000); document.addEventListener('visibilitychange', onVis);
    return { sess: { role: w.role, id: w.ref_id } };
  }
  const res = error => error ? { err: cleanErr(error) } : { patch: {} };
  return {
    kind: 'web',
    username: () => (who && who.username) || '',
    async restore() {
      const { data } = await SB.auth.getSession();
      if (!data || !data.session) return null;
      try { const w = await whoami(); if (!w) { await SB.auth.signOut(); return null; } return await enter(w); } catch (e) { return null; }
    },
    async login(u, p) {
      const { error } = await SB.auth.signInWithPassword({ email: emailOf(u), password: p });
      if (error) {
        const m = error.message || '';
        if (/rate|too many/i.test(m)) return { err: 'Demasiados intentos. Espera un momento e intenta de nuevo.' };
        if (/fetch|network/i.test(m)) return { err: 'Sin conexión. Revisa tu internet.' };
        return { err: 'Usuario o contraseña incorrectos' };
      }
      try { const w = await whoami(); if (!w) { await SB.auth.signOut(); return { err: 'Esta cuenta no tiene acceso a COUCH+' }; } return await enter(w); }
      catch (e) { return { err: 'No se pudo conectar. Intenta de nuevo.' }; }
    },
    async pin(code) {
      const { data, error } = await SB.rpc('cp_verify_pin', { p_pin: code });
      if (error) return { err: 'No se pudo verificar el código. Intenta de nuevo.' };
      if (data && data.locked_until) return { err: 'Demasiados intentos. Espera 5 minutos.' };
      if (!data || !data.ok) return { err: 'Código incorrecto' };
      return await enter(await whoami());
    },
    async logout() {
      clearInterval(timer); document.removeEventListener('visibilitychange', onVis);
      try { if (who && who.role === 'super') await SB.rpc('cp_end_session'); } catch (e) {}
      await SB.auth.signOut(); who = null; Store.unload();
    },
    check() { if (!who) return true; if (who.invalid) return false; if (who.role !== 'super' && !who.active) return false; if (who.role === 'super' && !who.pin_ok) return false; return true; },
    async create(kind, rec, pass) { const { error } = await SB.rpc('cp_create_account', { p_role: kind, p_ref: rec.id, p_username: rec.user, p_password: pass, p_trainer: kind === 'student' ? rec.trainerId : null }); return res(error); },
    async setPassword(kind, rec, pass) { const { error } = await SB.rpc('cp_set_password', { p_ref: rec.id, p_password: pass }); return res(error); },
    async rename(kind, rec, user) { const { error } = await SB.rpc('cp_set_username', { p_ref: rec.id, p_username: user }); return res(error); },
    async remove(kind, rec) { const { error } = await SB.rpc('cp_remove_account', { p_ref: rec.id }); return res(error); },
    async reassign(sid, tid) { const { error } = await SB.rpc('cp_reassign_student', { p_student: sid, p_trainer: tid }); return res(error); },
    async changeAdmin({ cur, pass, pin }) {
      const { data: ud } = await SB.auth.getUser();
      const { error: e1 } = await SB.auth.signInWithPassword({ email: ud && ud.user ? ud.user.email : '', password: cur });
      if (e1) return { err: 'La contraseña actual no es correcta' };
      if (pass) { const { error } = await SB.auth.updateUser({ password: pass }); if (error) return { err: cleanErr(error) }; }
      if (pin) { const { error } = await SB.rpc('cp_set_pin', { p_pin: pin }); if (error) return { err: cleanErr(error) }; }
      return {};
    }
  };
})();
