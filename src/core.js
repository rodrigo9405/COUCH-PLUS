/* COUCH+ · núcleo: utilidades, almacenamiento, autenticación y analítica */
const { html, render, Component, useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = window.htmPreact;

/* ---------- SHA-256 (síncrono, UTF-8) ---------- */
function sha256(str) {
  const msg = unescape(encodeURIComponent(str));
  const K = [], H = [];
  let n = 2, c = 0;
  const frac = x => ((x - Math.floor(x)) * 4294967296) | 0;
  while (c < 64) { let p = true; for (let i = 2; i * i <= n; i++) if (n % i === 0) { p = false; break; } if (p) { if (c < 8) H[c] = frac(Math.pow(n, 1 / 2)); K[c++] = frac(Math.pow(n, 1 / 3)); } n++; }
  const words = []; const L = msg.length * 8;
  for (let i = 0; i < msg.length; i++) words[i >> 2] |= msg.charCodeAt(i) << ((3 - i % 4) * 8);
  words[L >> 5] |= 0x80 << (24 - L % 32);
  words[((L + 64 >> 9) << 4) + 15] = L;
  const r = (x, y) => (x >>> y) | (x << (32 - y));
  for (let j = 0; j < words.length; j += 16) {
    const w = []; for (let k = 0; k < 16; k++) w[k] = words[j + k] | 0; const h = H.slice(0);
    for (let i = 0; i < 64; i++) {
      if (i >= 16) {
        const a = w[i - 15], b = w[i - 2];
        w[i] = (w[i - 16] + (r(a, 7) ^ r(a, 18) ^ (a >>> 3)) + w[i - 7] + (r(b, 17) ^ r(b, 19) ^ (b >>> 10))) | 0;
      }
      const t1 = (h[7] + (r(h[4], 6) ^ r(h[4], 11) ^ r(h[4], 25)) + ((h[4] & h[5]) ^ (~h[4] & h[6])) + K[i] + (w[i] | 0)) | 0;
      const t2 = ((r(h[0], 2) ^ r(h[0], 13) ^ r(h[0], 22)) + ((h[0] & h[1]) ^ (h[0] & h[2]) ^ (h[1] & h[2]))) | 0;
      h.pop(); h.unshift((t1 + t2) | 0); h[4] = (h[4] + t1) | 0;
    }
    for (let i = 0; i < 8; i++) H[i] = (H[i] + h[i]) | 0;
  }
  return H.map(x => ('00000000' + (x >>> 0).toString(16)).slice(-8)).join('');
}
const passHash = p => sha256('couch+|' + p);
const pinHash = p => sha256('couch+pin|' + p);

const REMIND_DAYS = 5;

/* ---------- Utilidades ---------- */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const pad = n => String(n).padStart(2, '0');
const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseD = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const today = () => toISO(new Date());
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return toISO(d); };
const addMonths = (s, n) => { const [y, m, d] = s.split('-').map(Number); const t = new Date(y, m - 1 + n, 1); const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate(); t.setDate(Math.min(d, last)); return toISO(t); };
const diffDays = (a, b) => Math.round((parseD(b) - parseD(a)) / 86400000);
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS3 = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const dow = s => (parseD(s).getDay() + 6) % 7;
const weekStart = s => addDays(s, -dow(s));
const fmtD = s => { if (!s) return '—'; const d = parseD(s); return `${d.getDate()} ${MES[d.getMonth()]} ${d.getFullYear()}`; };
const fmtDs = s => { if (!s) return '—'; const d = parseD(s); return `${d.getDate()} ${MES[d.getMonth()]}`; };
const fmtLong = s => { const d = parseD(s); return `${DIAS[dow(s)].toLowerCase()} ${d.getDate()} de ${MESL[d.getMonth()]}`; };
const fmtTime = ts => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtDur = sec => { sec = Math.max(0, Math.round(sec)); const m = Math.floor(sec / 60), s = sec % 60; return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m}:${pad(s)}`; };
const isoOfTs = ts => toISO(new Date(ts));
const normTxt = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const clone = o => JSON.parse(JSON.stringify(o));
const fullName = p => p ? `${p.nombres || ''} ${p.apellidos || ''}`.trim() : '';
const initials = p => (((p?.nombres || '?')[0] || '') + ((p?.apellidos || '')[0] || '')).toUpperCase();
const round1 = n => Math.round(n * 10) / 10;
const numStr = n => { if (n == null || isNaN(n)) return '—'; const r = Math.round(n * 100) / 100; return String(r).replace('.', ','); };
const parseNum = v => { if (v == null || v === '') return null; const n = Number(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
const FREQ = { mensual: { m: 1, label: 'Mensual' }, trimestral: { m: 3, label: 'Trimestral' }, anual: { m: 12, label: 'Anual' } };
const nextFrom = (start, freq) => addMonths(start, (FREQ[freq] || FREQ.mensual).m);
function payState(next) {
  if (!next) return { k: 'none', label: 'Sin fecha' };
  const d = diffDays(today(), next);
  if (d < 0) return { k: 'late', d, label: `Vencido hace ${-d} ${-d === 1 ? 'día' : 'días'}` };
  if (d === 0) return { k: 'today', d, label: 'Vence hoy' };
  if (d <= REMIND_DAYS) return { k: 'soon', d, label: `Vence en ${d} ${d === 1 ? 'día' : 'días'}` };
  return { k: 'ok', d, label: 'Al día' };
}
function waLink(phone, text) {
  let p = String(phone || '').replace(/\D/g, '');
  if (p.length === 9) p = '51' + p;
  return p ? `https://wa.me/${p}?text=${encodeURIComponent(text)}` : null;
}
const PLATE = ['#C8312B', '#1F58B5', '#D9A21B', '#23885A', '#E9ECEF', '#2B2F36', '#8C3FB5'];
const PLATE_INK = ['#fff', '#fff', '#1b1b1b', '#fff', '#1b1b1b', '#fff', '#fff'];
const LSK = 'couchplus.v1.';
const lsGet = k => { try { const v = localStorage.getItem(LSK + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } };
const lsSet = k => v => { try { localStorage.setItem(LSK + k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const lsPut = (k, v) => lsSet(k)(v);
const lsDel = k => { try { localStorage.removeItem(LSK + k); } catch (e) {} };
const ssGet = k => { try { const v = sessionStorage.getItem(LSK + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } };
const ssSet = (k, v) => { try { v == null ? sessionStorage.removeItem(LSK + k) : sessionStorage.setItem(LSK + k, JSON.stringify(v)); } catch (e) {} };

function useStore() {
  const [, setV] = useState(Store.ver);
  useEffect(() => Store.subscribe(v => setV(v)), []);
  return Store;
}

/* ---------- Consultas ---------- */
const Q = {
  trainers: () => Store.all('trainers').sort((a, b) => fullName(a).localeCompare(fullName(b))),
  trainer: id => Store.get('trainers', id),
  students: tid => Store.all('students').filter(s => !tid || s.trainerId === tid).sort((a, b) => fullName(a).localeCompare(fullName(b))),
  student: id => Store.get('students', id),
  reviews: sid => Store.all('reviews').filter(r => r.studentId === sid).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : (a.createdAt || 0) - (b.createdAt || 0)),
  logs: sid => Store.all('logs').filter(l => l.studentId === sid).sort((a, b) => (a.ts || 0) - (b.ts || 0)),
  meal: (sid, date) => Store.get('meals', `${sid}_${date}`),
  meals: sid => Store.all('meals').filter(m => m.studentId === sid),
  tpls: (tid, kind) => Store.all('tpl').filter(t => t.trainerId === tid && t.kind === kind).sort((a, b) => (a.name || '').localeCompare(b.name || '')),
  admin: () => Store.get('meta', 'admin'),
  findUser(u) {
    const U = String(u || '').trim().toUpperCase();
    if (!U) return null;
    if (typeof SUPER !== 'undefined' && U === SUPER.user.toUpperCase()) return { role: 'super' };
    const t = Store.all('trainers').find(x => (x.user || '').toUpperCase() === U); if (t) return { role: 'trainer', rec: t };
    const s = Store.all('students').find(x => (x.user || '').toUpperCase() === U); if (s) return { role: 'student', rec: s };
    return null;
  },
  userTaken(u, exceptId) {
    const U = String(u || '').trim().toUpperCase();
    if (!U) return false;
    if (typeof SUPER !== 'undefined' && U === SUPER.user.toUpperCase()) return true;
    return Store.all('trainers').some(x => x.id !== exceptId && (x.user || '').toUpperCase() === U) || Store.all('students').some(x => x.id !== exceptId && (x.user || '').toUpperCase() === U);
  }
};

/* ---------- Dieta ---------- */
const UNITS = ['g', 'kg', 'ml', 'l', 'unidad', 'taza', 'cda', 'cdta', 'porción', 'rebanada', 'scoop', 'lata', 'oz', 'lb'];
const emptySlot = () => ({ items: [], dishes: [], steps: [] });
const slotHas = sl => sl && ((sl.items || []).length || (sl.dishes || []).length);
function dietDay(st, d) { const diet = st?.diet; if (!diet || !diet.meals) return []; const day = (diet.days || {})[d] || {}; return diet.meals.map(m => ({ meal: m, slot: day[m.id] || emptySlot() })); }
function plannedMeals(st, d) { return dietDay(st, d).filter(x => slotHas(x.slot)); }
const itemTxt = it => `${numStr(it.q)} ${it.u === 'unidad' ? (Number(it.q) === 1 ? 'unidad de' : 'unidades de') : (it.u ? it.u + ' de' : '')} ${it.name}`.replace(/\s+/g, ' ').trim();
const itemShort = it => `${numStr(it.q)}${['g', 'kg', 'ml', 'l', 'oz', 'lb'].includes(it.u) ? ' ' + it.u : it.u ? ' ' + it.u : ''} ${it.name}`;

/* ---------- Compras ---------- */
function unitBase(u) { if (u === 'kg') return ['g', 1000]; if (u === 'g') return ['g', 1]; if (u === 'l') return ['ml', 1000]; if (u === 'ml') return ['ml', 1]; if (u === 'lb') return ['g', 453.592]; if (u === 'oz') return ['g', 28.3495]; return [u || 'unidad', 1]; }
function prettyQty(q, base) {
  if (base === 'g') return q >= 1000 ? `${numStr(round1(q / 1000))} kg` : `${numStr(Math.round(q))} g`;
  if (base === 'ml') return q >= 1000 ? `${numStr(round1(q / 1000))} l` : `${numStr(Math.round(q))} ml`;
  const r = Math.round(q * 100) / 100;
  const PL = { unidad: 'unidades', taza: 'tazas', rebanada: 'rebanadas', 'porción': 'porciones', lata: 'latas', scoop: 'scoops' };
  return `${numStr(r)} ${r === 1 || !PL[base] ? base : PL[base]}`;
}
function shoppingList(st, dates) {
  const map = new Map();
  dates.forEach(date => {
    plannedMeals(st, dow(date)).forEach(({ slot }) => {
      const all = [...(slot.items || []), ...(slot.dishes || []).flatMap(d => d.items || [])];
      all.forEach(it => {
        const q = parseNum(it.q); if (q == null || !it.name) return;
        const [base, f] = unitBase(it.u);
        const k = normTxt(it.name) + '|' + base;
        const cur = map.get(k) || { name: it.name.trim(), base, q: 0, days: new Set() };
        cur.q += q * f; cur.days.add(DIAS3[dow(date)]); map.set(k, cur);
      });
    });
  });
  return Array.from(map.values()).map(x => ({ ...x, label: prettyQty(x.q, x.base), days: Array.from(x.days) })).sort((a, b) => a.name.localeCompare(b.name));
}

/* ---------- Entrenamiento ---------- */
const toKg = (w, u) => u === 'lb' ? w * 0.453592 : w;
function nextDayIdx(st) {
  const r = st?.routine; if (!r || !(r.days || []).length) return -1;
  const logs = Q.logs(st.id).filter(l => (l.routineVer || 0) === (r.ver || 0));
  if (!logs.length) return 0;
  return ((logs[logs.length - 1].dayIdx || 0) + 1) % r.days.length;
}
function bestOf(ex) { let mw = 0, mr = 0, vol = 0; (ex.sets || []).forEach(s => { const w = toKg(Number(s.w) || 0, s.u); mw = Math.max(mw, w); mr = Math.max(mr, Number(s.reps) || 0); vol += w * (Number(s.reps) || 0); }); return { mw, mr, vol }; }
function exHistory(sid, name, beforeTs) {
  const n = normTxt(name);
  return Q.logs(sid).filter(l => l.status === 'done' && (!beforeTs || l.ts < beforeTs)).map(l => ({ l, ex: (l.exercises || []).find(e => normTxt(e.name) === n) })).filter(x => x.ex && (x.ex.sets || []).length);
}
function improvements(sid, exercises, ts) {
  const out = [];
  exercises.forEach(ex => {
    if (!(ex.sets || []).length) return;
    const cur = bestOf(ex), hist = exHistory(sid, ex.name, ts);
    if (!hist.length) { out.push({ kind: 'first', name: ex.name, cur }); return; }
    const dayMs = 86400000;
    const pick = (lo, hi) => { const c = hist.filter(h => ts - h.l.ts >= lo * dayMs && ts - h.l.ts <= hi * dayMs); return c.length ? c[c.length - 1] : null; };
    const week = pick(4, 11) || hist[hist.length - 1];
    const month = pick(24, 40);
    [[week, 'semana pasada'], [month, 'mes pasado']].forEach(([h, label]) => {
      if (!h) return;
      const p = bestOf(h.ex);
      if (cur.mw > p.mw + 0.01) out.push({ kind: 'up', name: ex.name, label, txt: `${numStr(round1(p.mw))} → ${numStr(round1(cur.mw))} kg` });
      else if (Math.abs(cur.mw - p.mw) < 0.01 && cur.mr > p.mr) out.push({ kind: 'up', name: ex.name, label, txt: `${p.mr} → ${cur.mr} repeticiones` });
      else if (cur.vol > p.vol * 1.03 && cur.mw >= p.mw - 0.01) out.push({ kind: 'up', name: ex.name, label, txt: `volumen +${Math.round((cur.vol / p.vol - 1) * 100)}%` });
    });
  });
  const seen = new Set();
  return out.filter(x => { const k = x.name + x.label + x.kind; if (seen.has(k)) return false; seen.add(k); return true; });
}

/* ---------- Adherencia y omisiones ---------- */
function rangeDates(from, to) { const out = []; let d = from; let g = 0; while (d <= to && g++ < 800) { out.push(d); d = addDays(d, 1); } return out; }
function stats(st, from, to) {
  const t = today(); const start = st.inicio && st.inicio > from ? st.inicio : from;
  const end = to > t ? t : to;
  const logs = Q.logs(st.id).filter(l => l.date >= from && l.date <= to);
  const done = logs.filter(l => l.status === 'done'), skipped = logs.filter(l => l.status === 'skipped');
  let planned = 0, ate = 0, skippedMeals = 0; const mealSkips = [];
  let noLog = 0;
  if (start <= end) rangeDates(start, end).forEach(d => {
    const pm = plannedMeals(st, dow(d)); const log = Q.meal(st.id, d); const ch = log?.checks || {};
    if (!pm.length) return;
    if (!Object.keys(ch).length) { if (d !== t) noLog++; return; }
    pm.forEach(({ meal }) => {
      const v = ch[meal.id];
      if (d === t && !v) return;
      planned++;
      if (v === 'done') ate++;
      else if (v === 'skip') { skippedMeals++; mealSkips.push({ date: d, meal: meal.name, reason: (log.reasons || {})[meal.id] || '' }); }
    });
  });
  const vol = done.reduce((a, l) => a + (l.exercises || []).reduce((b, e) => b + bestOf(e).vol, 0), 0);
  return {
    done: done.length, skipped: skipped.length, skippedLogs: skipped, logs,
    trainPct: done.length + skipped.length ? Math.round(done.length / (done.length + skipped.length) * 100) : null,
    planned, ate, skippedMeals, mealSkips, noLog, dietPct: planned ? Math.round(ate / planned * 100) : null, vol
  };
}
function omissionsSince(st, date) {
  const from = date || st.inicio || addDays(today(), -30);
  const s = stats(st, from, today());
  return { days: s.skippedLogs.map(l => ({ date: l.date, day: l.dayName, reason: l.reason })), meals: s.mealSkips, s };
}
function lastReview(sid) { const r = Q.reviews(sid); return r.length ? r[r.length - 1] : null; }
function weightSeries(sid) {
  return Q.reviews(sid).map(r => { const m = (r.measures || []).find(x => /peso|weight/i.test(normTxt(x.name))); return m && parseNum(m.value) != null ? { x: r.date, y: parseNum(m.value), u: m.unit } : null; }).filter(Boolean);
}
function measureNames(sid) { const set = new Map(); Q.reviews(sid).forEach(r => (r.measures || []).forEach(m => { if (parseNum(m.value) != null) set.set(m.name, m.unit); })); return Array.from(set.entries()).map(([name, unit]) => ({ name, unit })); }
function measureSeries(sid, name) { return Q.reviews(sid).map(r => { const m = (r.measures || []).find(x => x.name === name); return m && parseNum(m.value) != null ? { x: r.date, y: parseNum(m.value) } : null; }).filter(Boolean); }
function streak(st) {
  let d = today(), n = 0, g = 0;
  const has = x => Q.logs(st.id).some(l => l.date === x && l.status === 'done');
  if (!has(d)) d = addDays(d, -1);
  const dates = new Set(Q.logs(st.id).filter(l => l.status === 'done').map(l => l.date));
  while (g++ < 400) { if (dates.has(d)) { n++; d = addDays(d, -1); } else { const w = dow(d); if (w === 6 || w === 5) { d = addDays(d, -1); continue; } break; } }
  return n;
}

/* ---------- Notificaciones ---------- */
function notifications(sess) {
  const out = []; const t = today();
  if (sess.role === 'super') {
    Q.trainers().forEach(tr => { const p = payState(tr.nextPay); if (['late', 'today', 'soon'].includes(p.k)) out.push({ kind: p.k === 'late' ? 'bad' : 'warn', title: `Pago de ${fullName(tr)}`, text: `${p.label} · ${fmtD(tr.nextPay)}`, go: { view: 'trainers', id: tr.id } }); });
  } else if (sess.role === 'trainer') {
    const tr = Q.trainer(sess.id); if (!tr) return out;
    const p = payState(tr.nextPay);
    if (['late', 'today', 'soon'].includes(p.k)) out.push({ kind: p.k === 'late' ? 'bad' : 'warn', title: 'Tu suscripción COUCH+', text: `${p.label} · ${fmtD(tr.nextPay)}`, go: { view: 'account' } });
    Q.students(tr.id).forEach(s => {
      if (s.remind) { const ps = payState(s.nextPay); if (['late', 'today', 'soon'].includes(ps.k)) out.push({ kind: ps.k === 'late' ? 'bad' : 'warn', title: `Pago de ${fullName(s)}`, text: `${ps.label} · ${fmtD(s.nextPay)}`, go: { view: 'student', id: s.id, tab: 'perfil' } }); }
      if (s.nextReview && s.nextReview <= t) out.push({ kind: 'info', title: `Revisión de ${fullName(s)}`, text: s.nextReview === t ? 'Programada para hoy' : `Pendiente desde ${fmtD(s.nextReview)}`, go: { view: 'student', id: s.id, tab: 'revisiones' } });
      Q.logs(s.id).filter(l => l.status === 'skipped' && diffDays(l.date, t) <= 3).forEach(l => out.push({ kind: 'bad', title: `${s.nombres} omitió ${l.dayName}`, text: l.reason ? `“${l.reason}”` : 'Sin motivo', go: { view: 'student', id: s.id, tab: 'progreso' } }));
    });
  } else if (sess.role === 'student') {
    const s = Q.student(sess.id); if (!s) return out;
    if (s.remind) { const ps = payState(s.nextPay); if (['late', 'today', 'soon'].includes(ps.k)) out.push({ kind: ps.k === 'late' ? 'bad' : 'warn', title: 'Recordatorio de pago', text: `Tu próximo pago: ${fmtD(s.nextPay)} · ${ps.label.toLowerCase()}`, go: { view: 'home' } }); }
    if (s.nextReview && diffDays(t, s.nextReview) <= 2 && diffDays(t, s.nextReview) >= 0) out.push({ kind: 'info', title: 'Revisión con tu entrenador', text: s.nextReview === t ? 'Es hoy' : fmtLong(s.nextReview), go: { view: 'progress' } });
  }
  return out;
}

/* ---------- Imagen ---------- */
function compressImage(file, max = 1000) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = () => rej(new Error('read'));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => rej(new Error('img'));
      img.onload = () => {
        let q = 0.78, m = max, out = '';
        for (let i = 0; i < 6; i++) {
          const s = Math.min(1, m / Math.max(img.width, img.height));
          const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          out = c.toDataURL('image/jpeg', q);
          if (out.length < 190000) break;
          q -= 0.1; m = Math.round(m * 0.82);
        }
        res(out);
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
