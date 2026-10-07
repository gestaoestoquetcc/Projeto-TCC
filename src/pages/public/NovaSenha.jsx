import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLock, FiArrowLeft } from 'react-icons/fi';
import AuthLayout from '../../components/auth/AuthLayout';
import { Campo, Aviso, BotaoPrincipal, ForcaSenha } from '../../components/auth/CamposAuth';
import { atualizarSenha, avaliarSenha } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Tela aberta pelo link do e-mail "Esqueci a senha".
 * O Supabase lê o link e deixa a pessoa logada só para trocar a senha.
 */
export default function NovaSenhaPage() {
  const { usuario, carregando: verificando, concluirRecuperacao } = useAuth();
  const navigate = useNavigate();

  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [pronto, setPronto] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (!avaliarSenha(senha).valida) return setErro('A senha precisa ter pelo menos 6 caracteres.');
    if (senha !== confirmar) return setErro('As senhas não são iguais.');

    setSalvando(true);
    try {
      await atualizarSenha(senha);
      setPronto(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  function irParaSistema() {
    concluirRecuperacao();
    navigate('/', { replace: true });
  }

  if (verificando) {
    return (
      <AuthLayout titulo="Verificando link..." subtitulo="Só um instante.">
        <div className="h-24 rounded-lg bg-gray-200/60 animate-pulse" />
      </AuthLayout>
    );
  }

  // Abriu a tela sem o link do e-mail (ou o link expirou)
  if (!usuario) {
    return (
      <AuthLayout titulo="Link inválido ou expirado" subtitulo="Peça um link novo para criar sua senha.">
        <div className="space-y-4">
          <Aviso>Este link já foi usado ou passou do prazo.</Aviso>
          <Link
            to="/esqueci-senha"
            className="w-full h-11 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-bold inline-flex items-center justify-center"
          >
            Pedir novo link
          </Link>
          <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm font-semibold text-amber-700 hover:underline">
            <FiArrowLeft className="w-4 h-4" /> Voltar para o login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (pronto) {
    return (
      <AuthLayout titulo="Senha alterada!" subtitulo="Use a senha nova nas próximas vezes que entrar.">
        <div className="space-y-5">
          <Aviso tipo="sucesso">Sua senha foi atualizada com sucesso.</Aviso>
          <button
            type="button"
            onClick={irParaSistema}
            className="w-full h-11 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-bold"
          >
            Ir para o sistema
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout titulo="Criar senha nova" subtitulo={`Conta: ${usuario.email}`}>
      <form onSubmit={enviar} className="space-y-4" noValidate>
        <Aviso>{erro}</Aviso>

        <div>
          <Campo
            id="senha"
            rotulo="Senha nova"
            icone={FiLock}
            tipo="password"
            autoComplete="new-password"
            placeholder="Crie uma senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            disabled={salvando}
            autoFocus
          />
          <ForcaSenha senha={senha} />
        </div>

        <Campo
          id="confirmar"
          rotulo="Confirmar senha nova"
          icone={FiLock}
          tipo="password"
          autoComplete="new-password"
          placeholder="Repita a senha"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          disabled={salvando}
        />

        <div className="pt-2">
          <BotaoPrincipal carregando={salvando} textoCarregando="Salvando...">
            Salvar senha nova
          </BotaoPrincipal>
        </div>
      </form>
    </AuthLayout>
  );
}
