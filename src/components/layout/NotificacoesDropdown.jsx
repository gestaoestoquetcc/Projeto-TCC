import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiBell, 
  FiCheck, 
  FiTrash2, 
  FiAlertTriangle, 
  FiTrendingUp, 
  FiPackage, 
  FiTruck, 
  FiX,
  FiExternalLink
} from 'react-icons/fi';
import { getPecas } from '../../services/pecasService';
import { getMovimentacoes } from '../../services/movimentacoesService';

export default function NotificacoesDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [lidasIds, setLidasIds] = useState(() => {
    try {
      const salvo = localStorage.getItem('@autostock_notif_lidas');
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Carregar dados 100% reais de peças em risco e movimentações recentes
  const carregarNotificacoesReais = useCallback(async () => {
    try {
      const [pecas, movs] = await Promise.all([
        getPecas().catch(() => []),
        getMovimentacoes().catch(() => [])
      ]);

      const lista = [];

      // 1. Alertas de Ruptura / Estoque Crítico
      const pecasCriticas = pecas.filter(
        (p) => p.status === 'critico' || p.quantidade <= p.pontoReposicao
      );

      pecasCriticas.forEach((p) => {
        lista.push({
          id: `crit_${p.id}`,
          tipo: 'ruptura',
          titulo: 'Risco de Ruptura de Estoque',
          mensagem: `${p.nome} (${p.codigo}) atingiu ${p.quantidade} un. Abaixo do limite mínimo (${p.pontoReposicao}).`,
          tempo: 'Prioritário',
          link: '/pecas'
        });
      });

      // 2. Alertas de Atenção
      const pecasAtencao = pecas.filter(
        (p) => p.status === 'atencao' && !pecasCriticas.some((c) => c.id === p.id)
      );

      pecasAtencao.forEach((p) => {
        lista.push({
          id: `atenc_${p.id}`,
          tipo: 'ia',
          titulo: 'Alerta de Reposição Preventiva',
          mensagem: `${p.nome} (${p.codigo}) possui ${p.quantidade} un. e está próximo ao ponto de pedido.`,
          tempo: 'Recomendado',
          link: '/previsao'
        });
      });

      // 3. Últimas Movimentações Realizadas
      movs.slice(0, 3).forEach((m) => {
        lista.push({
          id: `mov_${m.id}`,
          tipo: m.tipo === 'entrada' ? 'estoque' : 'fornecedor',
          titulo: m.tipo === 'entrada' ? 'Entrada Processada' : 'Saída Registrada',
          mensagem: `${m.quantidade} un. de ${m.pecaNome} — Doc: ${m.documento}`,
          tempo: m.hora || 'Hoje',
          link: '/movimentacao'
        });
      });

      setNotificacoes(lista);
    } catch (err) {
      console.warn('Erro ao carregar notificações reais:', err);
    }
  }, []);

  useEffect(() => {
    carregarNotificacoesReais();
  }, [carregarNotificacoesReais]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const naoLidas = notificacoes.filter((n) => !lidasIds.includes(n.id)).length;

  const marcarComoLida = (id) => {
    setLidasIds((prev) => {
      const novos = [...prev, id];
      localStorage.setItem('@autostock_notif_lidas', JSON.stringify(novos));
      return novos;
    });
  };

  const marcarTodasLidas = () => {
    const todosIds = notificacoes.map((n) => n.id);
    setLidasIds(todosIds);
    localStorage.setItem('@autostock_notif_lidas', JSON.stringify(todosIds));
  };

  const limparTodas = () => {
    const todosIds = notificacoes.map((n) => n.id);
    setLidasIds(todosIds);
    localStorage.setItem('@autostock_notif_lidas', JSON.stringify(todosIds));
    setNotificacoes([]);
  };

  const handleItemClick = (n) => {
    marcarComoLida(n.id);
    setIsOpen(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  const getIcone = (tipo) => {
    switch (tipo) {
      case 'ruptura':
        return <FiAlertTriangle className="w-4 h-4 text-red-500 shrink-0" />;
      case 'ia':
        return <FiTrendingUp className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'fornecedor':
        return <FiTruck className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'estoque':
      default:
        return <FiPackage className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão Sino */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir notificações"
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a202c] transition-colors focus:outline-none cursor-pointer"
      >
        <FiBell className="w-5 h-5" />
        {naoLidas > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#c8672b] text-[10px] font-black text-white shadow-sm">
            {naoLidas}
          </span>
        )}
      </button>

      {/* Backdrop transparente/escuro para fechar ao tocar fora */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs sm:bg-black/20" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Painel Dropdown Responsivo */}
      {isOpen && (
        <div className="fixed inset-x-3 top-16 max-w-sm mx-auto sm:max-w-none sm:mx-0 sm:fixed sm:inset-x-auto sm:left-64 sm:top-4 sm:w-96 rounded-2xl bg-[#161b22] border border-[#2d3748] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header do Dropdown */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d3748] bg-[#0d1117]/90">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-200 tracking-wide uppercase">
                Central de Alertas
              </span>
              {naoLidas > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {naoLidas} pendente{naoLidas > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {naoLidas > 0 && (
                <button
                  type="button"
                  onClick={marcarTodasLidas}
                  title="Marcar todas como lidas"
                  className="p-1 rounded text-gray-400 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <FiCheck className="w-4 h-4" />
                </button>
              )}
              {notificacoes.length > 0 && (
                <button
                  type="button"
                  onClick={limparTodas}
                  title="Limpar histórico"
                  className="p-1 rounded text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Fechar"
                className="p-1 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lista de Notificações Reais */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#21262d]">
            {notificacoes.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                <FiBell className="w-7 h-7 mx-auto mb-2 text-gray-600 stroke-[1.5]" />
                <span className="font-medium text-gray-300 block">Nenhum alerta pendente</span>
                <span className="text-gray-500 mt-1 block">Todas as peças e movimentações estão em dia.</span>
              </div>
            ) : (
              notificacoes.map((item) => {
                const isLida = lidasIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3.5 hover:bg-[#1c2128] transition-colors cursor-pointer flex items-start gap-3 group relative ${
                      isLida ? 'opacity-65' : 'bg-[#1b222d]/40'
                    }`}
                  >
                    <div className="mt-0.5">{getIcone(item.tipo)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs tracking-tight truncate ${
                          isLida ? 'text-gray-400 font-medium' : 'text-gray-100 font-bold'
                        }`}>
                          {item.titulo}
                        </span>
                        <span className="text-[10px] text-gray-500 shrink-0 font-mono">
                          {item.tempo}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-400 mt-1 leading-snug line-clamp-2">
                        {item.mensagem}
                      </p>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-[#c8672b] group-hover:underline flex items-center gap-0.5">
                          Visualizar <FiExternalLink className="w-2.5 h-2.5" />
                        </span>

                        {!isLida && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              marcarComoLida(item.id);
                            }}
                            className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                          >
                            Marcar lida
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
