document.addEventListener('DOMContentLoaded', async () => {
    const session = AUTH.getSession();
    if (!session) return;

    const buscaInput = document.getElementById('buscaMembros');
    const tabela      = document.getElementById('tabelaMembros');
    const tabs        = document.querySelectorAll('.tab-item[data-setor]');

    let setorAtivo = 'todos';
    let membros    = [];

    function normalizar(valor) {
        return valor
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    // Mapeia o setor do banco (ex: "Gestão de Pessoas") para o valor usado nas abas (ex: "gestao")
    function setorParaSlug(setor) {
        return normalizar(setor || '').replace(/\s+/g, '');
    }

    function statusConfig(status) {
        if (status === 'erro') {
            return { classe: 'status-erro', icone: 'fa-circle-exclamation', texto: 'Erro' };
        }
        if (status === 'pendente') {
            return { classe: 'status-pendente', icone: 'fa-spinner', texto: 'Pendente' };
        }
        return { classe: 'status-regular', icone: 'fa-check', texto: 'Regular' };
    }

    function filtrarMembros() {
        const busca = normalizar(buscaInput.value.trim());

        return membros.filter(membro => {
            const slugSetor    = setorParaSlug(membro.setor);
            const combinaSetor = setorAtivo === 'todos' || slugSetor.includes(setorAtivo);
            const combinaBusca = !busca || normalizar(membro.nome).includes(busca);
            return combinaSetor && combinaBusca;
        });
    }

    function renderizarNome(membro) {
        // Admin pode clicar em qualquer nome para ver o perfil. O próprio admin não tem link para si mesmo.
        if (membro.id === session.userId) return `<span>${membro.nome}</span>`;
        return `<span><a class="name-user" href="perfil.html?id=${membro.id}">${membro.nome}</a></span>`;
    }

    function renderizarMembros() {
        const resultados = filtrarMembros();

        if (!resultados.length) {
            tabela.innerHTML = '<div class="empty-row">Nenhum membro encontrado.</div>';
            return;
        }

        tabela.innerHTML = resultados.map(membro => {
            const status  = statusConfig(membro.status);
            const inicial = membro.nome.charAt(0).toUpperCase();

            return `
                <div class="row">
                    <div class="people">
                        <div class="icon-user">${inicial}</div>
                        ${renderizarNome(membro)}
                    </div>
                    <span class="col">${membro.admissao || '—'}</span>
                    <div class="${status.classe}">
                        <i class="fa-solid ${status.icone}"></i>
                        ${status.texto}
                    </div>
                </div>
            `;
        }).join('');
    }

    async function carregarMembros() {
        tabela.innerHTML = '<div class="empty-row">Carregando...</div>';
        try {
            const res  = await fetch('http://localhost:3000/api/usuarios', {
                headers: { 'Authorization': `Bearer ${session.token}` }
            });
            const data = await res.json();

            if (!data.ok) {
                tabela.innerHTML = `<div class="empty-row">${data.error || 'Erro ao carregar membros.'}</div>`;
                return;
            }

            membros = data.usuarios;
            renderizarMembros();
        } catch {
            tabela.innerHTML = '<div class="empty-row">Não foi possível conectar ao servidor.</div>';
        }
    }

    buscaInput.addEventListener('input', renderizarMembros);

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');
            setorAtivo = tab.dataset.setor;
            renderizarMembros();
        });
    });

    await carregarMembros();
});