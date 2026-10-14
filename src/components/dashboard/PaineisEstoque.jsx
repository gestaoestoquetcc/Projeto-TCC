import React from 'react';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function PaineisEstoque({ pecas = [] }) {
  const navigate = useNavigate();

  // Montar lista de críticos exclusivamente a partir de peças reais do Supabase
  const itensCriticos = React.useMemo(() => {
    if (!pecas || pecas.length === 0) return [];

    const filtrados = pecas.filter(
      (p) => p.status === 'critico' || p.status === 'atencao' || p.quantidade <= p.pontoReposicao
    );

    return filtrados.slice(0, 4).map((p) => ({
      id: p.id,
      nome: p.nome,
      codigo: p.codigo || p.sku,
      quantidade: p.quantidade,
      pontoReposicao: p.pontoReposicao || 10,
      tipo: p.status === 'critico' || p.quantidade <= (p.pontoReposicao || 10) ? 'critico' : 'atencao'
    }));
  }, [pecas]);

  // Montar lista de maior giro a partir de dados reais
  const itensMaiorGiro = React.useMemo(() => {
    if (!pecas || pecas.length === 0) return [];

    return [...pecas]
      .map((p) => {
        const giroNum = parseFloat(String(p.giro || '').replace('x', '')) || 1.0;
        return {
          id: p.id,
          nome: p.nome,
          giro: giroNum,
          giroTexto: `${giroNum.toFixed(1)}x`
        };
      })
      .sort((a, b) => b.giro - a.giro)
      .slice(0, 4)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));
  }, [pecas]);

  const maxGiroVal = itensMaiorGiro.length > 0 ? Math.max(...itensMaiorGiro.map((i) => i.giro), 1) : 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* CARD 1: ITENS CRÍTICOS */}
      <div className="bg-white/90 border border-[#e5dfd4] rounded-xl p-6 shadow-xs flex flex-col justify-between">
        <div>
          {/* Header do Card */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold">
              Itens Críticos
            </span>
            <button
              type="button"
              onClick={() => navigate('/pecas')}
              className="text-xs font-semibold text-[#b85824] hover:text-amber-800 transition-colors inline-flex items-center gap-1 group"
            >
              ver catálogo
              <FiArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Lista de Itens Críticos Reais */}
          {itensCriticos.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <FiCheckCircle className="w-7 h-7 mx-auto mb-2 text-emerald-500 opacity-70" />
              <p className="text-xs font-medium text-gray-600">Nenhum item em estado crítico ou de atenção.</p>
              <span className="text-[11px] text-gray-400 block mt-0.5">Todos os SKUs operam acima do ponto de reposição.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {itensCriticos.map((item) => {
                const isCritico = item.tipo === 'critico';

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between group hover:bg-black/[0.02] p-1.5 -mx-1.5 rounded-lg transition-colors cursor-pointer"
                    onClick={() => navigate('/pecas')}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-1 h-8 rounded-full shrink-0 ${
                          isCritico ? 'bg-[#dc2626]' : 'bg-[#d97706]'
                        }`}
                      />
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 group-hover:text-amber-900 transition-colors">
                          {item.nome}
                        </h4>
                        <span className="text-xs font-mono text-gray-400">
                          {item.codigo}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex items-baseline gap-1">
                      <span
                        className={`text-base font-extrabold ${
                          isCritico ? 'text-[#dc2626]' : 'text-[#d97706]'
                        }`}
                      >
                        {item.quantidade}
                      </span>
                      <span className="text-xs font-mono text-gray-400">
                        /{item.pontoReposicao}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CARD 2: MAIOR GIRO */}
      <div className="bg-white/90 border border-[#e5dfd4] rounded-xl p-6 shadow-xs flex flex-col justify-between">
        <div>
          {/* Header do Card */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold">
              Maior Giro
            </span>
            <span className="text-xs font-mono text-gray-400">
              30 dias
            </span>
          </div>

          {/* Lista de Maior Giro Real */}
          {itensMaiorGiro.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <p className="text-xs font-medium text-gray-500">Nenhuma peça cadastrada para cálculo de giro.</p>
              <button
                type="button"
                onClick={() => navigate('/pecas')}
                className="mt-2 text-xs font-semibold text-[#b85824] hover:underline"
              >
                + Cadastrar peças no estoque
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {itensMaiorGiro.map((item) => {
                const pct = Math.min(100, Math.max(15, (item.giro / maxGiroVal) * 100));

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between group hover:bg-black/[0.02] p-1.5 -mx-1.5 rounded-lg transition-colors cursor-pointer"
                    onClick={() => navigate('/pecas')}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-xs font-mono font-semibold text-gray-400 w-3 text-center">
                        {item.rank}
                      </span>
                      <h4 className="font-semibold text-sm text-gray-900 group-hover:text-amber-900 transition-colors">
                        {item.nome}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-14 h-1 bg-[#ece7dd] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#d97706] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-gray-700 min-w-[42px] text-right">
                        {item.giroTexto}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
