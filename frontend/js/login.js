
AUTH.initDB();

const sessaoAtiva = AUTH.getSession();
if (sessaoAtiva) {
    window.location.href = sessaoAtiva.redirectTo;
}

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
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const email    = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const btn      = document.getElementById('btnLogin');

    if (!email)    { showError('Preencha o e-mail.'); return; }
    if (!password) { showError('Preencha a senha.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('Formato de e-mail inválido.'); return;
    }

    btn.classList.add('loading');
    btn.textContent = 'Entrando';

    await new Promise(r => setTimeout(r, 600));

    const result = await AUTH.login(email, password);

    if (result.ok) {
        btn.textContent       = '✓ Acesso concedido!';
        btn.style.background  = '#1a6e3a';
        btn.style.borderColor = '#1a6e3a';
        await new Promise(r => setTimeout(r, 500));
        window.location.href = result.session.redirectTo;
    } else {
        btn.classList.remove('loading');
        btn.textContent = 'Login';
        showError(result.error);
    }
});