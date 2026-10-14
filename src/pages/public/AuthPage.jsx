import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiMail, 
  FiLock, 
  FiUser, 
  FiBriefcase, 
  FiEye, 
  FiEyeOff, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiLoader,
  FiArrowRight
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

// Logomarca simples e elegante do AutoStock
function AutoStockLogoMark() {
  return (
    <div className="w-10 h-10 rounded-xl bg-[#c8672b] flex items-center justify-center text-white shadow-xs shrink-0">
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="w-5 h-5 text-white"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, resetPassword } = useAuth();

  // 'login', 'cadastro', 'recuperar'
  const [abaAtiva, setAbaAtiva] = useState(
    location.pathname === '/cadastro' ? 'cadastro' : location.pathname === '/recuperar-senha' ? 'recuperar' : 'login'
  );

  // Estados de formulário
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('Operador de Almoxarifado');

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Medidor da dificuldade da senha
  const calcularForcaSenha = (str) => {
    if (!str) return { nivel: 0, label: '', cor: '' };
    let score = 0;
    if (str.length >= 6) score += 1;
    if (str.length >= 8) score += 1;
    if (/[a-z]/.test(str) && /[A-Z]/.test(str)) score += 1;
    if (/\d/.test(str) || /[^A-Za-z0-9]/.test(str)) score += 1;

    switch (score) {
      case 1:
        return { nivel: 1, label: 'Muito Fraca', cor: 'bg-red-500', texto: 'text-red-600' };
      case 2:
        return { nivel: 2, label: 'Razoável', cor: 'bg-amber-500', texto: 'text-amber-600' };
      case 3:
        return { nivel: 3, label: 'Boa', cor: 'bg-blue-500', texto: 'text-blue-600' };
      case 4:
        return { nivel: 4, label: 'Forte', cor: 'bg-emerald-500', texto: 'text-emerald-600' };
      default:
        return { nivel: 0, label: '', cor: '' };
    }
  };

  const forcaSenha = calcularForcaSenha(senha);

  const limparFeedback = () => {
    setErro('');
    setSucesso('');
  };

  const handleMudarAba = (novaAba) => {
    setAbaAtiva(novaAba);
    limparFeedback();
  };

  // Submit Login
  const handleLogin = async (e) => {
    e.preventDefault();
    limparFeedback();

    if (!email || !senha) {
      setErro('Por favor, informe seu e-mail e sua senha.');
      return;
    }

    try {
      setLoading(true);
      await signIn({ email, password: senha });
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.message?.includes('Invalid login credentials')) {
        setErro('Credenciais inválidas. Verifique seu e-mail e senha.');
      } else {
        setErro(err.message || 'Erro ao realizar login.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit Cadastro
  const handleCadastro = async (e) => {
    e.preventDefault();
    limparFeedback();

    if (!nome.trim() || !email.trim() || !senha) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve possuir pelo menos 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    try {
      setLoading(true);
      await signUp({
        nome: nome.trim(),
        email: email.trim(),
        password: senha,
        cargo: cargo.trim() || 'Operador de Almoxarifado'
      });
      setSucesso('Conta criada com sucesso! Você já pode entrar.');
      setTimeout(() => {
        handleMudarAba('login');
      }, 1500);
    } catch (err) {
      console.error(err);
      if (err.message?.includes('User already registered')) {
        setErro('Este e-mail já está cadastrado.');
      } else if (err.message?.includes('rate limit') || err.status === 429) {
        setErro('Limite de envios do Supabase atingido. Tente novamente mais tarde.');
      } else {
        setErro(err.message || 'Erro ao criar conta.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit Recuperação de Senha
  const handleRecuperarSenha = async (e) => {
    e.preventDefault();
    limparFeedback();

    if (!email.trim()) {
      setErro('Informe seu e-mail para enviarmos as instruções.');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email.trim());
      setSucesso('Instruções enviadas para o seu e-mail!');
    } catch (err) {
      console.error(err);
      if (err.message?.includes('rate limit') || err.status === 429) {
        setErro('Limite temporário de e-mails atingido. Aguarde alguns minutos.');
      } else {
        setErro(err.message || 'Erro ao enviar e-mail de recuperação.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Demonstração / Banca de TCC
  const handleEntrarComoConvidado = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex flex-col justify-center items-center px-4 py-12 text-gray-800">
      
      {/* Container Central Simples */}
      <div className="w-full max-w-md">
        
        {/* Topo: Logo & Título do Sistema */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-3">
            <AutoStockLogoMark />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AutoStock</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">Gestão de Almoxarifado Automotivo</p>
        </div>

        {/* Card Principal */}
        <div className="bg-white border border-[#e5dfd4] rounded-2xl p-6 sm:p-8 shadow-xs">
          
          {/* Título da Aba */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              {abaAtiva === 'login' && 'Entrar na sua conta'}
              {abaAtiva === 'cadastro' && 'Criar sua conta'}
              {abaAtiva === 'recuperar' && 'Recuperar senha'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {abaAtiva === 'login' && 'Digite seu e-mail e senha para acessar o painel.'}
              {abaAtiva === 'cadastro' && 'Preencha seus dados para começar.'}
              {abaAtiva === 'recuperar' && 'Enviaremos um link de recuperação no seu e-mail.'}
            </p>
          </div>

          {/* Feedback: Erro */}
          {erro && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <FiAlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          {/* Feedback: Sucesso */}
          {sucesso && (
            <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{sucesso}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* 1. FORMULÁRIO DE LOGIN                                    */}
          {/* ========================================================= */}
          {abaAtiva === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@empresa.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#dcd6ca] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#c8672b] focus:ring-1 focus:ring-[#c8672b] transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => handleMudarAba('recuperar')}
                    className="text-xs text-[#c8672b] hover:text-[#ad531c] font-medium transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#dcd6ca] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#c8672b] focus:ring-1 focus:ring-[#c8672b] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="p-1 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title={mostrarSenha ? 'Ocultar' : 'Exibir'}
                  >
                    {mostrarSenha ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-[#c8672b] hover:bg-[#b0561e] text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <span>Entrar</span>
                )}
              </button>

              <div className="pt-4 border-t border-[#f0ede6] text-center text-xs text-gray-600">
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => handleMudarAba('cadastro')}
                  className="font-bold text-[#c8672b] hover:text-[#ad531c] transition-colors"
                >
                  Cadastre-se
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* 2. FORMULÁRIO DE CADASTRO                                 */}
          {/* ========================================================= */}
          {abaAtiva === 'cadastro' && (
            <form onSubmit={handleCadastro} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Carlos Mendes"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#dcd6ca] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#c8672b] focus:ring-1 focus:ring-[#c8672b] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@empresa.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#dcd6ca] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#c8672b] focus:ring-1 focus:ring-[#c8672b] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Função / Cargo
                </label>
                <div className="relative">
                  <FiBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#dcd6ca] rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#c8672b] focus:ring-1 focus:ring-[#c8672b] transition-all cursor-pointer"
                  >
                    <option value="Operador de Almoxarifado">Operador de Almoxarifado</option>
                    <option value="Gerente de Estoque">Gerente de Estoque</option>
                    <option value="Comprador / Suprimentos">Comprador / Suprimentos</option>
                    <option value="Administrador do Sistema">Administrador do Sistema</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 dígitos"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-[#dcd6ca] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#c8672b] focus:ring-1 focus:ring-[#c8672b] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Confirmar Senha
                  </label>
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a senha"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-[#dcd6ca] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#c8672b] focus:ring-1 focus:ring-[#c8672b] transition-all"
                  />
                </div>
              </div>

              {/* Medidor Visual de Dificuldade da Senha */}
              {senha.length > 0 && (
                <div className="space-y-1.5 p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500 font-medium">Força da senha:</span>
                    <span className={`font-bold ${forcaSenha.texto}`}>
                      {forcaSenha.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    <div className={`rounded-full transition-all duration-300 ${forcaSenha.nivel >= 1 ? forcaSenha.cor : 'bg-gray-200'}`} />
                    <div className={`rounded-full transition-all duration-300 ${forcaSenha.nivel >= 2 ? forcaSenha.cor : 'bg-gray-200'}`} />
                    <div className={`rounded-full transition-all duration-300 ${forcaSenha.nivel >= 3 ? forcaSenha.cor : 'bg-gray-200'}`} />
                    <div className={`rounded-full transition-all duration-300 ${forcaSenha.nivel >= 4 ? forcaSenha.cor : 'bg-gray-200'}`} />
                  </div>
                  <span className="text-[10px] text-gray-400 block leading-tight">
                    {forcaSenha.nivel < 3 
                      ? 'Dica: use pelo menos 8 dígitos, mesclando letras maiúsculas, minúsculas e números.'
                      : 'Excelente! Senha segura para o ambiente corporativo.'}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-[#c8672b] hover:bg-[#b0561e] text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    <span>Cadastrando...</span>
                  </>
                ) : (
                  <span>Criar conta</span>
                )}
              </button>

              <div className="pt-4 border-t border-[#f0ede6] text-center text-xs text-gray-600">
                Já possui uma conta?{' '}
                <button
                  type="button"
                  onClick={() => handleMudarAba('login')}
                  className="font-bold text-[#c8672b] hover:text-[#ad531c] transition-colors"
                >
                  Entrar
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* 3. FORMULÁRIO DE RECUPERAR SENHA                          */}
          {/* ========================================================= */}
          {abaAtiva === 'recuperar' && (
            <form onSubmit={handleRecuperarSenha} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Seu E-mail
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@empresa.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#dcd6ca] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#c8672b] focus:ring-1 focus:ring-[#c8672b] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#c8672b] hover:bg-[#b0561e] text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    <span>Enviando link...</span>
                  </>
                ) : (
                  <span>Enviar link de recuperação</span>
                )}
              </button>

              <div className="pt-4 border-t border-[#f0ede6] text-center text-xs text-gray-600">
                Lembrou da senha?{' '}
                <button
                  type="button"
                  onClick={() => handleMudarAba('login')}
                  className="font-bold text-[#c8672b] hover:text-[#ad531c] transition-colors"
                >
                  Voltar ao login
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Rodapé / Acesso Direto para Teste de TCC */}
        <div className="mt-6 text-center space-y-3">
          <button
            type="button"
            onClick={handleEntrarComoConvidado}
            className="text-xs text-gray-600 hover:text-gray-900 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Acessar sem login (modo de demonstração)</span>
            <FiArrowRight className="w-3.5 h-3.5 text-[#c8672b]" />
          </button>

          <p className="text-[11px] text-gray-400">
            AutoStock © 2026 · Todos os direitos reservados
          </p>
        </div>

      </div>
    </div>
  );
}
