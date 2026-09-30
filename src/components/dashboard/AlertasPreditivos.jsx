import React, { useState } from 'react';
import { FiX, FiArrowRight, FiCpu, FiTrendingUp, FiShoppingBag, FiInfo } from 'react-icons/fi';

export default function AlertasPreditivos({ onGerarPedido, onAbrirDetalheIA }) {
  const [alertas, setAlertas] = useState([
    {
      id: '1',
      tipo: 'ruptura',
      badgeLabel: 'RUPTURA',
      codigo: 'FRE-0142',
      titulo: 'Pastilha de Freio Traseira EV',
      descricao: 'Apenas 8 unidades. Risco de desabastecimento em 5 dias com demanda atual.',
      percentual: 97,
      acaoLabel: 'Gerar Pedido',
      detalhes: {
        categoria: 'Elétrico (EV)',
        frotaAlvo: 'BYD Dolphin, Song Plus, Ora 03',
        consumoMedioSemanal: '12 un/sem',
        projecaoDemanda: 'Pico previsto para próximas 2 semanas devido a revisões de frotistas',
        sugestaoCompra: 30
      }
    },
    {
      id: '2',
      tipo: 'atencao',
      badgeLabel: 'ATENÇÃO',
      codigo: 'AMA-0689',
      titulo: 'Amortecedor Dianteiro EV',
      descricao: 'Alta de 34% detectada — frota EV crescendo em SP/RJ. Recomenda reforço.',
      percentual: 89,
      acaoLabel: 'Ver Previsão',
      detalhes: {
        categoria: 'Elétrico (EV)',
        frotaAlvo: 'Veículos utilitários leves elétricos',
        consumoMedioSemanal: '6 un/sem',
        projecaoDemanda: 'Aumento contínuo de 34% em emplacamentos regionais no último trimestre',
        sugestaoCompra: 18
      }
    },
    {
      id: '3',
      tipo: 'previsao',
      badgeLabel: 'PREVISÃO',
      codigo: 'INJ-0921',
      titulo: 'Bico Injetor GDI 4ª Geração',
      descricao: 'Padrão histórico: +28% no 4º trimestre. Janela de compra preventiva em 12 dias.',
      percentual: 94,
      acaoLabel: 'Ver Análise',
      detalhes: {
        categoria: 'Combustão',
        frotaAlvo: 'Motores Turbo GDI (HB20, Tracker, T-Cross)',
        consumoMedioSemanal: '15 un/sem',
        projecaoDemanda: 'Sazonalidade de final de ano (manutenções preventivas para viagens de fim de ano)',
        sugestaoCompra: 45
      }
    }
  ]);

  const [modalDetalhe, setModalDetalhe] = useState(null);

  const handleDismiss = (id, e) => {
    e.stopPropagation();
    setAlertas((prev) => prev.filter((a) => a.id !== id));
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
        return {
          cardBg: 'bg-[#fefcf6] hover:bg-[#fcf8ed]',
          border: 'border-[#faecc8]',
          badge: 'bg-[#fef3c7] text-[#d97706] border border-[#fde68a]',
          progress: 'bg-[#d97706]',
          progressText: 'text-[#d97706]',
          btn: 'border-[#fcd34d] text-[#d97706] hover:bg-[#fef3c7]'
        };
      case 'previsao':
      default:
        return {
          cardBg: 'bg-[#f4faf8] hover:bg-[#eef8f5]',
          border: 'border-[#ccefe6]',
          badge: 'bg-[#ccfbf1] text-[#0d9488] border border-[#99f6e4]',
          progress: 'bg-[#0d9488]',
          progressText: 'text-[#0d9488]',
          btn: 'border-[#5eead4] text-[#0d9488] hover:bg-[#ccfbf1]'
        };
    }
  };

  return (
    <section className="mb-8">
      {/* Header da Seção */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold">
            Alertas Preditivos
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#e6f7f3] text-[#0d9488] border border-[#bbf0e4]">
            <FiCpu className="w-3 h-3 text-[#0d9488]" />
            {alertas.length} ativos
          </span>
        </div>
      </div>

      {/* Grid de Alertas */}
      {alertas.length === 0 ? (
        <div className="bg-white/80 border border-[#e5dfd4] rounded-xl p-8 text-center">
          <p className="text-xs text-gray-500 font-medium">
            Nenhum alerta preditivo pendente no momento. Todos os estoques operam dentro dos parâmetros da IA.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {alertas.map((alerta) => {
            const styles = getAlertStyles(alerta.tipo);

            return (
              <div
                key={alerta.id}
                className={`${styles.cardBg} border ${styles.border} rounded-xl p-5 flex flex-col justify-between shadow-xs transition-all relative group`}
              >
                {/* Header do Card */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${styles.badge}`}>
                        {alerta.badgeLabel}
                      </span>
                      <span className="text-[11px] font-mono text-gray-400 font-semibold">
                        {alerta.codigo}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDismiss(alerta.id, e)}
                      className="text-gray-300 hover:text-gray-600 p-1 rounded-md transition-colors"
                      title="Dispensar alerta"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-bold text-sm text-gray-900 tracking-tight leading-snug mb-2">
                    {alerta.titulo}
                  </h3>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    {alerta.descricao}
                  </p>
                </div>

                {/* Footer do Card com Barra de Risco e Ação */}
                <div className="mt-5 pt-3 border-t border-black/5 flex items-center justify-between gap-3">
                  {/* Barra e Percentual */}
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 h-1 bg-black/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${styles.progress}`}
                        style={{ width: `${alerta.percentual}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-mono font-bold ${styles.progressText}`}>
                      {alerta.percentual}%
                    </span>
                  </div>

                  {/* Botão de Ação */}
                  <button
                    type="button"
                    onClick={() => handleAcaoClick(alerta)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-colors bg-white/70 shadow-2xs ${styles.btn}`}
                  >
                    <span>{alerta.acaoLabel}</span>
                    <FiArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes da IA */}
      {modalDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setModalDetalhe(null)} 
          />

          <div className="relative bg-[#fcfbfa] border border-[#e5dfd5] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden z-10 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#ece7de]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <FiCpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Análise do Motor de IA</h3>
                  <span className="text-xs text-gray-500 font-mono">{modalDetalhe.codigo} · {modalDetalhe.titulo}</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setModalDetalhe(null)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 space-y-1">
                <span className="font-bold text-teal-900 block">Diagnóstico Preditivo</span>
                <p className="text-teal-800 leading-relaxed">{modalDetalhe.descricao}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-[#e5dfd4]">
                  <span className="text-gray-400 block font-mono text-[10px] uppercase">Confiança do Modelo</span>
                  <span className="text-base font-black text-gray-900">{modalDetalhe.percentual}%</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#e5dfd4]">
                  <span className="text-gray-400 block font-mono text-[10px] uppercase">Consumo Médio</span>
                  <span className="text-base font-black text-gray-900">{modalDetalhe.detalhes?.consumoMedioSemanal || 'N/A'}</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#e5dfd4] space-y-1">
                <span className="text-gray-400 block font-mono text-[10px] uppercase">Frota e Tendência</span>
                <p className="text-gray-700 font-medium">{modalDetalhe.detalhes?.projecaoDemanda}</p>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-900 block">Sugestão de Reposição</span>
                  <span className="text-xs text-amber-700">Lote ideal calculado pela IA</span>
                </div>
                <span className="text-lg font-black text-amber-800">{modalDetalhe.detalhes?.sugestaoCompra} un.</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#ece7de] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalDetalhe(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Fechar
              </button>
              {onGerarPedido && (
                <button
                  type="button"
                  onClick={() => {
                    const item = modalDetalhe;
                    setModalDetalhe(null);
                    onGerarPedido(item);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors shadow-xs"
                >
                  Confirmar Reposição
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
