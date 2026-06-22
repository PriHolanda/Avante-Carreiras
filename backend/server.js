require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('./db');
const path    = require('path');
const fs      = require('fs');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = '8h';

function formatarData(val) {
  if (!val) return null;
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [ano, mes, dia] = val.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  const d = new Date(val);
  if (isNaN(d)) return String(val);
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

// ── POST /api/login ──────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha)
    return res.status(400).json({ ok: false, error: 'Dados incompletos.' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    const user = rows[0];
    if (!user)
      return res.status(401).json({ ok: false, error: 'E-mail não encontrado.' });

    const match = await bcrypt.compare(senha, user.senha_hash);
    if (!match)
      return res.status(401).json({ ok: false, error: 'Senha incorreta.' });

    const redirectTo = user.role === 'admin' ? 'membros.html' : 'meuperfil.html';

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      ok: true, token, redirectTo,
      user: {
        id:         user.id,
        nome:       user.nome,
        email:      user.email,
        role:       user.role,
        setor:      user.setor,
        admissao:   formatarData(user.admissao),
        nascimento: formatarData(user.nascimento),
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Erro interno do servidor.' });
  }
});

// ── POST /api/cadastro ───────────────────────────────────────────────────────
app.post('/api/cadastro', async (req, res) => {
  const { nome, email, senha, setor, nascimento } = req.body;
  if (!nome || !email || !senha || !setor)
    return res.status(400).json({ ok: false, error: 'Dados incompletos.' });

  try {
    const existe = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    if (existe.rows.length > 0)
      return res.status(409).json({ ok: false, error: 'Este e-mail já está cadastrado.' });

    const senha_hash = await bcrypt.hash(senha, 12);
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, role, setor, nascimento)
       VALUES ($1, $2, $3, 'membro', $4, $5)
       RETURNING id, nome, email, role, setor, admissao`,
      [nome.trim(), email.toLowerCase().trim(), senha_hash, setor, nascimento || null]
    );
    res.status(201).json({ ok: true, user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Erro interno do servidor.' });
  }
});

// ── Middleware de autenticação JWT ───────────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ ok: false, error: 'Token ausente.' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ ok: false, error: 'Token inválido ou expirado.' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin')
    return res.status(403).json({ ok: false, error: 'Acesso restrito a administradores.' });
  next();
}

app.get('/api/me', authMiddleware, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, nome, email, role, setor, admissao, nascimento FROM usuarios WHERE id = $1',
    [req.user.userId]
  );
  res.json({ ok: true, user: rows[0] });
});

// ── GET /api/usuarios — admin lista todos os membros com status calculado ────
app.get('/api/usuarios', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.id, u.nome, u.email, u.role, u.setor, u.admissao,
        CASE WHEN COUNT(d.id) > 0 THEN 'regular' ELSE 'pendente' END AS status
      FROM usuarios u
      LEFT JOIN documentos d ON d.usuario_id = u.id
      GROUP BY u.id, u.nome, u.email, u.role, u.setor, u.admissao
      ORDER BY u.nome ASC
    `);
    const usuarios = rows.map(u => ({ ...u, admissao: formatarData(u.admissao) }));
    res.json({ ok: true, usuarios });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Erro ao buscar usuários.' });
  }
});

// ── GET /api/usuarios/:id — admin vê qualquer um, membro só vê o próprio ─────
app.get('/api/usuarios/:id', authMiddleware, async (req, res) => {
  const targetId = Number(req.params.id);
  if (req.user.role !== 'admin' && req.user.userId !== targetId)
    return res.status(403).json({ ok: false, error: 'Acesso negado.' });

  try {
    const { rows } = await pool.query(
      'SELECT id, nome, email, role, setor, admissao, nascimento FROM usuarios WHERE id = $1',
      [targetId]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, error: 'Usuário não encontrado.' });

    const user = rows[0];
    res.json({
      ok: true,
      user: { ...user, admissao: formatarData(user.admissao), nascimento: formatarData(user.nascimento) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Erro ao buscar usuário.' });
  }
});

// ── Upload de documentos ─────────────────────────────────────────────────────
const multer = require('multer');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext        = path.extname(file.originalname).toLowerCase();
    const unique     = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    // Usa o usuário ALVO do upload (pode ser o admin enviando para outro membro)
    const targetId = req.body.usuarioId || req.user.userId;
    cb(null, `doc-${targetId}-${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Apenas arquivos PDF são permitidos.'));
  }
});

// POST /api/documentos/upload
// Body pode incluir 'usuarioId' — só admin pode enviar para outro usuário.
// Se 'usuarioId' não vier, o documento é vinculado ao próprio usuário logado.
app.post('/api/documentos/upload', authMiddleware, (req, res) => {
  upload.single('arquivo')(req, res, async (err) => {
    if (err) return res.status(400).json({ ok: false, error: err.message });
    if (!req.file) return res.status(400).json({ ok: false, error: 'Nenhum arquivo enviado.' });

    const { tipo = 'voluntariado', usuarioId } = req.body;
    const targetId = usuarioId ? Number(usuarioId) : req.user.userId;

    // Só admin pode enviar documento em nome de outro usuário
    if (targetId !== req.user.userId && req.user.role !== 'admin') {
      fs.unlink(req.file.path, () => {});
      return res.status(403).json({ ok: false, error: 'Acesso negado.' });
    }

    const tamanho_kb = Math.round(req.file.size / 1024);

    try {
      const { rows } = await pool.query(
        `INSERT INTO documentos (usuario_id, nome_arquivo, nome_original, tipo, status, tamanho_kb)
         VALUES ($1, $2, $3, $4, 'pendente', $5)
         RETURNING id, nome_original, tipo, status, enviado_em`,
        [targetId, req.file.filename, req.file.originalname, tipo, tamanho_kb]
      );
      res.status(201).json({ ok: true, documento: rows[0] });
    } catch (dbErr) {
      console.error(dbErr);
      fs.unlink(req.file.path, () => {});
      res.status(500).json({ ok: false, error: 'Erro ao salvar documento.' });
    }
  });
});

// GET /api/documentos — lista documentos do usuário logado
app.get('/api/documentos', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nome_arquivo, nome_original, tipo, status, tamanho_kb, enviado_em
       FROM documentos WHERE usuario_id = $1 ORDER BY enviado_em DESC`,
      [req.user.userId]
    );
    res.json({ ok: true, documentos: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Erro ao buscar documentos.' });
  }
});

// ── GET /api/documentos/todos — admin lista TODOS os documentos do sistema ───
app.get('/api/documentos/todos', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT d.id, d.nome_original, d.tipo, d.enviado_em,
             u.id AS usuario_id, u.nome AS nome_usuario, u.setor
      FROM documentos d
      JOIN usuarios u ON u.id = d.usuario_id
      ORDER BY d.enviado_em DESC
    `);
    res.json({ ok: true, documentos: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Erro ao buscar documentos.' });
  }
});

// GET /api/documentos/:id/download
app.get('/api/documentos/:id/download', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM documentos WHERE id = $1', [req.params.id]);
    const doc = rows[0];
    if (!doc) return res.status(404).json({ ok: false, error: 'Documento não encontrado.' });
    if (req.user.role !== 'admin' && doc.usuario_id !== req.user.userId)
      return res.status(403).json({ ok: false, error: 'Acesso negado.' });

    const filePath = path.join(uploadsDir, doc.nome_arquivo);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ ok: false, error: 'Arquivo não encontrado no servidor.' });

    res.setHeader('Content-Disposition', `attachment; filename="${doc.nome_original}"`);
    res.setHeader('Content-Type', 'application/pdf');
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Erro ao baixar documento.' });
  }
});

// DELETE /api/documentos/:id — membro deleta o próprio, admin deleta qualquer um
app.delete('/api/documentos/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM documentos WHERE id = $1', [req.params.id]);
    const doc = rows[0];
    if (!doc) return res.status(404).json({ ok: false, error: 'Documento não encontrado.' });
    if (req.user.role !== 'admin' && doc.usuario_id !== req.user.userId)
      return res.status(403).json({ ok: false, error: 'Acesso negado.' });

    await pool.query('DELETE FROM documentos WHERE id = $1', [req.params.id]);

    const filePath = path.join(uploadsDir, doc.nome_arquivo);
    fs.unlink(filePath, () => {});

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Erro ao deletar documento.' });
  }
});

// GET /api/documentos/usuario/:userId — admin lista docs de um usuário específico
app.get('/api/documentos/usuario/:userId', authMiddleware, async (req, res) => {
  const targetId = Number(req.params.userId);
  if (req.user.role !== 'admin' && req.user.userId !== targetId)
    return res.status(403).json({ ok: false, error: 'Acesso negado.' });

  try {
    const { rows } = await pool.query(
      `SELECT d.id, d.nome_arquivo, d.nome_original, d.tipo, d.status, d.tamanho_kb, d.enviado_em,
              u.nome AS nome_usuario
       FROM documentos d JOIN usuarios u ON u.id = d.usuario_id
       WHERE d.usuario_id = $1 ORDER BY d.enviado_em DESC`,
      [targetId]
    );
    res.json({ ok: true, documentos: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Erro ao buscar documentos.' });
  }
});

const { recuperarSenha, redefinirSenha } = require('./redefinir-senha');
app.post('/api/recuperar-senha', recuperarSenha);
app.post('/api/redefinir-senha', redefinirSenha);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () =>
  console.log(`Avante API rodando em http://localhost:${PORT}`)
);
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Erro: porta ${PORT} já está em uso.`);
    process.exit(1);
  }
  throw err;
});