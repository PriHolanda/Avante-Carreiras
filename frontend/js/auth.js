/**
 * Avante Carreiras — auth.js (versão API)
 */
const AUTH = (() => {
  const API_BASE    = 'http://localhost:3000/api';
  const SESSION_KEY = 'avante_session';

  function initDB() {}

  async function login(email, password) {
    try {
      const res  = await fetch(`${API_BASE}/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, senha: password })
      });
      const data = await res.json();
      if (!data.ok) return { ok: false, error: data.error };

      const session = {
        userId:     data.user.id,
        nome:       data.user.nome,
        email:      data.user.email,
        role:       data.user.role,
        setor:      data.user.setor,
        admissao:   data.user.admissao,
        nascimento: data.user.nascimento,
        redirectTo: data.redirectTo,
        token:      data.token,
        expiresAt:  Date.now() + 8 * 60 * 60 * 1000
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { ok: true, session };
    } catch (e) {
      return { ok: false, error: 'Não foi possível conectar ao servidor.' };
    }
  }

  async function register({ nome, email, senha, setor, nascimento }) {
    try {
      const res  = await fetch(`${API_BASE}/cadastro`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nome, email, senha, setor, nascimento })
      });
      const data = await res.json();
      return data.ok ? { ok: true } : { ok: false, error: data.error };
    } catch {
      return { ok: false, error: 'Não foi possível conectar ao servidor.' };
    }
  }

  async function requestPasswordReset(email) {
    try {
      const res = await fetch(`${API_BASE}/recuperar-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      return data.ok ? { ok: true } : { ok: false, error: data.error };
    } catch {
      return { ok: false, error: 'N\u00e3o foi poss\u00edvel conectar ao servidor.' };
    }
  }

  async function resetPassword(email, codigo, novaSenha) {
    try {
      const res = await fetch(`${API_BASE}/redefinir-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo, novaSenha })
      });
      const data = await res.json();
      return data.ok ? { ok: true } : { ok: false, error: data.error };
    } catch {
      return { ok: false, error: 'N\u00e3o foi poss\u00edvel conectar ao servidor.' };
    }
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      // Valida apenas os campos essenciais
      if (!session.token || !session.expiresAt || !session.redirectTo || !session.role) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
  }

  function requireAuth(requiredRole) {
    const session = getSession();
    if (!session) {
      window.location.href = 'login.html';
      return null;
    }
    if (requiredRole && session.role !== requiredRole && session.role !== 'admin') {
      window.location.href = 'meuperfil.html';
      return null;
    }
    return session;
  }

  function injectUserData(session) {
    document.querySelectorAll('[data-user-nome]').forEach(el => el.textContent = session.nome ?? '—');
    document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = session.email ?? '—');
    document.querySelectorAll('[data-user-setor]').forEach(el => el.textContent = session.setor ?? '—');
    document.querySelectorAll('[data-user-admissao]').forEach(el => el.textContent = session.admissao ?? '—');
    document.querySelectorAll('[data-user-nascimento]').forEach(el => el.textContent = session.nascimento ?? '—');
    document.querySelectorAll('[data-role-only="admin"]').forEach(el => {
      el.style.display = session.role === 'admin' ? '' : 'none';
    });
    document.querySelectorAll('[data-role-only="membro"]').forEach(el => {
      el.style.display = session.role === 'membro' ? '' : 'none';
    });
  }

  return { login, logout, register, requestPasswordReset, resetPassword, getSession, requireAuth, injectUserData, initDB };
})();
