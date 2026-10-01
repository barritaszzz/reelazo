/* Reelazo web v3 - main.js. Mejora progresiva: todo el contenido ya esta en el HTML.
   Si gsap/ScrollTrigger/Lenis no cargan, cae a IntersectionObserver + CSS. Sin dependencias propias. */
(() => {
'use strict';
window.__ok = 1;
const d = document, H = d.documentElement, $ = (s, r = d) => r.querySelector(s), $$ = (s, r = d) => [...r.querySelectorAll(s)];
const mq = q => matchMedia(q).matches;
const RM = mq('(prefers-reduced-motion: reduce)'), FINE = mq('(hover:hover) and (pointer:fine)');
const L = JSON.parse($('#i18n').textContent);
const MAIL = 'barritasz429@gmail.com';
/* LITE = movil o tactil: scroll nativo, sin Lenis, sin ScrollTrigger y revelados que disparan antes */
const LITE = innerWidth < 768 || mq('(hover:none)') || mq('(pointer:coarse)');
const G = window.gsap, ST = window.ScrollTrigger, GS = !!(G && ST && !RM && !LITE);
if (G && ST) G.registerPlugin(ST);
const save = !!(navigator.connection && navigator.connection.saveData);
const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
let lenis = null, reelST = null;

/* ---------- toast y copiar ---------- */
const toast = $('#toast'); let tt;
const say = m => { toast.textContent = m; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 1800); };
const copy = async txt => {
  try { await navigator.clipboard.writeText(txt); }
  catch (e) { const a = d.createElement('textarea'); a.value = txt; a.style.cssText = 'position:fixed;opacity:0'; d.body.append(a); a.select(); try { d.execCommand('copy'); } catch (_) {} a.remove(); }
};

/* ---------- progreso y capitulos ---------- */
const bar = $('.progreso'), noTL = !(window.CSS && CSS.supports('animation-timeline', 'scroll()'));
let flashed = 0;
const onScroll = () => {
  const h = H.scrollHeight - innerHeight, p = h > 0 ? Math.min(1, scrollY / h) : 0;
  if (noTL) bar.style.transform = `scaleX(${p})`;
  if (p > .995 && !flashed) { flashed = 1; if (!RM) bar.animate([{ filter: 'none' }, { filter: 'brightness(1.8) saturate(1.3)', boxShadow: '0 0 18px 2px #FFC53D' }, { filter: 'none' }], 600); }
  if (p < .9) flashed = 0;
};
addEventListener('scroll', onScroll, { passive: true }); onScroll();
const cap = $('#cap'), cn = $('.cn', cap), nm = $('.nm', cap), clinks = $$('ol a', cap);
const setCap = s => {
  const n = +s.dataset.cap;
  cn.textContent = `CAP. ${String(n).padStart(2, '0')}/09`; nm.textContent = s.dataset.nm;
  clinks.forEach((a, i) => i + 1 === n ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
};
if ('IntersectionObserver' in window) {
  const cio = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setCap(e.target)), { rootMargin: '-45% 0px -50% 0px' });
  $$('[data-cap]').forEach(s => cio.observe(s));
}
cap.addEventListener('click', e => { if (e.target.closest('ol a')) cap.open = false; });
d.addEventListener('click', e => { if (cap.open && !cap.contains(e.target)) cap.open = false; });
addEventListener('keydown', e => { if (e.key === 'Escape' && cap.open) { cap.open = false; $('summary', cap).focus(); } });

/* ---------- hero: teaser y scrub ---------- */
const tz = $('#teaser');
if (tz && !RM && !save) {
  const go = () => { tz.src = tz.dataset.src; tz.play().then(() => tz.classList.add('on')).catch(() => {}); };
  d.readyState === 'complete' ? go() : addEventListener('load', go, { once: true });
  tz.addEventListener('timeupdate', () => tz.parentNode.style.setProperty('--pg', tz.duration ? tz.currentTime / tz.duration : 0));
  new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? tz.classList.contains('on') && tz.play().catch(() => {}) : tz.pause())).observe(tz);
}
if (GS) {
  const sc = { trigger: '#hook', start: 'top top', end: '60% top', scrub: .6 };
  G.to('.frame--l', { x: -48, rotate: -3, ease: 'none', scrollTrigger: sc });
  G.to('.frame--r', { x: 48, rotate: 3, ease: 'none', scrollTrigger: sc });
  G.to('.halo', { y: 90, ease: 'none', scrollTrigger: sc });
  /* problema: texto que se enciende */
  const lit = $('#lit');
  if (lit) {
    const txt = lit.textContent; lit.setAttribute('aria-label', txt); lit.textContent = '';
    txt.split(' ').forEach((w, i, a) => { const s = d.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.textContent = w; lit.append(s); if (i < a.length - 1) lit.append(' '); });
    G.fromTo($$('.w', lit), { opacity: .2 }, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: lit, start: 'top 70%', end: 'bottom 55%', scrub: true } });
  }
  /* pins solo en escritorio */
  const mm = G.matchMedia();
  mm.add('(min-width:900px) and (hover:hover) and (pointer:fine)', () => {
    const pin = $('#pin-reels'), car = $('#carril'), lis = $$('li', car);
    pin.classList.add('is-pin');
    const dist = () => Math.max(0, car.scrollWidth - innerWidth);
    const fx = () => {
      const c = innerWidth / 2;
      lis.forEach(li => { const r = li.getBoundingClientRect(), k = Math.min(1, Math.abs(r.left + r.width / 2 - c) / (innerWidth * .45)); li.style.scale = (1.04 - .12 * k).toFixed(3); li.style.opacity = (1 - .4 * k).toFixed(2); });
    };
    reelST = G.to(car, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + Math.round(Math.max(dist(), innerHeight * 1.8)), pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true, onUpdate: fx, onRefresh: fx } });
    fx(); reelST = reelST.scrollTrigger;
    const pr = $('#pin-proc'), steps = $$('.step', pr);
    pr.classList.add('is-pin'); steps.forEach(s => s.classList.remove('rev'));
    const tl = G.timeline({ scrollTrigger: { trigger: pr, start: 'top top', end: () => '+=' + Math.round(innerHeight * 2), pin: true, scrub: .8, anticipatePin: 1 } });
    tl.fromTo('.tl__line', { '--g': 0 }, { '--g': 1, ease: 'none', duration: steps.length }, 0);
    steps.forEach((s, i) => {
      tl.fromTo($('.n', s), { opacity: .3, scale: .9 }, { opacity: 1, scale: 1, duration: .4, ease: 'power2.out' }, i)
        .fromTo($('p', s), { opacity: .25, y: 12 }, { opacity: 1, y: 0, duration: .5, ease: 'power2.out' }, i);
    });
    return () => { reelST = null; pin.classList.remove('is-pin'); pr.classList.remove('is-pin'); lis.forEach(li => { li.style.scale = ''; li.style.opacity = ''; }); };
  });
  $$('.sec--d').forEach(s => G.fromTo(s, { '--dk': 0 }, { '--dk': 1, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'top 55%', scrub: true } }));
  G.from('.chip', { opacity: 0, y: 16, duration: .5, ease: 'power3.out', stagger: .04, clearProps: 'all', scrollTrigger: { trigger: '#chips', start: 'top 85%', once: true } });
}

/* ---------- elige tu estilo ---------- */
const app = $('.estilos'), mini = $('.mini', app), shell = $('#shell'), phone = $('#phone'), chips = $('#chips'), pill = $('.pill', chips);
const radios = $$('input[name=estilo]', app), hasHas = !!(window.CSS && CSS.supports('selector(:has(*))'));
const FURL = 'https://fonts.googleapis.com/css2?family=Manrope:wght@700&family=Archivo:wght@800&family=Space+Grotesk:wght@700&family=Sora:wght@600&family=Inter+Tight:wght@700&family=Unbounded:wght@800&family=Baloo+2:wght@700&family=Chakra+Petch:wght@700&family=Cormorant+Garamond:wght@500&family=Fraunces:wght@600&display=swap';
let userTouched = false;
let cur = (radios.find(r => r.checked) || radios[0]).value, fonts = 0;
const injectFonts = () => { if (fonts) return; fonts = 1; const l = d.createElement('link'); l.rel = 'stylesheet'; l.href = FURL; d.head.append(l); };
const movePill = () => {
  const l = $('#e-' + cur + '+label', chips); if (!l) return;
  const t = pill.style.transform, tr = pill.style.transition;
  pill.style.transition = 'none'; pill.style.transform = 'none';
  const dy = pill.getBoundingClientRect().top - chips.getBoundingClientRect().top - chips.clientTop + chips.scrollTop;
  pill.style.transform = t; void pill.offsetWidth; pill.style.transition = tr;
  pill.style.width = l.offsetWidth + 'px'; pill.style.height = l.offsetHeight + 'px'; pill.style.transform = `translate(${l.offsetLeft}px,${l.offsetTop - dy}px)`;
};
const chn = $('#chipsn'), setCn = () => { if (chn) chn.textContent = `${radios.findIndex(r => r.value === cur) + 1}/${radios.length} \u2192`; };
const apply = (id, scroll) => {
  cur = id; $('#e-' + id).checked = true; mini.dataset.estilo = id; phone.dataset.estilo = id; ls.set('rz-estilo', id);
  if (!hasHas) $$('[data-n]', app).forEach(s => { s.hidden = s.dataset.n !== id; });
  movePill(); setCn();
  if (scroll && chips.scrollWidth > chips.clientWidth) chips.scrollTo({ left: Math.max(0, $('#e-' + id + '+label').offsetLeft - 16), behavior: RM ? 'auto' : 'smooth' });
};
const go = (id, byAuto) => {
  if (id === cur || (byAuto && userTouched)) return;
  const sc = byAuto ? 0 : 1;   /* la autodemo no mueve la tira de chips: nada se desplaza bajo el dedo */
  if (d.startViewTransition && !RM) { $('#e-' + cur).checked = true; d.startViewTransition(() => { if (!(byAuto && userTouched)) apply(id, sc); }); }
  else apply(id, sc);
};
const saved = ls.get('rz-estilo');
apply(saved && $('#e-' + saved) ? saved : cur);
if (!(saved && $('#e-' + saved))) phone.dataset.estilo = 'kinetic';
requestAnimationFrame(() => { movePill(); chips.classList.add('has-pill'); });
addEventListener('resize', movePill);
if (d.fonts) d.fonts.ready.then(movePill);
/* autodemo: 3 estilos, una sola vez. Cualquier clic, tecla o toque del usuario en el selector o en el antes/despues la apaga para siempre */
const ab = $('#autobtn'), SEQ = ['brutal', 'glass', 'luxe'];
let auto = null, ai = 0, autoWait = 0;
const stop = () => { clearInterval(auto); auto = null; clearTimeout(autoWait); autoWait = 0; };
const halt = () => { stop(); ab.setAttribute('aria-pressed', 'true'); ab.textContent = L.resume; };
const run = () => {
  if (userTouched) return;
  ai = 0; ab.setAttribute('aria-pressed', 'false'); ab.textContent = L.pause; clearInterval(auto);
  auto = setInterval(() => { if (userTouched) return stop(); if (ai >= SEQ.length) { halt(); ab.hidden = true; } else go(SEQ[ai++], true); }, 2200);
};
const kill = () => { if (userTouched) return; userTouched = true; stop(); ab.hidden = true; chips.scrollLeft = chips.scrollLeft; };
['pointerdown', 'mousedown', 'touchstart', 'click', 'keydown', 'input', 'change', 'focusin'].forEach(ev =>
  app.addEventListener(ev, e => { if (!ab.contains(e.target)) kill(); }, true));
radios.forEach(r => r.addEventListener('change', () => { kill(); go(r.value); }));
if (!RM) {
  ab.hidden = false; halt(); ab.setAttribute('aria-pressed', 'false'); ab.textContent = L.pause;
  ab.addEventListener('click', () => { if (userTouched) return; auto !== null ? halt() : run(); });
}
/* antes / despues */
const ba = $('#ba'), setP = v => shell.style.setProperty('--p', v + '%');
ba.value = 70; setP(70);
let baTouched = false;
ba.addEventListener('input', () => { baTouched = true; kill(); setP(ba.value); });
/* tilt del marco */
if (FINE && !RM) {
  const br = $('#browser'), st = $('#stage'); let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const loop = () => { cx += (tx - cx) * .12; cy += (ty - cy) * .12; br.style.transform = `rotateX(${cy.toFixed(2)}deg) rotateY(${cx.toFixed(2)}deg)`; raf = (Math.abs(tx - cx) > .01 || Math.abs(ty - cy) > .01) ? requestAnimationFrame(loop) : 0; };
  st.addEventListener('pointermove', e => { const r = st.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - .5) * 8; ty = -((e.clientY - r.top) / r.height - .5) * 8; if (!raf) raf = requestAnimationFrame(loop); });
  st.addEventListener('pointerleave', () => { tx = ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
}
if ('IntersectionObserver' in window) {
  const fio = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { injectFonts(); fio.disconnect(); } }, { rootMargin: '600px' });
  fio.observe($('#estilos')); fio.observe($('#contacto'));
  let breathed = 0;
  new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) {
      if (!breathed && !RM) { breathed = 1; const t0 = performance.now(); const f = n => { if (baTouched) return; const x = Math.min(1, (n - t0) / 900), v = 70 - 12 * Math.sin(Math.PI * x); ba.value = v; setP(v); if (x < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }
      if (!RM && !userTouched && auto === null && !autoWait && ai === 0) autoWait = setTimeout(() => { autoWait = 0; if (!userTouched) run(); }, 4000);
    } else if (!userTouched) { if (auto !== null) halt(); clearTimeout(autoWait); autoWait = 0; }
  }), { threshold: .5 }).observe($('#stage'));
}

/* ---------- reproductor de Reels ---------- */
const lb = $('#lb'), lbv = $('#lbv'), reels = $$('.reel'), offs = [];
let opener = null;
const openLb = f => {
  const a = $('.reel__a', f); opener = a; lbv.poster = $('img', f).src; lbv.src = a.href;
  if (lenis) lenis.stop(); lb.showModal(); lbv.play().catch(() => {});
};
lb.addEventListener('close', () => { lbv.pause(); lbv.removeAttribute('src'); lbv.load(); if (lenis) lenis.start(); if (opener) opener.focus(); });
lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
reels.forEach(f => {
  const v = $('video', f), a = $('.reel__a', f); let hov = 0;
  const on = force => { if (!force && (RM || save)) return; v.play().then(() => { v.classList.add('on'); f.classList.add('playing'); }).catch(() => {}); };
  const off = () => { clearTimeout(hov); v.pause(); v.currentTime = 0; v.classList.remove('on'); f.classList.remove('playing', 'touch-on'); f.style.setProperty('--pg', 0); };
  offs.push(off);
  if (FINE) {
    const enter = () => { hov = setTimeout(() => on(), 120); };
    a.addEventListener('pointerenter', enter); a.addEventListener('focus', enter); a.addEventListener('pointerleave', off); a.addEventListener('blur', off);
  }
  v.addEventListener('timeupdate', () => f.style.setProperty('--pg', v.duration ? v.currentTime / v.duration : 0));
  a.addEventListener('click', e => {
    e.preventDefault();
    if (FINE) { off(); openLb(f); return; }
    if (f.classList.contains('playing')) { off(); return; }
    offs.forEach(o => o !== off && o()); on(1); f.classList.add('touch-on');
  });
  $('.sound', f).addEventListener('click', () => { off(); openLb(f); });
  if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting && f.classList.contains('playing')) off(); })).observe(f);
});
$$('input[name=rl]').forEach(r => r.addEventListener('change', () => {
  const s = r.value;
  reels.forEach(f => {
    const slug = f.dataset.slug, img = $('img', f), v = $('video', f), a = $('.reel__a', f), base = img.getAttribute('src').replace(/[^/]*$/, '');
    offs.forEach(o => o());
    img.src = `${base}${slug}-${s}.webp`; v.poster = img.src; v.src = `${base}${slug}-${s}.mp4`; a.setAttribute('href', `${base}${slug}-${s}.mp4`);
  });
}));

/* ---------- microinteracciones ---------- */
if (FINE) $$('.bc').forEach(c => c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px'); }));
if (FINE && !RM) {
  const mags = $$('[data-mag]').map(el => ({ el, x: 0, y: 0, tx: 0, ty: 0 })); let raf = 0;
  const loop = () => { let busy = 0; mags.forEach(m => { m.x += (m.tx - m.x) * .15; m.y += (m.ty - m.y) * .15; m.el.style.translate = `${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`; if (Math.abs(m.tx - m.x) > .05 || Math.abs(m.ty - m.y) > .05) busy = 1; }); raf = busy ? requestAnimationFrame(loop) : 0; };
  addEventListener('pointermove', e => {
    mags.forEach(m => { const r = m.el.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); if (Math.hypot(dx, dy) < r.width / 2 + 90) { m.tx = Math.max(-6, Math.min(6, dx * .12)); m.ty = Math.max(-6, Math.min(6, dy * .12)); } else m.tx = m.ty = 0; });
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
}
const cb = $('#copybtn');
cb.addEventListener('click', async () => { await copy(MAIL); say(L.copied_mail); cb.textContent = L.copied_btn; setTimeout(() => { cb.textContent = L.copy_btn; }, 1500); });
/* FAQ: altura animada si el navegador no tiene interpolate-size */
if (!RM && !(window.CSS && CSS.supports('interpolate-size', 'allow-keywords'))) {
  $$('.faq details').forEach(dt => {
    const sm = $('summary', dt); let an = null; const ease = 'cubic-bezier(.65,0,.35,1)';
    sm.addEventListener('click', e => {
      e.preventDefault(); if (an) an.cancel();
      const h0 = dt.offsetHeight; dt.style.overflow = 'hidden';
      if (dt.open) { an = dt.animate({ height: [h0 + 'px', sm.offsetHeight + 'px'] }, { duration: 350, easing: ease }); an.onfinish = () => { dt.open = false; dt.style.overflow = ''; an = null; }; }
      else { dt.open = true; an = dt.animate({ height: [h0 + 'px', dt.offsetHeight + 'px'] }, { duration: 350, easing: ease }); an.onfinish = () => { dt.style.overflow = ''; an = null; }; }
    });
  });
}

/* ---------- precios: contadores y cotizador ---------- */
const count = el => {
  const to = +el.dataset.to, t0 = performance.now();
  const f = n => { const x = Math.min(1, (n - t0) / 900); el.textContent = Math.round(to * (1 - (1 - x) * (1 - x))).toLocaleString('en-US'); if (x < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
};
if ('IntersectionObserver' in window) {
  const plans = $('#plans'), star = $('.plan--star');
  if (!RM) { const pio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { pio.unobserve(e.target); $$('.precio', e.target).forEach(count); } }), { threshold: .3 }); pio.observe(plans); }
  new IntersectionObserver(es => es.forEach(e => star.classList.toggle('off', !e.isIntersecting))).observe(star);
}
const qz = $('#cotizador');
if (qz) {
  qz.hidden = false;
  const q = n => $('[name=' + n + ']', qz), fmt = n => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const qo = $('#qo'), qm = $('#qm'), qs = $('#qs'), qd = $('#qd'), qi = $('#qi'), send = $('#qsend'), ov = $('#qr'), mi = $('#qr-m'), pl = $('#qr-p');
  let nr = 0, summary = '';
  const setv = (el, h) => { if (el.dataset.v === h) return; el.dataset.v = h; el.innerHTML = h; el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); };
  const calc = () => {
    const b = $('[name=qb]:checked', qz).value, gb = q('qgb').checked, rv = q('qrv').checked, cf = !!(q('qcf') && q('qcf').checked), both = b === 'cre' && rv;
    const once = (b === 'arr' ? 899 : 0) + (gb ? 500 : 0) + nr * 249, mo = (b === 'cre' ? 2400 : 0) + (rv ? 399 : 0) - (both ? 100 : 0);
    ov.textContent = nr; mi.disabled = nr <= 0; pl.disabled = nr >= 8;
    setv(qo, `${fmt(once)}&nbsp;<small>${L.mxn}</small>`); setv(qm, `${fmt(mo)}&nbsp;<small>${L.mo}</small>`);
    qs.hidden = !both; qd.hidden = b !== 'cre'; qd.innerHTML = `${L.dep} <b>1,200&nbsp;${L.mxn}</b>`;
    const iv = []; if (once) iv.push(`<b>${fmt(once * .16)}&nbsp;${L.mxn}</b> (${L.once.toLowerCase()})`); if (mo) iv.push(`<b>${fmt(mo * .16)}&nbsp;${L.mxn}</b> (${L.month.toLowerCase()})`);
    qi.hidden = true; qi.innerHTML = `${L.iva} ${iv.join(' · ')}`;
    const it = []; if (b === 'arr') it.push([L.n_arr, 899]); if (b === 'cre') it.push([L.n_cre, 2400]); if (gb) it.push([L.n_gb, 500]); if (rv) it.push([L.n_rev, 399]); if (nr) it.push([`${L.n_reel} ×${nr}`, nr * 249]);
    const combo = it.map(x => x[0]).join(' + ') || L.only_sample, subj = L.subj_combo.replace('{c}', combo);
    const body = [L.hi, '', ...it.map(x => `- ${x[0]}: ${fmt(x[1])} MXN`), '', `${L.once}: ${fmt(once)} MXN`, `${L.month}: ${fmt(mo)} ${L.mo}`, b === 'cre' ? `${L.dep} 1,200 MXN` : '', both ? L.save : '', cf ? L.cfdi_l : '', '', L.bye].filter((x, i, a) => x !== '' || (a[i - 1] !== '' && i)).join('\n');
    send.href = `mailto:${MAIL}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`; summary = `${subj}\n\n${body}`;
  };
  qz.addEventListener('input', calc); qz.addEventListener('change', calc);
  mi.addEventListener('click', () => { nr = Math.max(0, nr - 1); calc(); }); pl.addEventListener('click', () => { nr = Math.min(8, nr + 1); calc(); });
  $('#qcopy').addEventListener('click', async () => { await copy(summary); say(L.copied_sum); });
  calc();
}

/* ---------- sorpresa final: tu negocio, en un Reel ---------- */
const biz = $('#biz'), rn = $('#rlname'), cta = $('#cta'), CTA0 = cta.textContent, SUBJ0 = decodeURIComponent(cta.href.split('subject=')[1] || '');
const upd = () => {
  const n = biz.value.trim().slice(0, 40), txt = n || L.biz_default;
  rn.textContent = ''; txt.split(/\s+/).forEach((w, i) => { const s = d.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i); s.textContent = w; rn.append(s, ' '); });
  if (n) { const [a, b] = L.cta_named.split('{n}'), e = d.createElement('em'); e.className = 'serif'; e.textContent = n; cta.replaceChildren(a, e, b); } else cta.textContent = CTA0;
  cta.href = `mailto:${MAIL}?subject=${encodeURIComponent(n ? L.subj_named.replace('{n}', n) : SUBJ0)}`;
};
biz.addEventListener('input', () => { typed = 1; rn.classList.remove('typing'); biz.placeholder = PH0; upd(); });
const PH0 = biz.placeholder; let typed = 0;
const setName = txt => { rn.textContent = ''; txt.split(/\s+/).forEach((w, i) => { const s = d.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i); s.textContent = w; rn.append(s, ' '); }); };
const autoType = () => {
  const DEMO = 'Taquer\u00eda El G\u00fcero'; let i = 0;
  rn.classList.add('typing');
  const step = () => { if (typed || biz.value) return; i++; const t = DEMO.slice(0, i); biz.placeholder = t; setName(t); if (i < DEMO.length) setTimeout(step, 75); else setTimeout(() => { if (!typed && !biz.value) { rn.classList.remove('typing'); } }, 600); };
  step();
};
if (!RM && 'IntersectionObserver' in window) new IntersectionObserver((es, o) => { if (es.some(e => e.isIntersecting)) { o.disconnect(); setTimeout(() => { if (!biz.value) autoType(); }, 900); } }, { threshold: .6 }).observe(phone);
if (GS) {
  ST.create({ trigger: phone, start: 'top 60%', once: true, onEnter: () => {
    const ease = 'back.out(1.6)';
    G.timeline()
      .from('.ph__top', { x: -90, y: -170, rotate: -14, opacity: 0, duration: .9, ease })
      .from('.ph__screen', { scale: .5, opacity: 0, duration: .9, ease }, .08)
      .from('.ph__bot', { x: 90, y: 170, rotate: 14, opacity: 0, duration: .9, ease }, .16)
      .fromTo(cta, { scale: 1 }, { scale: 1.08, duration: .3, yoyo: true, repeat: 1, ease: 'back.out(2)', onComplete: () => G.set(cta, { clearProps: 'transform' }) }, '>-.05');
  } });
}

/* ---------- revelado estandar ("rev") ---------- */
const revs = $$('.rev');
const reveal = el => {
  el.classList.add('in');
  const dl = (parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0) * 90;
  setTimeout(() => el.classList.remove('rev', 'rev--drop', 'rev--frame', 'in'), 1300 + dl);
};
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); reveal(e.target); } }), LITE ? { threshold: 0, rootMargin: '0px 0px 18% 0px' } : { threshold: .2, rootMargin: '0px 0px -4% 0px' });
  revs.forEach(r => io.observe(r));
} else revs.forEach(r => r.classList.remove('rev'));

/* ---------- foco siempre visible ---------- */
const focusBox = t => (t.matches('input[type=radio],input[type=checkbox]') && t.labels && t.labels[0]) || t;
const inView = r => r.bottom > 80 && r.top < innerHeight - 8 && r.right > 0 && r.left < innerWidth;
d.addEventListener('focusin', e => {
  const t = e.target;
  if (!t.closest || !t.closest('.sec') || t.closest('#cap')) return;
  requestAnimationFrame(() => {
    const box = focusBox(t);
    if (reelST && t.closest('#carril')) {
      /* carril fijado: se mueve con el scroll de la pagina, no con scroll interno */
      const car = $('#carril'), r0 = box.getBoundingClientRect(), dist = Math.max(1, car.scrollWidth - innerWidth);
      if (r0.left < 24 || r0.right > innerWidth - 24) {
        const cx = +G.getProperty(car, 'x') || 0, nx = Math.max(-dist, Math.min(0, cx - (r0.left + r0.width / 2 - innerWidth / 2)));
        window.scrollTo({ top: reelST.start + (-nx / dist) * (reelST.end - reelST.start), behavior: 'instant' });
      }
      $('#pin-reels').scrollLeft = 0;
    }
    const r = box.getBoundingClientRect();
    if (!inView(r) || r.top < 72 || r.bottom > innerHeight - 8) box.scrollIntoView({ block: inView(r) ? 'nearest' : 'center', inline: 'nearest', behavior: 'instant' });
  });
});
const est = $('#estilos'), eh = $('.sec__head', est);
if (eh && 'ResizeObserver' in window) new ResizeObserver(() => est.style.setProperty('--head-h', (eh.offsetHeight + parseFloat(getComputedStyle(eh).marginBottom || 0)) + 'px')).observe(eh);

/* ---------- Lenis (solo puntero fino y sin movimiento reducido) ---------- */
if (!RM && FINE && !LITE && window.Lenis) {
  lenis = new Lenis({ lerp: .1, anchors: true });
  if (GS) { lenis.on('scroll', ST.update); G.ticker.add(t => lenis.raf(t * 1000)); G.ticker.lagSmoothing(0); }
  else { const r = t => { lenis.raf(t); requestAnimationFrame(r); }; requestAnimationFrame(r); }
}
if (GS) { const rf = () => ST.refresh(); if (d.fonts) d.fonts.ready.then(rf); addEventListener('load', rf); }
})();
