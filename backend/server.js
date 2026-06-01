require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('./db');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = '8h';

function formatarData(val) {
  if (!val) return null;
  // Se vier no formato YYYY-MM-DD (string pura do banco), evita conversão de timezone
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [ano, mes, dia] = val.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  // Caso venha como objeto Date ou timestamp ISO completo
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
      ok: true,
      token,
      redirectTo,
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

app.get('/api/me', authMiddleware, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, nome, email, role, setor, admissao, nascimento FROM usuarios WHERE id = $1',
    [req.user.userId]
  );
  res.json({ ok: true, user: rows[0] });
});

app.listen(process.env.PORT, () =>
  console.log(`Avante API rodando em http://localhost:${process.env.PORT}`)
);