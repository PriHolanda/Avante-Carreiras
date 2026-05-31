const NAV = (() => {
 
    // Autentica e injeta dados do usuário na UI
    function init(requiredRole) {
        const session = AUTH.requireAuth(requiredRole);
        if (!session) return null; // requireAuth já redireciona
 
        AUTH.injectUserData(session);
        _appendLogout();
 
        return session;
    }
 
    function _appendLogout() {
        const navList = document.querySelector('.nav-list');
        if (!navList) return;
 
        const a = document.createElement('a');
        a.className  = 'item-list';
        a.href       = '#';
        a.style.color     = '#ff6b6b';
        a.innerHTML  = '<i class="fa-solid fa-right-from-bracket"></i> Sair';
        a.onclick    = (e) => { e.preventDefault(); AUTH.logout(); };
 
        navList.appendChild(a);
    }
 
    return { init };
 
})();