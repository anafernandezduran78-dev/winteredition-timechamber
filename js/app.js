// Per-language strings come from <script id="i18n" type="application/json"> in each page.
const T = JSON.parse(document.getElementById('i18n').textContent);
/* ===== CONFIGURACIÓN =====
   GOOGLE_FORM: cuando exista el Google Form, pegar su URL ".../formResponse"
   y el "entry.XXXX" de cada pregunta (Form → ⋮ → "Obtener enlace rellenado previamente").
   El Google Form alimenta Salesforce.
   LEADS: Apps Script (campus-navidad/apps-script). Avisa por mail al empezar, a los 10 min si no
   se termina, al completar, y envía un resumen diario. Pegar la URL /exec y el SHARED_SECRET. */
const LEADS = { endpoint: 'https://script.google.com/macros/s/AKfycbzuxjNRqwgIHZL9_hv0yzBrTzoI3Yo3nR7qHh1fdPvBCoPfFo6QOqKhtVH6DIwjjSWp/exec', secret: 'cw-zvqHmK3u4gZfXW95JX39mHXs' };
const GOOGLE_FORM = {
  action: 'https://docs.google.com/forms/d/e/1FAIpQLSc3cvd4dwrSgebhVFDklFDGxcuYtoM6G0VjiJV9prMqGIt8aA/formResponse',
  fields: {
    name: 'entry.276155258', surname: 'entry.1914094277', age: 'entry.980487536', club: 'entry.192029865',
    level: 'entry.1480078896', shirt: 'entry.1801192116', week: 'entry.1074436091', total: 'entry.2032556179',
    gname: 'entry.773716956', email: 'entry.1447681880', phone: 'entry.1061006689', pickup: 'entry.1792462198',
    c_alone: 'entry.1531531111', health: 'entry.2122994921', c_health: 'entry.179497999', c_img: 'entry.1491247474',
    c_news: 'entry.660656589', consents: 'entry.790968576', source: 'entry.1238298527'
  }
};
const PRICES = T.prices;
const $ = id => document.getElementById(id);
const eur = n => T.price_fmt.replace('{n}', n);

// ----- mobile menu
const menuBtn = $('menuBtn'), siteNav = $('siteNav');
if (menuBtn) menuBtn.addEventListener('click', () => {
  const open = siteNav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
});

// ----- countdown (home only)
if ($('cdD')) {
  const start = new Date('2026-12-22T09:00:00+01:00').getTime();
  const pad = n => String(n).padStart(2, '0');
  const tick = () => {
    if (!$('cdD')) return;
    const d = Math.max(0, start - Date.now());
    $('cdD').textContent = pad(Math.floor(d / 864e5));
    $('cdH').textContent = pad(Math.floor(d / 36e5) % 24);
    $('cdM').textContent = pad(Math.floor(d / 6e4) % 60);
    $('cdS').textContent = pad(Math.floor(d / 1e3) % 60);
  };
  tick();
  clearInterval(window.__cd); window.__cd = setInterval(tick, 1000);
}

// ----- analytics + consent (GA4 with Consent Mode; Instagram embeds wait for consent too)
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
// Estadísticas propias (Apps Script, hoja "Visitas"): sin cookies ni datos personales.
const STATS_ON = !T.noembed && /^https?:/.test(location.protocol) && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const qs = new URLSearchParams(location.search);
const statSend = (type, extra) => {
  if (!STATS_ON || !LEADS.endpoint) return;
  let ref = '';
  try { const h = document.referrer && new URL(document.referrer).hostname; ref = h && h !== location.hostname ? h.replace(/^www\./, '') : ''; } catch (e) {}
  const w = innerWidth, dev = w < 700 ? 'movil' : w < 1100 ? 'tablet' : 'ordenador';
  const data = Object.assign({ page: location.pathname, lang: document.documentElement.lang, ref, dev,
    us: qs.get('utm_source') || '', um: qs.get('utm_medium') || '', uc: qs.get('utm_campaign') || '' }, extra || {});
  const payload = JSON.stringify({ type, secret: LEADS.secret, data });
  if (navigator.sendBeacon) navigator.sendBeacon(LEADS.endpoint, new Blob([payload], { type: 'text/plain' }));
  else fetch(LEADS.endpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: payload, keepalive: true }).catch(() => {});
};
statSend('visit');
function track(name, params){ if (T.ga4) gtag('event', name, params || {}); statSend('event', { name }); }
let cookieChoice = null;
try { cookieChoice = localStorage.getItem('tc_cookies'); } catch (e) {}
if (T.ga4) {
  // Si ya aceptó en otra visita, el consentimiento va ANTES del config (si no, el page_view sale como «denegado»).
  gtag('consent', 'default', { analytics_storage: cookieChoice === 'yes' ? 'granted' : 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  gtag('js', new Date());
  gtag('config', T.ga4, { anonymize_ip: true });
  const gs = document.createElement('script');
  gs.async = true; gs.src = 'https://www.googletagmanager.com/gtag/js?id=' + T.ga4;
  document.head.appendChild(gs);
}

// ----- Instagram reels: real embeds, loaded only after consent (banner "accept" or the button)
function embedReels() {
  if (T.noembed) return;                       // artifact preview: other sites cannot be framed
  document.querySelectorAll('.reel[data-reel]').forEach(fig => {
    if (fig.querySelector('iframe')) return;
    const f = document.createElement('iframe');
    f.src = 'https://www.instagram.com/reel/' + fig.dataset.reel + '/embed/';
    f.loading = 'lazy'; f.allowFullscreen = true; f.title = fig.querySelector('figcaption').textContent;
    f.setAttribute('scrolling', 'no');
    fig.querySelector('.reel-card').replaceWith(f);
    fig.classList.add('embedded');
  });
  const bar = document.querySelector('.embed-bar');
  if (bar) bar.hidden = true;
}
const embedBtn = $('embedBtn');
if (embedBtn) {
  if (T.noembed) document.querySelector('.embed-bar').hidden = true;
  embedBtn.addEventListener('click', () => { embedReels(); track('videos_embed'); });
  if (cookieChoice === 'yes') embedReels();
}
const cookieBox = $('cookie');
if (cookieBox && !T.noembed && (T.ga4 || embedBtn)) {
  const decide = ok => {
    if (ok && T.ga4) { gtag('consent', 'update', { analytics_storage: 'granted' }); gtag('event', 'page_view'); }
    try { localStorage.setItem('tc_cookies', ok ? 'yes' : 'no'); } catch (e) {}
    cookieBox.hidden = true;
    if (ok) embedReels();
  };
  if (cookieChoice !== 'yes' && cookieChoice !== 'no') cookieBox.hidden = false;
  $('ckOk').addEventListener('click', () => decide(true));
  $('ckNo').addEventListener('click', () => decide(false));
}
document.querySelectorAll('a[href*="wa.me"]').forEach(a => a.addEventListener('click', () => track('whatsapp_click')));
document.querySelectorAll('.langs a').forEach(a => a.addEventListener('click', () => track('language_switch', { language: a.lang })));

// ----- legal page: open the block named in the URL (#legal-privacidad…)
function openLegal() {
  const id = location.hash.slice(1).replace(/[^\w-]/g, '');
  const d = id && document.getElementById(id);
  if (d && d.tagName === 'DETAILS') { d.open = true; d.scrollIntoView(); }
}
if (document.querySelector('.legal-block')) { openLegal(); addEventListener('hashchange', openLegal); }

// ----- review form (press & reviews page): goes to the team for approval, never published automatically
const reviewForm = $('reviewForm');
if (reviewForm) {
  const rmsg = $('reviewMsg');
  const rshow = (cls, text) => { rmsg.className = 'msg ' + cls; rmsg.textContent = text; };
  reviewForm.addEventListener('submit', async ev => {
    ev.preventDefault();
    if (!reviewForm.checkValidity()) { reviewForm.reportValidity(); return; }
    if (!LEADS.endpoint) { rshow('err', T.msg_notconn); return; }
    const payload = JSON.stringify({ type: 'review', sessionId: 'review', secret: LEADS.secret, data: {
      name: $('r_name').value.trim(), rel: $('r_rel').value,
      rating: reviewForm.querySelector('input[name=r_rating]:checked').value,
      text: $('r_text').value.trim(), consent: 'Sí ' + new Date().toISOString(),
      lang: document.documentElement.lang } });
    const btn = $('reviewBtn');
    btn.disabled = true; btn.textContent = T.msg_sending;
    try {
      await fetch(LEADS.endpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: payload });
      reviewForm.reset();
      rshow('ok', T.r_ok);
      track('review_submit');
    } catch (err) {
      rshow('err', T.msg_err);
    } finally {
      btn.disabled = false; btn.textContent = T.r_submit;
    }
  });
}

// ----- registration form (sign-up page only)
const form = $('campusForm');
if (form) {
  const totalEl = $('total'), msg = $('msg'), gated = $('gated');
  const v = id => $(id).value.trim();
  const yes = id => $(id).checked ? 'Sí' : 'No';
  const selectedWeek = () => form.querySelector('input[name=week]:checked');
  const updateTotal = () => {
    totalEl.textContent = eur(PRICES[selectedWeek().dataset.key]);
    form.querySelectorAll('.pay-total').forEach(el => el.textContent = totalEl.textContent);
  };
  form.querySelectorAll('input[name=week]').forEach(r => r.addEventListener('change', updateTotal));
  updateTotal();
  const show = (cls, text) => { msg.className = 'msg ' + cls; msg.textContent = text; };

  // Nothing personal is stored or sent until the adult has declared guardianship and accepted the privacy policy.
  const accepted = () => $('c_tutor').checked && $('c_priv').checked;
  const applyGate = () => {
    const ok = accepted();
    gated.classList.toggle('locked', !ok);
    gated.querySelectorAll('input,select,textarea,button').forEach(el => el.disabled = !ok);
    $('gateMsg').hidden = ok;
    $('gateMsgEnd').hidden = ok;
  };
  ['c_tutor', 'c_priv'].forEach(id => $(id).addEventListener('change', applyGate));
  applyGate();

  // Health data needs its own explicit consent, asked only when something is written.
  const healthSync = () => {
    const has = v('health') !== '';
    $('healthConsent').hidden = !has;
    $('c_health').required = has;
    if (!has) $('c_health').checked = false;
  };
  $('health').addEventListener('input', healthSync);

  const source = () => 'Web Christmas Work [' + document.documentElement.lang + ']' + (location.search ? ' ' + location.search : '');
  const collect = () => accepted() ? {
    name: v('name'), surname: v('surname'), age: v('age'), club: v('club'),
    level: v('level'), shirt: v('shirt'), week: selectedWeek().value, total: totalEl.textContent,
    gname: v('gname'), email: v('email'), phone: v('phone'), pickup: v('pickup'), c_alone: yes('c_alone'),
    health: $('c_health').checked ? v('health') : '', c_health: yes('c_health'),
    c_img: yes('c_img'), c_news: yes('c_news'),
    consents: 'tutor+privacidad ' + new Date().toISOString() + (($('c_terms').checked && $('c_med').checked) ? ' · condiciones+atención médica' : ''),
    pay: payMethod() === 'card' ? 'Tarjeta (Stripe)' : 'Transferencia',
    lang: document.documentElement.lang,
    source: source()
  } : { source: source() };

  let sessionId = null, progressTimer = null;
  const newSessionId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const sendLead = (type, beacon, receipt) => {
    if (!LEADS.endpoint || !sessionId) return Promise.resolve();
    const payload = JSON.stringify({ type, sessionId, secret: LEADS.secret, data: collect(), receipt });
    if (beacon && navigator.sendBeacon) { navigator.sendBeacon(LEADS.endpoint, new Blob([payload], { type: 'text/plain' })); return Promise.resolve(); }
    // text/plain avoids the CORS preflight that Apps Script can't answer
    return fetch(LEADS.endpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: payload, keepalive: true }).catch(() => {});
  };
  const onActivity = () => {
    if (!sessionId) { sessionId = newSessionId(); sendLead('start'); track('form_start'); return; }
    clearTimeout(progressTimer);
    progressTimer = setTimeout(() => sendLead('progress'), 1500);
  };
  form.addEventListener('input', onActivity);
  form.addEventListener('change', onActivity);
  // leaving the page mid-form: flush what was typed so the 10-min email has it
  addEventListener('pagehide', () => { if (sessionId) { clearTimeout(progressTimer); sendLead('progress', true); } });

  // Transfer receipt: image or PDF, 5 MB max. Sent only with the completed registration.
  const receiptEl = $('receipt');
  // Payment method (card only when Stripe links are configured; otherwise transfer only)
  const payMethod = () => (form.querySelector('input[name=paymeth]:checked') || {}).value || 'transfer';
  const paySync = () => {
    const card = payMethod() === 'card';
    if ($('payTransfer')) $('payTransfer').hidden = card;
    if ($('payCard')) $('payCard').hidden = !card;
    receiptEl.required = !card;
    if (card) receiptEl.setCustomValidity('');
  };
  form.querySelectorAll('input[name=paymeth]').forEach(r => r.addEventListener('change', paySync));
  paySync();
  const receiptOk = () => {
    const f = receiptEl.files[0];
    const ok = !f || ((/^image\//.test(f.type) || f.type === 'application/pdf') && f.size <= 5 * 1024 * 1024);
    receiptEl.setCustomValidity(ok ? '' : T.receipt_err);
    return ok;
  };
  receiptEl.addEventListener('change', () => { if (!receiptOk()) receiptEl.reportValidity(); });
  const readReceipt = () => new Promise((res, rej) => {
    const f = receiptEl.files[0], r = new FileReader();
    r.onload = () => res({ name: f.name, type: f.type, b64: String(r.result).split(',')[1] });
    r.onerror = rej;
    r.readAsDataURL(f);
  });

  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    if (!accepted()) { show('err', T.gate_msg); return; }
    healthSync();
    if (payMethod() === 'transfer') receiptOk();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const data = collect();
    if (!GOOGLE_FORM.action && !LEADS.endpoint) {
      console.warn('Sin GOOGLE_FORM.action ni LEADS.endpoint: inscripción no enviada');
      show('err', T.msg_notconn);
      return;
    }
    const body = new URLSearchParams();
    for (const [k, entry] of Object.entries(GOOGLE_FORM.fields)) body.append(entry, data[k] ?? '');
    const btn = $('submitBtn');
    btn.disabled = true; btn.textContent = T.msg_sending;
    try {
      // Google Forms no devuelve CORS: no-cors envía igualmente; no podemos leer la respuesta.
      if (GOOGLE_FORM.action) await fetch(GOOGLE_FORM.action, { method: 'POST', mode: 'no-cors', body });
      clearTimeout(progressTimer);
      if (!sessionId) sessionId = newSessionId();
      const method = payMethod(), weekKey = selectedWeek().dataset.key;
      await sendLead('complete', false, method === 'transfer' && receiptEl.files[0] ? await readReceipt() : null);
      const cardUrl = method === 'card' && (T.card_links || {})[weekKey];
      if (cardUrl) {
        const q = new URLSearchParams({ client_reference_id: sessionId });
        if (/@/.test(data.email || '')) q.set('prefilled_email', data.email);
        q.set('locale', ({ es: 'es', ca: 'es', en: 'en', fr: 'fr', ru: 'auto', 'zh-Hans': 'zh' })[document.documentElement.lang] || 'auto');
        show('ok', T.card_redirect);
        location.href = cardUrl + '?' + q.toString();
        return;
      }
      track('generate_lead', { currency: 'EUR', value: PRICES[selectedWeek().dataset.key], week: data.week });
      sessionId = null;
      form.reset(); updateTotal(); applyGate(); healthSync();
      show('ok', T.msg_ok);
    } catch (err) {
      show('err', T.msg_err);
    } finally {
      btn.disabled = !accepted(); btn.textContent = T.submit;
    }
  });
}
