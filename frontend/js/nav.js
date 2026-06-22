const NAV = (() => {

    function init(requiredRole) {
        const session = AUTH.requireAuth(requiredRole);
        if (!session) return null;

        AUTH.injectUserData(session);
        _appendPerfil(session);
        _appendLogout();

        return session;
    }

    function _appendPerfil(session) {
        const navList = document.querySelector('.nav-list');
        if (!navList) return;
        if (navList.querySelector('[href="meuperfil.html"]')) return;

        const a = document.createElement('a');
        a.className = 'item-list';
        a.href = 'meuperfil.html';
        if (window.location.pathname.endsWith('meuperfil.html')) {
            a.classList.add('active');
        }
        a.innerHTML = '<i class="fa-solid fa-user"></i> Meu Perfil';
        navList.appendChild(a);
    }

    function _appendLogout() {
        const navList = document.querySelector('.nav-list');
        if (!navList) return;

        // Não injeta duplicado
        if (navList.querySelector('.btn-sair')) return;

        const a = document.createElement('a');
        a.className = 'item-list btn-sair';
        a.href = '#';
        a.style.color = '#ff6b6b';
        a.style.marginTop = '20px';
        a.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Sair';
        a.onclick = (e) => { e.preventDefault(); AUTH.logout(); };

        navList.appendChild(a);
    }

    return { init };

})();
