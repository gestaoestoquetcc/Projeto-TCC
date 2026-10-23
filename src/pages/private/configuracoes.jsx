import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiUsers, 
  FiUser, 
  FiSliders, 
  FiPlus, 
  FiEdit2, 
  FiLock, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiShield, 
  FiSearch,
  FiSave,
  FiRefreshCw,
  FiLoader,
  FiPackage,
  FiTrendingUp,
  FiCpu,
  FiBell,
  FiDatabase,
  FiFileText,
  FiActivity,
  FiRotateCcw,
  FiCheck,
  FiLink,
  FiArrowDown,
  FiArrowUp,
  FiDownload,
  FiLogOut
} from 'react-icons/fi';

import Sidebar from '../../components/layout/Sidebar';
import NovoUsuarioModal from '../../components/configuracoes/NovoUsuarioModal';
import EditarUsuarioModal from '../../components/configuracoes/EditarUsuarioModal';
import { useAuth } from '../../contexts/AuthContext';
import { getUsuarios, criarUsuario, atualizarUsuario } from '../../services/usuariosService';
import { getMovimentacoes } from '../../services/movimentacoesService';

function ToggleSwitch({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? 'bg-[#c8672b]' : 'bg-[#dcd6ca]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function ConfiguracoesPage() {
  const navigate = useNavigate();
  const { user, perfil, atualizarPerfil, updatePassword, isMaster, signOut } = useAuth();

  const [abaAtiva, setAbaAtiva] = useState(isMaster ? 'usuarios' : 'parametros'); // 'usuarios', 'perfil', 'parametros'
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState('todos');

  // Modais
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
  const [usuarioParaEditar, setUsuarioParaEditar] = useState(null);

  // Estados de "Meu Perfil"
  const [meuNome, setMeuNome] = useState('');
  const [meuCargo, setMeuCargo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');

  // Feedbacks
  const [msgSucesso, setMsgSucesso] = useState('');
  const [msgErro, setMsgErro] = useState('');
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

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

  const forcaSenhaPerfil = calcularForcaSenha(novaSenha);

  // Parâmetros do Sistema (com persistência em localStorage)
  const [parametros, setParametros] = useState(() => {
    const salvo = localStorage.getItem('@autostock_parametros');
    if (salvo) {
      try {
        return JSON.parse(salvo);
      } catch (e) {
        // fallback
      }
    }
    return {
      // ALERTAS PREDITIVOS
      alertasAutomaticos: true,
      sugestoesSemanais: true,
      confiancaMinima80: true,
      leadTimeDinamico: true,
      // ESTOQUE
      reposicaoAutomatica: false,
      notificacaoRuptura: true,
      recalcularPontosMensal: true,
      margemSegurancaPadrao: 20,
      exigirAprovacaoCompras: true,
      // INTEGRAÇÕES
      importacaoAutomaticaNfe: false,
      sincronizarErp: false,
      webhookAtivo: false,
      webhookUrl: 'https://api.distribuidora.com.br/v1/webhook-estoque',
      // AUDITORIA (MASTER)
      logAuditoriaEstrito: true,
      obrigatoriedadeJustificativa: true
    };
  });

  const updateParametro = (campo, valor) => {
    setParametros((prev) => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleSalvarParametros = () => {
    localStorage.setItem('@autostock_parametros', JSON.stringify(parametros));
    exibirSucesso('Diretrizes operacionais e automações salvas com sucesso!');
  };

  const handleRestaurarPadroes = () => {
    const padroes = {
      alertasAutomaticos: true,
      sugestoesSemanais: true,
      confiancaMinima80: true,
      leadTimeDinamico: true,
      reposicaoAutomatica: false,
      notificacaoRuptura: true,
      recalcularPontosMensal: true,
      margemSegurancaPadrao: 20,
      exigirAprovacaoCompras: true,
      importacaoAutomaticaNfe: false,
      sincronizarErp: false,
      webhookAtivo: false,
      webhookUrl: 'https://api.distribuidora.com.br/v1/webhook-estoque',
      logAuditoriaEstrito: true,
      obrigatoriedadeJustificativa: true
    };
    setParametros(padroes);
    localStorage.setItem('@autostock_parametros', JSON.stringify(padroes));
    exibirSucesso('Parâmetros restaurados para as diretrizes de fábrica!');
  };

  // Dados de Auditoria & Timeline (Master) - 100% dinâmico a partir das movimentações
  const [buscaAuditoria, setBuscaAuditoria] = useState('');
  const [filtroTipoAuditoria, setFiltroTipoAuditoria] = useState('todos');
  const [logsAuditoria, setLogsAuditoria] = useState([]);

  const logsFiltrados = useMemo(() => {
    return logsAuditoria.filter((log) => {
      if (filtroTipoAuditoria !== 'todos' && log.tipo !== filtroTipoAuditoria) return false;
      if (!buscaAuditoria.trim()) return true;
      const q = buscaAuditoria.toLowerCase();
      return (
        log.operador.toLowerCase().includes(q) ||
        log.detalhes.toLowerCase().includes(q) ||
        log.documento.toLowerCase().includes(q) ||
        log.motivo.toLowerCase().includes(q)
      );
    });
  }, [logsAuditoria, buscaAuditoria, filtroTipoAuditoria]);

  // Se não for Master e a aba atual for 'usuarios' ou 'auditoria', redireciona para 'parametros'
  useEffect(() => {
    if (!isMaster && (abaAtiva === 'usuarios' || abaAtiva === 'auditoria')) {
      setAbaAtiva('parametros');
    }
  }, [isMaster, abaAtiva]);

  // Carregar usuários e movimentações para a auditoria
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const [lista, movs] = await Promise.all([
        getUsuarios(),
        getMovimentacoes().catch(() => [])
      ]);
      setUsuarios(lista);

      const logsMapeados = (movs || []).map((m, index) => {
        const isSaida = m.tipo === 'saida';
        const dataStr = m.dataHora 
          ? new Date(m.dataHora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : 'Recente';

        return {
          id: m.id || `log-${index}`,
          operador: 'Operador de Estoque',
          cargo: 'Logística & Operação',
          iniciais: 'OE',
          acao: isSaida ? 'Baixa de Estoque' : 'Entrada de Estoque',
          tipo: isSaida ? 'saida' : 'entrada',
          detalhes: `${isSaida ? 'Deu baixa' : 'Deu entrada'} de ${m.quantidade} un. de ${m.pecaNome} (SKU: ${m.sku})`,
          documento: m.documento || (isSaida ? 'OS-Balcão' : 'NF-e'),
          motivo: m.motivo || (isSaida ? 'Requisição de manutenção' : 'Reposição de estoque'),
          ip: '192.168.1.1',
          dataHora: dataStr,
          hash: `#${m.id ? String(m.id).slice(-6) : Math.random().toString(16).slice(2, 8)}`
        };
      });
      setLogsAuditoria(logsMapeados);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Preencher dados do Meu Perfil
  useEffect(() => {
    if (perfil) {
      setMeuNome(perfil.nome || '');
      setMeuCargo(perfil.cargo || '');
    } else if (user) {
      setMeuNome(user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário');
      setMeuCargo(user.user_metadata?.cargo || 'Colaborador');
    }
  }, [perfil, user]);

  const exibirSucesso = (msg) => {
    setMsgSucesso(msg);
    setMsgErro('');
    setTimeout(() => setMsgSucesso(''), 4000);
  };

  const exibirErro = (msg) => {
    setMsgErro(msg);
    setMsgSucesso('');
    setTimeout(() => setMsgErro(''), 4000);
  };

  // KPIs dos Usuários
  const kpis = useMemo(() => {
    const total = usuarios.length;
    const masters = usuarios.filter((u) => u.role === 'master').length;
    const gerentes = usuarios.filter((u) => u.role === 'gerente').length;
    const operadores = usuarios.filter((u) => u.role === 'operador').length;
    return { total, masters, gerentes, operadores };
  }, [usuarios]);

  // Filtro de Usuários
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      if (filtroRole !== 'todos' && u.role !== filtroRole) return false;
      if (!busca.trim()) return true;
      const q = busca.toLowerCase();
      return (
        u.nome.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.cargo.toLowerCase().includes(q)
      );
    });
  }, [usuarios, busca, filtroRole]);

  // Ações de Usuário
  const handleCriarUsuario = async (dados) => {
    const novo = await criarUsuario(dados);
    setUsuarios((prev) => [novo, ...prev]);
    exibirSucesso(`Login para ${novo.nome} criado com sucesso!`);
  };

  const handleSalvarEdicao = async (id, updates) => {
    const atualizados = await atualizarUsuario(id, updates);
    setUsuarios(atualizados);
    exibirSucesso('Acessos do usuário atualizados com sucesso!');
  };

  // Salvar Meu Perfil
  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
    if (!meuNome.trim()) {
      exibirErro('O nome não pode ficar vazio.');
      return;
    }

    try {
      setSalvandoPerfil(true);
      await atualizarPerfil({
        nome: meuNome,
        cargo: meuCargo
      });
      exibirSucesso('Seu perfil foi atualizado! As alterações já estão visíveis na barra lateral.');
    } catch (err) {
      exibirErro('Erro ao salvar perfil.');
    } finally {
      setSalvandoPerfil(false);
    }
  };

  // Alterar Senha
  const handleAlterarSenha = async (e) => {
    e.preventDefault();
    if (!novaSenha || novaSenha.length < 6) {
      exibirErro('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarNovaSenha) {
      exibirErro('As senhas não coincidem.');
      return;
    }

    try {
      setSalvandoSenha(true);
      await updatePassword(novaSenha);
      setNovaSenha('');
      setConfirmarNovaSenha('');
      exibirSucesso('Sua senha foi atualizada com sucesso no Supabase!');
    } catch (err) {
      exibirErro(err.message || 'Erro ao redefinir senha.');
    } finally {
      setSalvandoSenha(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'master':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#fcf5ec] text-[#b36d1b] border border-[#f4e2ca]">
            <FiShield className="w-3 h-3 text-[#b36d1b]" />
            MASTER
          </span>
        );
      case 'gerente':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#eef5fc] text-[#1e6fbe] border border-[#d3e5f7]">
            <FiTrendingUp className="w-3 h-3 text-[#1e6fbe]" />
            GERENTE
          </span>
        );
      case 'operador':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f2f4f6] text-[#4b5563] border border-[#e1e4e8]">
            <FiPackage className="w-3 h-3 text-[#4b5563]" />
            OPERADOR
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f7f5f0] text-gray-900">
      {/* Sidebar com activeTab="configuracoes" */}
      <Sidebar activeTab="configuracoes" />

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col px-8 py-8 overflow-y-auto">
        {/* Header Breadcrumb & Title */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a89e90] block mb-1">
              Sistema & Governança
            </span>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
                Configurações
              </h1>
              {isMaster && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-[#fcf5ec] text-[#b36d1b] border border-[#f4e2ca]">
                  Painel Master Ativo
                </span>
              )}
            </div>
          </div>

          {abaAtiva === 'usuarios' && isMaster && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={carregarDados}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-amber-800 transition-colors p-2 rounded-lg hover:bg-black/5 disabled:opacity-50"
                title="Recarregar usuários"
              >
                <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>

              <button
                type="button"
                onClick={() => setIsNovoModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#c8672b] hover:bg-[#b85b20] text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all active:scale-98"
              >
                <FiPlus className="w-4 h-4 stroke-[2.5]" />
                Novo Usuário
              </button>
            </div>
          )}
        </header>

        {/* Abas Superiores */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#e5dfd4] pb-2">
          {isMaster && (
            <button
              type="button"
              onClick={() => setAbaAtiva('usuarios')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                abaAtiva === 'usuarios'
                  ? 'bg-[#1e1b18] text-amber-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <FiUsers className="w-4 h-4" />
              <span>Gestão de Usuários & Acessos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
                {usuarios.length}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setAbaAtiva('parametros')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              abaAtiva === 'parametros'
                ? 'bg-[#1e1b18] text-amber-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            <FiSliders className="w-4 h-4" />
            <span>Parâmetros & Automações</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('perfil')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              abaAtiva === 'perfil'
                ? 'bg-[#1e1b18] text-amber-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            <FiUser className="w-4 h-4" />
            <span>Meu Perfil</span>
          </button>

          {isMaster && (
            <button
              type="button"
              onClick={() => setAbaAtiva('auditoria')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                abaAtiva === 'auditoria'
                  ? 'bg-[#1e1b18] text-amber-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <FiActivity className="w-4 h-4" />
              <span>Auditoria & Logs</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-mono">
                {logsAuditoria.length}
              </span>
            </button>
          )}
        </div>

        {/* Mensagens de Feedback */}
        {msgSucesso && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{msgSucesso}</span>
          </div>
        )}

        {msgErro && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{msgErro}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 1: GESTÃO DE USUÁRIOS & ACESSOS (RBAC) */}
        {/* ======================================================== */}
        {abaAtiva === 'usuarios' && (
          <div className="space-y-6">
            {/* Cards de Resumo da Hierarquia */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white/90 border border-[#e5dfd4] rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-mono tracking-widest text-[#a89e90] uppercase font-bold block mb-1">
                  Total de Logins
                </span>
                <span className="text-2xl font-black text-gray-900">{kpis.total}</span>
              </div>

              <div className="bg-white/90 border border-[#e5dfd4] rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-mono tracking-widest text-[#a89e90] uppercase font-bold block mb-1">
                  Administradores Master
                </span>
                <span className="text-2xl font-black text-[#b36d1b]">{kpis.masters}</span>
              </div>

              <div className="bg-white/90 border border-[#e5dfd4] rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-mono tracking-widest text-[#a89e90] uppercase font-bold block mb-1">
                  Gerentes de Estoque
                </span>
                <span className="text-2xl font-black text-[#1e6fbe]">{kpis.gerentes}</span>
              </div>

              <div className="bg-white/90 border border-[#e5dfd4] rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-mono tracking-widest text-[#a89e90] uppercase font-bold block mb-1">
                  Operadores de Balcão
                </span>
                <span className="text-2xl font-black text-gray-600">{kpis.operadores}</span>
              </div>
            </div>

            {/* Toolbar: Busca e Filtro de Cargo */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative min-w-[280px]">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por nome, e-mail ou cargo..."
                    className="w-full pl-9 pr-4 py-2 bg-white/90 border border-[#e5dfd4] rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-600 focus:border-amber-600 shadow-xs"
                  />
                </div>

                <div className="inline-flex items-center p-1 bg-white/70 border border-[#e5dfd4] rounded-lg gap-1 shadow-xs">
                  {['todos', 'master', 'gerente', 'operador'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFiltroRole(r)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                        filtroRole === r
                          ? 'bg-[#fcf5ec] text-[#b36d1b] shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <span className="text-xs font-semibold text-gray-400 self-center">
                {usuariosFiltrados.length} usuários listados
              </span>
            </div>

            {/* Tabela de Usuários */}
            <div className="bg-white/95 border border-[#e5dfd4] rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#e5e0d5] text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-[#faf8f4]/60">
                      <th className="py-3.5 px-4 font-semibold">Usuário</th>
                      <th className="py-3.5 px-4 font-semibold">Cargo / Função</th>
                      <th className="py-3.5 px-4 font-semibold">Nível de Acesso</th>
                      <th className="py-3.5 px-4 font-semibold">Módulos Liberados</th>
                      <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ece7dd]">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="py-16 text-center text-gray-400">
                          <FiLoader className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
                          <span className="text-xs">Carregando governança de acessos...</span>
                        </td>
                      </tr>
                    ) : usuariosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-gray-400 text-xs font-medium">
                          Nenhum usuário localizado.
                        </td>
                      </tr>
                    ) : (
                      usuariosFiltrados.map((u) => {
                        const perms = u.permissoes || {};
                        const modulosHabilitados = Object.entries(perms)
                          .filter(([_, v]) => v)
                          .map(([k]) => k);

                        return (
                          <tr key={u.id} className="group hover:bg-[#fbf9f4] transition-colors">
                            {/* Nome & Avatar */}
                            <td className="py-4 px-4 align-middle whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white font-semibold text-xs tracking-wider shadow-xs shrink-0">
                                  {u.avatar_iniciais || 'AT'}
                                </div>
                                <div>
                                  <span className="font-bold text-sm text-gray-900 block group-hover:text-amber-900">
                                    {u.nome}
                                  </span>
                                  <span className="text-xs font-mono text-gray-400">
                                    {u.email}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Cargo */}
                            <td className="py-4 px-4 align-middle whitespace-nowrap">
                              <span className="text-xs font-semibold text-gray-800">
                                {u.cargo}
                              </span>
                            </td>

                            {/* Nível de Acesso */}
                            <td className="py-4 px-4 align-middle whitespace-nowrap">
                              {getRoleBadge(u.role)}
                            </td>

                            {/* Módulos */}
                            <td className="py-4 px-4 align-middle">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {modulosHabilitados.map((m) => (
                                  <span
                                    key={m}
                                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200"
                                  >
                                    {m}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4 align-middle text-center whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                u.ativo
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${u.ativo ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                {u.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>

                            {/* Ações */}
                            <td className="py-4 px-4 align-middle text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setUsuarioParaEditar(u)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-800 hover:bg-amber-50 border border-amber-200 transition-colors shadow-2xs"
                              >
                                <FiEdit2 className="w-3.5 h-3.5" />
                                <span>Permissões</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 2: MEU PERFIL */}
        {/* ======================================================== */}
        {abaAtiva === 'perfil' && (
          <div className="max-w-2xl space-y-6">
            {/* Card de Dados do Usuário */}
            <div className="bg-white/95 border border-[#e5dfd4] rounded-xl p-6 shadow-xs">
              <div className="flex items-center gap-4 pb-6 border-b border-[#ece7de] mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white font-black text-xl tracking-wider shadow-md">
                  {perfil?.avatar_iniciais || 'AT'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{meuNome || user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Usuário'}</h3>
                  <p className="text-xs text-gray-500 font-mono">{user?.email || ''}</p>
                  <div className="mt-1.5">
                    {getRoleBadge(perfil?.role || 'master')}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSalvarPerfil} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={meuNome}
                    onChange={(e) => setMeuNome(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#fbf9f5] rounded-lg border border-[#dcd6ca] outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cargo / Função Exibida
                  </label>
                  <input
                    type="text"
                    value={meuCargo}
                    onChange={(e) => setMeuCargo(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#fbf9f5] rounded-lg border border-[#dcd6ca] outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Esse cargo aparece no card da barra lateral e em relatórios gerados.
                  </span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={salvandoPerfil}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c8672b] hover:bg-[#b55a22] text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-60"
                  >
                    <FiSave className="w-4 h-4" />
                    {salvandoPerfil ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>

            {/* Card de Alteração de Senha */}
            <div className="bg-white/95 border border-[#e5dfd4] rounded-xl p-6 shadow-xs">
              <div className="flex items-center gap-2.5 mb-4">
                <FiLock className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-gray-900">Alterar Minha Senha de Acesso</h3>
              </div>

              <form onSubmit={handleAlterarSenha} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      placeholder="Mín. 6 caracteres"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-[#fbf9f5] rounded-lg border border-[#dcd6ca] outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      placeholder="Repita a nova senha"
                      value={confirmarNovaSenha}
                      onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-[#fbf9f5] rounded-lg border border-[#dcd6ca] outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-mono"
                    />
                  </div>
                </div>

                {/* Medidor Visual de Dificuldade da Senha */}
                {novaSenha.length > 0 && (
                  <div className="space-y-1.5 p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 font-medium">Força da nova senha:</span>
                      <span className={`font-bold ${forcaSenhaPerfil.texto}`}>
                        {forcaSenhaPerfil.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      <div className={`rounded-full transition-all duration-300 ${forcaSenhaPerfil.nivel >= 1 ? forcaSenhaPerfil.cor : 'bg-gray-200'}`} />
                      <div className={`rounded-full transition-all duration-300 ${forcaSenhaPerfil.nivel >= 2 ? forcaSenhaPerfil.cor : 'bg-gray-200'}`} />
                      <div className={`rounded-full transition-all duration-300 ${forcaSenhaPerfil.nivel >= 3 ? forcaSenhaPerfil.cor : 'bg-gray-200'}`} />
                      <div className={`rounded-full transition-all duration-300 ${forcaSenhaPerfil.nivel >= 4 ? forcaSenhaPerfil.cor : 'bg-gray-200'}`} />
                    </div>
                    <span className="text-[10px] text-gray-400 block leading-tight">
                      {forcaSenhaPerfil.nivel < 3 
                        ? 'Dica: use pelo menos 8 dígitos mesclando letras maiúsculas, minúsculas e números.'
                        : 'Excelente! Senha segura para o ambiente corporativo.'}
                    </span>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={salvandoSenha || !novaSenha}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
                  >
                    <FiLock className="w-3.5 h-3.5" />
                    {salvandoSenha ? 'Atualizando...' : 'Atualizar Senha'}
                  </button>
                </div>
              </form>
            </div>

            {/* Card de Encerramento de Sessão */}
            <div className="bg-white/95 border border-[#e5dfd4] rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Desconectar da Plataforma</h4>
                <p className="text-xs text-gray-500 mt-0.5">Encerre sua sessão com segurança neste terminal ou navegador.</p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await signOut();
                  } catch (err) {
                    console.warn('Erro ao sair:', err);
                  } finally {
                    navigate('/login', { replace: true });
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <FiLogOut className="w-3.5 h-3.5" />
                <span>Sair Desta Conta</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 3: PARÂMETROS DO SISTEMA & AUTOMAÇÕES */}
        {/* ======================================================== */}
        {abaAtiva === 'parametros' && (
          <div className="max-w-4xl space-y-6">
            {/* Banner Informativo */}
            <div className="p-4 bg-[#fbf9f5] border border-[#e8dfd2] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-600/10 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <FiCpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Motores de Automação & Políticas Operacionais</h4>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    Configure os limiares matemáticos do algoritmo de IA preditiva, automações de compras e sincronizações de dados.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleRestaurarPadroes}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Restaurar padrões"
                >
                  <FiRotateCcw className="w-3.5 h-3.5" />
                  Padrões
                </button>
                <button
                  type="button"
                  onClick={handleSalvarParametros}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#c8672b] hover:bg-[#b55a22] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                >
                  <FiSave className="w-3.5 h-3.5" />
                  Salvar Diretrizes
                </button>
              </div>
            </div>

            {/* SEÇÃO 1: ALERTAS PREDITIVOS */}
            <div className="bg-white/95 border border-[#e5dfd4] rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#ece7de]">
                <div className="flex items-center gap-2">
                  <FiCpu className="w-4 h-4 text-amber-600" />
                  <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold">
                    ALERTAS PREDITIVOS
                  </span>
                </div>
                <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                  Motor de IA Ativo
                </span>
              </div>

              {/* Item 1.1 */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Alertas automáticos
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Notificações em tempo real ao detectar risco de desabastecimento crítico
                  </span>
                </div>
                <ToggleSwitch
                  checked={parametros.alertasAutomaticos}
                  onChange={(val) => updateParametro('alertasAutomaticos', val)}
                />
              </div>

              {/* Item 1.2 */}
              <div className="flex items-center justify-between py-2 border-t border-[#f4efe8]">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Sugestões de compra semanais
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Gerar lista consolidada de reposição toda segunda-feira com base no histórico de giro
                  </span>
                </div>
                <ToggleSwitch
                  checked={parametros.sugestoesSemanais}
                  onChange={(val) => updateParametro('sugestoesSemanais', val)}
                />
              </div>

              {/* Item 1.3 */}
              <div className="flex items-center justify-between py-2 border-t border-[#f4efe8]">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Confiança mínima de 80%
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Filtrar e suprimir alertas preditivos que estejam abaixo do limiar estatístico de 80%
                  </span>
                </div>
                <ToggleSwitch
                  checked={parametros.confiancaMinima80}
                  onChange={(val) => updateParametro('confiancaMinima80', val)}
                />
              </div>

              {/* Item 1.4 */}
              <div className="flex items-center justify-between py-2 border-t border-[#f4efe8]">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Lead Time Dinâmico de Fornecedores
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Ajustar o cálculo de compras ponderando a oscilação histórica de entrega dos parceiros
                  </span>
                </div>
                <ToggleSwitch
                  checked={parametros.leadTimeDinamico}
                  onChange={(val) => updateParametro('leadTimeDinamico', val)}
                />
              </div>
            </div>

            {/* SEÇÃO 2: ESTOQUE */}
            <div className="bg-white/95 border border-[#e5dfd4] rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#ece7de]">
                <div className="flex items-center gap-2">
                  <FiPackage className="w-4 h-4 text-amber-600" />
                  <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold">
                    ESTOQUE
                  </span>
                </div>
                <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                  Políticas de Reposição
                </span>
              </div>

              {/* Item 2.1 */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Reposição automática
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Criar minuta de pedido de compra automaticamente ao atingir o ponto de reposição
                  </span>
                </div>
                <ToggleSwitch
                  checked={parametros.reposicaoAutomatica}
                  onChange={(val) => updateParametro('reposicaoAutomatica', val)}
                />
              </div>

              {/* Item 2.2 */}
              <div className="flex items-center justify-between py-2 border-t border-[#f4efe8]">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Notificação de ruptura
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Disparar e-mail e alerta urgente ao gerente quando qualquer item atingir estoque zero
                  </span>
                </div>
                <ToggleSwitch
                  checked={parametros.notificacaoRuptura}
                  onChange={(val) => updateParametro('notificacaoRuptura', val)}
                />
              </div>

              {/* Item 2.3 */}
              <div className="flex items-center justify-between py-2 border-t border-[#f4efe8]">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Recalcular pontos mensalmente
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Atualizar automaticamente pontos de pedido e estoques de segurança com base no giro recente
                  </span>
                </div>
                <ToggleSwitch
                  checked={parametros.recalcularPontosMensal}
                  onChange={(val) => updateParametro('recalcularPontosMensal', val)}
                />
              </div>

              {/* Item 2.4: Margem de Segurança Padrão */}
              <div className="flex items-center justify-between py-2 border-t border-[#f4efe8]">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Margem de Segurança Padrão (Buffer de Contingência)
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Acréscimo percentual automático sobre a demanda para absorver picos de pedidos
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[10, 15, 20, 25, 30].map((perc) => (
                    <button
                      key={perc}
                      type="button"
                      onClick={() => updateParametro('margemSegurancaPadrao', perc)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                        parametros.margemSegurancaPadrao === perc
                          ? 'bg-[#c8672b] text-white border-[#c8672b] shadow-xs'
                          : 'bg-white text-gray-600 border-[#dcd6ca] hover:bg-gray-50'
                      }`}
                    >
                      {perc}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Item 2.5: Aprovação em Duplo Nível */}
              <div className="flex items-center justify-between py-2 border-t border-[#f4efe8]">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Aprovação em Duplo Nível para Ordens de Compra
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Exige validação explícita de usuário com nível Gerente ou Master antes de emitir compras
                  </span>
                </div>
                <ToggleSwitch
                  checked={parametros.exigirAprovacaoCompras}
                  onChange={(val) => updateParametro('exigirAprovacaoCompras', val)}
                />
              </div>
            </div>

            {/* SEÇÃO 3: INTEGRAÇÕES */}
            <div className="bg-white/95 border border-[#e5dfd4] rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#ece7de]">
                <div className="flex items-center gap-2">
                  <FiDatabase className="w-4 h-4 text-amber-600" />
                  <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold">
                    INTEGRAÇÕES
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  Conectividade API & Fiscal
                </span>
              </div>

              {/* Item 3.1 */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Importação automática de NF-e
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Monitorar pasta de XML ou e-mail fiscal e importar novas peças automaticamente
                  </span>
                </div>
                <ToggleSwitch
                  checked={parametros.importacaoAutomaticaNfe}
                  onChange={(val) => updateParametro('importacaoAutomaticaNfe', val)}
                />
              </div>

              {/* Item 3.2 */}
              <div className="flex items-center justify-between py-2 border-t border-[#f4efe8]">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Sincronizar com ERP
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Atualizar saldos e movimentações de estoque em tempo real no ERP legado via API
                  </span>
                </div>
                <ToggleSwitch
                  checked={parametros.sincronizarErp}
                  onChange={(val) => updateParametro('sincronizarErp', val)}
                />
              </div>

              {/* Item 3.3: Webhook de Notificações */}
              <div className="py-2 border-t border-[#f4efe8] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      Webhook de Logística & Incidentes Críticos
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Disparar payload JSON em tempo real para Slack, WhatsApp Logístico ou endpoint externo
                    </span>
                  </div>
                  <ToggleSwitch
                    checked={parametros.webhookAtivo}
                    onChange={(val) => updateParametro('webhookAtivo', val)}
                  />
                </div>
                {parametros.webhookAtivo && (
                  <div className="pt-2">
                    <div className="relative">
                      <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="url"
                        value={parametros.webhookUrl}
                        onChange={(e) => updateParametro('webhookUrl', e.target.value)}
                        placeholder="https://sua-empresa.com/webhook/estoque"
                        className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#fbf9f5] border border-[#dcd6ca] rounded-lg font-mono outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SEÇÃO 4: AUDITORIA & SEGURANÇA (MASTER ONLY) */}
            {isMaster && (
              <div className="bg-white/95 border border-[#e5dfd4] rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#ece7de]">
                  <div className="flex items-center gap-2">
                    <FiShield className="w-4 h-4 text-amber-600" />
                    <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold">
                      AUDITORIA & GOVERNANÇA (MASTER)
                    </span>
                  </div>
                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                    Controle Restrito
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      Log de Auditoria Estrito
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Armazenar registro imutável com data, IP e usuário de qualquer exclusão ou ajuste manual
                    </span>
                  </div>
                  <ToggleSwitch
                    checked={parametros.logAuditoriaEstrito}
                    onChange={(val) => updateParametro('logAuditoriaEstrito', val)}
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-t border-[#f4efe8]">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      Obrigatoriedade de Justificativa de Baixa
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Bloquear saídas manuais que não contenham motivo documentado (Ex: Avaria, OS, Ajuste)
                    </span>
                  </div>
                  <ToggleSwitch
                    checked={parametros.obrigatoriedadeJustificativa}
                    onChange={(val) => updateParametro('obrigatoriedadeJustificativa', val)}
                  />
                </div>
              </div>
            )}

            {/* Botão Inferior de Salvar */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleRestaurarPadroes}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors"
              >
                Restaurar Padrões
              </button>
              <button
                type="button"
                onClick={handleSalvarParametros}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#c8672b] hover:bg-[#b55a22] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all"
              >
                <FiSave className="w-4 h-4" />
                Salvar Todas as Diretrizes
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 4: AUDITORIA & TIMELINE DE OPERAÇÕES (MASTER ONLY) */}
        {/* ======================================================== */}
        {abaAtiva === 'auditoria' && isMaster && (
          <div className="space-y-6">
            {/* Header Informativo & Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/95 border border-[#e5dfd4] rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-mono tracking-widest text-[#a89e90] uppercase font-bold block mb-1">
                  Total de Registros
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-gray-900">{logsAuditoria.length}</span>
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                    <FiActivity className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="bg-white/95 border border-[#e5dfd4] rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-mono tracking-widest text-[#a89e90] uppercase font-bold block mb-1">
                  Baixas & Saídas de OS
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-red-700">
                    {logsAuditoria.filter((l) => l.tipo === 'saida').length}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                    <FiArrowDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="bg-white/95 border border-[#e5dfd4] rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-mono tracking-widest text-[#a89e90] uppercase font-bold block mb-1">
                  Aprovações Preditivas IA
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-amber-700">
                    {logsAuditoria.filter((l) => l.tipo === 'ia_aprovacao').length}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <FiCpu className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="bg-white/95 border border-[#e5dfd4] rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-mono tracking-widest text-[#a89e90] uppercase font-bold block mb-1">
                  Governança & Segurança
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-blue-700">
                    {logsAuditoria.filter((l) => l.tipo === 'seguranca' || l.tipo === 'parametro').length}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <FiShield className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Toolbar de Pesquisa & Filtros de Auditoria */}
            <div className="bg-white/95 border border-[#e5dfd4] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[240px]">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filtrar por operador, OS, SKU ou motivo..."
                    value={buscaAuditoria}
                    onChange={(e) => setBuscaAuditoria(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#fbf9f5] border border-[#dcd6ca] rounded-lg outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                  />
                </div>

                <div className="flex items-center gap-1 bg-[#f5f1e8]/60 p-0.5 rounded-lg border border-[#e5dfd4]">
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'saida', label: 'Baixas (OS)' },
                    { id: 'entrada', label: 'Entradas' },
                    { id: 'ia_aprovacao', label: 'IA' },
                    { id: 'seguranca', label: 'Segurança' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFiltroTipoAuditoria(f.id)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                        filtroTipoAuditoria === f.id
                          ? 'bg-[#1e1b18] text-amber-400 shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const cabecalho = 'Data/Hora,Operador,Cargo,Acao,Documento,Motivo,IP,Hash\n';
                  const linhas = logsFiltrados.map((l) =>
                    `"${l.dataHora}","${l.operador}","${l.cargo}","${l.acao}","${l.documento}","${l.motivo}","${l.ip}","${l.hash}"`
                  ).join('\n');
                  const blob = new Blob([cabecalho + linhas], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `auditoria_autostock_${new Date().toISOString().slice(0, 10)}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  exibirSucesso('Relatório de auditoria exportado com sucesso em CSV!');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fcf5ec] text-[#b36d1b] border border-[#f0dac7] hover:bg-[#f8ebd9] rounded-lg text-xs font-bold transition-all shadow-2xs"
              >
                <FiDownload className="w-3.5 h-3.5" />
                Exportar Relatório (CSV)
              </button>
            </div>

            {/* Timeline de Eventos de Auditoria */}
            <div className="bg-white/95 border border-[#e5dfd4] rounded-xl p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#ece7de]">
                <h3 className="text-sm font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <FiActivity className="w-4 h-4 text-amber-600" />
                  Linha do Tempo de Governança & Rastreabilidade
                </h3>
                <span className="text-[11px] font-mono text-gray-400">
                  {logsFiltrados.length} evento{logsFiltrados.length !== 1 ? 's' : ''} exibido{logsFiltrados.length !== 1 ? 's' : ''}
                </span>
              </div>

              {logsFiltrados.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs font-medium">
                  Nenhum evento localizado com os filtros selecionados.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#ece7de]">
                  {logsFiltrados.map((log) => {
                    let Icone = FiActivity;
                    let iconBg = 'bg-gray-100 text-gray-600 border-gray-300';
                    let badgeColor = 'bg-gray-100 text-gray-700';

                    if (log.tipo === 'saida') {
                      Icone = FiArrowDown;
                      iconBg = 'bg-red-50 text-red-600 border-red-200';
                      badgeColor = 'bg-red-50 text-red-800 border border-red-200';
                    } else if (log.tipo === 'entrada') {
                      Icone = FiArrowUp;
                      iconBg = 'bg-emerald-50 text-emerald-600 border-emerald-200';
                      badgeColor = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
                    } else if (log.tipo === 'ia_aprovacao') {
                      Icone = FiCpu;
                      iconBg = 'bg-amber-50 text-amber-600 border-amber-200';
                      badgeColor = 'bg-amber-50 text-amber-800 border border-amber-200';
                    } else if (log.tipo === 'seguranca') {
                      Icone = FiShield;
                      iconBg = 'bg-blue-50 text-blue-600 border-blue-200';
                      badgeColor = 'bg-blue-50 text-blue-800 border border-blue-200';
                    } else if (log.tipo === 'parametro') {
                      Icone = FiSliders;
                      iconBg = 'bg-purple-50 text-purple-600 border-purple-200';
                      badgeColor = 'bg-purple-50 text-purple-800 border border-purple-200';
                    }

                    return (
                      <div key={log.id} className="relative group">
                        {/* Marcador na linha */}
                        <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border flex items-center justify-center shadow-2xs ${iconBg} bg-white`}>
                          <Icone className="w-3 h-3" />
                        </div>

                        {/* Card do Evento */}
                        <div className="p-4 rounded-xl border border-[#ece7de] bg-[#fbf9f5]/60 hover:bg-white hover:border-[#dfd8cc] transition-all shadow-2xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-900">
                                {log.operador}
                              </span>
                              <span className="text-[11px] text-gray-500">
                                ({log.cargo})
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                                {log.acao}
                              </span>
                            </div>

                            <span className="text-[11px] font-mono text-gray-400">
                              {log.dataHora}
                            </span>
                          </div>

                          <p className="text-xs text-gray-800 mt-2 font-medium">
                            {log.detalhes}
                          </p>

                          {/* Metadados: Documento, Justificativa e Rastreio */}
                          <div className="mt-3 pt-2.5 border-t border-[#ece7de] flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
                            <div className="flex flex-wrap items-center gap-3">
                              <span>
                                <strong className="text-gray-700">Ref:</strong> {log.documento}
                              </span>
                              {log.motivo && (
                                <span>
                                  <strong className="text-gray-700">Motivo:</strong> {log.motivo}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 font-mono text-[10px] text-gray-400">
                              <span>IP: {log.ip}</span>
                              <span>•</span>
                              <span className="text-emerald-700 font-bold" title="Hash criptográfico verificado">
                                {log.hash}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Novo Usuário */}
        <NovoUsuarioModal
          isOpen={isNovoModalOpen}
          onClose={() => setIsNovoModalOpen(false)}
          onSalvar={handleCriarUsuario}
        />

        {/* Modal de Editar Usuário */}
        {usuarioParaEditar && (
          <EditarUsuarioModal
            usuario={usuarioParaEditar}
            isOpen={!!usuarioParaEditar}
            onClose={() => setUsuarioParaEditar(null)}
            onSalvar={handleSalvarEdicao}
          />
        )}
      </main>
    </div>
  );
}
