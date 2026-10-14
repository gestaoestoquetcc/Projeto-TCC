import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiLoader,
  FiArrowRight
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/SupaBase';

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

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const { updatePassword, isAuthenticated } = useAuth();

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const [loading, setLoading] = useState(false);
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [sessaoValida, setSessaoValida] = useState(false);
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

  const forcaSenha = calcularForcaSenha(novaSenha);

  // 1. Verificar se o usuário chegou através de um link de recuperação válido
  useEffect(() => {
    const checarAcesso = async () => {
      try {
        const hash = window.location.hash;
        const search = window.location.search;
        const isRecoveryUrl = hash.includes('type=recovery') || search.includes('type=recovery') || hash.includes('access_token');

        const { data: { session } } = await supabase.auth.getSession();

        if (session || isRecoveryUrl || isAuthenticated) {
          setSessaoValida(true);
        } else {
          setSessaoValida(false);
        }
      } catch (err) {
        console.error('Erro ao verificar link de recuperação:', err);
        setSessaoValida(false);
      } finally {
        setVerificandoSessao(false);
      }
    };

    checarAcesso();
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!novaSenha) {
      setErro('Por favor, informe a nova senha.');
      return;
    }

    if (novaSenha.length < 6) {
      setErro('A senha deve possuir pelo menos 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem. Digite novamente.');
      return;
    }

    try {
      setLoading(true);
      await updatePassword(novaSenha);
      setSucesso('Senha atualizada com sucesso! Redirecionando para o sistema...');

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Erro ao redefinir senha:', err);
      if (err.message?.includes('New password should be different')) {
        setErro('A nova senha deve ser diferente da anterior.');
      } else {
        setErro(err.message || 'Não foi possível redefinir a senha. Solicite um novo link.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verificandoSessao) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex flex-col justify-center items-center p-4 text-gray-700">
        <FiLoader className="w-8 h-8 animate-spin text-[#c8672b] mb-3" />
        <span className="text-xs text-gray-500">Validando link de recuperação...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex flex-col justify-center items-center px-4 py-12 text-gray-800">
      <div className="w-full max-w-md">
        
        {/* Topo: Logo & Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-3">
            <AutoStockLogoMark />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AutoStock</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">Gestão de Almoxarifado Automotivo</p>
        </div>

        {/* Card Principal */}
        <div className="bg-white border border-[#e5dfd4] rounded-2xl p-6 sm:p-8 shadow-xs">
          
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Redefinir sua senha</h2>
            <p className="text-xs text-gray-500 mt-1">
              Crie uma nova senha de acesso segura para sua conta.
            </p>
          </div>

          {/* Alerta de Link Inválido ou Expirado */}
          {!sessaoValida && (
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl space-y-2">
              <div className="font-semibold flex items-center gap-1.5">
                <FiAlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Link expirado ou token ausente</span>
              </div>
              <p className="text-gray-600">
                O link de redefinição pode ter expirado. Solicite um novo link na tela de login.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-2 text-xs font-bold text-[#c8672b] hover:underline"
              >
                ← Voltar para o Login
              </button>
            </div>
          )}

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

          {/* Formulário de Redefinição */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Nova Senha
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  disabled={!sessaoValida || loading}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#dcd6ca] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#c8672b] focus:ring-1 focus:ring-[#c8672b] transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  disabled={!sessaoValida}
                  className="p-1 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  title={mostrarSenha ? 'Ocultar' : 'Exibir'}
                >
                  {mostrarSenha ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>

              {/* Medidor Visual de Dificuldade da Senha */}
              {novaSenha.length > 0 && (
                <div className="space-y-1.5 p-2.5 mt-2 bg-gray-50 border border-gray-200/80 rounded-xl">
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
                      ? 'Recomendado: 8+ caracteres mesclando letras maiúsculas, minúsculas e números.'
                      : 'Excelente! Senha segura para acesso corporativo.'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={mostrarConfirmar ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  disabled={!sessaoValida || loading}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#dcd6ca] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#c8672b] focus:ring-1 focus:ring-[#c8672b] transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                  disabled={!sessaoValida}
                  className="p-1 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  title={mostrarConfirmar ? 'Ocultar' : 'Exibir'}
                >
                  {mostrarConfirmar ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !sessaoValida}
              className="w-full mt-2 py-2.5 bg-[#c8672b] hover:bg-[#b0561e] text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  <span>Atualizando senha...</span>
                </>
              ) : (
                <span>Salvar Nova Senha</span>
              )}
            </button>

            <div className="pt-4 border-t border-[#f0ede6] text-center text-xs text-gray-600">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-bold text-[#c8672b] hover:text-[#ad531c] transition-colors"
              >
                ← Voltar para o Login
              </button>
            </div>
          </form>

        </div>

        {/* Rodapé */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-gray-400">
            AutoStock © 2026 · Todos os direitos reservados
          </p>
        </div>

      </div>
    </div>
  );
}
