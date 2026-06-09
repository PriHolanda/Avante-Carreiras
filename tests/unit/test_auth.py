import pytest
import time

def criar_sessao_mock(role="membro", expirada=False):
    tempo_expiracao = int(time.time() * 1000) - 1000 if expirada else int(time.time() * 1000) + (8 * 60 * 60 * 1000)
    return {
        "userId": 1,
        "nome": "Usuário Teste",
        "email": "teste@avante.com",
        "role": role,
        "setor": "Desenvolvimento",
        "redirectTo": "dashboard.html",
        "token": "token_valido_123",
        "expiresAt": tempo_expiracao
    }

def get_session_mock(local_storage_dict):
    session = local_storage_dict.get("avante_session")
    if not session:
        return None
    
    if not all(k in session for k in ["token", "expiresAt", "redirectTo", "role"]):
        local_storage_dict.pop("avante_session", None)
        return None
        
    if int(time.time() * 1000) > session["expiresAt"]:
        local_storage_dict.pop("avante_session", None)
        return None
        
    return session

def require_auth_mock(required_role, local_storage_dict):
    """
    Controle de acesso e proteção de rotas.
    """
    session = get_session_mock(local_storage_dict)
    if not session:
        return {"redirect": "login.html", "session": None}

    if required_role and session["role"] != required_role and session["role"] != "admin":
        return {"redirect": "meuperfil.html", "session": None}
        
    return {"redirect": None, "session": session}


def test_empty_storage():
    """
    Valida o comportamento do sistema quando não há nenhum usuário logado.
    """
    local_storage = {}
    assert get_session_mock(local_storage) is None

def test_expired_session():
    """
    Invalidação automática de sessões que estouraram o tempo limite de 8h.
    """
    sessao_expirada = criar_sessao_mock(role="admin", expirada=True)
    local_storage = {"avante_session": sessao_expirada}
    
    resultado = get_session_mock(local_storage)
    
    assert resultado is None
    assert "avante_session" not in local_storage

def test_unauthorized_role_blocking():
    """
    Garante o bloqueio de usuários sem privilégios na tela restrita ao RH.
    """
    sessao_membro = criar_sessao_mock(role="membro")
    local_storage = {"avante_session": sessao_membro}
    
    resultado = require_auth_mock("admin", local_storage)
    
    assert resultado["redirect"] == "meuperfil.html"
    assert resultado["session"] is None

def test_authorized_role_access():
    """
    Confirma a liberação de acesso para usuários com o cargo correto.
    """
    sessao_admin = criar_sessao_mock(role="admin")
    local_storage = {"avante_session": sessao_admin}
    
    resultado = require_auth_mock("admin", local_storage)
    
    assert resultado["redirect"] is None
    assert resultado["session"]["role"] == "admin"