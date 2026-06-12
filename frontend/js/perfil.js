const session = NAV.init();

if (session) {
    // ── Avatar ────────────────────────────────────────────────────────────────
    document.getElementById('avatarPerfil').textContent =
        session.nome.trim().charAt(0).toUpperCase();

    // ── Badge de cargo ────────────────────────────────────────────────────────
    const badge = document.getElementById('roleBadge');
    badge.textContent = session.role === 'admin' ? 'Administrador' : 'Membro';
    badge.classList.add(session.role === 'admin' ? 'badge-admin' : 'badge-membro');

    // ── Carrega documentos do banco ───────────────────────────────────────────
    carregarDocumentos();

    // ── Upload ────────────────────────────────────────────────────────────────
    const dropzone    = document.getElementById('uploadDropzone');
    const input       = document.getElementById('uploadInput');
    const preview     = document.getElementById('uploadPreview');
    const previewNome = document.getElementById('uploadPreviewNome');
    const remover     = document.getElementById('uploadRemover');
    const btnUpload   = document.getElementById('btnUpload');
    const feedback    = document.getElementById('uploadFeedback');

    let arquivoSelecionado = null;

    dropzone.addEventListener('click', () => input.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) selecionarArquivo(file);
    });

    input.addEventListener('change', () => {
        if (input.files[0]) selecionarArquivo(input.files[0]);
    });

    remover.addEventListener('click', () => limparSelecao());

    btnUpload.addEventListener('click', async () => {
        if (!arquivoSelecionado) return;
        setFeedback('', '');
        btnUpload.disabled = true;
        btnUpload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

        const tipo = document.getElementById('uploadTipo').value;
        const formData = new FormData();
        formData.append('arquivo', arquivoSelecionado);
        formData.append('tipo', tipo);

        try {
            const res  = await fetch('http://localhost:3000/api/documentos/upload', {
                method:  'POST',
                headers: { 'Authorization': `Bearer ${session.token}` },
                body:    formData
            });
            const data = await res.json();

            if (!data.ok) {
                setFeedback(data.error, 'erro');
                btnUpload.disabled = false;
                btnUpload.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Enviar documento';
                return;
            }

            setFeedback('Documento enviado com sucesso!', 'sucesso');
            limparSelecao();
            btnUpload.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Enviar documento';
            carregarDocumentos();
        } catch {
            setFeedback('Não foi possível conectar ao servidor.', 'erro');
            btnUpload.disabled = false;
            btnUpload.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Enviar documento';
        }
    });

    function selecionarArquivo(file) {
        if (file.type !== 'application/pdf') {
            setFeedback('Apenas arquivos PDF são permitidos.', 'erro');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setFeedback('O arquivo deve ter no máximo 10 MB.', 'erro');
            return;
        }
        arquivoSelecionado      = file;
        previewNome.textContent = file.name;
        dropzone.style.display  = 'none';
        preview.style.display   = 'flex';
        btnUpload.disabled      = false;
        setFeedback('', '');
    }

    function limparSelecao() {
        arquivoSelecionado    = null;
        input.value           = '';
        dropzone.style.display = '';
        preview.style.display  = 'none';
        btnUpload.disabled     = true;
    }

    function setFeedback(msg, tipo) {
        feedback.textContent = msg;
        feedback.className   = 'upload-feedback' + (tipo ? ` feedback-${tipo}` : '');
    }
}

// ── Busca documentos reais do banco ──────────────────────────────────────────
async function carregarDocumentos() {
    const tbody = document.getElementById('tabelaDocumentos');
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#888;padding:24px 0;">Carregando...</td></tr>`;

    try {
        const res  = await fetch('http://localhost:3000/api/documentos', {
            headers: { 'Authorization': `Bearer ${session.token}` }
        });
        const data = await res.json();

        if (!data.ok || data.documentos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#888;padding:24px 0;">Nenhum documento encontrado.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.documentos.map(d => `
            <tr>
                <td>${d.nome_original}</td>
                <td>${formatarData(d.enviado_em)}</td>
                <td style="text-align:right">
                    <button class="btn-download" onclick="baixarDocumento(${d.id}, '${d.nome_original.replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-download"></i> Baixar
                    </button>
                </td>
            </tr>
        `).join('');
    } catch {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#B3261E;padding:24px 0;">Erro ao carregar documentos.</td></tr>`;
    }
}

// ── Download ──────────────────────────────────────────────────────────────────
async function baixarDocumento(docId, nomeOriginal) {
    try {
        const res = await fetch(`http://localhost:3000/api/documentos/${docId}/download`, {
            headers: { 'Authorization': `Bearer ${session.token}` }
        });

        if (!res.ok) {
            const data = await res.json();
            alert(data.error || 'Erro ao baixar o arquivo.');
            return;
        }

        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = nomeOriginal;
        a.click();
        URL.revokeObjectURL(url);
    } catch {
        alert('Não foi possível conectar ao servidor.');
    }
}

function formatarData(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}