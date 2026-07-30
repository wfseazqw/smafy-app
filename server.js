const express = require('express');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'codes.json');

app.use(express.json({ limit: '6mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 初始化数据存储
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');

function loadCodes() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}
function saveCodes(codes) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(codes, null, 2));
}

// 二维码生成：服务端用 node-qrcode 出 PNG(dataURL) + SVG
app.post('/api/qrcode', async (req, res) => {
  try {
    const { text, options } = req.body;
    if (!text || !String(text).trim()) return res.status(400).json({ error: '内容不能为空' });
    const opts = {
      errorCorrectionLevel: (options && options.ecc) || 'M',
      margin: options && options.margin != null ? options.margin : 2,
      width: (options && options.width) || 400,
      color: {
        dark: (options && options.dark) || '#000000',
        light: (options && options.light) || '#ffffff'
      }
    };
    const png = await QRCode.toDataURL(text, opts);
    const svg = await QRCode.toString(text, { ...opts, type: 'svg' });
    res.json({ png, svg });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 活码 CRUD
app.get('/api/codes', (req, res) => {
  const codes = loadCodes().sort((a, b) => b.createdAt - a.createdAt);
  res.json(codes);
});

app.post('/api/codes', (req, res) => {
  const codes = loadCodes();
  const id = crypto.randomBytes(5).toString('hex');
  const now = Date.now();
  const code = {
    id,
    title: req.body.title || '未命名活码',
    type: req.body.type || 'text',
    content: req.body.content || {},
    scans: 0,
    createdAt: now,
    updatedAt: now
  };
  codes.push(code);
  saveCodes(codes);
  res.json(code);
});

app.get('/api/codes/:id', (req, res) => {
  const code = loadCodes().find(c => c.id === req.params.id);
  if (!code) return res.status(404).json({ error: '活码不存在' });
  res.json(code);
});

app.put('/api/codes/:id', (req, res) => {
  const codes = loadCodes();
  const i = codes.findIndex(c => c.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: '活码不存在' });
  codes[i] = {
    ...codes[i],
    title: req.body.title != null ? req.body.title : codes[i].title,
    type: req.body.type != null ? req.body.type : codes[i].type,
    content: req.body.content != null ? req.body.content : codes[i].content,
    updatedAt: Date.now()
  };
  saveCodes(codes);
  res.json(codes[i]);
});

app.delete('/api/codes/:id', (req, res) => {
  let codes = loadCodes();
  const before = codes.length;
  codes = codes.filter(c => c.id !== req.params.id);
  if (codes.length === before) return res.status(404).json({ error: '活码不存在' });
  saveCodes(codes);
  res.json({ ok: true });
});

// 扫描计数（防刷新重复计：前端用 sessionStorage 控制）
app.post('/api/codes/:id/scan', (req, res) => {
  const codes = loadCodes();
  const c = codes.find(c => c.id === req.params.id);
  if (!c) return res.status(404).json({ error: '活码不存在' });
  c.scans = (c.scans || 0) + 1;
  saveCodes(codes);
  res.json({ scans: c.scans });
});

// 扫码落地页
app.get('/c/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'scan.html'));
});

app.listen(PORT, () => {
  console.log(`\n  上码FY 已启动 ▶  http://localhost:${PORT}\n`);
});
