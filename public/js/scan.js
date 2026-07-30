const id = location.pathname.split('/').pop();
const box = document.getElementById('content');

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
function block(label, value) {
  return `<div class="block"><div class="label">${label}</div><div class="value">${esc(value)}</div></div>`;
}

function vcardDownload(c) {
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
  const blob = new Blob([lines.join('\n')], { type: 'text/vcard' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = (c.name || 'contact') + '.vcf'; a.click();
}

async function render(code) {
  const c = code.content || {};
  const t = code.title ? `<div class="title">${esc(code.title)}</div>` : '';
  let html = t;
  switch (code.type) {
    case 'url': {
      const u = c.url && !/^https?:\/\//i.test(c.url) ? 'https://' + c.url : (c.url || '');
      html += `<a class="btn" href="${esc(u)}" target="_blank" rel="noopener">打开链接</a>`;
      html += `<div style="text-align:center;margin-top:10px;font-size:13px;color:#8b94a6;word-break:break-all;">${esc(u)}</div>`;
      break;
    }
    case 'text':
      html += `<div class="text-content">${esc(c.text)}</div>`;
      break;
    case 'vcard':
      html += block('姓名', c.name) + block('电话', c.phone) + block('邮箱', c.email)
        + block('公司', c.org) + block('职位', c.title) + block('网址', c.url)
        + block('地址', c.address) + block('备注', c.note);
      html += `<button class="btn" onclick="vcardDownload(${JSON.stringify(c).replace(/"/g, '&quot;')})">保存到通讯录</button>`;
      break;
    case 'wifi':
      html += block('WiFi名称', c.ssid) + block('密码', c.password) + block('加密方式', c.enc);
      html += `<div style="font-size:12px;color:#8b94a6;text-align:center;">请在手机 WiFi 设置中手动输入连接</div>`;
      break;
    case 'tel':
      html += `<a class="btn" href="tel:${esc(c.tel)}">拨打电话 ${esc(c.tel)}</a>`;
      break;
    case 'sms':
      html += block('接收号码', c.tel) + block('内容', c.body);
      html += `<a class="btn" href="SMSTO:${esc(c.tel)}:${encodeURIComponent(c.body || '')}">发送短信</a>`;
      break;
    case 'email':
      html += block('邮箱', c.email) + block('主题', c.subject) + block('正文', c.body);
      html += `<a class="btn" href="mailto:${esc(c.email)}?subject=${encodeURIComponent(c.subject || '')}&body=${encodeURIComponent(c.body || '')}">发送邮件</a>`;
      break;
    default:
      html += `<div class="text-content">${esc(JSON.stringify(c))}</div>`;
  }
  box.innerHTML = html;
}

(async () => {
  try {
    const r = await fetch('/api/codes/' + id);
    if (!r.ok) { box.innerHTML = '<div class="notfound">活码不存在或已删除</div>'; return; }
    const code = await r.json();
    await render(code);
    // 扫描计数（同一会话只计一次）
    if (!sessionStorage.getItem('scanned_' + id)) {
      sessionStorage.setItem('scanned_' + id, '1');
      fetch('/api/codes/' + id + '/scan', { method: 'POST' }).catch(() => {});
    }
  } catch (e) {
    box.innerHTML = '<div class="notfound">加载失败</div>';
  }
})();
