import React, { useState, useMemo } from 'react';
import { FiX, FiArrowRight, FiCheckCircle, FiTrendingUp, FiShoppingBag, FiInfo } from 'react-icons/fi';

export default function AlertasPreditivos({ pecas = [], onGerarPedido, onAbrirDetalheIA }) {
  const [dispensados, setDispensados] = useState([]);
  const [modalDetalhe, setModalDetalhe] = useState(null);

  // Gerar alertas dinamicamente a partir das peças reais cadastradas no Supabase
  const alertas = useMemo(() => {
    if (!pecas || pecas.length === 0) return [];

    const lista = [];

    // Peças críticas (ruptura)
    const criticas = pecas.filter(
      (p) => p.status === 'critico' || p.quantidade <= (p.pontoReposicao || 0)
    );

    criticas.forEach((p) => {
      lista.push({
        id: `alert_crit_${p.id}`,
        tipo: 'ruptura',
        badgeLabel: 'RUPTURA',
        codigo: p.codigo,
        titulo: p.nome,
        descricao: `Apenas ${p.quantidade} un. em estoque físico. Ponto de reposição (${p.pontoReposicao}) violado.`,
        percentual: 96,
        acaoLabel: 'Gerar Entrada',
        detalhes: {
          categoria: p.categoria || p.segmento || 'Geral',
          frotaAlvo: 'Reposição Prioritária',
          consumoMedioSemanal: `${Math.max(2, Math.round(p.quantidade * 0.4))} un/sem`,
          projecaoDemanda: 'Risco de parada de atendimento no balcão por falta de produto.',
          sugestaoCompra: Math.max(10, (p.pontoReposicao * 2) - p.quantidade)
        }
      });
    });

    // Peças em atenção
    const emAtencao = pecas.filter(
      (p) => p.status === 'atencao' && !criticas.some((c) => c.id === p.id)
    );

    emAtencao.forEach((p) => {
      lista.push({
        id: `alert_atenc_${p.id}`,
        tipo: 'atencao',
        badgeLabel: 'ATENÇÃO',
        codigo: p.codigo,
        titulo: p.nome,
        descricao: `Saldo de ${p.quantidade} un. Próximo ao estoque mínimo de segurança (${p.pontoReposicao}).`,
        percentual: 85,
        acaoLabel: 'Ver Estoque',
        detalhes: {
          categoria: p.categoria || p.segmento || 'Geral',
          frotaAlvo: 'Demanda Regular',
          consumoMedioSemanal: `${Math.max(1, Math.round(p.quantidade * 0.2))} un/sem`,
          projecaoDemanda: 'Curva de giro indica necessidade de reabastecimento preventivo nos próximos dias.',
          sugestaoCompra: Math.max(5, p.pontoReposicao - p.quantidade + 10)
        }
      });
    });

    return lista.filter((a) => !dispensados.includes(a.id));
  }, [pecas, dispensados]);

  const handleDismiss = (id, e) => {
    e.stopPropagation();
    setDispensados((prev) => [...prev, id]);
  };

  const handleAcaoClick = (alerta) => {
    if (alerta.tipo === 'ruptura' && onGerarPedido) {
      onGerarPedido(alerta);
    } else {
      setModalDetalhe(alerta);
      if (onAbrirDetalheIA) onAbrirDetalheIA(alerta);
    }
  };

  const getAlertStyles = (tipo) => {
    switch (tipo) {
      case 'ruptura':
        return {
          cardBg: 'bg-[#fcf5f5] hover:bg-[#faefef]',
          border: 'border-[#f8d7d7]',
          badge: 'bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]',
          progress: 'bg-[#dc2626]',
          progressText: 'text-[#dc2626]',
          btn: 'border-[#fca5a5] text-[#dc2626] hover:bg-[#fee2e2]'
        };
      case 'atencao':
      default:
        return {
          cardBg: 'bg-[#fefcf6] hover:bg-[#fcf8ed]',
          border: 'border-[#faecc8]',
          badge: 'bg-[#fef3c7] text-[#d97706] border border-[#fde68a]',
          progress: 'bg-[#d97706]',
          progressText: 'text-[#d97706]',
          btn: 'border-[#fcd34d] text-[#d97706] hover:bg-[#fef3c7]'
        };
    }
  };

  return (
    <section className="mb-8">
      {/* Header da Seção */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold">
            Alertas Preditivos de Estoque
          </span>
          {alertas.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
              {alertas.length} {alertas.length === 1 ? 'pendência' : 'pendências'}
            </span>
          )}
        </div>
      </div>

      {/* Grid de Alertas */}
      {alertas.length === 0 ? (
        <div className="p-5 bg-white border border-[#e5dfd4] rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FiCheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Nenhum risco de ruptura detectado</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Todos os itens no inventário estão operando dentro da margem de segurança configurada.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
            Estoque 100% Regular
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alertas.map((item) => {
            const styles = getAlertStyles(item.tipo);

            return (
              <div
                key={item.id}
                onClick={() => setModalDetalhe(item)}
                className={`border rounded-xl p-4 transition-all relative flex flex-col justify-between cursor-pointer group shadow-2xs ${styles.cardBg} ${styles.border}`}
              >
                {/* Botão de Fechar / Descartar */}
                <button
                  type="button"
                  onClick={(e) => handleDismiss(item.id, e)}
                  title="Dispensar alerta"
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-black/5 transition-colors"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>

                {/* Conteúdo Superior */}
                <div>
                  <div className="flex items-center gap-2 mb-2 pr-6">
                    <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider ${styles.badge}`}>
                      {item.badgeLabel}
                    </span>
                    <span className="text-xs font-mono font-semibold text-gray-500">
                      {item.codigo}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-gray-900 tracking-tight leading-snug group-hover:text-amber-950 transition-colors">
                    {item.titulo}
                  </h3>

                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {item.descricao}
                  </p>
                </div>

                {/* Barra de Risco & Botão de Ação */}
                <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                      <span className="text-gray-500 font-mono">RISCO</span>
                      <span className={styles.progressText}>{item.percentual}%</span>
                    </div>
                    <div className="h-1 bg-black/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${styles.progress}`}
                        style={{ width: `${item.percentual}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcaoClick(item);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border bg-white shadow-2xs hover:shadow transition-all shrink-0 flex items-center gap-1 ${styles.btn}`}
                  >
                    <span>{item.acaoLabel}</span>
                    <FiArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes do Alerta */}
      {modalDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-2xs transition-opacity"
            onClick={() => setModalDetalhe(null)}
          />

          <div className="relative bg-white border border-[#e5dfd4] rounded-2xl max-w-lg w-full p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-amber-700 uppercase font-bold">
                  Diagnóstico da Peça
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-0.5">
                  {modalDetalhe.titulo}
                </h3>
                <span className="text-xs font-mono text-gray-500">
                  SKU: {modalDetalhe.codigo}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalDetalhe(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-gray-700">
              <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Categoria:</span>
                  <span className="font-semibold text-gray-900">{modalDetalhe.detalhes.categoria}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Consumo Estimado:</span>
                  <span className="font-semibold text-gray-900">{modalDetalhe.detalhes.consumoMedioSemanal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sugestão de Reposição:</span>
                  <span className="font-bold text-amber-800">{modalDetalhe.detalhes.sugestaoCompra} unidades</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-gray-900 block mb-1">Motivo do Alerta:</span>
                <p className="text-gray-600 leading-relaxed bg-[#fbf9f5] p-3 rounded-xl border border-[#ece7de]">
                  {modalDetalhe.detalhes.projecaoDemanda}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalDetalhe(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  const alertItem = modalDetalhe;
                  setModalDetalhe(null);
                  if (onGerarPedido) onGerarPedido(alertItem);
                }}
                className="px-4 py-2 text-xs font-bold bg-[#c8672b] hover:bg-[#b0561e] text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <FiShoppingBag className="w-3.5 h-3.5" />
                Registrar Movimentação
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
