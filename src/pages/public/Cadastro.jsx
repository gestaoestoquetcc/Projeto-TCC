import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiArrowLeft } from 'react-icons/fi';
import AuthLayout from '../../components/auth/AuthLayout';
import { Campo, Aviso, BotaoPrincipal, ForcaSenha } from '../../components/auth/CamposAuth';
import { cadastrar, avaliarSenha } from '../../services/authService';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CadastroPage() {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmar: '' });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [emailEnviadoPara, setEmailEnviadoPara] = useState('');

  const mudar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  function validar() {
    if (form.nome.trim().length < 3) return 'Informe seu nome completo.';
    if (!EMAIL_VALIDO.test(form.email.trim())) return 'Informe um e-mail válido.';
    if (!avaliarSenha(form.senha).valida) return 'A senha precisa ter pelo menos 6 caracteres.';
    if (form.senha !== form.confirmar) return 'As senhas não são iguais.';
    return '';
  }

  async function enviar(e) {
    e.preventDefault();
    const problema = validar();
    setErro(problema);
    if (problema) return;

    setCarregando(true);
    try {
      const { precisaConfirmar } = await cadastrar(form);
      if (precisaConfirmar) {
        setEmailEnviadoPara(form.email.trim());
        setCarregando(false);
      }
      // Se não precisar confirmar, o usuário já entra e o sistema abre o Dashboard sozinho
    } catch (err) {
      setErro(err.message);
      setCarregando(false);
    }
  }

  // Depois de cadastrar: pedir para confirmar o e-mail
  if (emailEnviadoPara) {
    return (
      <AuthLayout titulo="Confirme seu e-mail" subtitulo="Falta só um passo para acessar o AutoStock.">
        <div className="space-y-5">
          <Aviso tipo="sucesso">
            Enviamos um link de confirmação para <strong>{emailEnviadoPara}</strong>. Abra o e-mail, clique no link e
            depois entre com sua senha.
          </Aviso>
          <p className="text-xs text-gray-500">Não chegou? Veja a caixa de spam ou espere alguns minutos.</p>
          <Link
            to="/login"
            className="w-full h-11 rounded-lg border border-[#e4ded3] bg-white text-sm font-semibold text-gray-700 hover:border-amber-500 hover:text-amber-700 inline-flex items-center justify-center gap-2"
          >
            <FiArrowLeft className="w-4 h-4" /> Ir para o login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      titulo="Criar conta"
      subtitulo="Cadastre-se para usar o sistema de estoque."
      rodape={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="font-semibold text-amber-700 hover:text-amber-800 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} className="space-y-4" noValidate>
        <Aviso>{erro}</Aviso>

        <Campo
          id="nome"
          rotulo="Nome completo"
          icone={FiUser}
          autoComplete="name"
          placeholder="Ex.: Kelvin Torres"
          value={form.nome}
          onChange={mudar('nome')}
          disabled={carregando}
          autoFocus
        />

        <Campo
          id="email"
          rotulo="E-mail"
          icone={FiMail}
          tipo="email"
          autoComplete="email"
          placeholder="voce@empresa.com"
          value={form.email}
          onChange={mudar('email')}
          disabled={carregando}
        />

        <div>
          <Campo
            id="senha"
            rotulo="Senha"
            icone={FiLock}
            tipo="password"
            autoComplete="new-password"
            placeholder="Crie uma senha"
            value={form.senha}
            onChange={mudar('senha')}
            disabled={carregando}
          />
          <ForcaSenha senha={form.senha} />
        </div>

        <Campo
          id="confirmar"
          rotulo="Confirmar senha"
          icone={FiLock}
          tipo="password"
          autoComplete="new-password"
          placeholder="Repita a senha"
          value={form.confirmar}
          onChange={mudar('confirmar')}
          disabled={carregando}
        />

        <div className="pt-2">
          <BotaoPrincipal carregando={carregando} textoCarregando="Criando conta...">
            Criar conta
          </BotaoPrincipal>
        </div>
      </form>
    </AuthLayout>
  );
}
