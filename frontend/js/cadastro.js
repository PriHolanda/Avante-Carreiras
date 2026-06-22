
const s = AUTH.getSession();
if (s) window.location.href = s.redirectTo;

function setupToggle(btnId, inputId) {
    document.getElementById(btnId).addEventListener('click', () => {
        const input = document.getElementById(inputId);
        input.type = input.type === 'text' ? 'password' : 'text';
    });
}
setupToggle('toggleSenha', 'senha');
setupToggle('toggleConfirmar', 'confirmarSenha');

document.getElementById('senha').addEventListener('input', function () {
    const v = this.value;
    let score = 0;
    if (v.length >= 8)          score++;
    if (/[A-Z]/.test(v))        score++;
    if (/[0-9]/.test(v))        score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;

    const levels = [
        { pct: '0%',   color: '#eee',    text: '' },
        { pct: '25%',  color: '#B3261E', text: 'Fraca' },
        { pct: '50%',  color: '#E87D2B', text: 'Razoável' },
        { pct: '75%',  color: '#EAB308', text: 'Boa' },
        { pct: '100%', color: '#1a6e3a', text: 'Forte' },
    ];
    const lvl   = v.length === 0 ? levels[0] : (levels[score] || levels[1]);
    const fill  = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    fill.style.width           = lvl.pct;
    fill.style.backgroundColor = lvl.color;
    label.textContent          = lvl.text;
    label.style.color          = lvl.color;
});

// ── Helpers de erro ───────────────────────────────────────────────────────────
function setError(fieldId, msg) {
    const el  = document.getElementById(fieldId);
    const err = document.getElementById('erro-' + fieldId);
    if (el)  el.classList.add('input-error');
    if (err) { err.textContent = msg; err.classList.add('visible'); }
}

function clearError(fieldId) {
    const el  = document.getElementById(fieldId);
    const err = document.getElementById('erro-' + fieldId);
    if (el)  el.classList.remove('input-error');
    if (err) err.classList.remove('visible');
}

function clearAll() {
    ['nome', 'email', 'setor', 'nascimento', 'senha', 'confirmar'].forEach(clearError);
}

['nome', 'email', 'senha'].forEach(id =>
    document.getElementById(id).addEventListener('input', () => clearError(id))
);
document.getElementById('setor').addEventListener('change', () => clearError('setor'));
document.getElementById('nascimento').addEventListener('change', () => clearError('nascimento'));
document.getElementById('confirmarSenha').addEventListener('input', () => clearError('confirmar'));

function validate(nome, email, setor, nascimento, senha, confirmar) {
    let ok = true;
    if (!nome.trim() || nome.trim().split(' ').length < 2) {
        setError('nome', 'Informe nome e sobrenome.'); ok = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('email', 'E-mail inválido.'); ok = false;
    }
    if (!setor) {
        setError('setor', 'Selecione um setor.'); ok = false;
    }
    if (!nascimento) {
        setError('nascimento', 'Informe a data de nascimento.'); ok = false;
    } else {
        const hoje = new Date();
        const nasc = new Date(nascimento);
        const idade = hoje.getFullYear() - nasc.getFullYear();
        if (nasc > hoje) {
            setError('nascimento', 'Data inválida.'); ok = false;
        } else if (idade < 14) {
            setError('nascimento', 'Idade mínima de 14 anos.'); ok = false;
        }
    }
    if (senha.length < 8) {
        setError('senha', 'Mínimo 8 caracteres.'); ok = false;
    }
    if (senha !== confirmar) {
        setError('confirmar', 'As senhas não coincidem.'); ok = false;
    }
    return ok;
}

document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAll();

    const nome      = document.getElementById('nome').value;
    const email     = document.getElementById('email').value.trim().toLowerCase();
    const setor     = document.getElementById('setor').value;
    const nascimento = document.getElementById('nascimento').value;
    const senha     = document.getElementById('senha').value;
    const confirmar = document.getElementById('confirmarSenha').value;

    if (!validate(nome, email, setor, nascimento, senha, confirmar)) return;

    const btn = document.getElementById('btnCadastro');
    btn.disabled = true;
    btn.classList.add('loading');
    btn.textContent = '';

    await new Promise(r => setTimeout(r, 700));

    const result = await AUTH.register({ nome, email, senha, setor, nascimento });

    if (!result.ok) {
        btn.disabled = false;
        btn.classList.remove('loading');
        btn.textContent = 'Criar conta';
        setError('email', result.error);
        return;
    }

    btn.textContent       = '✓ Conta criada!';
    btn.style.background  = '#1a6e3a';
    btn.style.borderColor = '#1a6e3a';
    document.getElementById('toast').classList.add('show');

    await new Promise(r => setTimeout(r, 1800));
    window.location.href = 'login.html';
});