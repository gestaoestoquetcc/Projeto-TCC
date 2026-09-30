import React, { useState } from 'react';
import { FiCheck, FiCheckCircle, FiInfo, FiLoader, FiX, FiCpu } from 'react-icons/fi';

export default function SugestoesCompra({ onAprovarItem, onAprovarTodas }) {
  const [sugestoes, setSugestoes] = useState([
    {
      id: 's1',
      prioridade: 'urgente',
      badge: 'URGENTE',
      codigo: 'FRE-0142',
      nome: 'Pastilha de Freio Traseira EV',
      subtexto: 'Ruptura crítica + alta no segmento EV detectada',
      atual: 8,
      sugerido: 40,
      valor: 3596,
      valorFormatado: 'R$ 3.596',
      confianca: 97,
      status: 'pendente', // 'pendente' | 'aprovado'
      explicabilidade: {
        leadTime: '3 dias úteis',
        demandaSemanal: '14 un/semana',
        riscoRuptura: '98% em 4 dias',
        fornecedorRecomendado: 'Bosch Auto Parts Brasil'
      }
    },
    {
      id: 's2',
      prioridade: 'alto',
      badge: 'ALTO',
      codigo: 'AMA-0689',
      nome: 'Amortecedor Dianteiro EV',
      subtexto: 'Frota EV +34% em SP/RJ — demanda sazonal projetada',
      atual: 4,
      sugerido: 20,
      valor: 6400,
      valorFormatado: 'R$ 6.400',
      confianca: 89,
      status: 'pendente',
      explicabilidade: {
        leadTime: '5 dias úteis',
        demandaSemanal: '6 un/semana',
        riscoRuptura: '85% em 6 dias',
        fornecedorRecomendado: 'Monroe Shocks Distribuição'
      }
    },
    {
      id: 's3',
      prioridade: 'normal',
      badge: 'NORMAL',
      codigo: 'INJ-0921',
      nome: 'Bico Injetor GDI 4ª Geração',
      subtexto: 'Histórico: pico de 28% no 4º trim. — compra preventiva',
      atual: 48,
      sugerido: 60,
      valor: 11700,
      valorFormatado: 'R$ 11.700',
      confianca: 94,
      status: 'pendente',
      explicabilidade: {
        leadTime: '7 dias úteis',
        demandaSemanal: '18 un/semana',
        riscoRuptura: 'Moderado (janela de compra preventiva antecipada)',
        fornecedorRecomendado: 'Denso Brasil Componentes'
      }
    },
    {
      id: 's4',
      prioridade: 'alto',
      badge: 'ALTO',
      codigo: 'VEL-1122',
      nome: 'Sensor ABS Roda Dianteira',
      subtexto: 'Abaixo do ponto de reposição + tendência de alta',
      atual: 27,
      sugerido: 25,
      valor: 1700,
      valorFormatado: 'R$ 1.700',
      confianca: 85,
      status: 'pendente',
      explicabilidade: {
        leadTime: '4 dias úteis',
        demandaSemanal: '9 un/semana',
        riscoRuptura: '78% em 8 dias',
        fornecedorRecomendado: 'Delphi Technologies Aftermarket'
      }
    }
  ]);

  const [modalDetalhe, setModalDetalhe] = useState(null);
  const [aprovandoTodas, setAprovandoTodas] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Total sugerido apenas dos pendentes
  const totalSugerido = sugestoes
    .filter((s) => s.status === 'pendente')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const handleAprovar = (id) => {
    setSugestoes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'aprovado' } : item))
    );
    const itemAprovado = sugestoes.find((s) => s.id === id);
    if (onAprovarItem) onAprovarItem(itemAprovado);
    setFeedbackMsg(`Ordem de compra para ${itemAprovado.nome} aprovada com sucesso!`);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  const handleAprovarTodas = () => {
    setAprovandoTodas(true);
    setTimeout(() => {
      setSugestoes((prev) => prev.map((item) => ({ ...item, status: 'aprovado' })));
      setAprovandoTodas(false);
      if (onAprovarTodas) onAprovarTodas(sugestoes);
      setFeedbackMsg('Todas as 4 sugestões de compra foram aprovadas e enviadas para o setor de compras!');
      setTimeout(() => setFeedbackMsg(''), 5000);
    }, 600);
  };

  const getPriorityStyle = (prioridade) => {
    switch (prioridade) {
      case 'urgente':
        return {
          borderLeft: 'border-l-4 border-l-[#dc2626]',
          badge: 'bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]'
        };
      case 'alto':
        return {
          borderLeft: 'border-l-4 border-l-[#d97706]',
          badge: 'bg-[#fef3c7] text-[#d97706] border border-[#fde68a]'
        };
      case 'normal':
      default:
        return {
          borderLeft: 'border-l-4 border-l-[#16a34a]',
          badge: 'bg-[#e6f7f3] text-[#0d9488] border border-[#bbf0e4]'
        };
    }
  };

  return (
    <section className="mb-8">
      {/* Banner / Divisor com Total e Botão "Aprovar Todas" */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-[#e5dfd4]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#f7f5f0] px-4 text-xs font-mono tracking-widest text-[#a89e90] uppercase font-bold">
            Sugestões de Compra
          </span>
        </div>
      </div>

      {feedbackMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Barra de Ações do Total */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-mono text-gray-700">
          Total sugerido:{' '}
          <strong className="text-sm font-bold text-gray-900">
            R$ {totalSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </strong>
        </div>

        <button
          type="button"
          onClick={handleAprovarTodas}
          disabled={totalSugerido === 0 || aprovandoTodas}
          className="inline-flex items-center gap-2 px-5 py-2 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-lg shadow-xs hover:shadow transition-all disabled:opacity-50 active:scale-98"
        >
          {aprovandoTodas ? (
            <>
              <FiLoader className="w-3.5 h-3.5 animate-spin" />
              Processando...
            </>
          ) : totalSugerido === 0 ? (
            <>
              <FiCheck className="w-3.5 h-3.5" />
              Todas Aprovadas
            </>
          ) : (
            'Aprovar Todas'
          )}
        </button>
      </div>

      {/* Lista de Sugestões de Compra */}
      <div className="space-y-3">
        {sugestoes.map((item) => {
          const style = getPriorityStyle(item.prioridade);
          const isAprovado = item.status === 'aprovado';

          return (
            <div
              key={item.id}
              className={`bg-white/95 border border-[#e5dfd4] rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all ${
                style.borderLeft
              } flex flex-col md:flex-row md:items-center justify-between gap-4`}
            >
              {/* Lado Esquerdo: Tag, SKU, Nome e Subtexto */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${style.badge}`}>
                    {item.badge}
                  </span>
                  <span className="text-xs font-mono text-gray-400 font-semibold">
                    {item.codigo}
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalDetalhe(item)}
                    className="text-gray-400 hover:text-teal-700 ml-1 transition-colors"
                    title="Ver justificativa da IA"
                  >
                    <FiInfo className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="font-bold text-sm text-gray-900 tracking-tight">
                  {item.nome}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.subtexto}
                </p>
              </div>

              {/* Lado Direito: Colunas ATUAL, SUGERIDO, VALOR, CONF. e AÇÃO */}
              <div className="flex items-center justify-between md:justify-end gap-6 sm:gap-8 pt-2 md:pt-0 border-t md:border-t-0 border-[#f1ede5]">
                {/* ATUAL */}
                <div className="text-center min-w-[36px]">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-medium">
                    Atual
                  </span>
                  <span className={`text-sm font-extrabold ${item.atual <= 10 ? 'text-[#dc2626]' : 'text-gray-900'}`}>
                    {item.atual}
                  </span>
                </div>

                {/* SUGERIDO */}
                <div className="text-center min-w-[50px]">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-medium">
                    Sugerido
                  </span>
                  <span className="text-sm font-extrabold text-[#0d9488]">
                    {item.sugerido} un.
                  </span>
                </div>

                {/* VALOR */}
                <div className="text-center min-w-[70px]">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-medium">
                    Valor
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {item.valorFormatado}
                  </span>
                </div>

                {/* CONFIANÇA */}
                <div className="min-w-[65px]">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-medium text-center">
                    Conf.
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0d9488] rounded-full"
                        style={{ width: `${item.confianca}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-[#0d9488]">
                      {item.confianca}%
                    </span>
                  </div>
                </div>

                {/* BOTÃO APROVAR */}
                <div className="min-w-[80px] text-right">
                  {isAprovado ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                      <FiCheck className="w-3.5 h-3.5" />
                      Aprovado
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAprovar(item.id)}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold border border-[#5eead4] text-[#0d9488] hover:bg-[#e6f7f3] transition-all bg-white shadow-2xs active:scale-95"
                    >
                      Aprovar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal / Drawer com Justificativa da IA (XAI - Explainable AI) */}
      {modalDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setModalDetalhe(null)}
          />

          <div className="relative bg-[#fcfbfa] border border-[#e5dfd5] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden z-10 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#ece7de]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <FiCpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Memória de Cálculo do Algoritmo Preditivo
                  </h3>
                  <span className="text-xs text-gray-500 font-mono">
                    {modalDetalhe.codigo} · {modalDetalhe.nome}
                  </span>
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
              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100">
                <span className="font-bold text-teal-900 block mb-1">Raciocínio da IA:</span>
                <p className="text-teal-800 leading-relaxed">
                  {modalDetalhe.subtexto}. O algoritmo combinou a velocidade de esgotamento nos últimos 30 dias com o tempo de entrega do fornecedor para evitar interrupção de vendas.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-[#e5dfd4]">
                  <span className="text-gray-400 block font-mono text-[10px] uppercase">Lead Time do Fornecedor</span>
                  <span className="text-sm font-bold text-gray-900">{modalDetalhe.explicabilidade.leadTime}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#e5dfd4]">
                  <span className="text-gray-400 block font-mono text-[10px] uppercase">Consumo Semanal</span>
                  <span className="text-sm font-bold text-gray-900">{modalDetalhe.explicabilidade.demandaSemanal}</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#e5dfd4]">
                <span className="text-gray-400 block font-mono text-[10px] uppercase mb-0.5">Fornecedor Homologado</span>
                <span className="text-sm font-semibold text-gray-800">{modalDetalhe.explicabilidade.fornecedorRecomendado}</span>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-900 block">Lote Otimizado de Reposição</span>
                  <span className="text-[11px] text-amber-700">{modalDetalhe.sugerido} unidades · {modalDetalhe.valorFormatado}</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-800 bg-white px-2.5 py-1 rounded border border-amber-200">
                  Economia de escala: +14%
                </span>
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
              {modalDetalhe.status === 'pendente' && (
                <button
                  type="button"
                  onClick={() => {
                    handleAprovar(modalDetalhe.id);
                    setModalDetalhe(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0d9488] hover:bg-[#0f766e] rounded-lg transition-colors shadow-xs"
                >
                  Aprovar Agora
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
