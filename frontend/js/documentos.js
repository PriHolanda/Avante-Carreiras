document.addEventListener('DOMContentLoaded', () => {
    const documentos = [
        { nome: 'Priscila da Silva Holanda', setor: 'Gestao de Pessoas', dataEnvio: '29/05/2023', tipo: 'voluntariado', status: 'regular' },
        { nome: 'Gabriel Dias Vale', setor: 'Comercial', dataEnvio: '30/05/2023', tipo: 'voluntariado', status: 'regular' },
        { nome: 'Davy Nascimento Anastacio', setor: 'Projetos', dataEnvio: '31/05/2023', tipo: 'voluntariado', status: 'regular' },
        { nome: 'Vitoria Rabelo Santiago', setor: 'Marketing', dataEnvio: '31/05/2023', tipo: 'voluntariado', status: 'regular' },
        { nome: 'Diana Braga Nogueira', setor: 'Gestao de Pessoas', dataEnvio: '01/06/2023', tipo: 'voluntariado', status: 'regular' },
        { nome: 'Fatima Acioly Albuquerque', setor: 'Embarcados', dataEnvio: '14/05/2024', tipo: 'voluntariado', status: 'regular' },
        { nome: 'Veronica Agostinho Alves', setor: 'Comercial', dataEnvio: '14/05/2024', tipo: 'voluntariado', status: 'regular' },
        { nome: 'Evely Paz da Silva', setor: 'Marketing', dataEnvio: '14/05/2024', tipo: 'voluntariado', status: 'regular' },
        { nome: 'Weslem Wallace Lira', setor: 'Projetos', dataEnvio: '15/05/2024', tipo: 'rescisao', status: 'erro' },
        { nome: 'Daniel Jaco dos Santos Pereira', setor: 'Embarcados', dataEnvio: '16/05/2024', tipo: 'rescisao', status: 'pendente' },
    ];

    const buscaInput = document.getElementById('buscaDocumentos');
    const tabela = document.getElementById('tabelaDocumentos');
    const tabs = document.querySelectorAll('.tab-item[data-tipo]');

    let tipoAtivo = 'todos';

    function normalizar(valor) {
        return valor
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function labelTipo(tipo) {
        return tipo === 'rescisao' ? 'Rescisao' : 'Voluntariado';
    }

    function statusConfig(status) {
        if (status === 'erro') {
            return { classe: 'status-error', icone: 'fa-xmark' };
        }

        if (status === 'pendente') {
            return { classe: 'status-alert', icone: 'fa-exclamation' };
        }

        return { classe: 'status-check', icone: 'fa-check' };
    }

    function documentoCombinaComBusca(documento, busca) {
        if (!busca) return true;

        const nome = normalizar(documento.nome);
        const setor = normalizar(documento.setor);

        return nome.includes(busca) || setor.includes(busca);
    }

    function filtrarDocumentos() {
        const busca = normalizar(buscaInput.value.trim());

        return documentos.filter(documento => {
            const combinaTipo = tipoAtivo === 'todos' || documento.tipo === tipoAtivo;
            return combinaTipo && documentoCombinaComBusca(documento, busca);
        });
    }

    function renderizarDocumentos() {
        const resultados = filtrarDocumentos();

        if (!resultados.length) {
            tabela.innerHTML = '<div class="empty-row">Nenhum documento encontrado.</div>';
            return;
        }

        tabela.innerHTML = resultados.map(documento => {
            const status = statusConfig(documento.status);

            return `
                <div class="row">
                    <div class="people">
                        <div class="icon-status ${status.classe}">
                            <i class="fa-solid ${status.icone}"></i>
                        </div>
                        <span>${documento.nome}</span>
                    </div>
                    <span class="col">${documento.dataEnvio}</span>
                    <span class="col">${labelTipo(documento.tipo)}</span>
                </div>
            `;
        }).join('');
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

    renderizarDocumentos();
});
