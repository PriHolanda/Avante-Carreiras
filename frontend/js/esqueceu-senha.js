const form = document.getElementById('recuperarForm');
const emailInput = document.getElementById('emailRecuperacao');
const subtitle = document.getElementById('recuperarSubtitle');
const emailGroup = document.getElementById('emailGroup');
const codigoBox = document.getElementById('codigoBox');
const resetFields = document.getElementById('resetFields');
const codigoInput = document.getElementById('codigoVerificacao');
const novaSenhaInput = document.getElementById('novaSenha');
const confirmarNovaSenhaInput = document.getElementById('confirmarNovaSenha');
const btn = document.getElementById('btnEnviar');
const toast = document.getElementById('toast');
let step = 'email';

function setError(input, message) {
    const error = document.getElementById('erro-' + input.id);
    input.classList.add('input-error');
    error.textContent = message;
    error.classList.add('visible');
}

function clearError(input) {
    const error = document.getElementById('erro-' + input.id);
    input.classList.remove('input-error');
    error.textContent = '';
    error.classList.remove('visible');
}

function clearAllErrors() {
    [emailInput, codigoInput, novaSenhaInput, confirmarNovaSenhaInput].forEach(clearError);
}

function showPasswordStep() {
    step = 'password';
    emailInput.disabled = true;
    emailGroup.classList.add('email-locked');
    codigoBox.classList.add('visible');
    resetFields.classList.add('visible');
    subtitle.textContent = 'Digite o c\u00f3digo recebido por e-mail e cadastre uma nova senha.';
    btn.textContent = 'Cadastrar nova senha';
    codigoInput.focus();
}

emailInput.addEventListener('input', () => clearError(emailInput));
codigoInput.addEventListener('input', () => clearError(codigoInput));
novaSenhaInput.addEventListener('input', () => clearError(novaSenhaInput));
confirmarNovaSenhaInput.addEventListener('input', () => clearError(confirmarNovaSenhaInput));

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAllErrors();

    const email = emailInput.value.trim();
    if (!email) {
        setError(emailInput, 'Informe seu e-mail.');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError(emailInput, 'Digite um e-mail v\u00e1lido.');
        return;
    }

    if (step === 'password') {
        const codigo = codigoInput.value.trim();
        const novaSenha = novaSenhaInput.value;
        const confirmarNovaSenha = confirmarNovaSenhaInput.value;

        if (!codigo) {
            setError(codigoInput, 'Informe o c\u00f3digo recebido.');
            return;
        }

        if (codigo.length !== 6) {
            setError(codigoInput, 'Digite o c\u00f3digo de 6 d\u00edgitos.');
            return;
        }

        if (novaSenha.length < 8) {
            setError(novaSenhaInput, 'A senha deve ter no m\u00ednimo 8 caracteres.');
            return;
        }

        if (novaSenha !== confirmarNovaSenha) {
            setError(confirmarNovaSenhaInput, 'As senhas n\u00e3o coincidem.');
            return;
        }
    }

    btn.disabled = true;
    btn.classList.add('loading');
    btn.textContent = step === 'email' ? 'Enviando' : 'Salvando';

    const result = step === 'email'
        ? await AUTH.requestPasswordReset(email)
        : await AUTH.resetPassword(email, codigoInput.value.trim(), novaSenhaInput.value);

    btn.classList.remove('loading');
    btn.disabled = false;

    if (!result.ok) {
        setError(step === 'email' ? emailInput : codigoInput, result.error);
        btn.textContent = step === 'email' ? 'Enviar c\u00f3digo' : 'Cadastrar nova senha';
        return;
    }

    if (step === 'email') {
        showPasswordStep();
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Senha cadastrada';
    btn.style.backgroundColor = '#1a6e3a';
    btn.style.borderColor = '#1a6e3a';
    toast.classList.add('show');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1800);
});
