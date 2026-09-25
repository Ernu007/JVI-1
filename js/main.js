/* =========================================================
   JVI Carga & Serviços — Landing Page
   ========================================================= */

const REDUCIDO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Configuração da empresa ---------- */
const JVI = {
  whatsapp: '258875558005',
  telefone: '+258875558005',
  email: 'jvicargaservicos@gmail.com',
  endpoint: '/.netlify/functions/submit',
};

/* =========================================================
   HEADER + MENU MÓVEL + BARRA DE PROGRESSO
   ========================================================= */
const header = document.getElementById('header');
const menu = document.getElementById('menu');
const menuBtn = document.getElementById('menuBtn');
const menuFundo = document.getElementById('menuFundo');
const barraTopo = document.getElementById('barraTopo');

let timerMenu = null;
function alternarMenu(abrir) {
  clearTimeout(timerMenu);
  menuFundo.dataset.visivel = String(abrir);
  menuBtn.setAttribute('aria-expanded', String(abrir));
  if (abrir) {
    delete menu.dataset.estado;
    menu.dataset.aberto = 'true';
    document.body.style.overflow = 'hidden';
  } else {
    // deixa a animacao de saida correr antes de tirar do layout
    if (menu.dataset.aberto === 'true') {
      menu.dataset.estado = 'a-fechar';
      timerMenu = setTimeout(() => {
        menu.dataset.aberto = 'false';
        delete menu.dataset.estado;
      }, 320);
    }
    document.body.style.overflow = '';
  }
}
menuBtn.addEventListener('click', () => alternarMenu(menu.dataset.aberto !== 'true'));
menuFundo.addEventListener('click', () => alternarMenu(false));
menu.querySelectorAll('a, button').forEach((el) => el.addEventListener('click', () => alternarMenu(false)));

/* Scroll: header preso + barra de progresso */
function aoDeslocar() {
  const y = window.scrollY;
  header.classList.toggle('header--preso', y > 40);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  barraTopo.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
}
window.addEventListener('scroll', aoDeslocar, { passive: true });
aoDeslocar();

/* =========================================================
   ANIMAÇÕES AO SCROLL (IntersectionObserver)
   ========================================================= */
const alvos = document.querySelectorAll('.revelar');
if ('IntersectionObserver' in window && !REDUCIDO) {
  const obs = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          e.target.dataset.visivel = 'true';
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
  alvos.forEach((el) => obs.observe(el));
} else {
  alvos.forEach((el) => (el.dataset.visivel = 'true'));
}

/* =========================================================
   ETAPAS — destaca a etapa visível e desenha a linha
   ========================================================= */
const etapas = document.querySelectorAll('.etapa');
const fluxoLinha = document.getElementById('fluxoLinha');
if (etapas.length) {
  const obsEtapas = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => e.target.setAttribute('aria-current', String(e.isIntersecting)));
    },
    { threshold: 0.6 }
  );
  etapas.forEach((e) => obsEtapas.observe(e));

  if (fluxoLinha && !REDUCIDO) {
    const obsLinha = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          const pai = e.target.parentElement;
  const altura = pai.offsetHeight;
  const topo = e.target.offsetTop;
          const p = Math.min(1, Math.max(0, topo / altura));
          fluxoLinha.style.height = `${p * 100}%`;
        });
      },
      { threshold: [0, 0.5, 1] }
    );
    etapas.forEach((e) => obsLinha.observe(e));
  }
}

/* =========================================================
   HERO — rota a desenhar-se + caixas 3D
   ========================================================= */
function iniciarHero() {
  const canvas = document.getElementById('canvasHero');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let dpr = 1;
  let inicio = null;
  let caixas = [];
  let rotas = [];
  let ultimo = 0;

  const VERDE = '#A9CF44';
  const LARANJA = '#EA8240';

  /* Rotas desenhadas em canvas 2D — leve em mobile */
  function criarRotas() {
    const n = window.innerWidth < 700 ? 3 : 5;
    rotas = [];
    for (let i = 0; i < n; i += 1) {
      const x0 = Math.random() * w;
      const y0 = h * (0.2 + Math.random() * 0.7);
      rotas.push({
        x0,
        y0,
        cx: Math.min(w, Math.max(0, x0 + (Math.random() - 0.5) * w * 0.7)),
        cy: y0 + (Math.random() - 0.5) * h * 0.45,
        x1: w * (0.35 + Math.random() * 0.75),
        y1: h * (0.15 + Math.random() * 0.75),
        atraso: 0.15 + i * 0.28,
        dur: 1.5 + Math.random() * 0.8,
        cor: i % 3 === 0 ? LARANJA : VERDE,
        p: 0,
      });
    }
  }

  function criarCaixas() {
    const n = window.innerWidth < 700 ? 4 : 9;
    caixas = [];
    for (let i = 0; i < n; i += 1) {
      caixas.push({
        x: Math.random() * w,
        y: Math.random() * h,
        s: (0.5 + Math.random() * 0.85) * (w < 700 ? 16 : 26),
        vx: (Math.random() - 0.5) * 0.22,
        vy: -0.1 - Math.random() * 0.28,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.008,
        o: 0.34 + Math.random() * 0.4,
        fase: Math.random() * Math.PI * 2,
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    criarRotas();
    criarCaixas();
  }

  /* Ponto numa curva quadrática de Bézier */
  function bez(p0, p1, p2, t) {
    const m = 1 - t;
    return m * m * p0 + 2 * m * t * p1 + t * t * p2;
  }

  function ease(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function desenharCaixa(c, t) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.r);
    const s = c.s;
    const bob = Math.sin(t * 0.0012 + c.fase) * 6;
    ctx.translate(0, bob);
    ctx.globalAlpha = c.o;

    const g = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(190,222,100,0.95)');
    g.addColorStop(1, 'rgba(130,201,30,0.6)');
    ctx.fillStyle = g;
    ctx.strokeStyle = 'rgba(232,237,245,0.75)';
    ctx.lineWidth = 1;

    // face frontal
    ctx.beginPath();
    ctx.rect(-s / 2, -s / 2, s, s * 0.72);
    ctx.fill();
    ctx.stroke();
    // face superior (isometria)
    ctx.beginPath();
    ctx.moveTo(-s / 2, -s / 2);
    ctx.lineTo(-s / 2 + s * 0.18, -s / 2 - s * 0.18);
    ctx.lineTo(s / 2 + s * 0.18, -s / 2 - s * 0.18);
    ctx.lineTo(s / 2, -s / 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(232,237,245,0.42)';
    ctx.fill();
    // face lateral
    ctx.beginPath();
    ctx.moveTo(s / 2, -s / 2);
    ctx.lineTo(s / 2 + s * 0.18, -s / 2 - s * 0.18);
    ctx.lineTo(s / 2 + s * 0.18, s * 0.72 - s * 0.18);
    ctx.lineTo(s / 2, s * 0.72);
    ctx.closePath();
    ctx.fillStyle = 'rgba(19,30,51,0.72)';
    ctx.fill();
    ctx.stroke();
    // fita
    ctx.fillStyle = 'rgba(234,130,64,0.9)';
    ctx.fillRect(-s * 0.08, -s / 2, s * 0.16, s * 0.72);
    ctx.restore();
  }

  function frame(agora) {
    if (!inicio) inicio = agora;
    const t = (agora - inicio) / 1000;
    ctx.clearRect(0, 0, w, h);

    /* Rotas a desenhar-se (~2s) */
    for (const r of rotas) {
      const tp = Math.min(1, Math.max(0, (t - r.atraso) / r.dur));
      if (tp <= 0) continue;
      const p = ease(tp);
      ctx.save();
      ctx.globalAlpha = REDUCIDO ? 0.5 : 0.55 * (1 - p * 0.45);
      ctx.strokeStyle = r.cor;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.moveTo(r.x0, r.y0);
      ctx.quadraticCurveTo(r.cx, r.cy, r.x1, r.y1);
      ctx.stroke();
      ctx.setLineDash([]);

      // cabeça luminosa
      const hx = bez(r.x0, r.cx, r.x1, p);
      const hy = bez(r.y0, r.cy, r.y1, p);
      const grad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 14);
      grad.addColorStop(0, r.cor);
      grad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(hx, hy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* Caixas a flutuar */
    if (!REDUCIDO) {
      const dt = Math.min(40, agora - ultimo) / 16;
      ultimo = agora;
      for (const c of caixas) {
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.r += c.vr * dt;
        if (c.y < -60) { c.y = h + 60; c.x = Math.random() * w; }
        if (c.x < -60) c.x = w + 60;
        if (c.x > w + 60) c.x = -60;
        desenharCaixa(c, agora);
      }
    } else {
      for (const c of caixas) desenharCaixa(c, agora);
    }

    if (t < 3.2) requestAnimationFrame(frame);
    else if (!REDUCIDO) requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', () => { resize(); }, { passive: true });

  requestAnimationFrame(() => {
    document.getElementById('hero')?.classList.add('pronto');
    frame(performance.now());
  });
}

/* =========================================================
   MAPA DE MOÇAMBIQUE — silhueta + rotas animadas
   ------------------------------------------------------------
   O contorno usa coordenadas geograficas reais (lon, lat) e e
   projectado para o canvas, para o pais ficar reconhecivel em
   qualquer tamanho de ecra e as cidades cairem no sitio certo.
   ========================================================= */

// Limites aproximados de Moçambique
const LON_MIN = 28.4, LON_MAX = 41.0;
const LAT_MIN = 10.4, LAT_MAX = 27.2;
const MAPA_L = 260, MAPA_A = 430;

// Contorno: sentido horario a partir do nordeste
const PAIS_LL = [
  [40.6, 11.0], [40.5, 12.5], [40.7, 14.5], [39.9, 16.2], [38.8, 16.5],
  [37.0, 17.2], [35.5, 16.5], [35.0, 15.5], [34.5, 14.0], [34.0, 13.4],
  [34.4, 12.7], [34.2, 12.0], [32.7, 11.2], [32.5, 12.2], [32.0, 13.0],
  [31.0, 13.6], [30.5, 14.5], [30.3, 15.6], [29.6, 16.5], [28.9, 17.6],
  [28.7, 18.5], [29.2, 20.0], [29.8, 21.2], [30.4, 22.4], [31.0, 23.4],
  [31.2, 24.4], [30.9, 25.0], [32.4, 25.9], [32.6, 25.9], [34.8, 24.0],
  [35.5, 22.0], [36.8, 20.0], [40.0, 16.5], [40.6, 14.0],
];

const CIDADES_LL = [
  { nome: 'Palma',     lon: 40.5,  lat: 11.9, hub: false, dx: 9,   dy: -9,  align: 'left' },
  { nome: 'Pemba',     lon: 40.5,  lat: 13.0, hub: false, dx: 9,   dy: -9,  align: 'left' },
  { nome: 'Lichinga',  lon: 35.4,  lat: 13.3, hub: false, dx: -9,  dy: -9,  align: 'right' },
  { nome: 'Nampula',   lon: 39.3,  lat: 15.1, hub: false, dx: 9,   dy: -9,  align: 'left' },
  { nome: 'Quelimane', lon: 36.9,  lat: 17.9, hub: false, dx: -9,  dy: 18, align: 'right' },
  { nome: 'Tete',      lon: 33.6,  lat: 16.2, hub: false, dx: -9,  dy: 4,  align: 'right' },
  { nome: 'Beira',     lon: 34.8,  lat: 19.8, hub: false, dx: -9,  dy: 4,  align: 'right' },
  { nome: 'Chimoio',   lon: 37.1,  lat: 19.0, hub: false, dx: 9,   dy: 18, align: 'left' },
  { nome: 'Xai-Xai',   lon: 33.9,  lat: 25.2, hub: false, dx: 10,  dy: -14, align: 'left' },
  { nome: 'Matola',    lon: 32.5,  lat: 25.8, hub: false, dx: -9,  dy: 4,  align: 'right' },
  { nome: 'Maputo',    lon: 32.6,  lat: 25.0, hub: true,  dx: 11,  dy: 20, align: 'left' },
];

// Projectao equirectangular normalizada para o espaco logico do mapa
const projLon = (lon) => ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * MAPA_L;
const projLat = (lat) => ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * MAPA_A;

const PAIS = PAIS_LL.map(([lon, lat]) => [projLon(lon), projLat(lat)]);
const CIDADES = CIDADES_LL.map((c) => ({
  ...c, x: projLon(c.lon), y: projLat(c.lat),
}));

function iniciarMapa() {
  const canvas = document.getElementById('canvasMapa');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, esc = 1, ox = 0, oy = 0;
  let t0 = performance.now();
  let visivel = false;

  const VERDE = '#A9CF44';
  const LARANJA = '#EA8240';

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = w < 700 ? 14 : 40;
    const padTopo = pad;
    const padBase = w < 700 ? 26 : 40;
    esc = Math.min((w - pad * 2) / MAPA_L, (h - padTopo - padBase) / MAPA_A);
    ox = (w - MAPA_L * esc) / 2;
    oy = padTopo + (h - padTopo - padBase - MAPA_A * esc) / 2;
  }

  const X = (lx) => ox + lx * esc;
  const Y = (ly) => oy + ly * esc;

  function desenharPais() {
    ctx.save();
    ctx.beginPath();
    PAIS.forEach(([lx, ly], i) => (i ? ctx.lineTo(X(lx), Y(ly)) : ctx.moveTo(X(lx), Y(ly))));
    ctx.closePath();
    const g = ctx.createLinearGradient(0, Y(0), 0, Y(MAPA_A));
    g.addColorStop(0, 'rgba(169,207,68,0.16)');
    g.addColorStop(0.5, 'rgba(169,207,68,0.06)');
    g.addColorStop(1, 'rgba(169,207,68,0.02)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(169,207,68,0.6)';
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  function etiqueta(c, cor) {
    ctx.save();
    ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = cor;
    ctx.textAlign = c.align === 'right' ? 'right' : 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.nome, X(c.x) + c.dx, Y(c.y) + c.dy);
    ctx.restore();
  }

  function frame(agora) {
    const t = (agora - t0) / 1000;
    ctx.clearRect(0, 0, w, h);
    desenharPais();

    const hub = CIDADES.find((c) => c.hub);
    const hx = X(hub.x);
    const hy = Y(hub.y);
    const etiquetas = [];

    for (const c of CIDADES) {
      if (c.hub) continue;
      const x = X(c.x);
      const y = Y(c.y);
      const dist = Math.hypot(hx - x, hy - y);
      const p = Math.min(1, Math.max(0, (t - dist / 900) * 1.15));
      if (p <= 0) continue;

      const ccx = (x + hx) / 2 + (hy - y) * 0.18;
      const ccy = (y + hy) / 2 - (hx - x) * 0.18;

      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = 'rgba(169,207,68,0.7)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(ccx, ccy, hx, hy);
      ctx.stroke();
      ctx.setLineDash([]);

      const e = p * p * (3 - 2 * p);
      const m = 1 - e;
      const tx = m * m * x + 2 * m * e * ccx + e * e * hx;
      const ty = m * m * y + 2 * m * e * ccy + e * e * hy;
      const rg = ctx.createRadialGradient(tx, ty, 0, tx, ty, 10);
      rg.addColorStop(0, VERDE);
      rg.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(tx, ty, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = VERDE;
      ctx.beginPath();
      ctx.arc(x, y, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(x, y, 8 + Math.sin(t * 2 + x) * 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (w > 430) etiquetas.push(c);
    }

    ctx.save();
    const pulso = 14 + Math.sin(t * 2.4) * 5;
    const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 30);
    hg.addColorStop(0, 'rgba(234,130,64,0.8)');
    hg.addColorStop(1, 'transparent');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(hx, hy, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = LARANJA;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(hx, hy, pulso, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = LARANJA;
    ctx.beginPath();
    ctx.arc(hx, hy, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // etiquetas por ultimo, para o brilho do hub nao as tapar
    if (w > 430) {
      etiquetas.forEach((c) => etiqueta(c, 'rgba(203,213,225,0.88)'));
      etiqueta(hub, LARANJA);
    }

    if (visivel) requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', () => {
    resize();
    if (visivel) frame(performance.now());
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      (e) => {
        visivel = e[0].isIntersecting;
        if (visivel) { resize(); t0 = performance.now(); frame(performance.now()); }
      },
      { threshold: 0.15 }
    ).observe(canvas);
  } else {
    visivel = true;
    frame(performance.now());
  }
}

/* =========================================================
   MODAL
   ========================================================= */
const modal = document.getElementById('modal');
let focoAnterior = null;

function abrirModal() {
  focoAnterior = document.activeElement;
  modal.dataset.aberto = 'true';
  document.body.classList.add('modal-aberto');
  const primeiro = modal.querySelector('input, button, select');
  setTimeout(() => primeiro?.focus(), 60);
}
function fecharModal() {
  modal.dataset.aberto = 'false';
  document.body.classList.remove('modal-aberto');
  focoAnterior?.focus();
}
modal.querySelectorAll('[data-fechar]').forEach((el) => el.addEventListener('click', fecharModal));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.dataset.aberto === 'true') fecharModal();
});

/* =========================================================
   FORMULÁRIO AIRWAYBILL
   ========================================================= */
const tpl = document.getElementById('tplOrc');

/* O mesmo formulário vive na secção e no modal. Como não pode haver
   IDs duplicados, cada clone recebe um prefixo próprio e os `for` /
   `aria-labelledby` / `aria-describedby` são reescritos em conformidade. */
function montarFormulario(destino, prefixo) {
  const frag = tpl.content.cloneNode(true);
  const mapa = new Map();
  frag.querySelectorAll('[id]').forEach((el) => mapa.set(el.id, `${prefixo}-${el.id}`));
  frag.querySelectorAll('[id]').forEach((el) => { el.id = mapa.get(el.id); });
  frag.querySelectorAll('label[for]').forEach((el) => {
    if (mapa.has(el.htmlFor)) el.htmlFor = mapa.get(el.htmlFor);
  });
  frag.querySelectorAll('[aria-labelledby], [aria-describedby]').forEach((el) => {
    ['aria-labelledby', 'aria-describedby'].forEach((attr) => {
      const v = el.getAttribute(attr);
      if (!v) return;
      el.setAttribute(attr, v.split(/\s+/).map((t) => mapa.get(t) || t).join(' '));
    });
  });
  destino.appendChild(frag);
}

montarFormulario(document.getElementById('orcSecao'), 'orc-a');
montarFormulario(document.getElementById('orcModal'), 'orc-b');

document.querySelectorAll('[data-abrir-orc]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const alvo = window.innerWidth < 1000 ? document.getElementById('orcSecao') : document.getElementById('orcModal');
    const rect = alvo.getBoundingClientRect();
    if (modal.dataset.aberto === 'false' && rect.top < window.innerHeight && rect.bottom > 0 && alvo.id === 'orcSecao') {
      alvo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      abrirModal();
    }
  });
});

/* Lógica do formulário, aplicada a cada instância (secção + modal) */
document.querySelectorAll('.orc__form').forEach((form) => {
  const raiz = form.closest('.orc');
  const passosBtns = [...raiz.querySelectorAll('.orc-passo-btn')];
  const seccoes = [...raiz.querySelectorAll('.form-seccao')];
  const barra = form.querySelector('.orc__barra');
  const barraFill = barra.querySelector('span');
  const btnAnt = form.querySelector('[data-ant]');
  const btnSeg = form.querySelector('[data-seg]');
  const btnEnv = form.querySelector('[data-env]');
  const estado = form.querySelector('[data-estado]');
  let atual = 0;
  function valido(sec) {
    let ok = true;
    seccoes[sec].querySelectorAll('[required]').forEach((inp) => {
      const campo = inp.closest('.campo');
      const vazio = !inp.value.trim();
      const emailRuim = inp.type === 'email' && inp.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value);
      const mau = vazio || emailRuim;
      if (mau) ok = false;
      if (campo) campo.dataset.erro = String(mau);
      if (mau && ok === false && document.activeElement !== inp) inp.focus({ preventScroll: false });
    });
    return ok;
  }

  function mostrar(idx) {
    atual = Math.max(0, Math.min(seccoes.length - 1, idx));
    seccoes.forEach((s, i) => (s.dataset.ativa = String(i === atual)));
    passosBtns.forEach((b, i) => {
      b.setAttribute('aria-current', String(i === atual));
      b.dataset.feito = String(i < atual);
    });
    const pct = ((atual + 1) / seccoes.length) * 100;
    barraFill.style.width = `${pct}%`;
    barra.setAttribute('aria-valuenow', Math.round(pct));
    btnAnt.disabled = atual === 0;
    btnSeg.hidden = atual === seccoes.length - 1;
    btnEnv.hidden = atual !== seccoes.length - 1;
    if (atual === seccoes.length - 1) actualizarResumo();
  }

  function actualizarResumo() {
    const g = (n) => form.elements[n]?.value?.trim() || '—';
    const nVol = g('volumes');
    const peso = g('peso');
    const base = parseFloat(g('valor_cobrar')) || 0;
    const iva = Math.round(base * 0.16 * 100) / 100;
    form.elements.iva.value = base ? iva.toFixed(2) : '';
    const total = base + iva;
    form.querySelector('[data-res="emissor"]').textContent = `${g('emissor_nome')} — ${g('emissor_endereco')}`;
    form.querySelector('[data-res="carga"]').textContent = `${nVol} vol · ${peso} kg — ${g('descricao')}`;
    form.querySelector('[data-res="destino"]').textContent = `${g('receptor_nome')} — ${g('receptor_endereco')}`;
    form.querySelector('[data-res="valores"]').textContent = base
      ? `${base.toFixed(2)} + IVA ${iva.toFixed(2)} = ${total.toFixed(2)} MZN (${form.querySelector('input[name="pagamento"]:checked')?.value || 'Numerário'})`
      : 'A definir pela JVI';
  }

  form.querySelector('[data-res="emissor"]') && form.elements.valor_cobrar.addEventListener('input', actualizarResumo);
  form.addEventListener('change', (e) => {
    if (e.target.name === 'pagamento') {
      const v = e.target.value;
      form.querySelector('[data-campo="cheque_num"]').hidden = v !== 'Cheque';
      form.querySelector('[data-campo="banco"]').hidden = v !== 'Cheque';
    }
    if (e.target.name === 'canal' || e.target.name === 'pagamento') actualizarResumo();
  });

  passosBtns.forEach((b) => b.addEventListener('click', () => {
    const alvo = Number(b.dataset.passo);
    if (alvo > atual && !valido(atual)) return;
    mostrar(alvo);
  }));
  btnSeg.addEventListener('click', () => { if (valido(atual)) mostrar(atual + 1); });
  btnAnt.addEventListener('click', () => mostrar(atual - 1));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!seccoes.every((_, i) => valido(i))) { mostrar(seccoes.findIndex((_, i) => !valido(i))); return; }

    const dados = Object.fromEntries(new FormData(form).entries());
    dados.origem = 'site';
    dados.canal = form.querySelector('input[name="canal"]:checked')?.value || 'ambos';
    dados.pagamento = form.querySelector('input[name="pagamento"]:checked')?.value || 'Numerário';

    btnEnv.disabled = true;
    btnEnv.textContent = 'A enviar…';
    estado.dataset.mostrar = 'true';
    estado.className = 'estado-envio estado-envio--aviso';
    estado.textContent = 'A enviar o seu pedido…';

    const textoWA = [
      `*Pedido de orçamento — JVI Carga & Serviços*`,
      ``,
      `*Emissor:* ${dados.emissor_nome} (${dados.emissor_contacto})`,
      `*Carga:* ${dados.volumes} vol · ${dados.peso} kg`,
      `*Descrição:* ${dados.descricao}`,
      `*Destino:* ${dados.receptor_nome} — ${dados.receptor_endereco}`,
      dados.valor_cobrar ? `*Valor estimado:* ${dados.valor_cobrar} MZN` : '',
    ].filter(Boolean).join('\n');

    let gravouSheet = false;
    let enviouEmail = false;

    try {
      const r = await fetch(JVI.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      const resp = await r.json().catch(() => ({}));
      gravouSheet = Boolean(resp.sheet);
      enviouEmail = Boolean(resp.email);
    } catch {
      // sem backend — seguimos para o WhatsApp
    }

    const canal = dados.canal;
    estado.className = 'estado-envio estado-envio--ok';
    estado.textContent =
      'Pedido registado. A JVI Carga & Serviços já recebeu o seu pedido de orçamento e vai entrar em contacto consigo.';

    if (canal === 'ambos' || canal === 'whatsapp') {
      window.open(`https://wa.me/${JVI.whatsapp}?text=${encodeURIComponent(textoWA)}`, '_blank', 'noopener');
    }
    if (canal === 'email' && !enviouEmail) {
      window.location.href = `mailto:${JVI.email}?subject=${encodeURIComponent('Pedido de orçamento de transporte')}&body=${encodeURIComponent(textoWA)}`;
    }
    if (!gravouSheet && !enviouEmail) {
      estado.className = 'estado-envio estado-envio--aviso';
      estado.textContent += ' (Registo automático temporariamente indisponível — o contacto directo acima está garantido.)';
    }

    btnEnv.disabled = false;
    btnEnv.textContent = 'Enviar pedido';
  });
  mostrar(0);
});

/* =========================================================
   ARRANQUE
   ========================================================= */
document.getElementById('ano').textContent = new Date().getFullYear();
iniciarHero();
iniciarMapa();
