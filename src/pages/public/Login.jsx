import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import AuthLayout from '../../components/auth/AuthLayout';
import { Campo, Aviso, BotaoPrincipal } from '../../components/auth/CamposAuth';
import { entrar } from '../../services/authService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (!email.trim() || !senha) {
      setErro('Preencha o e-mail e a senha.');
      return;
    }
    setCarregando(true);
    try {
      await entrar(email, senha);
      // Deu certo: o sistema percebe o login e abre o Dashboard sozinho
    } catch (err) {
      setErro(err.message);
      setCarregando(false);
    }
  }

  return (
    <AuthLayout
      titulo="Bem-vindo de volta"
      subtitulo="Entre com seu e-mail e senha para acessar o estoque."
      rodape={
        <>
          Não tem conta?{' '}
          <Link to="/cadastro" className="font-semibold text-amber-700 hover:text-amber-800 hover:underline">
            Criar conta
          </Link>
        </>
      }
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

        <Campo
          id="senha"
          rotulo="Senha"
          icone={FiLock}
          tipo="password"
          autoComplete="current-password"
          placeholder="Sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          disabled={carregando}
          extra={
            <Link to="/esqueci-senha" className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline">
              Esqueci minha senha
            </Link>
          }
        />

        <div className="pt-2">
          <BotaoPrincipal carregando={carregando} textoCarregando="Entrando...">
            Entrar <FiArrowRight className="w-4 h-4" />
          </BotaoPrincipal>
        </div>
      </form>
    </AuthLayout>
  );
}
