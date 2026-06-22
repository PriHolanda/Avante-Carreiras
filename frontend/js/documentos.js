document.addEventListener('DOMContentLoaded', async () => {
    const session = AUTH.getSession();
    if (!session) return;

    const buscaInput = document.getElementById('buscaDocumentos');
    const tabela      = document.getElementById('tabelaDocumentos');
    const tabs        = document.querySelectorAll('.tab-item[data-tipo]');

    let tipoAtivo  = 'todos';
    let documentos = [];

    function normalizar(valor) {
        return valor
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function labelTipo(tipo) {
        return tipo === 'rescisao' || tipo === 'recissao' ? 'Rescisão' : 'Voluntariado';
    }

    function documentoCombinaComBusca(documento, busca) {
        if (!busca) return true;
        const nome  = normalizar(documento.nome_usuario);
        const setor = normalizar(documento.setor || '');
        return nome.includes(busca) || setor.includes(busca);
    }

    function filtrarDocumentos() {
        const busca = normalizar(buscaInput.value.trim());

        return documentos.filter(documento => {
            const combinaTipo = tipoAtivo === 'todos' || documento.tipo === tipoAtivo;
            return combinaTipo && documentoCombinaComBusca(documento, busca);
        });
    }

    function formatarData(iso) {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }

    function renderizarDocumentos() {
        const resultados = filtrarDocumentos();

        if (!resultados.length) {
            tabela.innerHTML = '<div class="empty-row">Nenhum documento encontrado.</div>';
            return;
        }

        tabela.innerHTML = resultados.map(documento => {
            const inicial = documento.nome_usuario.charAt(0).toUpperCase();

            return `
                <div class="row">
                    <div class="people">
                        <div class="icon-user">${inicial}</div>
                        <span><a class="name-user" href="perfil.html?id=${documento.usuario_id}">${documento.nome_usuario}</a></span>
                    </div>
                    <span class="col">${formatarData(documento.enviado_em)}</span>
                    <span class="col">${labelTipo(documento.tipo)}</span>
                </div>
            `;
        }).join('');
    }

    async function carregarDocumentos() {
        tabela.innerHTML = '<div class="empty-row">Carregando...</div>';
        try {
            const res  = await fetch('http://localhost:3000/api/documentos/todos', {
                headers: { 'Authorization': `Bearer ${session.token}` }
            });
            const data = await res.json();

            if (!data.ok) {
                tabela.innerHTML = `<div class="empty-row">${data.error || 'Erro ao carregar documentos.'}</div>`;
                return;
            }

            documentos = data.documentos;
            renderizarDocumentos();
        } catch {
            tabela.innerHTML = '<div class="empty-row">Não foi possível conectar ao servidor.</div>';
        }
    }

    buscaInput.addEventListener('input', renderizarDocumentos);

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');
            tipoAtivo = tab.dataset.tipo;
            renderizarDocumentos();
        });
    });

    await carregarDocumentos();
});