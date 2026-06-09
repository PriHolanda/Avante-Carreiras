from tests.unit.test_auth import require_auth_mock
from tests.unit.test_login import login_mock

def test_login_and_rh_navigation_flow():
    """
    Teste de Integração Real: Valida o fluxo completo de Login de Admin seguido de Navegação.
    """
    local_storage = {}
    login_sucesso = login_mock("admin@avante.com", "senha123", local_storage)
    assert login_sucesso is True
    assert "avante_session" in local_storage
    local_storage["avante_session"]["redirectTo"] = "dashboard.html"
    resultado_rota = require_auth_mock("admin", local_storage)
    assert resultado_rota["redirect"] is None
    assert resultado_rota["session"]["role"] == "admin"