document.addEventListener('DOMContentLoaded', () => {
    const membros = [
        { nome: 'Priscila da Silva Holanda', setor: 'gestao', admissao: '29/05/2023', status: 'regular' },
        { nome: 'Gabriel Dias Vale', setor: 'comercial', admissao: '30/05/2023', status: 'regular' },
        { nome: 'Vitoria Rabelo Santiago', setor: 'marketing', admissao: '31/05/2023', status: 'pendente', perfil: 'perfil.html' },
        { nome: 'Davy Nascimento Anastacio', setor: 'projetos', admissao: '31/05/2023', status: 'regular' },
        { nome: 'Diana Braga Nogueira', setor: 'gestao', admissao: '01/06/2023', status: 'regular' },
        { nome: 'Fatima Acioly Albuquerque', setor: 'embarcados', admissao: '14/05/2024', status: 'pendente' },
        { nome: 'Eduarda Santos Costa', setor: 'marketing', admissao: '14/05/2024', status: 'erro' },
        { nome: 'Joao Silva Costa', setor: 'projetos', admissao: '20/08/2024', status: 'erro' },
    ];

    const buscaInput = document.getElementById('buscaMembros');
    const tabela = document.getElementById('tabelaMembros');
    const tabs = document.querySelectorAll('.tab-item[data-setor]');

    let setorAtivo = 'todos';

    function normalizar(valor) {
        return valor
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
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
            const combinaSetor = setorAtivo === 'todos' || membro.setor === setorAtivo;
            const combinaBusca = !busca || normalizar(membro.nome).includes(busca);

            return combinaSetor && combinaBusca;
        });
    }

    function renderizarNome(membro) {
        if (!membro.perfil) return `<span>${membro.nome}</span>`;

        return `<span><a class="name-user" href="${membro.perfil}">${membro.nome}</a></span>`;
    }

    function renderizarMembros() {
        const resultados = filtrarMembros();

        if (!resultados.length) {
            tabela.innerHTML = '<div class="empty-row">Nenhum membro encontrado.</div>';
            return;
        }

        tabela.innerHTML = resultados.map(membro => {
            const status = statusConfig(membro.status);
            const inicial = membro.nome.charAt(0).toUpperCase();

            return `
                <div class="row">
                    <div class="people">
                        <div class="icon-user">${inicial}</div>
                        ${renderizarNome(membro)}
                    </div>
                    <span class="col">${membro.admissao}</span>
                    <div class="${status.classe}">
                        <i class="fa-solid ${status.icone}"></i>
                        ${status.texto}
                    </div>
                </div>
            `;
        }).join('');
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

    renderizarMembros();
});
