const session = NAV.init();

        // ── Avatar com inicial do nome ────────────────────────────────────────
        if (session) {
            const inicial = session.nome.trim().charAt(0).toUpperCase();
            document.getElementById('avatarPerfil').textContent = inicial;

            // Badge de cargo
            const badge = document.getElementById('roleBadge');
            badge.textContent = session.role === 'admin' ? 'Administrador' : 'Membro';
            badge.classList.add(session.role === 'admin' ? 'badge-admin' : 'badge-membro');

            // ── Documentos: busca da API ──────────────────────────────────────
            // Por enquanto carrega documentos de exemplo por usuário.
            // Quando a rota /api/documentos/:userId estiver pronta, substituir pelo fetch abaixo.
            carregarDocumentos(session);
        }

        function carregarDocumentos(session) {
            // Placeholder: documentos de exemplo por usuário
            // Substituir por: fetch(`/api/documentos/${session.userId}`, { headers: { Authorization: `Bearer ${session.token}` } })
            const docsPorUsuario = {
                'admin@avante.com': [
                    { nome: 'contrato-direx.pdf',        data: '01/01/2023', status: 'regular' },
                    { nome: 'termo-confidencialidade.pdf', data: '01/01/2023', status: 'regular' },
                ],
                'vitoriarabelo@gmail.com': [
                    { nome: 'termo-voluntariado.pdf',  data: '05/01/2026', status: 'regular'  },
                    { nome: 'documento.pdf',           data: '30/01/2026', status: 'pendente' },
                    { nome: 'documento-assinado.docx', data: '31/01/2026', status: 'erro'     },
                ],
                'danieljaco@gmail.com': [
                    { nome: 'termo-voluntariado.pdf', data: '16/05/2024', status: 'pendente' },
                ],
            };

            const docs = docsPorUsuario[session.email] || [];
            const tbody = document.getElementById('tabelaDocumentos');

            if (docs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#888;padding:30px 0;">Nenhum documento encontrado.</td></tr>`;
                return;
            }

            tbody.innerHTML = docs.map(d => `
                <tr>
                    <td>${d.nome}</td>
                    <td>${d.data}</td>
                    <td class="status-doc status-${d.status}">
                        <i class="fa-solid ${iconePorStatus(d.status)}"></i>
                        ${labelPorStatus(d.status)}
                    </td>
                </tr>
            `).join('');
        }

        function iconePorStatus(s) {
            return s === 'regular' ? 'fa-check' : s === 'pendente' ? 'fa-spinner' : 'fa-circle-exclamation';
        }
        function labelPorStatus(s) {
            return s === 'regular' ? 'Assinado' : s === 'pendente' ? 'Pendente' : 'Formato errado!';
        }