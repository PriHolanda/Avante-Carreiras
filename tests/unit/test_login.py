import pytest, time

def login_mock(email, password, local_storage_dict):
    """
    Simula a lógica da função login do arquivo login.js.
    """
    USUARIO_CORRETO = "teste@avante.com"
    SENHA_CORRETA = "senha123"
    
    if email != USUARIO_CORRETO or password != SENHA_CORRETA:
        return False

    session_data = {
        "userId": 1,
        "email": email,
        "role": "membro",
        "token": "token_valido_123",
        "expiresAt": int(time.time() * 1000) + (8 * 60 * 60 * 1000)
    }
    
    local_storage_dict["avante_session"] = session_data
    return True


def test_login_success():
    """
    Valida o armazenamento da sessão após um login bem-sucedido.
    """
    local_storage = {}
    
    resultado = login_mock("teste@avante.com", "senha123", local_storage)
    
    assert resultado is True
    assert "avante_session" in local_storage
    assert local_storage["avante_session"]["email"] == "teste@avante.com"


def test_login_wrong_password():
    """
    Garante que tentativas com senha incorreta sejam bloqueadas pelo sistema.
    """
    local_storage = {}
    
    resultado = login_mock("teste@avante.com", "senha_errada", local_storage)
    
    assert resultado is False
    assert "avante_session" not in local_storage


def test_login_wrong_email():
    """
    Garante que e-mails não cadastrados não consigam autenticação.
    """
    local_storage = {}
    
    resultado = login_mock("errado@avante.com", "senha123", local_storage)
    
    assert resultado is False
    assert "avante_session" not in local_storage