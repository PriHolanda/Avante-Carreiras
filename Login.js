/**
 * Avante Carreiras — Sistema de Autenticação
 * 
 * "Banco de dados" emulado em localStorage.
 * Em produção, substitua as chamadas por fetch() para sua API REST.
 */

const AUTH = (() => {

  // ─── Banco de usuários (simulado) ────────────────────────────────────────
  // Senhas armazenadas como SHA-256 hex.
  // Geradas com: await AUTH.hashPassword("senha")
  // Credenciais de teste:
  //   admin@avante.com  / avante@2024   → role: admin
  //   vitoria@avante.com / membro123    → role: membro
  //   daniel@avante.com  / membro123   → role: membro

  const USERS_DB_KEY = 'avante_users_db';
  const SESSION_KEY  = 'avante_session';

  // Hash SHA-256 via WebCrypto (nativo no browser, sem lib externa)
  async function hashPassword(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Inicializa o "banco" na primeira execução
  async function initDB() {
    if (localStorage.getItem(USERS_DB_KEY)) return;

    const users = [
      {
        id: 1,
        nome: 'Administrador',
        email: 'admin@avante.com',
        passwordHash: await hashPassword('avante@2024'),
        role: 'admin',
        setor: 'Direx',
        admissao: '01/01/2023',
        nascimento: '10/03/1995',
        redirectTo: 'membros.html'
      },
      {
        id: 2,
        nome: 'Vitória Rabelo Santiago',
        email: 'vitoriarabelo@gmail.com',
        passwordHash: await hashPassword('membro123'),
        role: 'membro',
        setor: 'Projetos',
        admissao: '13/04/2026',
        nascimento: '30/05/2005',
        redirectTo: 'perfil.html'
      },
      {
        id: 3,
        nome: 'Daniel Jacó dos Santos Pereira',
        email: 'danieljaco@gmail.com',
        passwordHash: await hashPassword('membro123'),
        role: 'membro',
        setor: 'Projetos',
        admissao: '16/04/2024',
        nascimento: '30/05/2002',
        redirectTo: 'membrocomum.html'
      }
    ];

    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    console.info('[Auth] Banco de usuários inicializado.');
  }

  function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
  }

  // ─── Login ────────────────────────────────────────────────────────────────
  async function login(email, password) {
    await initDB();

    const users = getUsers();
    const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) return { ok: false, error: 'E-mail não encontrado.' };

    const hash = await hashPassword(password);
    if (hash !== user.passwordHash) return { ok: false, error: 'Senha incorreta.' };

    // Cria sessão (token simples; em produção use JWT do servidor)
    const session = {
      userId:   user.id,
      nome:     user.nome,
      email:    user.email,
      role:     user.role,
      setor:    user.setor,
      admissao: user.admissao,
      nascimento: user.nascimento,
      token:    crypto.randomUUID(),
      expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 horas
      redirectTo: user.redirectTo
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, session };
  }

  // ─── Sessão ───────────────────────────────────────────────────────────────
  function getSession() {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
  }

  // ─── Guard: redireciona para login se não autenticado ─────────────────────
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

  // ─── Popula elementos da UI com dados da sessão ───────────────────────────
  function injectUserData(session) {
    document.querySelectorAll('[data-user-nome]').forEach(el => el.textContent = session.nome);
    document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = session.email);
    document.querySelectorAll('[data-user-setor]').forEach(el => el.textContent = session.setor);
    document.querySelectorAll('[data-user-admissao]').forEach(el => el.textContent = session.admissao);
    document.querySelectorAll('[data-user-nascimento]').forEach(el => el.textContent = session.nascimento);
    document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = session.role);

    // Mostra/oculta elementos por role
    document.querySelectorAll('[data-role-only="admin"]').forEach(el => {
      el.style.display = session.role === 'admin' ? '' : 'none';
    });
    document.querySelectorAll('[data-role-only="membro"]').forEach(el => {
      el.style.display = session.role === 'membro' ? '' : 'none';
    });
  }

  return { login, logout, getSession, requireAuth, injectUserData, initDB };
})();
 // Se já tem sessão válida, redireciona direto
        const existingSession = AUTH.getSession();
        if (existingSession) {
            window.location.href = existingSession.redirectTo;
        }

        // Inicializa o banco de usuários na primeira visita
        AUTH.initDB();

        // ─── Helpers ──────────────────────────────────────────────────────────
        function showError(msg) {
            const box = document.getElementById('errorMsg');
            document.getElementById('errorText').textContent = msg;
            box.classList.add('visible');
            document.getElementById('emailInput').classList.add('input-error');
            document.getElementById('passwordInput').classList.add('input-error');
        }

        function clearError() {
            document.getElementById('errorMsg').classList.remove('visible');
            document.getElementById('emailInput').classList.remove('input-error');
            document.getElementById('passwordInput').classList.remove('input-error');
        }

        function fillCredentials(email, pass) {
            document.getElementById('emailInput').value    = email;
            document.getElementById('passwordInput').value = pass;
            clearError();
        }

        // ─── Submit ───────────────────────────────────────────────────────────
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError();

            const email    = document.getElementById('emailInput').value.trim();
            const password = document.getElementById('passwordInput').value;
            const btn      = document.getElementById('btnLogin');

            // Validação básica de campos
            if (!email) { showError('Preencha o e-mail.'); return; }
            if (!password) { showError('Preencha a senha.'); return; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showError('Formato de e-mail inválido.'); return;
            }

            // Estado de carregamento
            btn.classList.add('loading');
            btn.textContent = 'Entrando';

            // Pequeno delay para simular latência de rede (remova em produção)
            await new Promise(r => setTimeout(r, 600));

            const result = await AUTH.login(email, password);

            if (result.ok) {
                // Sucesso — redireciona conforme role
                btn.textContent = '✓ Acesso concedido!';
                btn.style.background = '#1a6e3a';
                await new Promise(r => setTimeout(r, 500));
                window.location.href = result.session.redirectTo;
            } else {
                btn.classList.remove('loading');
                btn.textContent = 'Login';
                showError(result.error);
            }
        });