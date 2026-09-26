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
/* =========================================================
   HERO — voo da carga (Pemba -> Maputo) e revelacao do titulo
   ========================================================= */
import { iniciarVoo, ROTA } from './hero-voo.js';

const NOME_PALAVRA = {
  0: 'Cabo Delgado', 1: 'Nampula', 2: 'Zambézia',
  3: 'Sofala', 4: 'Gaza', 5: 'Maputo',
};

function iniciarHero() {
  const canvas = document.getElementById('canvasHero');
  const hero = document.getElementById('hero');
  if (!canvas || !hero) return;

  /* Cada palavra do titulo acende quando o aviao entra na provincia
     correspondente. Sem o scene, o titulo fica todo visivel. */
  const palavras = [...hero.querySelectorAll('.pal')];
  const marca = palavras.map((el) => {
    el.style.setProperty('--p', '0');
    return el;
  });

  requestAnimationFrame(() => {
    hero.classList.add('pronto');
    iniciarVoo(canvas, {
      aoProgredir(prog) {
        palavras.forEach((el, i) => {
          const alvo = (i + 0.35) / palavras.length;
          const v = Math.max(0, Math.min(1, (prog - alvo) / 0.16));
          el.style.setProperty('--p', v.toFixed(3));
        });
        marca.length; void NOME_PALAVRA; void ROTA;
      },
    });
  });
}

/* =========================================================
   MAPA DE MOÇAMBIQUE — provinces reais
   ------------------------------------------------------------
   O desenho vem de js/mapa-dados.js, gerado a partir do
   geoBoundaries ADM1. Aqui so se faz a projecao, o brilho
   quando a rota passa e as etiquetas.
   ========================================================= */
import { BBOX, PROVINCIAS, CAPITAIS } from './mapa-dados.js';

function iniciarMapa() {
  const canvas = document.getElementById('canvasMapa');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LARG = BBOX[2] - BBOX[0];
  const ALT = BBOX[3] - BBOX[1];

  let w = 0, h = 0, esc = 1, ox = 0, oy = 0;
  let visivel = false;
  let t0 = performance.now();
  const hub = CAPITAIS['Maputo'];
  const brilho = {};

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pad = w < 700 ? 14 : 40;
    const padB = w < 700 ? 26 : 40;
    esc = Math.min((w - pad * 2) / LARG, (h - pad - padB) / ALT);
    ox = (w - LARG * esc) / 2;
    oy = pad + (h - pad - padB - ALT * esc) / 2;
  }

  /* BBOX ja vem projectado (lon*cos, -lat): subtrair a origem e obrigatorio,
     senao o mapa e desenhado fora do canvas. */
  const X = (lx) => ox + (lx - BBOX[0]) * esc;
  const Y = (ly) => oy + (ly - BBOX[1]) * esc;

  function caminho(anel, fechar) {
    ctx.beginPath();
    for (let i = 0; i < anel.length; i += 1) {
      if (i === 0) ctx.moveTo(X(anel[i][0]), Y(anel[i][1]));
      else ctx.lineTo(X(anel[i][0]), Y(anel[i][1]));
    }
    if (fechar) ctx.closePath();
  }

  function etiqueta(x, y, t, cor, align) {
    ctx.save();
    ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#0F172A';
    ctx.lineJoin = 'round';
    ctx.strokeText(t, x, y);
    ctx.fillStyle = cor;
    ctx.fillText(t, x, y);
    ctx.restore();
  }

  function desenhar(t) {
    ctx.clearRect(0, 0, w, h);

    // provincia a provincia: exterior desenhado por cima da linha verde
    for (const nome in PROVINCIAS) {
      const b = brilho[nome] || 0;
      for (const anel of PROVINCIAS[nome]) {
        caminho(anel, true);
        if (anel === PROVINCIAS[nome][0]) {
          ctx.fillStyle = b > 0
            ? `rgba(169,207,68,${(0.05 + 0.26 * b).toFixed(3)})`
            : 'rgba(169,207,68,0.035)';
          ctx.fill();
        }
        ctx.strokeStyle = b > 0
          ? `rgba(169,207,68,${(0.4 + 0.5 * b).toFixed(3)})`
          : 'rgba(169,207,68,0.5)';
        ctx.lineWidth = 1 + b * 1.1;
        ctx.stroke();
      }
    }

    // rota de cada capital ate ao hub
    for (const nome in CAPITAIS) {
      if (nome === 'Maputo') continue;
      const c = CAPITAIS[nome];
      const p = Math.max(0, Math.min(1, (t - (distancia(c, hub) / 9)) * 1.2));
      if (p <= 0) continue;
      const x = X(c.x);
      const y = Y(c.y);
      const hx = X(hub.x);
      const hy = Y(hub.y);
      const ccx = (x + hx) / 2 + (hy - y) * 0.18;
      const ccy = (y + hy) / 2 - (hx - x) * 0.18;

      ctx.save();
      ctx.setLineDash([4, 5]);
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = 'rgba(169,207,68,0.75)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(ccx, ccy, hx, hy);
      ctx.stroke();
      ctx.setLineDash([]);

      const e = p * p * (3 - 2 * p);
      const m = 1 - e;
      const tx = m * m * x + 2 * m * e * ccx + e * e * hx;
      const ty = m * m * y + 2 * m * e * ccy + e * e * hy;
      const rg = ctx.createRadialGradient(tx, ty, 0, tx, ty, 9);
      rg.addColorStop(0, '#A9CF44');
      rg.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(tx, ty, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#A9CF44';
      ctx.beginPath();
      ctx.arc(x, y, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // hub
    const hx = X(hub.x);
    const hy = Y(hub.y);
    const pulso = 13 + Math.sin(t * 2.2) * 4;
    ctx.save();
    const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 28);
    hg.addColorStop(0, 'rgba(234,130,64,0.75)');
    hg.addColorStop(1, 'transparent');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(hx, hy, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = '#EA8240';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(hx, hy, pulso, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#EA8240';
    ctx.beginPath();
    ctx.arc(hx, hy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // nomes das capitais, por ultimo para ficarem por cima
    if (w > 430) {
      for (const nome in CAPITAIS) {
        const c = CAPITAIS[nome];
        etiqueta(X(c.x) + (c.x < 34 ? -9 : 9), Y(c.y) + 13, c.nome,
          '#A9CF44', c.x < 34 ? 'right' : 'left');
      }
    }
  }

  function distancia(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  resize();
  window.addEventListener('resize', () => { if (visivel) desenhar((performance.now() - t0) / 1000); }, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((e) => {
      visivel = e[0].isIntersecting;
      if (!visivel) return;
      resize();
      t0 = performance.now();
      if (reduzir) { desenhar(3); return; }
      const passo = (agora) => {
        if (!visivel) return;
        desenhar((agora - t0) / 1000);
        requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    }, { threshold: 0.15 }).observe(canvas);
  } else {
    visivel = true;
    desenhar(3);
  }
  void brilho;
}

/* =========================================================
   MODAL
   ========================================================= */
const modal = document.getElementById('modal');
let focoAnterior = null;

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function abrirModal() {
  focoAnterior = document.activeElement;
  modal.dataset.aberto = 'true';
  document.body.classList.add('modal-aberto');
  const primeiro = modal.querySelector('.modal__fechar');
  setTimeout(() => primeiro?.focus(), 60);
}
function fecharModal() {
  modal.dataset.aberto = 'false';
  document.body.classList.remove('modal-aberto');
  focoAnterior?.focus();
}
modal.querySelectorAll('[data-fechar]').forEach((el) => el.addEventListener('click', fecharModal));
document.addEventListener('keydown', (e) => {
  if (modal.dataset.aberto !== 'true') return;
  if (e.key === 'Escape') { fecharModal(); return; }
  /* Focus trap: o Tab nao pode sair do dialogo enquanto estiver aberto */
  if (e.key !== 'Tab') return;
  const itens = [...modal.querySelectorAll(FOCAVEIS)].filter((el) => el.offsetParent !== null);
  if (!itens.length) return;
  const primeiro = itens[0];
  const ultimo = itens[itens.length - 1];
  if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
  else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
});

/* =========================================================
   DIÁLOGO LEGAL (política de privacidade)
   ========================================================= */
const legal = document.getElementById('legalPrivacidade');
let focoLegal = null;

function abrirLegal() {
  focoLegal = document.activeElement;
  legal.dataset.aberto = 'true';
  document.body.classList.add('modal-aberto');
  setTimeout(() => legal.querySelector('.legal__fechar')?.focus(), 60);
}
function fecharLegal() {
  legal.dataset.aberto = 'false';
  document.body.classList.remove('modal-aberto');
  focoLegal?.focus();
}
document.querySelectorAll('[data-legal="privacidade"]').forEach((el) => {
  el.addEventListener('click', (e) => { e.preventDefault(); abrirLegal(); });
});
legal.querySelectorAll('[data-fechar-legal]').forEach((el) => el.addEventListener('click', fecharLegal));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && legal.dataset.aberto === 'true') fecharLegal();
  if (e.key !== 'Tab' || legal.dataset.aberto !== 'true') return;
  const itens = [...legal.querySelectorAll(FOCAVEIS)].filter((el) => el.offsetParent !== null);
  if (!itens.length) return;
  const primeiro = itens[0];
  const ultimo = itens[itens.length - 1];
  if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
  else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
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
    actualizarResumo();
  }

  /* Cada erro fica ligado ao seu campo por aria-describedby, para o
     leitor de ecra anunciar a falha quando o campo recebe o foco. */
  form.querySelectorAll('.campo[data-campo]').forEach((campo) => {
    const msg = campo.querySelector('.campo__erro');
    const inp = campo.querySelector('input, select, textarea');
    if (msg && inp) {
      if (!msg.id) msg.id = `${inp.id}-erro`;
      inp.setAttribute('aria-describedby', msg.id);
    }
  });

  function actualizarResumo() {
    const g = (n) => form.elements[n]?.value?.trim() || '—';
    const nVol = g('volumes');
    const peso = g('peso');
    const base = parseFloat(g('valor_cobrar')) || 0;
    const iva = Math.round(base * 0.16 * 100) / 100;
    form.elements.iva.value = base ? iva.toFixed(2) : '';
    const total = base + iva;
    /* O resumo vive na coluna lateral, fora do <form>: procuramos em `raiz`. */
    const alvo = (n) => raiz.querySelector(`[data-res="${n}"]`);
    const res = {
      emissor: alvo('emissor'), carga: alvo('carga'),
      destino: alvo('destino'), valores: alvo('valores'),
    };
    if (res.emissor) res.emissor.textContent = `${g('emissor_nome')} — ${g('emissor_endereco')}`;
    if (res.carga) res.carga.textContent = `${nVol} vol · ${peso} kg — ${g('descricao')}`;
    if (res.destino) res.destino.textContent = `${g('receptor_nome')} — ${g('receptor_endereco')}`;
    if (res.valores) res.valores.textContent = base
      ? `${base.toFixed(2)} + IVA ${iva.toFixed(2)} = ${total.toFixed(2)} MZN (${form.querySelector('input[name="pagamento"]:checked')?.value || 'Numerário'})`
      : 'A definir pela JVI';
  }

  form.elements.valor_cobrar?.addEventListener('input', actualizarResumo);
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

  const ABERTO_EM = Date.now();
  const consent = form.querySelector('[data-consent]');
  const consentCaixa = form.querySelector('input[name="consentimento"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!seccoes.every((_, i) => valido(i))) { mostrar(seccoes.findIndex((_, i) => !valido(i))); return; }

    /* Sem consentimento não enviamos nada: a caixa é obrigatória */
    if (!consentCaixa.checked) {
      consent.dataset.erro = 'true';
      estado.dataset.mostrar = 'true';
      estado.className = 'estado-envio estado-envio--erro';
      estado.textContent = 'Para enviar o pedido, precisa de aceitar a Política de Privacidade.';
      consentCaixa.focus();
      return;
    }
    consent.dataset.erro = 'false';

    const dados = Object.fromEntries(new FormData(form).entries());
    delete dados.consentimento;
    dados.origem = 'site';
    dados.canal = form.querySelector('input[name="canal"]:checked')?.value || 'ambos';
    dados.pagamento = form.querySelector('input[name="pagamento"]:checked')?.value || 'Numerário';
    /* Tempo de preenchimento: o backend descarta pedidos < 3 s (bots) */
    dados._t = Date.now() - ABERTO_EM;

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
    let falhou = false;
    let mensagem = '';

    try {
      const r = await fetch(JVI.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      const resp = await r.json().catch(() => ({}));
      gravouSheet = Boolean(resp.sheet);
      enviouEmail = Boolean(resp.email);
      if (r.status === 429) { falhou = true; mensagem = resp.erro || 'Demasiados pedidos seguidos. Aguarde um momento e tente de novo.'; }
      else if (r.status === 400) { falhou = true; mensagem = resp.erro ? `Não foi possível enviar: ${resp.erro}. Verifique os dados e tente de novo.` : 'Dados inválidos.'; }
      else if (r.status >= 500) { falhou = true; mensagem = 'O serviço de registo está temporariamente indisponível.'; }
    } catch {
      falhou = true;
    }

    const canal = dados.canal;

    if (falhou) {
      estado.className = 'estado-envio estado-envio--erro';
      estado.textContent = mensagem + ' Pode enviar o pedido directamente por WhatsApp ou email — os botões ao lado.';
      if (canal === 'ambos' || canal === 'whatsapp') {
        window.open(`https://wa.me/${JVI.whatsapp}?text=${encodeURIComponent(textoWA)}`, '_blank', 'noopener');
      }
      if (canal === 'email') {
        window.location.href = `mailto:${JVI.email}?subject=${encodeURIComponent('Pedido de orçamento de transporte')}&body=${encodeURIComponent(textoWA)}`;
      }
      btnEnv.disabled = false;
      btnEnv.textContent = 'Enviar pedido';
      return;
    }

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
