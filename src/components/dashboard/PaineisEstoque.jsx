import React from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function PaineisEstoque({ pecas = [] }) {
  const navigate = useNavigate();

  // Dados padrão para Itens Críticos baseados na referência
  const dadosCriticosFallback = [
    {
      id: 'c1',
      nome: 'Pastilha de Freio Traseira EV',
      codigo: 'FRE-0142',
      quantidade: 8,
      pontoReposicao: 20,
      tipo: 'critico'
    },
    {
      id: 'c2',
      nome: 'Amortecedor Dianteiro EV',
      codigo: 'AMA-0689',
      quantidade: 4,
      pontoReposicao: 12,
      tipo: 'critico'
    },
    {
      id: 'c3',
      nome: 'Sensor ABS Roda Dianteira',
      codigo: 'VEL-1122',
      quantidade: 27,
      pontoReposicao: 30,
      tipo: 'atencao'
    },
    {
      id: 'c4',
      nome: 'Caixa de Direção Hidráulica',
      codigo: 'TRQ-0677',
      quantidade: 9,
      pontoReposicao: 10,
      tipo: 'atencao'
    }
  ];

  // Dados padrão para Maior Giro baseados na referência
  const dadosGiroFallback = [
    {
      id: 'g1',
      rank: 1,
      nome: 'Pastilha de Freio Traseira EV',
      giro: 12.4,
      giroTexto: '12.4x'
    },
    {
      id: 'g2',
      rank: 2,
      nome: 'Filtro de Óleo Sintético',
      giro: 8.7,
      giroTexto: '8.7x'
    },
    {
      id: 'g3',
      rank: 3,
      nome: 'Bico Injetor GDI 4ª Geração',
      giro: 7.2,
      giroTexto: '7.2x'
    },
    {
      id: 'g4',
      rank: 4,
      nome: 'Bateria Selada Moto 9Ah',
      giro: 6.2,
      giroTexto: '6.2x'
    }
  ];

  // Montar lista de críticos a partir de peças reais se existirem
  const itensCriticos = React.useMemo(() => {
    if (!pecas || pecas.length === 0) return dadosCriticosFallback;

    const filtrados = pecas.filter(
      (p) => p.status === 'critico' || p.status === 'atencao' || p.quantidade <= p.pontoReposicao
    );

    if (filtrados.length === 0) return dadosCriticosFallback;

    return filtrados.slice(0, 4).map((p) => ({
      id: p.id,
      nome: p.nome,
      codigo: p.codigo || p.sku,
      quantidade: p.quantidade,
      pontoReposicao: p.pontoReposicao || p.estoqueMinimo || 10,
      tipo: p.status === 'critico' || p.quantidade <= (p.pontoReposicao || 10) ? 'critico' : 'atencao'
    }));
  }, [pecas]);

  // Montar lista de maior giro
  const itensMaiorGiro = React.useMemo(() => {
    if (!pecas || pecas.length === 0) return dadosGiroFallback;

    // Se as peças tiverem giro numérico ou formatado
    const ordenados = [...pecas]
      .map((p, idx) => {
        const giroNum = parseFloat(String(p.giro || '').replace('x', '')) || (6.5 - idx * 0.8);
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

    return ordenados.length > 0 ? ordenados : dadosGiroFallback;
  }, [pecas]);

  const maxGiroVal = 12.4;

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
              ver todos
              <FiArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Lista de Itens Críticos */}
          <div className="space-y-4">
            {itensCriticos.map((item) => {
              const isCritico = item.tipo === 'critico';

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between group hover:bg-black/[0.02] p-1.5 -mx-1.5 rounded-lg transition-colors cursor-pointer"
                  onClick={() => navigate('/pecas')}
                >
                  {/* Barra lateral indicadora + Nome e Código */}
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

                  {/* Quantidade atual / Ponto de Reposição */}
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

          {/* Lista de Maior Giro */}
          <div className="space-y-4">
            {itensMaiorGiro.map((item) => {
              const pct = Math.min(100, Math.max(15, (item.giro / maxGiroVal) * 100));

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between group hover:bg-black/[0.02] p-1.5 -mx-1.5 rounded-lg transition-colors cursor-pointer"
                  onClick={() => navigate('/pecas')}
                >
                  {/* Ranking Number + Nome da Peça */}
                  <div className="flex items-center gap-3.5">
                    <span className="text-xs font-mono font-semibold text-gray-400 w-3 text-center">
                      {item.rank}
                    </span>
                    <h4 className="font-semibold text-sm text-gray-900 group-hover:text-amber-900 transition-colors">
                      {item.nome}
                    </h4>
                  </div>

                  {/* Barra horizontal laranja + Valor do Giro */}
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
        </div>
      </div>
    </div>
  );
}
