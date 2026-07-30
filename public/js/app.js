const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ---------- å†…å®¹ç±»åž‹å®šä¹‰ ----------
const TYPES = [
  { id: 'text',   name: 'æ–‡æœ¬' },
  { id: 'url',    name: 'ç½‘å€' },
  { id: 'vcard',  name: 'åç‰‡' },
  { id: 'wifi',   name: 'WiFi' },
  { id: 'tel',    name: 'ç”µè¯' },
  { id: 'sms',    name: 'çŸ­ä¿¡' },
  { id: 'email',  name: 'é‚®ä»¶' },
];

const FIELDS = {
  text:  [{ k: 'text', label: 'æ–‡æœ¬å†…å®¹', type: 'textarea', ph: 'è¾“å…¥è¦ç”Ÿæˆçš„æ–‡å­—â€¦' }],
  url:   [{ k: 'url', label: 'ç½‘å€é“¾æŽ¥', type: 'text', ph: 'https://example.com' }],
  tel:   [{ k: 'tel', label: 'ç”µè¯å·ç ', type: 'text', ph: '13800138000' }],
  sms:   [{ k: 'tel', label: 'æŽ¥æ”¶å·ç ', type: 'text' }, { k: 'body', label: 'çŸ­ä¿¡å†…å®¹', type: 'textarea' }],
  email: [{ k: 'email', label: 'é‚®ç®±åœ°å€', type: 'text' }, { k: 'subject', label: 'ä¸»é¢˜', type: 'text' }, { k: 'body', label: 'æ­£æ–‡', type: 'textarea' }],
  vcard: [
    { k: 'name', label: 'å§“å' }, { k: 'phone', label: 'ç”µè¯' }, { k: 'email', label: 'é‚®ç®±' },
    { k: 'org', label: 'å…¬å¸/ç»„ç»‡' }, { k: 'title', label: 'èŒä½' }, { k: 'url', label: 'ç½‘å€' },
    { k: 'address', label: 'åœ°å€' }, { k: 'note', label: 'å¤‡æ³¨', type: 'textarea' }
  ],
  wifi: [
    { k: 'ssid', label: 'WiFiåç§°(SSID)' }, { k: 'password', label: 'å¯†ç ', type: 'text' },
    { k: 'enc', label: 'åŠ å¯†æ–¹å¼', type: 'select', options: ['WPA', 'WEP', 'nopass'] },
    { k: 'hidden', label: 'éšè—ç½‘ç»œ', type: 'checkbox' }
  ],
};

// ---------- è¯»å–è¡¨å• / ç¼–ç å†…å®¹ ----------
function getContent(prefix, type) {
  const c = {};
  (FIELDS[type] || []).forEach(f => {
    const el = document.getElementById(prefix + '-' + f.k);
    if (!el) return;
    c[f.k] = f.type === 'checkbox' ? el.checked : el.value;
  });
  return c;
}

function esc(s) { return String(s == null ? '' : s).replace(/([\\;,:"])/g, '\\$1'); }

function buildText(type, c) {
  switch (type) {
    case 'text': return (c.text || '').trim();
    case 'url': {
      let u = (c.url || '').trim();
      if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
      return u;
    }
    case 'tel': return 'tel:' + (c.tel || '').trim();
    case 'sms': return 'SMSTO:' + (c.tel || '') + ':' + (c.body || '');
    case 'email': {
      const e = (c.email || '').trim();
      const params = [];
      if (c.subject) params.push('subject=' + encodeURIComponent(c.subject));
      if (c.body) params.push('body=' + encodeURIComponent(c.body));
      return 'mailto:' + e + (params.length ? '?' + params.join('&') : '');
    }
    case 'wifi': {
      const enc = c.enc === 'nopass' ? 'nopass' : (c.enc || 'WPA');
      let s = 'WIFI:T:' + enc + ';S:' + esc(c.ssid) + ';';
      if (enc !== 'nopass') s += 'P:' + esc(c.password) + ';';
      if (c.hidden) s += 'H:true;';
      return s + ';';
    }
    case 'vcard': {
      const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
      if (c.name) lines.push('N:' + c.name, 'FN:' + c.name);
      if (c.org) lines.push('ORG:' + c.org);
      if (c.title) lines.push('TITLE:' + c.title);
      if (c.phone) lines.push('TEL;TYPE=CELL:' + c.phone);
      if (c.email) lines.push('EMAIL:' + c.email);
      if (c.url) lines.push('URL:' + c.url);
      if (c.address) lines.push('ADR:;;' + c.address + ';;;;');
      if (c.note) lines.push('NOTE:' + c.note);
      lines.push('END:VCARD');
      return lines.join('\n');
    }
    default: return '';
  }
}

// ---------- ç¾ŽåŒ–çŠ¶æ€ ----------
function beautifyFrom(prefix) {
  return {
    ecc: $('#' + prefix + '-ecc').value,
    margin: +$('#' + prefix + '-margin').value,
    width: +$('#' + prefix + '-width').value,
    dark: $('#' + prefix + '-dark').value,
    light: $('#' + prefix + '-light').value,
    logo: logoCache[prefix] || null,
  };
}

const logoCache = { s: null, d: null };

// ---------- æ¸²æŸ“è¡¨å•å­—æ®µ ----------
function renderFields(containerId, prefix, type) {
  const box = $('#' + containerId);
  box.innerHTML = '';
  (FIELDS[type] || []).forEach(f => {
    const wrap = document.createElement('div');
    wrap.className = 'field' + (f.type === 'checkbox' ? ' checkbox' : '');
    const id = prefix + '-' + f.k;
    if (f.type === 'checkbox') {
      wrap.innerHTML = `<input type="checkbox" id="${id}"><label for="${id}">${f.label}</label>`;
    } else {
      const lbl = `<label for="${id}">${f.label}</label>`;
      const ctrl = f.type === 'textarea'
        ? `<textarea id="${id}" placeholder="${f.ph || ''}"></textarea>`
        : f.type === 'select'
          ? `<select id="${id}">${f.options.map(o => `<option>${o}</option>`).join('')}</select>`
          : `<input type="text" id="${id}" placeholder="${f.ph || ''}">`;
      wrap.innerHTML = lbl + ctrl;
    }
    box.appendChild(wrap);
  });
}

// ---------- ç”ŸæˆäºŒç»´ç ï¼ˆæœåŠ¡ç«¯ï¼‰ ----------
async function genQR(text, opts) {
  const r = await fetch('/api/qrcode', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, options: opts })
  });
  if (!r.ok) throw new Error((await r.json()).error || 'ç”Ÿæˆå¤±è´¥');
  return r.json();
}

// æŠŠ PNG dataURL ç”»åˆ° canvasï¼Œå åŠ  logo
function drawWithLogo(canvas, pngDataUrl, logoDataUrl, cb) {
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    if (logoDataUrl) {
      const logo = new Image();
      logo.onload = () => {
        const size = canvas.width * 0.22;
        const x = (canvas.width - size) / 2, y = (canvas.height - size) / 2;
        const pad = size * 0.12, r = size * 0.18;
        ctx.fillStyle = '#fff';
        roundRect(ctx, x - pad, y - pad, size + pad * 2, size + pad * 2, r);
        ctx.fill();
        ctx.drawImage(logo, x, y, size, size);
        cb && cb();
      };
      logo.onerror = () => cb && cb();
      logo.src = logoDataUrl;
    } else cb && cb();
  };
  img.src = pngDataUrl;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function downloadDataUrl(url, name) {
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
}

// ---------- é™æ€ç é€»è¾‘ ----------
let sType = 'text', sSvg = '';
function buildTypeTabs(containerId, onPick) {
  const box = $('#' + containerId);
  box.innerHTML = '';
  TYPES.forEach(t => {
    const b = document.createElement('button');
    b.textContent = t.name; b.dataset.type = t.id;
    if (t.id === (containerId === 'static-types' ? sType : dType)) b.classList.add('active');
    b.onclick = () => {
      $$('#' + containerId + ' button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      onPick(t.id);
    };
    box.appendChild(b);
  });
}
async function renderStatic() {
  const text = buildText(sType, getContent('s', sType));
  const hint = $('#static-hint');
  if (!text) { hint.textContent = 'è¯·è¾“å…¥å†…å®¹'; return; }
  try {
    const { png, svg } = await genQR(text, beautifyFrom('s'));
    sSvg = svg;
    drawWithLogo($('#static-canvas'), png, logoCache.s);
    hint.textContent = 'å·²ç”Ÿæˆ Â· æ‰«ç å³æ˜¾ç¤ºå†…å®¹';
  } catch (e) { hint.textContent = 'ç”Ÿæˆå¤±è´¥ï¼š' + e.message; }
}

// ---------- æ´»ç é€»è¾‘ ----------
let dType = 'text', editingId = null, dSvg = '';
async function renderDynamic() {
  if (!editingId) return;
  const url = location.origin + '/c/' + editingId;
  const { png, svg } = await genQR(url, beautifyFrom('d'));
  dSvg = svg;
  drawWithLogo($('#dynamic-canvas'), png, logoCache.d);
}

async function loadCodes() {
  const r = await fetch('/api/codes');
  const codes = await r.json();
  const box = $('#code-list');
  if (!codes.length) { box.innerHTML = '<p class="empty">è¿˜æ²¡æœ‰æ´»ç ï¼Œå·¦ä¾§åˆ›å»ºä¸€ä¸ªå§ï½ž</p>'; return; }
  box.innerHTML = '';
  for (const c of codes) {
    const item = document.createElement('div');
    item.className = 'code-item';
    const url = location.origin + '/c/' + c.id;
    const { png } = await genQR(url, { ecc: 'M', margin: 1, width: 128, dark: '#000', light: '#fff' });
    const date = new Date(c.createdAt).toLocaleDateString();
    item.innerHTML = `
      <img src="${png}">
      <div class="info">
        <div class="t">${escapeHtml(c.title)}</div>
        <div class="meta">ç±»åž‹ï¼š${typeName(c.type)} Â· æ‰«æ ${c.scans} æ¬¡ Â· ${date}</div>
      </div>
      <div class="ops">
        <button data-act="edit">ç¼–è¾‘</button>
        <button data-act="view" data-link="${url}">æ‰«ç é¡µ</button>
        <button data-act="del">åˆ é™¤</button>
      </div>`;
    item.querySelector('[data-act=edit]').onclick = () => editCode(c);
    item.querySelector('[data-act=view]').onclick = (e) => window.open(e.target.dataset.link, '_blank');
    item.querySelector('[data-act=del]').onclick = () => delCode(c.id);
    box.appendChild(item);
  }
}
function typeName(t) { return (TYPES.find(x => x.id === t) || { name: t }).name; }
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }

function editCode(c) {
  editingId = c.id;
  $('#d-title').value = c.title;
  dType = c.type;
  $$('#dynamic-types button').forEach(b => b.classList.toggle('active', b.dataset.type === c.type));
  renderFields('dynamic-fields', 'd', c.type);
  // å›žå¡«å­—æ®µ
  Object.entries(c.content).forEach(([k, v]) => {
    const el = document.getElementById('d-' + k);
    if (el) el.type === 'checkbox' ? el.checked = !!v : el.value = v;
  });
  renderDynamic();
  $('#d-result').classList.remove('hidden');
  $('#d-link').value = location.origin + '/c/' + c.id;
  $('#d-open').href = $('#d-link').value;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function delCode(id) {
  if (!confirm('ç¡®å®šåˆ é™¤è¿™ä¸ªæ´»ç ï¼Ÿ')) return;
  await fetch('/api/codes/' + id, { method: 'DELETE' });
  if (editingId === id) resetDynamic();
  loadCodes();
}

function resetDynamic() {
  editingId = null; dType = 'text';
  $('#d-title').value = '';
  $$('#dynamic-types button').forEach(b => b.classList.toggle('active', b.dataset.type === 'text'));
  renderFields('dynamic-fields', 'd', 'text');
  $('#d-result').classList.add('hidden');
}

// ---------- æ‰¹é‡ç”Ÿç  ----------
async function batchGen() {
  const raw = $('#batch-text').value.trim();
  const grid = $('#batch-grid'); grid.innerHTML = '';
  if (!raw) return;
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let label = line, content = line;
    if (line.includes('|')) { const p = line.split('|'); label = p[0].trim() || p[1]; content = p.slice(1).join('|').trim() || p[0]; }
    const card = document.createElement('div');
    card.className = 'batch-card';
    card.innerHTML = `<img alt=""><div class="cap">${escapeHtml(label)}</div><button class="dl">ä¸‹è½½PNG</button>`;
    grid.appendChild(card);
    try {
      const { png } = await genQR(content, { ecc: 'M', margin: 2, width: 260 });
      card.querySelector('img').src = png;
      card.querySelector('.dl').onclick = () => downloadDataUrl(png, label + '.png');
    } catch (e) { card.querySelector('.cap').textContent = 'ç”Ÿæˆå¤±è´¥'; }
  }
}

// ---------- äº‹ä»¶ç»‘å®š ----------
function init() {
  // tabs
  $$('.tab').forEach(t => t.onclick = () => {
    $$('.tab').forEach(x => x.classList.remove('active'));
    $$('.panel').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    $('#tab-' + t.dataset.tab).classList.add('active');
    if (t.dataset.tab === 'dynamic') loadCodes();
  });

  // é™æ€
  buildTypeTabs('static-types', t => { sType = t; renderFields('static-fields', 's', t); renderStatic(); });
  renderFields('static-fields', 's', 'text');
  $('#static-fields').addEventListener('input', renderStatic);
  ['s-dark', 's-light', 's-ecc', 's-width', 's-margin'].forEach(id => $('#' + id).addEventListener('input', renderStatic));
  $('#s-logo').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader(); rd.onload = () => { logoCache.s = rd.result; renderStatic(); }; rd.readAsDataURL(f);
  });
  $('#static-png').onclick = () => $('#static-canvas').toBlob(b => downloadDataUrl(URL.createObjectURL(b), 'qrcode.png'));
  $('#static-svg').onclick = () => downloadDataUrl('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sSvg), 'qrcode.svg');
  $('#static-copy').onclick = () => {
    const canvas = $('#static-canvas');
    canvas.toBlob(b => {
      navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]).then(() => alert('已复制图片')).catch(() => alert('复制失败，请手动下载'));
    });
  };

  // æ´»ç 
  buildTypeTabs('dynamic-types', t => { dType = t; renderFields('dynamic-fields', 'd', t); });
  renderFields('dynamic-fields', 'd', 'text');
  $('#dynamic-fields').addEventListener('input', () => { if (editingId) renderDynamic(); });
  ['d-dark', 'd-light', 'd-ecc', 'd-width', 'd-margin'].forEach(id => $('#' + id).addEventListener('input', () => { if (editingId) renderDynamic(); }));
  $('#d-logo').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader(); rd.onload = () => { logoCache.d = rd.result; if (editingId) renderDynamic(); }; rd.readAsDataURL(f);
  });
  $('#d-save').onclick = async () => {
    const title = $('#d-title').value.trim() || 'æœªå‘½åæ´»ç ';
    const content = getContent('d', dType);
    if (!buildText(dType, content)) { alert('è¯·å…ˆå¡«å†™å†…å®¹'); return; }
    try {
      let code;
      if (editingId) {
        const r = await fetch('/api/codes/' + editingId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, type: dType, content }) });
        code = await r.json();
      } else {
        const r = await fetch('/api/codes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, type: dType, content }) });
        code = await r.json();
        editingId = code.id;
      }
      $('#d-result').classList.remove('hidden');
      $('#d-link').value = location.origin + '/c/' + code.id;
      $('#d-open').href = $('#d-link').value;
      await renderDynamic();
      loadCodes();
      alert(editingId ? 'å·²ä¿å­˜æ›´æ–°' : 'æ´»ç å·²åˆ›å»º');
    } catch (e) { alert('ä¿å­˜å¤±è´¥ï¼š' + e.message); }
  };
  $('#d-reset').onclick = resetDynamic;
  $('#d-copy-link').onclick = () => { navigator.clipboard.writeText($('#d-link').value); alert('é“¾æŽ¥å·²å¤åˆ¶'); };

  // æ‰¹é‡
  $('#batch-gen').onclick = batchGen;
  $('#batch-clear').onclick = () => { $('#batch-text').value = ''; $('#batch-grid').innerHTML = ''; };

  // é¦–æ¬¡æ¸²æŸ“
  renderStatic();
}
document.addEventListener('DOMContentLoaded', init);
