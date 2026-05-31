/**
 * Avante Carreiras — auth.js
 * Apenas define o módulo AUTH. Não executa nada automaticamente.
 * Inclua em todas as páginas ANTES dos scripts específicos de cada tela.
 */
const DB_VERSION = '1.0';
if (localStorage.getItem('avante_db_version') !== DB_VERSION) {
    localStorage.clear();
    localStorage.setItem('avante_db_version', DB_VERSION);
}
const AUTH = (() => {

  const USERS_DB_KEY = 'avante_users_db';
  const SESSION_KEY  = 'avante_session';

  async function hashPassword(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async function initDB() {
    if (localStorage.getItem(USERS_DB_KEY)) return;
    const users = [
      {
        id: 1, nome: 'Administrador', email: 'admin@avante.com',
        passwordHash: await hashPassword('avante@2024'),
        role: 'admin', setor: 'Direx', admissao: '01/01/2023',
        nascimento: '10/03/1995', redirectTo: 'membros.html'
      },
      {
        id: 2, nome: 'Vitória Rabelo Santiago', email: 'vitoriarabelo@gmail.com',
        passwordHash: await hashPassword('membro123'),
        role: 'membro', setor: 'Projetos', admissao: '13/04/2026',
        nascimento: '30/05/2005', redirectTo: 'perfil.html'
      },
      {
        id: 3, nome: 'Daniel Jacó dos Santos Pereira', email: 'danieljaco@gmail.com',
        passwordHash: await hashPassword('membro123'),
        role: 'membro', setor: 'Projetos', admissao: '16/04/2024',
        nascimento: '30/05/2002', redirectTo: 'membrocomum.html'
      }
    ];
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  }

  function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
  }

  async function login(email, password) {
    await initDB();
    const users = getUsers();
    const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { ok: false, error: 'E-mail não encontrado.' };
    const hash = await hashPassword(password);
    if (hash !== user.passwordHash) return { ok: false, error: 'Senha incorreta.' };
    const session = {
      userId: user.id, nome: user.nome, email: user.email,
      role: user.role, setor: user.setor, admissao: user.admissao,
      nascimento: user.nascimento, token: crypto.randomUUID(),
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
      redirectTo: user.redirectTo
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, session };
  }

  async function register({ nome, email, senha, setor }) {
    await initDB();
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'Este e-mail já está cadastrado.' };
    }
    const newUser = {
      id: users.length + 1, nome: nome.trim(),
      email: email.toLowerCase(),
      passwordHash: await hashPassword(senha),
      role: 'membro', setor, admissao: new Date().toLocaleDateString('pt-BR'),
      nascimento: '', redirectTo: 'membrocomum.html'
    };
    users.push(newUser);
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    return { ok: true, user: newUser };
  }

  // ─── getSession: retorna null se não houver sessão ou se estiver expirada ──
  // NUNCA redireciona. Apenas lê e valida.
  function getSession() {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw);
      if (!session.token || !session.expiresAt || !session.redirectTo) {
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

  // ─── requireAuth: redireciona para login se não autenticado ───────────────
  // Use apenas nas páginas INTERNAS (membros, perfil, etc.), nunca no login.
  function requireAuth(requiredRole) {
    const session = getSession();
    if (!session) {
      window.location.href = 'login.html';
      return null;
    }
    if (requiredRole && session.role !== requiredRole && session.role !== 'admin') {
      window.location.href = 'login.html';
      return null;
    }
    return session;
  }

  function injectUserData(session) {
    document.querySelectorAll('[data-user-nome]').forEach(el => el.textContent = session.nome);
    document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = session.email);
    document.querySelectorAll('[data-user-setor]').forEach(el => el.textContent = session.setor);
    document.querySelectorAll('[data-user-admissao]').forEach(el => el.textContent = session.admissao);
    document.querySelectorAll('[data-user-nascimento]').forEach(el => el.textContent = session.nascimento);
    document.querySelectorAll('[data-role-only="admin"]').forEach(el => {
      el.style.display = session.role === 'admin' ? '' : 'none';
    });
    document.querySelectorAll('[data-role-only="membro"]').forEach(el => {
      el.style.display = session.role === 'membro' ? '' : 'none';
    });
  }

  // ── Nenhum código de redirecionamento aqui! Só exporta funções. ───────────
  return { login, logout, register, getSession, requireAuth, injectUserData, initDB };

})();