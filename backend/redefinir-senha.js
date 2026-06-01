const nodemailer = require('nodemailer');
const bcrypt     = require('bcrypt');
const pool       = require('./db');

const passwordResetCodes = new Map();

function getMailTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS)
    throw new Error('Configurações SMTP ausentes no .env.');

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

async function enviarCodigoRecuperacao(destinatario, codigo) {
  const transporter = getMailTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to: destinatario,
    subject: 'Código de recuperação - Avante Carreiras',
    text: `Seu código de verificação é: ${codigo}. Ele expira em 10 minutos.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #040C34; line-height: 1.5;">
        <h2>Recuperação de senha</h2>
        <p>Use o código abaixo para cadastrar uma nova senha no Avante Carreiras:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #02A9D6;">${codigo}</p>
        <p>Este código expira em 10 minutos.</p>
      </div>
    `
  });
}

// ── POST /api/recuperar-senha ────────────────────────────────────────────────
async function recuperarSenha(req, res) {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ ok: false, error: 'Informe o e-mail.' });

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const { rows } = await pool.query(
      'SELECT id, email FROM usuarios WHERE email = $1',
      [normalizedEmail]
    );

    if (!rows[0])
      return res.status(404).json({ ok: false, error: 'E-mail não encontrado.' });

    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    await enviarCodigoRecuperacao(normalizedEmail, codigo);

    passwordResetCodes.set(normalizedEmail, {
      codigo,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Não foi possível enviar o código por e-mail.' });
  }
}

// ── POST /api/redefinir-senha ────────────────────────────────────────────────
async function redefinirSenha(req, res) {
  const { email, codigo, novaSenha } = req.body;
  if (!email || !codigo || !novaSenha)
    return res.status(400).json({ ok: false, error: 'Dados incompletos.' });

  if (novaSenha.length < 8)
    return res.status(400).json({ ok: false, error: 'A senha deve ter no mínimo 8 caracteres.' });

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const reset = passwordResetCodes.get(normalizedEmail);

    if (!reset)
      return res.status(400).json({ ok: false, error: 'Solicite um novo código.' });

    if (Date.now() > reset.expiresAt) {
      passwordResetCodes.delete(normalizedEmail);
      return res.status(400).json({ ok: false, error: 'Código expirado. Solicite um novo.' });
    }

    if (reset.codigo !== codigo)
      return res.status(400).json({ ok: false, error: 'Código inválido.' });

    const senha_hash = await bcrypt.hash(novaSenha, 12);
    await pool.query(
      'UPDATE usuarios SET senha_hash = $1 WHERE email = $2',
      [senha_hash, normalizedEmail]
    );

    passwordResetCodes.delete(normalizedEmail);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Erro interno do servidor.' });
  }
}

module.exports = { recuperarSenha, redefinirSenha };