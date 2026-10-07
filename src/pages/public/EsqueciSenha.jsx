import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiSend } from 'react-icons/fi';
import AuthLayout from '../../components/auth/AuthLayout';
import { Campo, Aviso, BotaoPrincipal } from '../../components/auth/CamposAuth';
import { enviarLinkRecuperacao } from '../../services/authService';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (!EMAIL_VALIDO.test(email.trim())) {
      setErro('Informe um e-mail válido.');
      return;
    }
    setCarregando(true);
    try {
      await enviarLinkRecuperacao(email);
      setEnviado(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  const voltar = (
    <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-amber-700 hover:text-amber-800 hover:underline">
      <FiArrowLeft className="w-4 h-4" /> Voltar para o login
    </Link>
  );

  if (enviado) {
    return (
      <AuthLayout titulo="Verifique seu e-mail" subtitulo="O link para criar uma senha nova está a caminho." rodape={voltar}>
        <div className="space-y-4">
          {/* Por segurança, não dizemos se o e-mail existe ou não no sistema */}
          <Aviso tipo="sucesso">
            Se existir uma conta com <strong>{email.trim()}</strong>, você vai receber um link para criar uma senha nova.
          </Aviso>
          <p className="text-xs text-gray-500">
            Não chegou? Veja a caixa de spam. O link vale por pouco tempo e só pode ser usado uma vez.
          </p>
          <button
            type="button"
            onClick={() => setEnviado(false)}
            className="text-xs font-semibold text-gray-600 hover:text-amber-700 hover:underline"
          >
            Enviar para outro e-mail
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      titulo="Esqueceu a senha?"
      subtitulo="Digite seu e-mail e enviaremos um link para você criar uma senha nova."
      rodape={voltar}
    >
      <form onSubmit={enviar} className="space-y-4" noValidate>
        <Aviso>{erro}</Aviso>

        <Campo
          id="email"
          rotulo="E-mail"
          icone={FiMail}
          tipo="email"
          autoComplete="email"
          placeholder="voce@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={carregando}
          autoFocus
        />

        <div className="pt-2">
          <BotaoPrincipal carregando={carregando} textoCarregando="Enviando...">
            <FiSend className="w-4 h-4" /> Enviar link
          </BotaoPrincipal>
        </div>
      </form>
    </AuthLayout>
  );
}
