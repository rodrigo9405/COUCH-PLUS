/* COUCH+ · componentes base */
const ICONS = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10', users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', calendar: 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  dumbbell: 'M6.5 6v12M17.5 6v12M3 9v6M21 9v6M6.5 12h11', food: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7',
  chart: 'M3 3v18h18M7 15l4-4 3 3 5-6', cart: 'M3 3h2l2.4 12.2a2 2 0 0 0 2 1.8h8.2a2 2 0 0 0 2-1.6L21 8H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0', layers: 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9', plus: 'M12 5v14M5 12h14', edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6', check: 'M20 6 9 17l-5-5', x: 'M18 6 6 18M6 6l12 12', chevR: 'M9 18l6-6-6-6', chevL: 'M15 18l-6-6 6-6', chevD: 'M6 9l6 6 6-6',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2', camera: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z', msg: 'M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.2-5.4A8.5 8.5 0 1 1 21 11.5z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3', copy: 'M9 9h11v11H9zM5 15H4V4h11v1', play: 'M6 4l14 8-14 8z', skip: 'M5 4l10 8-10 8zM19 5v14',
  power: 'M12 2v10M18.4 6.6a9 9 0 1 1-12.8 0', wallet: 'M3 7h18v13H3zM3 7l3-4h12l3 4M16 14h.01', ruler: 'M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4zM7.5 10.5l2 2M10.5 7.5l2 2M13.5 4.5l2 2M4.5 13.5l2 2',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14zM20 17v4H6.5', up: 'M12 19V5M5 12l7-7 7 7', down: 'M12 5v14M19 12l-7 7-7-7',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
  flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.3.3 1.4 1.3 2.8 2.5 2.8z',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4', refresh: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5', cube: 'M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7 12 12l8.7-5M12 22V12',
  menu: 'M3 6h18M3 12h18M3 18h18', grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z', undo: 'M3 7v6h6M21 17a9 9 0 0 0-15-6.7L3 13'
};
const Ic = ({ n, s = 18, w = 2, cls = '' }) => html`<svg class=${'ic ' + cls} width=${s} height=${s} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=${w} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${ICONS[n] || ''} /></svg>`;

/* ---------- Bus de UI: modales y avisos ---------- */
const UIBus = (() => {
  let modals = [], toasts = []; const subs = new Set(); const emit = () => subs.forEach(f => f());
  return {
    get modals() { return modals; }, get toasts() { return toasts; },
    open(renderFn, opts = {}) { const id = uid(); modals = [...modals, { id, renderFn, opts }]; emit(); return () => UIBus.close(id); },
    close(id) { modals = modals.filter(m => m.id !== id); emit(); },
    toast(msg, kind = 'ok') { const id = uid(); toasts = [...toasts, { id, msg, kind }]; emit(); setTimeout(() => { toasts = toasts.filter(t => t.id !== id); emit(); }, 3400); },
    sub(f) { subs.add(f); return () => subs.delete(f); }
  };
})();
const toast = (m, k) => UIBus.toast(m, k);
function useBus() { const [, s] = useState(0); useEffect(() => UIBus.sub(() => s(x => x + 1)), []); return UIBus; }
function openModal(Comp, props = {}, opts = {}) { let close; close = UIBus.open(c => html`<${Comp} ...${props} close=${c} />`, opts); return close; }
function confirmBox({ title, text, ok = 'Confirmar', cancel = 'Cancelar', danger = false, input = null }) {
  return new Promise(res => {
    UIBus.open(close => html`<${ConfirmDlg} title=${title} text=${text} ok=${ok} cancel=${cancel} danger=${danger} input=${input} onDone=${v => { close(); res(v); }} />`);
  });
}
function ConfirmDlg({ title, text, ok, cancel, danger, input, onDone }) {
  const [val, setVal] = useState('');
  const need = input && input.required && !val.trim();
  return html`<${Modal} title=${title} onClose=${() => onDone(false)} size="sm"
    footer=${html`<button class="btn ghost" onClick=${() => onDone(false)}>${cancel}</button><button class=${'btn ' + (danger ? 'danger' : 'primary')} disabled=${need} onClick=${() => onDone(input ? val.trim() || true : true)}>${ok}</button>`}>
    ${text && html`<p class="muted">${text}</p>`}
    ${input && html`<label class="field"><span>${input.label}</span><textarea id="confirm-input" rows="3" placeholder=${input.placeholder || ''} value=${val} onInput=${e => setVal(e.target.value)}></textarea></label>`}
  <//>`;
}
function Modal({ title, sub, onClose, children, footer, size = 'md', noClose }) {
  const ref = useRef();
  useEffect(() => {
    const k = e => { if (e.key === 'Escape' && !noClose) onClose && onClose(); };
    document.addEventListener('keydown', k);
    const f = ref.current && ref.current.querySelector('input:not([type=checkbox]):not([type=file]),textarea,select');
    if (f && size !== 'full') setTimeout(() => f.focus({ preventScroll: true }), 30);
    return () => document.removeEventListener('keydown', k);
  }, []);
  return html`<div class=${'overlay sz-' + size} onMouseDown=${e => { if (e.target === e.currentTarget && !noClose && size !== 'full') onClose && onClose(); }}>
    <div class="dialog" role="dialog" aria-modal="true" aria-label=${title} ref=${ref}>
      <header class="dlg-h"><div><h3>${title}</h3>${sub && html`<p class="muted sm">${sub}</p>`}</div>${!noClose && html`<button class="icon-btn" aria-label="Cerrar" onClick=${onClose}><${Ic} n="x" /></button>`}</header>
      <div class="dlg-b">${children}</div>
      ${footer && html`<footer class="dlg-f">${footer}</footer>`}
    </div></div>`;
}
function ModalHost() {
  const bus = useBus();
  return html`${bus.modals.map(m => html`<div key=${m.id}>${m.renderFn(() => UIBus.close(m.id))}</div>`)}
    <div class="toasts" aria-live="polite">${bus.toasts.map(t => html`<div key=${t.id} class=${'toast ' + t.kind}><${Ic} n=${t.kind === 'bad' ? 'alert' : 'check'} s=${16} /> ${t.msg}</div>`)}</div>`;
}

/* ---------- Pequeños componentes ---------- */
const Pill = ({ k = 'neutral', children }) => html`<span class=${'pill ' + k}>${children}</span>`;
const PayPill = ({ next }) => { const p = payState(next); const map = { late: 'bad', today: 'warn', soon: 'warn', ok: 'good', none: 'neutral' }; return html`<${Pill} k=${map[p.k]}>${p.label}<//>`; };
const Avatar = ({ p, size = 36, tone = 0 }) => html`<span class="avatar" style=${`width:${size}px;height:${size}px;font-size:${size * 0.38}px;background:${PLATE[tone % 4]};color:${PLATE_INK[tone % 4]}`}>${initials(p)}</span>`;
const hashTone = s => { let h = 0; for (const c of String(s || '')) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) % 4; };
const Empty = ({ icon = 'grid', title, text, children }) => html`<div class="empty"><div class="empty-ic"><${Ic} n=${icon} s=${22} /></div><strong>${title}</strong>${text && html`<p class="muted">${text}</p>`}${children}</div>`;
const Plate = ({ i, label, size = 30 }) => html`<span class="plate" style=${`--pc:${PLATE[i % 7]};--pi:${PLATE_INK[i % 7]};width:${size}px;height:${size}px;font-size:${size * 0.36}px`}>${label}</span>`;
const Field = ({ label, hint, children, error, cls = '' }) => html`<label class=${'field ' + cls}><span>${label}</span>${children}${hint && !error && html`<small class="muted">${hint}</small>`}${error && html`<small class="err">${error}</small>`}</label>`;
function Tabs({ tabs, value, onChange }) {
  return html`<div class="tabs" role="tablist">${tabs.map(t => html`<button role="tab" aria-selected=${value === t.k} class=${'tab ' + (value === t.k ? 'on' : '')} onClick=${() => onChange(t.k)}>${t.icon && html`<${Ic} n=${t.icon} s=${16} />`}${t.label}${t.badge ? html`<span class="badge">${t.badge}</span>` : ''}</button>`)}</div>`;
}
function Seg({ options, value, onChange, small }) {
  return html`<div class=${'seg ' + (small ? 'sm' : '')}>${options.map(o => html`<button type="button" class=${value === o.k ? 'on' : ''} onClick=${() => onChange(o.k)}>${o.label}</button>`)}</div>`;
}
function Toggle({ checked, onChange, label, id }) {
  return html`<label class="toggle" for=${id}><input id=${id} type="checkbox" checked=${checked} onChange=${e => onChange(e.target.checked)} /><span class="track"><span class="knob"></span></span>${label && html`<span>${label}</span>`}</label>`;
}
function CopyBtn({ text, label = 'Copiar' }) {
  const [done, setDone] = useState(false);
  const go = () => {
    const ok = () => { setDone(true); setTimeout(() => setDone(false), 1600); };
    try { navigator.clipboard.writeText(text).then(ok, () => { fallback(); }); } catch (e) { fallback(); }
    function fallback() { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast('Selecciona el texto y cópialo manualmente', 'bad'); } ta.remove(); }
  };
  return html`<button type="button" class="btn ghost sm" onClick=${go}><${Ic} n=${done ? 'check' : 'copy'} s=${15} />${done ? 'Copiado' : label}</button>`;
}
function WaBtn({ phone, text, label = 'WhatsApp' }) {
  const href = waLink(phone, text);
  if (!href) return html`<span class="muted sm">Sin teléfono registrado</span>`;
  return html`<a class="btn ghost sm" href=${href} target="_blank" rel="noopener"><${Ic} n="msg" s=${15} />${label}</a>`;
}
function PhotoImg({ pid, alt = '', cls = '' }) {
  const [src, setSrc] = useState(null); const [miss, setMiss] = useState(false);
  useEffect(() => { let on = true; Store.getPhoto(pid).then(s => { if (!on) return; s ? setSrc(s) : setMiss(true); }); return () => { on = false; }; }, [pid]);
  if (miss) return html`<div class=${'ph-miss ' + cls}><${Ic} n="camera" /></div>`;
  return src ? html`<img class=${cls} src=${src} alt=${alt} />` : html`<div class=${'ph-load ' + cls}></div>`;
}
function useWide(q = '(min-width: 860px)') {
  const mq = window.matchMedia ? window.matchMedia(q) : null;
  const [w, setW] = useState(mq ? mq.matches : true);
  useEffect(() => { if (!mq) return; const f = e => setW(e.matches); mq.addEventListener ? mq.addEventListener('change', f) : mq.addListener(f); return () => mq.removeEventListener ? mq.removeEventListener('change', f) : mq.removeListener(f); }, []);
  return w;
}

/* ---------- Gráficos ---------- */
function LineChart({ data, unit = '', h = 180, color = 'var(--accent)' }) {
  if (!data || !data.length) return html`<div class="chart-empty muted">Sin datos todavía</div>`;
  const W = 640, H = h, pl = 44, pr = 56, pt = 18, pb = 28;
  const xs = data.map(d => parseD(d.x).getTime()); const ys = data.map(d => d.y);
  let x0 = Math.min(...xs), x1 = Math.max(...xs); if (x0 === x1) { x0 -= 864e5 * 3; x1 += 864e5 * 3; }
  let y0 = Math.min(...ys), y1 = Math.max(...ys); const padY = (y1 - y0) * 0.18 || Math.max(1, Math.abs(y1) * 0.04); y0 -= padY; y1 += padY;
  const X = t => pl + (t - x0) / (x1 - x0) * (W - pl - pr), Y = v => pt + (1 - (v - y0) / (y1 - y0)) * (H - pt - pb);
  const pts = data.map((d, i) => [X(xs[i]), Y(d.y)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L${pts[pts.length - 1][0].toFixed(1)} ${H - pb} L${pts[0][0].toFixed(1)} ${H - pb} Z`;
  const ticks = [0, 0.5, 1].map(f => y0 + padY + (y1 - y0 - 2 * padY) * f);
  const last = pts[pts.length - 1], gid = 'g' + Math.random().toString(36).slice(2, 7);
  return html`<svg class="chart" viewBox=${`0 0 ${W} ${H}`} role="img" aria-label="Gráfico de evolución">
    <defs><linearGradient id=${gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color=${color} stop-opacity="0.22" /><stop offset="1" stop-color=${color} stop-opacity="0" /></linearGradient></defs>
    ${ticks.map(v => html`<line x1=${pl} x2=${W - pr} y1=${Y(v)} y2=${Y(v)} class="grid-l" /><text x=${pl - 8} y=${Y(v) + 4} text-anchor="end" class="axis-t">${numStr(round1(v))}</text>`)}
    <path d=${area} fill=${`url(#${gid})`} />
    <path d=${line} fill="none" stroke=${color} stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
    ${pts.map((p, i) => html`<circle cx=${p[0]} cy=${p[1]} r=${i === pts.length - 1 ? 5 : 3} fill=${i === pts.length - 1 ? color : 'var(--surface)'} stroke=${color} stroke-width="2" />`)}
    <text x=${Math.min(last[0] + 9, W - 4)} y=${last[1] + 4} class="axis-v" fill=${color} text-anchor=${last[0] + 9 > W - pr ? 'end' : 'start'}>${numStr(data[data.length - 1].y)} ${unit}</text>
    <text x=${pl} y=${H - 8} class="axis-t">${fmtDs(data[0].x)}</text>
    ${data.length > 1 && html`<text x=${W - pr} y=${H - 8} text-anchor="end" class="axis-t">${fmtDs(data[data.length - 1].x)}</text>`}
  </svg>`;
}
function Ring({ pct, size = 86, stroke = 9, color = 'var(--accent)', label, sub }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  return html`<div class="ring" style=${`width:${size}px;height:${size}px`}>
    <svg width=${size} height=${size} viewBox=${`0 0 ${size} ${size}`}><circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke="var(--line)" stroke-width=${stroke} />
    <circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke=${color} stroke-width=${stroke} stroke-linecap="round" stroke-dasharray=${`${c * v / 100} ${c}`} transform=${`rotate(-90 ${size / 2} ${size / 2})`} /></svg>
    <div class="ring-t"><strong>${pct == null ? '—' : pct + '%'}</strong>${label && html`<span>${label}</span>`}</div></div>`;
}
function Bars({ items, h = 120, unit = '' }) {
  const max = Math.max(1, ...items.map(i => i.v));
  return html`<div class="bars" style=${`height:${h}px`}>${items.map(i => html`<div class="bar-col" title=${`${i.label}: ${i.v}${unit}`}>
    <span class="bar-v">${i.v || ''}</span><div class="bar" style=${`height:${Math.max(2, i.v / max * (h - 38))}px;background:${i.color || 'var(--accent)'}`}></div><span class="bar-l">${i.label}</span></div>`)}</div>`;
}

/* ---------- Escenario 3D ---------- */
function Stage3D({ name, cls = '' }) {
  const ref = useRef(), st = useRef(null), first = useRef(true);
  const [label, setLabel] = useState('');
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    st.current = Fig3D.mount(ref.current, name, { lineColor: css.getPropertyValue('--ink-3').trim() || '#8892a0' });
    setLabel(st.current.label ? st.current.label() : '');
    return () => st.current && st.current.destroy();
  }, []);
  useEffect(() => { if (first.current) { first.current = false; return; } if (st.current) { st.current.set(name); setLabel(st.current.label ? st.current.label() : ''); } }, [name]);
  return html`<div class=${'stage-wrap ' + cls}><div class="stage" ref=${ref}></div><span class="stage-tag"><${Ic} n="cube" s=${13} /> ${label} · arrastra para girar</span></div>`;
}
function preview3D(name) { openModal(({ close }) => html`<${Modal} title=${name || 'Ejercicio'} sub="Vista de referencia del movimiento" onClose=${close} size="lg"><${Stage3D} name=${name} cls="tall" /><//>`); }
