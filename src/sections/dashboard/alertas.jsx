import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiCheckCircle } from 'react-icons/fi';

// Estilo de cada tipo de alerta
const ESTILOS = {
  ruptura: {
    tag: 'Ruptura',
    caixa: 'bg-[#d64545]/[0.07] border-[#d64545]/30',
    cor: 'text-[#d64545]',
    linha: 'bg-[#d64545]',
    tagFundo: 'bg-[#d64545]/15',
    botao: 'text-[#d64545] bg-[#d64545]/10 border-[#d64545]/30 hover:bg-[#d64545]/20',
  },
  atencao: {
    tag: 'Atenção',
    caixa: 'bg-[#c9900c]/[0.07] border-[#c9900c]/30',
    cor: 'text-[#c9900c]',
    linha: 'bg-[#c9900c]',
    tagFundo: 'bg-[#c9900c]/15',
    botao: 'text-[#c9900c] bg-[#c9900c]/10 border-[#c9900c]/30 hover:bg-[#c9900c]/20',
  },
};

// Seção de alertas: mostra as peças mais perto de acabar
export default function AlertasPreditivos({ t, pecas = [], movimentacoes = [] }) {
  const navigate = useNavigate();
  const [fechados, setFechados] = useState([]);

  const alertas = useMemo(() => {
    // Saídas dos últimos 30 dias por peça, para estimar em quantos dias acaba
    const limite = Date.now() - 30 * 86400000;
    const saidasPorPeca = {};
    movimentacoes.forEach((m) => {
      if (m.tipo === 'saida' && new Date(m.dataHora).getTime() >= limite) {
        saidasPorPeca[m.pecaId] = (saidasPorPeca[m.pecaId] || 0) + Number(m.quantidade || 0);
      }
    });

    return pecas
      .filter((p) => p.status === 'critico' || p.status === 'atencao')
      .map((p) => {
        const mediaDia = (saidasPorPeca[p.id] || 0) / 30;
        const diasRestantes = mediaDia > 0 ? Math.floor(p.quantidade / mediaDia) : null;
        const tipo = p.status === 'critico' ? 'ruptura' : 'atencao';

        let texto = `Apenas ${p.quantidade} unidades (mínimo: ${p.pontoReposicao}).`;
        if (diasRestantes !== null) {
          texto += ` No ritmo atual, acaba em ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}.`;
        } else {
          texto += ' Sem saídas nos últimos 30 dias.';
        }

        // Quanto do mínimo ainda tem (para a barrinha)
        const nivel = Math.min(100, Math.round((p.quantidade / (p.pontoReposicao || 1)) * 100));
        return { ...p, tipo, texto, nivel };
      })
      .sort((a, b) => a.nivel - b.nivel)
      .filter((a) => !fechados.includes(a.id))
      .slice(0, 3);
  }, [pecas, movimentacoes, fechados]);

  return (
    <>
      {/* Divisor com título */}
      <div className="flex items-center gap-3 my-8">
        <span className={`flex-1 h-px ${t.linhaDivisoria}`} />
        <span className={`text-[11px] font-mono tracking-[0.2em] uppercase ${t.textoSuave}`}>Alertas de Estoque</span>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-teal-500/50 text-teal-600 bg-teal-500/10">
          {alertas.length} ativos
        </span>
        <span className={`flex-1 h-px ${t.linhaDivisoria}`} />
      </div>

      {alertas.length === 0 ? (
        <div className={`border rounded-xl py-10 text-center mb-8 ${t.card}`}>
          <FiCheckCircle className="w-7 h-7 mx-auto mb-2 text-[#2f9e5b]" />
          <p className={`text-sm font-semibold ${t.textoForte}`}>Nenhum alerta no momento</p>
          <p className={`text-xs mt-1 ${t.textoSuave}`}>Todas as peças estão acima do ponto de reposição.</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {alertas.map((a) => {
            const e = ESTILOS[a.tipo];
            return (
              <div key={a.id} className={`border rounded-xl p-5 flex flex-col ${e.caixa}`}>
                <div className="flex items-center gap-2.5">
                  <span className={`text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded ${e.cor} ${e.tagFundo}`}>
                    {e.tag}
                  </span>
                  <span className={`text-xs font-mono ${t.textoSuave}`}>{a.codigo}</span>
                  <button
                    type="button"
                    onClick={() => setFechados((prev) => [...prev, a.id])}
                    className={`ml-auto p-1 rounded hover:bg-black/5 ${t.textoFraco}`}
                    aria-label="Fechar alerta"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                <h4 className={`text-base font-semibold mt-4 mb-2 ${t.textoForte}`}>{a.nome}</h4>
                <p className={`text-sm leading-relaxed mb-4 ${t.textoSuave}`}>{a.texto}</p>

                <div className="mt-auto flex items-center justify-between gap-3">
                  <div className={`flex items-center gap-2 text-xs font-mono ${e.cor}`} title="Estoque atual em relação ao mínimo">
                    <span className="w-16 h-1 rounded-full bg-black/10 overflow-hidden">
                      <span className={`block h-full ${e.linha}`} style={{ width: `${a.nivel}%` }} />
                    </span>
                    {a.nivel}% do mín.
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/movimentacao')}
                    className={`text-xs font-mono font-semibold px-3 py-1.5 rounded border transition-colors ${e.botao}`}
                  >
                    Gerar Pedido →
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}
