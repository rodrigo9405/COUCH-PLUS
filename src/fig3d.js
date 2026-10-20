/* COUCH+ · Figura 3D de gimnasio (Three.js r149, cinemática inversa de 2 huesos) */
const Fig3D = (() => {
  const D = Math.PI / 180;
  const LEN = { thigh: 0.45, shin: 0.44, upper: 0.33, fore: 0.31 };
  const lerp = (a, b, t) => a + (b - a) * t;
  const L3 = (A, B, t) => A.map((v, i) => lerp(v, B[i], t));
  const sym = (x, y, z) => ({ L: [x, y, z], R: [-x, y, z] });
  const symL = (A, B, t) => sym(...L3(A, B, t));
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  function stand() {
    return {
      root: [0, 0.97, 0], rot: [0, 0, 0], spine: [0, 0, 0], head: 0,
      feet: sym(0.13, 0.08, 0.03), fs: 'world', legPole: sym(0.15, 0, 1),
      hands: sym(0.23, 0.87, 0.05), hs: 'world', armPole: sym(0.35, 0, -1),
      pitch: { L: 0, R: 0 }
    };
  }

  /* ---------- Biblioteca de ejercicios ---------- */
  const BENCH = { t: 'bench', pos: [0, 0, -0.1], len: 1.25 };
  const EX = {
    squat: {
      label: 'Sentadilla con barra', view: [58, 8, 4.3, 1.0], period: 3.2,
      props: [{ t: 'bar' }, { t: 'rack', z: -0.15 }],
      fn(p) {
        const b = stand();
        b.feet = sym(0.17, 0.08, 0.06); b.legPole = sym(0.4, 0, 1);
        b.root = L3([0, 0.95, 0], [0, 0.58, -0.2], p);
        b.spine = [lerp(4, 38, p), 0, 0]; b.head = lerp(0, -22, p);
        b.hands = sym(0.36, 0.53, -0.11); b.hs = 'spine'; b.armPole = sym(0.4, -1, -0.5);
        return b;
      }
    },
    deadlift: {
      label: 'Peso muerto', view: [62, 8, 4.1, 0.92], period: 3.4,
      props: [{ t: 'bar' }],
      fn(p) {
        const b = stand();
        const th = 65 * Math.pow(1 - p, 1.15);
        const h = lerp(0.22, 0.86, p);
        const sy = h + 0.615, sz = lerp(0.17, 0.0, p);
        b.root = [0, sy - 0.5 * Math.cos(th * D) - 0.02, sz - 0.5 * Math.sin(th * D)];
        b.spine = [th, 0, 0]; b.head = -0.5 * th;
        b.hands = sym(0.22, h, lerp(0.08, 0.1, p)); b.armPole = sym(0.2, 0, -1);
        return b;
      }
    },
    bench: {
      label: 'Press de banca', view: [76, 22, 4.0, 0.62], period: 3,
      props: [BENCH, { t: 'bar' }, { t: 'rack', z: -0.42, h: 1.25, bench: true }],
      fn(p) {
        const b = stand();
        b.root = [0, 0.55, 0.15]; b.rot = [-90, 0, 0];
        b.hands = sym(0.3, lerp(0.72, 1.16, p), lerp(-0.25, -0.33, p)); b.armPole = sym(1, -0.5, 0.3);
        b.feet = sym(0.27, 0.08, 0.75); b.legPole = sym(0.3, 1, 0.5);
        return b;
      }
    },
    bench_db: {
      label: 'Press con mancuernas', view: [76, 20, 3.6, 0.62], period: 3,
      props: [BENCH, { t: 'db' }],
      fn(p) {
        const b = EX.bench.fn(p);
        b.hands = symL([0.33, 0.72, -0.33], [0.15, 1.16, -0.35], p); b.armPole = sym(1, -0.6, 0.1);
        return b;
      }
    },
    fly: {
      label: 'Aperturas', view: [30, 30, 3.9, 0.6], period: 3.4,
      props: [BENCH, { t: 'db' }],
      fn(p) {
        const b = EX.bench.fn(0);
        const f = lerp(12, 84, p) * D;
        b.hands = sym(0.19 + 0.6 * Math.cos(f), 0.55 + 0.6 * Math.sin(f), -0.36);
        b.armPole = sym(0.6, -0.8, 0.2);
        return b;
      }
    },
    pushup: {
      label: 'Flexiones', view: [82, 14, 3.2, 0.4], period: 2.4,
      props: [{ t: 'mat', len: 2.1, z: -0.2 }],
      fn(p) {
        const b = stand();
        const phi = lerp(6, 19.5, p), th = 90 - phi;
        b.rot = [th, 0, 0];
        b.root = [0, 0.17 + 0.885 * Math.sin(phi * D), -0.9 + 0.885 * Math.cos(phi * D)];
        b.hands = sym(0.25, 0.05, 0.42); b.armPole = sym(0.7, 0.6, -0.4);
        b.feet = sym(0.1, 0.17, -0.9); b.legPole = sym(0, 1, -0.1); b.pitch = { L: 70, R: 70 };
        b.head = -15;
        return b;
      }
    },
    plank: {
      label: 'Plancha', view: [80, 14, 3.2, 0.35], period: 4,
      props: [{ t: 'mat', len: 2.1, z: -0.2 }],
      fn(p) {
        const b = stand();
        const phi = lerp(8, 9.6, p), th = 90 - phi;
        b.rot = [th, 0, 0];
        b.root = [0, 0.17 + 0.885 * Math.sin(phi * D), -0.95 + 0.885 * Math.cos(phi * D)];
        b.hands = sym(0.12, 0.06, 0.7); b.armPole = sym(0, -1, 0);
        b.feet = sym(0.1, 0.17, -0.95); b.legPole = sym(0, 1, -0.1); b.pitch = { L: 70, R: 70 };
        b.head = -10;
        return b;
      }
    },
    row: {
      label: 'Remo con barra', view: [70, 8, 4.0, 0.92], period: 2.6,
      props: [{ t: 'bar' }],
      fn(p) {
        const b = stand();
        b.root = [0, 0.85, -0.15]; b.spine = [48, 0, 0]; b.head = -28;
        b.hands = symL([0.24, 0.57, 0.24], [0.24, 0.95, 0.12], p); b.armPole = sym(0.3, 1, -0.6);
        b.feet = sym(0.13, 0.08, 0.05); b.legPole = sym(0.2, 0, 1);
        return b;
      }
    },
    row_db: {
      label: 'Remo con mancuernas', view: [70, 8, 3.8, 0.92], period: 2.6,
      props: [{ t: 'db' }],
      fn(p) { const b = EX.row.fn(p); b.hands = symL([0.2, 0.57, 0.22], [0.22, 0.97, 0.06], p); return b; }
    },
    pulldown: {
      label: 'Jalón al pecho', view: [52, 6, 3.8, 1.15], period: 2.8,
      props: [{ t: 'box', pos: [0, 0.24, 0.05], size: [0.42, 0.48, 0.42] }, { t: 'box', pos: [0, 1.25, -0.42], size: [0.12, 2.5, 0.12], metal: 1 },
        { t: 'box', pos: [0, 2.46, -0.15], size: [0.1, 0.08, 0.62], metal: 1 }, { t: 'box', pos: [0, 0.7, 0.32], size: [0.42, 0.09, 0.09], pad: 1 },
        { t: 'cable', from: [0, 2.42, 0.12] }, { t: 'handle', w: 1.05 }],
      fn(p) {
        const b = stand();
        b.root = [0, 0.56, 0]; b.spine = [lerp(-4, -14, p), 0, 0]; b.head = lerp(-10, 0, p);
        b.hands = symL([0.42, 1.68, 0.06], [0.4, 1.15, 0.14], p); b.armPole = sym(0.5, -1, -0.4);
        b.feet = sym(0.16, 0.08, 0.48); b.legPole = sym(0.1, 1, 0.6);
        return b;
      }
    },
    pullup: {
      label: 'Dominadas', view: [42, 4, 4.9, 1.45], period: 3,
      props: [{ t: 'pullframe', y: 2.32, z: 0.04 }],
      fn(p) {
        const b = stand();
        b.root = L3([0, 1.17, -0.02], [0, 1.6, 0.03], p); b.spine = [lerp(-4, -12, p), 0, 0]; b.head = lerp(-8, -14, p);
        b.hands = sym(0.36, 2.3, 0.04); b.armPole = sym(0.6, -1, -0.3);
        b.feet = sym(0.07, -0.8, -0.22); b.fs = 'root'; b.legPole = sym(0, 0, 1); b.pitch = { L: 50, R: 50 };
        return b;
      }
    },
    ohp: {
      label: 'Press militar', view: [48, 6, 4.6, 1.2], period: 2.8,
      props: [{ t: 'bar' }],
      fn(p) {
        const b = stand();
        const z = lerp(0.14, 0.02, p) + 0.1 * Math.sin(Math.PI * p);
        b.hands = sym(0.27, lerp(1.53, 2.08, p), z);
        b.armPole = symL([0.3, -1, 0.6], [0.6, 0, -0.3], p); b.head = -12 * Math.sin(Math.PI * p);
        return b;
      }
    },
    ohp_db: {
      label: 'Press de hombro con mancuernas', view: [30, 6, 4.3, 1.2], period: 2.8,
      props: [{ t: 'db' }],
      fn(p) { const b = stand(); b.hands = symL([0.36, 1.52, 0.03], [0.2, 2.08, 0], p); b.armPole = sym(1, -0.6, 0); return b; }
    },
    lateral: {
      label: 'Elevaciones laterales', view: [22, 8, 4.0, 1.1], period: 2.6,
      props: [{ t: 'db' }],
      fn(p) {
        const b = stand(); b.spine = [5, 0, 0];
        const f = lerp(-84, 2, p) * D;
        b.hands = sym(0.19 + 0.62 * Math.cos(f), 1.49 + 0.62 * Math.sin(f), 0.08); b.armPole = sym(0.1, 0.4, -1);
        return b;
      }
    },
    front: {
      label: 'Elevación frontal', view: [62, 8, 4.0, 1.1], period: 2.6,
      props: [{ t: 'db' }],
      fn(p) {
        const b = stand(); const f = lerp(-84, 0, p) * D;
        b.hands = sym(0.22, 1.49 + 0.62 * Math.sin(f), 0.62 * Math.cos(f)); b.armPole = sym(0.6, -0.3, -0.3);
        return b;
      }
    },
    curl: {
      label: 'Curl de bíceps', view: [55, 6, 3.9, 1.05], period: 2.4,
      props: [{ t: 'db' }],
      fn(p) {
        const b = stand(); const th = lerp(-80, 66, p) * D;
        b.hands = sym(0.2, 1.16 + 0.31 * Math.sin(th), -0.02 + 0.31 * Math.cos(th)); b.armPole = sym(0.1, 0, -1);
        return b;
      }
    },
    curl_bar: {
      label: 'Curl con barra', view: [55, 6, 4.0, 1.05], period: 2.4,
      props: [{ t: 'bar', small: 1 }],
      fn(p) { const b = EX.curl.fn(p); b.hands.L[0] = 0.24; b.hands.R[0] = -0.24; return b; }
    },
    pushdown: {
      label: 'Extensión de tríceps en polea', view: [74, 6, 4.1, 1.1], period: 2.4,
      props: [{ t: 'box', pos: [0, 1.2, 0.62], size: [0.14, 2.4, 0.14], metal: 1 }, { t: 'cable', from: [0, 2.28, 0.5] }, { t: 'handle', w: 0.38 }],
      fn(p) {
        const b = stand(); b.spine = [10, 0, 0];
        const th = lerp(10, -86, p) * D;
        b.hands = sym(0.13, 1.17 + 0.31 * Math.sin(th), 0.07 + 0.31 * Math.cos(th)); b.armPole = sym(0.15, 0, -1);
        return b;
      }
    },
    lunge: {
      label: 'Zancadas', view: [72, 8, 4.0, 0.92], period: 3,
      props: [{ t: 'db' }],
      fn(p) {
        const b = stand();
        b.feet = { L: [0.12, 0.08, 0.42], R: [-0.12, 0.13, -0.42] }; b.pitch = { L: 0, R: 42 };
        b.legPole = { L: [0.1, 0, 1], R: [-0.1, -0.4, 1] };
        b.root = L3([0, 0.9, 0.03], [0, 0.56, 0.03], p); b.spine = [6, 0, 0];
        b.hands = sym(0.23, -0.1, 0.04); b.hs = 'root';
        return b;
      }
    },
    legext: {
      label: 'Extensión de cuádriceps', view: [78, 8, 3.2, 0.7], period: 2.6,
      props: [{ t: 'box', pos: [0, 0.25, 0.08], size: [0.46, 0.5, 0.62] }, { t: 'box', pos: [0, 0.88, -0.27], size: [0.46, 0.72, 0.09], rx: -8, pad: 1 }, { t: 'roller' }],
      fn(p) {
        const b = stand();
        b.root = [0, 0.58, -0.05]; b.spine = [-8, 0, 0];
        const th = lerp(6, 84, p) * D;
        const K = [0.1, 0.53, 0.4];
        const f = [K[1] - 0.44 * Math.cos(th), K[2] + 0.44 * Math.sin(th)];
        b.feet = sym(0.1, f[0], f[1]); b.legPole = sym(0, 1, 0.2); b.pitch = { L: -th / D, R: -th / D };
        b.roller = [0, f[0] + 0.07 * Math.sin(th), f[1] + 0.07 * Math.cos(th)];
        b.hands = sym(0.3, 0.5, -0.02); b.armPole = sym(0.3, 0, -1);
        return b;
      }
    },
    legcurl: {
      label: 'Curl femoral', view: [82, 16, 3.3, 0.6], period: 2.6,
      props: [{ t: 'bench', pos: [0, 0.16, -0.1], len: 1.4, h: 0.62 }, { t: 'roller' }],
      fn(p) {
        const b = stand();
        b.root = [0, 0.72, 0]; b.rot = [90, 0, 0]; b.head = -25;
        const th = lerp(2, 100, p) * D;
        const K = [0.72, -0.48];
        const f = [K[0] + 0.44 * Math.sin(th), K[1] - 0.44 * Math.cos(th)];
        b.feet = sym(0.1, f[0], f[1]); b.legPole = sym(0, -1, 0); b.pitch = { L: 150 - th / D * 0.5, R: 150 - th / D * 0.5 };
        b.roller = [0, f[0] + 0.07 * Math.cos(th), f[1] + 0.07 * Math.sin(th)];
        b.hands = sym(0.25, 0.58, 0.75); b.armPole = sym(0.6, 0.4, -0.2);
        return b;
      }
    },
    calf: {
      label: 'Elevación de talones', view: [70, 4, 4.1, 0.98], period: 2.2,
      props: [{ t: 'db' }, { t: 'box', pos: [0, 0.03, 0.1], size: [0.6, 0.06, 0.2], dark: 1 }],
      fn(p) {
        const b = stand();
        b.root = [0, lerp(1.0, 1.08, p), 0];
        b.feet = sym(0.13, lerp(0.12, 0.2, p), 0.0); b.pitch = { L: lerp(-6, 30, p), R: lerp(-6, 30, p) };
        b.hands = sym(0.23, -0.1, 0.04); b.hs = 'root';
        return b;
      }
    },
    hipthrust: {
      label: 'Hip thrust', view: [84, 12, 3.3, 0.5], period: 2.8,
      props: [{ t: 'box', pos: [0, 0.21, -0.55], size: [1.1, 0.42, 0.3], pad: 1 }, { t: 'bar' }],
      fn(p) {
        const b = stand();
        b.rot = [lerp(-50, -88, p), 0, 0]; b.root = L3([0, 0.2, -0.02], [0, 0.5, 0.1], p); b.head = lerp(5, 22, p);
        b.feet = sym(0.18, 0.08, 0.52); b.legPole = sym(0.2, 1, 0.3);
        b.hands = sym(0.3, 0.02, 0.17); b.hs = 'root'; b.armPole = sym(0.4, 0.5, 0);
        return b;
      }
    },
    crunch: {
      label: 'Abdominales', view: [80, 18, 3, 0.35], period: 2.4,
      props: [{ t: 'mat', len: 1.9, z: 0.05 }],
      fn(p) {
        const b = stand();
        b.root = [0, 0.13, 0]; b.rot = [-90, 0, 0]; b.spine = [lerp(0, 36, p), 0, 0]; b.head = lerp(4, 14, p);
        b.feet = sym(0.13, 0.08, 0.56); b.legPole = sym(0, 1, 0.2);
        b.hands = sym(0.12, 0.68, -0.06); b.hs = 'spine'; b.armPole = sym(1, 0.2, 0.3);
        return b;
      }
    },
    cardio: {
      label: 'Trote en el sitio', view: [55, 6, 4.0, 0.98], period: 0.8, raw: true,
      props: [],
      fn(p, s) {
        const b = stand();
        const a = Math.sin(s), up = v => Math.max(0, v);
        b.root = [0, 0.96 + 0.025 * Math.abs(a), 0.02]; b.spine = [6, 0, 0];
        b.feet = { L: [0.12, 0.08 + 0.3 * up(a), 0.03 - 0.05 * up(a)], R: [-0.12, 0.08 + 0.3 * up(-a), 0.03 - 0.05 * up(-a)] };
        b.pitch = { L: 25 * up(a), R: 25 * up(-a) };
        b.hands = { L: [0.22, 0.1 + 0.1 * up(-a), 0.14 + 0.16 * (-a)], R: [-0.22, 0.1 + 0.1 * up(a), 0.14 + 0.16 * a] }; b.hs = 'root';
        b.armPole = sym(0.2, -0.3, -1);
        return b;
      }
    },
    idle: {
      label: 'Movimiento de referencia', view: [40, 6, 4.0, 0.98], period: 4,
      props: [],
      fn(p) { const b = stand(); b.root = [0, 0.97 - 0.006 * p, 0]; b.spine = [lerp(0, 2, p), 0, 0]; b.hands = sym(0.24, lerp(0.87, 0.88, p), 0.05); return b; }
    }
  };

  /* ---------- Clasificador por nombre ---------- */
  const RULES = [
    ['legcurl', ['curl femoral', 'femoral', 'leg curl', 'isquio']],
    ['legext', ['extension de cuadriceps', 'extensiones de cuadriceps', 'leg extension', 'sillon de cuadriceps', 'sillon']],
    ['calf', ['pantorrilla', 'gemelo', 'calf', 'soleo', 'talones']],
    ['hipthrust', ['hip thrust', 'puente de gluteo', 'glute bridge', 'empuje de cadera', 'puente']],
    ['pushdown', ['triceps', 'pushdown', 'press frances', 'patada', 'fondos', 'dips', 'copa']],
    ['legcurl', ['curl de pierna']],
    ['curl', ['curl', 'biceps', 'martillo', 'hammer', 'predicador', 'concentrado']],
    ['fly', ['apertura', 'fly', 'flye', 'pec deck', 'peck deck', 'contractora', 'cruce', 'crossover']],
    ['pushup', ['flexion', 'lagartija', 'push up', 'pushup', 'push-up']],
    ['plank', ['plancha', 'plank', 'isometric']],
    ['crunch', ['abdominal', 'crunch', 'encogimiento abdominal', 'sit up', 'situp', 'elevacion de piernas', 'oblicuo', 'rueda']],
    ['pullup', ['dominada', 'pull up', 'pullup', 'chin up', 'chin-up', 'barra fija']],
    ['pulldown', ['jalon', 'pulldown', 'pull down', 'polea alta', 'pullover']],
    ['row', ['remo', 'row', 'face pull', 'serrucho']],
    ['deadlift', ['peso muerto', 'deadlift', 'rumano', 'rdl', 'buenos dias', 'good morning', 'encogimiento', 'shrug']],
    ['lunge', ['zancada', 'estocada', 'lunge', 'bulgara', 'split', 'desplante', 'step up', 'subida al cajon']],
    ['squat', ['sentadilla', 'squat', 'prensa', 'hack', 'goblet', 'smith', 'aductor', 'abductor']],
    ['lateral', ['elevacion lateral', 'elevaciones laterales', 'vuelo', 'lateral', 'pajaro', 'posterior', 'deltoide']],
    ['front', ['elevacion frontal', 'elevaciones frontales', 'frontal', 'front raise']],
    ['ohp', ['press militar', 'press de hombro', 'press hombro', 'overhead', 'arnold', 'shoulder press', 'tras nuca', 'press sobre la cabeza']],
    ['bench', ['press banca', 'press de banca', 'banco plano', 'press plano', 'bench', 'press inclinado', 'press declinado', 'inclinado', 'declinado', 'press de pecho', 'chest press', 'press pecho']],
    ['cardio', ['cardio', 'trote', 'correr', 'caminadora', 'cinta', 'bicicleta', 'eliptica', 'burpee', 'salto', 'jumping', 'soga', 'cuerda', 'escaladora', 'mountain climber']]
  ];
  const MUSCLE = [['bench', ['pecho', 'pectoral']], ['pulldown', ['dorsal']], ['row', ['espalda']], ['squat', ['pierna', 'cuadriceps', 'muslo']], ['hipthrust', ['gluteo']],
    ['ohp', ['hombro']], ['curl', ['brazo']], ['crunch', ['abdomen', 'abs', 'core']]];
  function classify(name) {
    const n = norm(name);
    const db = /mancuerna|dumbbell|\bdb\b/.test(n);
    const bar = /barra|barbell|\bz\b|ez/.test(n);
    for (const [k, words] of RULES) {
      if (words.some(w => n.includes(w))) {
        if (k === 'bench' && db) return 'bench_db';
        if (k === 'ohp' && db) return 'ohp_db';
        if (k === 'row' && db) return 'row_db';
        if (k === 'curl' && bar && !db) return 'curl_bar';
        return k;
      }
    }
    for (const [k, words] of MUSCLE) if (words.some(w => n.includes(w))) return k;
    return 'idle';
  }

  /* ---------- Construcción del muñeco ---------- */
  function build(THREE) {
    const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.62, metalness: 0.05 }, o));
    const mat = {
      skin: M(0xc98b62, { roughness: 0.55 }), top: M(0x1d4f91), shorts: M(0x272c33), shoe: M(0xeeeeea), sole: M(0xd23a2e),
      hair: M(0x221a14, { roughness: 0.9 })
    };
    const cap = (r, l, m) => { const g = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 14), m); g.castShadow = true; return g; };
    const sph = (r, m, s) => { const g = new THREE.Mesh(new THREE.SphereGeometry(r, 22, 16), m); if (s) g.scale.set(...s); g.castShadow = true; return g; };
    const grp = (p, par) => { const g = new THREE.Group(); g.position.set(...p); if (par) par.add(g); return g; };

    const root = new THREE.Group();
    const pelvis = sph(0.15, mat.shorts, [1.08, 0.72, 0.78]); pelvis.position.y = -0.02; root.add(pelvis);
    const spine = grp([0, 0.02, 0], root);
    const abd = sph(0.14, mat.top, [1.0, 1.15, 0.78]); abd.position.y = 0.17; spine.add(abd);
    const chest = sph(0.2, mat.top, [1.0, 0.82, 0.66]); chest.position.y = 0.38; spine.add(chest);
    const traps = sph(0.12, mat.skin, [1.3, 0.55, 0.7]); traps.position.set(0, 0.5, -0.02); spine.add(traps);
    const neck = cap(0.05, 0.08, mat.skin); neck.position.y = 0.55; spine.add(neck);
    const head = grp([0, 0.6, 0], spine);
    const skull = sph(0.105, mat.skin, [0.94, 1.08, 1.0]); skull.position.set(0, 0.1, 0.005); head.add(skull);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.109, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), mat.hair);
    hair.scale.set(0.95, 1.05, 1.02); hair.position.set(0, 0.115, -0.006); hair.rotation.x = -0.25; head.add(hair);
    const nose = sph(0.02, mat.skin); nose.position.set(0, 0.085, 0.105); head.add(nose);
    [-1, 1].forEach(s => { const e = sph(0.022, mat.skin, [0.6, 1, 0.8]); e.position.set(0.1 * s, 0.1, 0); head.add(e); });

    const arm = side => {
      const sh = grp([0.19 * side, 0.5, 0], spine);
      const delt = sph(0.068, mat.skin); sh.add(delt);
      const up = cap(0.052, LEN.upper, mat.skin); up.position.y = -LEN.upper / 2; sh.add(up);
      const el = grp([0, -LEN.upper, 0], sh);
      const fo = cap(0.043, LEN.fore, mat.skin); fo.position.y = -LEN.fore / 2; el.add(fo);
      const ha = grp([0, -LEN.fore, 0], el);
      const hand = sph(0.048, mat.skin, [0.9, 1.15, 0.75]); hand.position.y = -0.03; ha.add(hand);
      return { a: sh, b: el, end: ha };
    };
    const leg = side => {
      const hp = grp([0.1 * side, -0.03, 0], root);
      const th = cap(0.075, LEN.thigh, mat.skin); th.position.y = -LEN.thigh / 2; hp.add(th);
      const sh = cap(0.088, 0.16, mat.shorts); sh.position.y = -0.12; hp.add(sh);
      const kn = grp([0, -LEN.thigh, 0], hp);
      const shin = cap(0.054, LEN.shin, mat.skin); shin.position.y = -LEN.shin / 2; kn.add(shin);
      const an = grp([0, -LEN.shin, 0], kn);
      const foot = grp([0, 0, 0], an);
      const shoe = sph(0.07, mat.shoe, [0.72, 0.5, 1.75]); shoe.position.set(0, -0.035, 0.06); foot.add(shoe);
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.02, 0.24), mat.sole); sole.position.set(0, -0.068, 0.06); sole.castShadow = true; foot.add(sole);
      return { a: hp, b: kn, end: an, foot };
    };
    const parts = { root, spine, head, armL: arm(1), armR: arm(-1), legL: leg(1), legR: leg(-1) };
    return parts;
  }

  /* ---------- Equipamiento ---------- */
  function makeProps(THREE, list) {
    const metal = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.85, roughness: 0.28 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x23272d, roughness: 0.7, metalness: 0.2 });
    const pad = new THREE.MeshStandardMaterial({ color: 0x2c2f35, roughness: 0.8 });
    const plateC = { red: 0xc8312b, blue: 0x1f58b5, yellow: 0xe0ac1f, green: 0x2a8f57 };
    const P = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.1 });
    const cyl = (r, l, m, seg = 24) => { const g = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, seg), m); g.castShadow = true; g.receiveShadow = true; return g; };
    const box = (s, m) => { const g = new THREE.Mesh(new THREE.BoxGeometry(...s), m); g.castShadow = true; g.receiveShadow = true; return g; };
    const out = { group: new THREE.Group(), dyn: [] };
    const X = (o) => { o.rotation.z = Math.PI / 2; return o; };
    list.forEach(pr => {
      if (pr.t === 'bar') {
        const g = new THREE.Group();
        const small = pr.small;
        g.add(X(cyl(0.014, small ? 1.2 : 2.0, metal, 12)));
        const plates = small ? [['green', 0.15, 0.03]] : [['red', 0.225, 0.055], ['blue', 0.225, 0.045]];
        [-1, 1].forEach(s => {
          let x = (small ? 0.42 : 0.66);
          plates.forEach(([c, r, w]) => { const pl = X(cyl(r, w, P(plateC[c]), 32)); pl.position.x = s * (x + w / 2); g.add(pl); x += w + 0.004; });
          const col = X(cyl(0.032, 0.06, metal, 16)); col.position.x = s * (x + 0.03); g.add(col);
          const sl = X(cyl(0.026, small ? 0.16 : 0.3, metal, 16)); sl.position.x = s * (small ? 0.48 : 0.8); g.add(sl);
        });
        out.group.add(g); out.dyn.push({ t: 'bar', o: g });
      } else if (pr.t === 'handle') {
        const g = new THREE.Group(); g.add(X(cyl(0.013, pr.w, metal, 12)));
        [-1, 1].forEach(s => { const gr = X(cyl(0.018, 0.12, dark, 12)); gr.position.x = s * (pr.w / 2 - 0.08); g.add(gr); });
        out.group.add(g); out.dyn.push({ t: 'bar', o: g });
      } else if (pr.t === 'db') {
        [0, 1].forEach(() => {
          const g = new THREE.Group();
          g.add(X(cyl(0.016, 0.2, metal, 12)));
          [-1, 1].forEach(s => { const h = X(cyl(0.055, 0.075, dark, 6)); h.position.x = s * 0.115; g.add(h); });
          out.group.add(g); out.dyn.push({ t: 'db', o: g });
        });
      } else if (pr.t === 'bench') {
        const h = pr.h || 0.45, len = pr.len || 1.25;
        const g = new THREE.Group(); g.position.set(...pr.pos);
        const top = box([0.3, 0.075, len], pad); top.position.y = h - 0.04; g.add(top);
        const st = box([0.08, h - 0.08, len * 0.7], dark); st.position.y = (h - 0.08) / 2; g.add(st);
        [-1, 1].forEach(s => { const f = box([0.44, 0.04, 0.06], dark); f.position.set(0, 0.02, s * len * 0.38); g.add(f); });
        out.group.add(g);
      } else if (pr.t === 'box') {
        const m = pr.metal ? metal : pr.pad ? pad : pr.dark ? dark : dark;
        const g = box(pr.size, m); g.position.set(...pr.pos); if (pr.rx) g.rotation.x = pr.rx * D; out.group.add(g);
      } else if (pr.t === 'rack') {
        const h = pr.h || 1.75;
        [-1, 1].forEach(s => {
          const up = box([0.06, h, 0.06], dark); up.position.set(s * 0.62, h / 2, pr.z); out.group.add(up);
          const hook = box([0.06, 0.05, 0.12], metal); hook.position.set(s * 0.62, pr.bench ? h - 0.08 : 1.45, pr.z + 0.07); out.group.add(hook);
          const ft = box([0.1, 0.04, 0.6], dark); ft.position.set(s * 0.62, 0.02, pr.z); out.group.add(ft);
        });
      } else if (pr.t === 'pullframe') {
        const bar = X(cyl(0.018, 1.6, metal, 14)); bar.position.set(0, pr.y, pr.z); out.group.add(bar);
        [-1, 1].forEach(s => { const po = box([0.07, pr.y + 0.05, 0.07], dark); po.position.set(s * 0.8, (pr.y + 0.05) / 2, pr.z); out.group.add(po);
          const ft = box([0.1, 0.04, 0.9], dark); ft.position.set(s * 0.8, 0.02, pr.z); out.group.add(ft); });
      } else if (pr.t === 'mat') {
        const g = box([0.7, 0.012, pr.len], new THREE.MeshStandardMaterial({ color: 0x3b4a5c, roughness: 0.9 })); g.position.set(0, 0.006, pr.z || 0); g.castShadow = false; out.group.add(g);
      } else if (pr.t === 'cable') {
        const g = cyl(0.005, 1, metal, 6); out.group.add(g);
        const pul = X(cyl(0.05, 0.03, dark, 18)); pul.rotation.set(0, Math.PI / 2, Math.PI / 2); pul.position.set(...pr.from); out.group.add(pul);
        out.dyn.push({ t: 'cable', o: g, from: new THREE.Vector3(...pr.from) });
      } else if (pr.t === 'roller') {
        const g = X(cyl(0.05, 0.42, pad, 18)); out.group.add(g); out.dyn.push({ t: 'roller', o: g });
      }
    });
    return out;
  }

  /* ---------- IK ---------- */
  function makeSolver(THREE) {
    const v = () => new THREE.Vector3();
    const S = v(), T = v(), dir = v(), P = v(), E = v(), Tn = v(), tmp = v();
    const q = new THREE.Quaternion(), qp = new THREE.Quaternion();
    const DOWN = new THREE.Vector3(0, -1, 0);
    return function solve(chain, l1, l2, target, pole) {
      chain.a.parent.updateMatrixWorld(true);
      chain.a.getWorldPosition(S);
      T.copy(target);
      dir.subVectors(T, S); let d = dir.length(); if (d < 1e-5) { dir.set(0, -1, 0); d = 1e-5; } dir.divideScalar(d);
      d = Math.min(Math.max(d, Math.abs(l1 - l2) + 1e-3), l1 + l2 - 1e-4);
      const ca = Math.min(1, Math.max(-1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))), sa = Math.sqrt(1 - ca * ca);
      P.copy(pole).addScaledVector(dir, -pole.dot(dir));
      if (P.lengthSq() < 1e-6) { P.set(0, 0, 1).addScaledVector(dir, -dir.z); if (P.lengthSq() < 1e-6) P.set(1, 0, 0); }
      P.normalize();
      E.copy(S).addScaledVector(dir, l1 * ca).addScaledVector(P, l1 * sa);
      Tn.copy(S).addScaledVector(dir, d);
      chain.a.parent.getWorldQuaternion(qp); qp.invert();
      tmp.subVectors(E, S).normalize().applyQuaternion(qp);
      chain.a.quaternion.setFromUnitVectors(DOWN, tmp);
      chain.a.updateMatrixWorld(true);
      chain.a.getWorldQuaternion(q); q.invert();
      tmp.subVectors(Tn, E).normalize().applyQuaternion(q);
      chain.b.quaternion.setFromUnitVectors(DOWN, tmp);
      chain.a.updateMatrixWorld(true);
    };
  }

  /* ---------- Escenario ---------- */
  function mount(container, exerciseName, opts = {}) {
    const THREE = window.THREE;
    if (!THREE) { container.innerHTML = '<div class="fig-fallback">No se pudo cargar el visor 3D.</div>'; return { set() {}, destroy() {} }; }
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!opts.still }); }
    catch (e) { container.innerHTML = '<div class="fig-fallback">Este dispositivo no muestra gráficos 3D.</div>'; return { set() {}, destroy() {} }; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block'; renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'pan-y';

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(34, 1, 0.05, 50);
    scene.add(new THREE.HemisphereLight(0xf2f5ff, 0x3a3328, 0.75));
    const key = new THREE.DirectionalLight(0xffffff, 0.95); key.position.set(2.2, 4.2, 2.6); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2.6, bottom: -1.5, near: 0.5, far: 10 }); key.shadow.bias = -0.0008;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fc4ff, 0.35); rim.position.set(-3, 2.5, -2.5); scene.add(rim);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(3.2, 64), new THREE.ShadowMaterial({ opacity: 0.22 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const lineCol = new THREE.Color(opts.lineColor || '#8892a0');
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.45, 1.47, 96), new THREE.MeshBasicMaterial({ color: lineCol, transparent: true, opacity: 0.35 })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.001; scene.add(ring);
    const grid = new THREE.GridHelper(2.9, 12, lineCol, lineCol); grid.material.transparent = true; grid.material.opacity = 0.12; grid.position.y = 0.0005; scene.add(grid);

    const fig = build(THREE); scene.add(fig.root);
    const solve = makeSolver(THREE);
    let props = null, ex = null, key0 = 'idle';
    let az = 50, el = 8, dist = 3.5, ty = 1, userAz = 0, userEl = 0;
    const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
    const tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler();
    const hp = [new THREE.Vector3(), new THREE.Vector3()], ep = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), ax = new THREE.Vector3(), X1 = new THREE.Vector3(1, 0, 0);

    function set(name) {
      key0 = EX[name] ? name : classify(name);
      ex = EX[key0];
      if (props) scene.remove(props.group);
      props = makeProps(THREE, ex.props); scene.add(props.group);
      [az, el, dist, ty] = ex.view; userAz = 0; userEl = 0;
      return key0;
    }
    function toWorld(spaceObj, arr) { return spaceObj ? spaceObj.localToWorld(V(arr)) : V(arr); }
    function dirWorld(spaceObj, arr) { const d = V(arr); if (spaceObj) { spaceObj.getWorldQuaternion(tmpQ); d.applyQuaternion(tmpQ); } return d; }

    function pose(p, s) {
      const b = ex.fn(p, s);
      fig.root.position.set(...b.root);
      fig.root.rotation.set(b.rot[0] * D, b.rot[1] * D, b.rot[2] * D);
      fig.spine.rotation.set(b.spine[0] * D, b.spine[1] * D, b.spine[2] * D);
      fig.head.rotation.set(b.head * D, 0, 0);
      fig.root.updateMatrixWorld(true);
      const hs = b.hs === 'spine' ? fig.spine : b.hs === 'root' ? fig.root : null;
      const fs = b.fs === 'root' ? fig.root : null;
      ['L', 'R'].forEach((k, i) => {
        const leg = fig['leg' + k], arm = fig['arm' + k];
        solve(leg, LEN.thigh, LEN.shin, toWorld(fs, b.feet[k]), dirWorld(fs, b.legPole[k]));
        leg.end.parent.getWorldQuaternion(tmpQ); tmpQ.invert();
        const want = new THREE.Quaternion().setFromEuler(tmpE.set((b.pitch[k] || 0) * D, 0, 0));
        leg.end.quaternion.copy(tmpQ.multiply(want));
        solve(arm, LEN.upper, LEN.fore, toWorld(hs, b.hands[k]), dirWorld(hs, b.armPole[k]));
        arm.end.updateMatrixWorld(true); arm.end.getWorldPosition(hp[i]);
      });
      let dbI = 0;
      props.dyn.forEach(d => {
        if (d.t === 'bar') {
          d.o.position.addVectors(hp[0], hp[1]).multiplyScalar(0.5); d.o.position.y -= 0.03;
          ax.subVectors(hp[0], hp[1]); ax.y = 0; if (ax.lengthSq() < 1e-6) ax.set(1, 0, 0); ax.normalize();
          d.o.quaternion.setFromUnitVectors(X1, ax);
        } else if (d.t === 'db') {
          const i = dbI++; const arm = i === 0 ? fig.armL : fig.armR;
          arm.b.getWorldPosition(ep);
          d.o.position.copy(hp[i]); d.o.position.y -= 0.025;
          ax.subVectors(hp[i], ep).normalize().cross(up);
          if (ax.length() < 0.3) ax.set(1, 0, 0); ax.normalize();
          d.o.quaternion.setFromUnitVectors(X1, ax);
        } else if (d.t === 'cable') {
          const to = new THREE.Vector3().addVectors(hp[0], hp[1]).multiplyScalar(0.5);
          const mid = new THREE.Vector3().addVectors(to, d.from).multiplyScalar(0.5);
          d.o.position.copy(mid); d.o.scale.set(1, to.distanceTo(d.from), 1);
          d.o.quaternion.setFromUnitVectors(up, new THREE.Vector3().subVectors(d.from, to).normalize());
        } else if (d.t === 'roller' && b.roller) {
          d.o.position.set(...b.roller);
        }
      });
    }
    function placeCam() {
      const a = (az + userAz) * D, e = Math.max(-5, Math.min(60, el + userEl)) * D;
      cam.position.set(Math.sin(a) * Math.cos(e) * dist, ty + Math.sin(e) * dist, Math.cos(a) * Math.cos(e) * dist);
      cam.lookAt(0, ty, 0);
    }
    function resize() {
      const w = container.clientWidth || 300, h = container.clientHeight || 300;
      renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    }
    set(exerciseName);
    resize();
    const ro = window.ResizeObserver ? new ResizeObserver(resize) : null; ro && ro.observe(container);

    // arrastrar para girar
    let drag = null;
    const cv = renderer.domElement;
    const pd = e => { drag = { x: e.clientX, y: e.clientY, az: userAz, el: userEl }; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); };
    const pm = e => { if (!drag) return; userAz = drag.az - (e.clientX - drag.x) * 0.4; userEl = drag.el + (e.clientY - drag.y) * 0.25; };
    const pu = () => { drag = null; };
    cv.addEventListener('pointerdown', pd); cv.addEventListener('pointermove', pm); cv.addEventListener('pointerup', pu); cv.addEventListener('pointercancel', pu);

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, t0 = performance.now(), alive = true, paused = false;
    function frame(now) {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (paused) return;
      const t = (now - t0) / 1000 * (reduce ? 0.4 : 1);
      const s = t * 2 * Math.PI / ex.period;
      const p = ex.raw ? 0 : 0.5 - 0.5 * Math.cos(s);
      pose(p, s); placeCam(); renderer.render(scene, cam);
    }
    if (!opts.still) raf = requestAnimationFrame(frame);
    return {
      set: n => { const k = set(n); return k; },
      key: () => key0,
      label: () => ex.label,
      renderAt(p, s = 0) { pose(p, s); placeCam(); renderer.render(scene, cam); return renderer.domElement; },
      pause(v) { paused = v; },
      destroy() { alive = false; cancelAnimationFrame(raf); ro && ro.disconnect(); renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); cv.remove(); }
    };
  }

  const LIBRARY = [
    'Press de banca con barra', 'Press de banca con mancuernas', 'Press inclinado con mancuernas', 'Aperturas con mancuernas', 'Cruces en polea', 'Flexiones de pecho',
    'Jalón al pecho', 'Dominadas', 'Remo con barra', 'Remo con mancuerna', 'Remo sentado en polea', 'Peso muerto', 'Peso muerto rumano',
    'Sentadilla con barra', 'Prensa de piernas', 'Zancadas con mancuernas', 'Sentadilla búlgara', 'Extensión de cuádriceps', 'Curl femoral', 'Hip thrust', 'Elevación de talones',
    'Press militar con barra', 'Press de hombro con mancuernas', 'Elevaciones laterales', 'Elevación frontal', 'Face pull',
    'Curl de bíceps con mancuernas', 'Curl con barra', 'Curl martillo', 'Extensión de tríceps en polea', 'Press francés', 'Fondos en paralelas',
    'Abdominales crunch', 'Plancha', 'Elevación de piernas', 'Trote en caminadora', 'Burpees'
  ];
  return { mount, classify, LIBRARY, EX };
})();
