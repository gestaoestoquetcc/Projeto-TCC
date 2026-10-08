import React from 'react';
import { FiCpu, FiAlertTriangle, FiCheckCircle, FiTarget, FiTrendingUp } from 'react-icons/fi';

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const SELO = {
  lucro: { texto: 'Lucro', classe: 'bg-emerald-500/10 text-[#2f9e5b] border-emerald-500/30' },
  prejuizo: { texto: 'Prejuízo', classe: 'bg-red-500/10 text-[#d64545] border-red-500/30' },
  empate: { texto: 'Empate', classe: 'bg-gray-500/10 text-gray-500 border-gray-500/30' },
  'sem-dados': { texto: 'Sem dados', classe: 'bg-gray-500/10 text-gray-500 border-gray-500/30' },
};

/** Painel "Análise da IA" do financeiro (análise automática feita pelo sistema) */
export default function AnaliseFinanceira({ t, analise }) {
  const selo = SELO[analise.situacao] || SELO['sem-dados'];

  return (
    <section className={`border rounded-xl shadow-xs p-6 flex flex-col gap-5 ${t.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#e8772e] to-[#b85b20] flex items-center justify-center shadow-sm">
            <FiCpu className="w-4 h-4 text-white" />
          </span>
          <span className={`text-sm font-bold ${t.textoForte}`}>Análise da IA</span>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-[#b36d1b] border border-amber-500/30"
            title="Análise feita pelo próprio sistema, sem IA externa"
          >
            Automática
          </span>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${selo.classe}`}>{selo.texto}</span>
      </div>

      <p className={`text-sm leading-relaxed ${t.textoForte}`}>{analise.resumo}</p>

      {analise.previsao && (
        <div className="rounded-lg p-3.5 bg-gradient-to-br from-[#e8772e]/10 to-[#e8772e]/[0.03] border border-[#e8772e]/25">
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#c8672b] flex items-center gap-1.5 mb-2">
            <FiTrendingUp className="w-3.5 h-3.5" /> Previsão para o fim do mês
          </span>
          <div className="flex flex-col gap-1.5">
            <Mini t={t} rotulo="Entradas" valor={brl(analise.previsao.receitas)} cor="text-[#2f9e5b]" />
            <Mini t={t} rotulo="Saídas" valor={brl(analise.previsao.saidas)} cor="text-[#d64545]" />
            <Mini
              t={t}
              rotulo={analise.previsao.lucro >= 0 ? 'Lucro' : 'Prejuízo'}
              valor={brl(analise.previsao.lucro)}
              cor={analise.previsao.lucro >= 0 ? 'text-[#2f9e5b]' : 'text-[#d64545]'}
            />
          </div>
          <p className={`text-[11px] mt-2 ${t.textoFraco}`}>Se o ritmo de vendas e de gastos do dia a dia continuar igual.</p>
        </div>
      )}

      {analise.alertas.length > 0 && (
        <Lista t={t} titulo="Pontos de atenção" icone={FiAlertTriangle} cor="text-[#d64545]" itens={analise.alertas} />
      )}
      {analise.dicas.length > 0 && <Lista t={t} titulo="Recomendações" icone={FiTarget} cor="text-[#2f9e5b]" itens={analise.dicas} />}
      {analise.alertas.length === 0 && analise.situacao === 'lucro' && (
        <p className="text-xs text-[#2f9e5b] flex items-center gap-1.5">
          <FiCheckCircle className="w-3.5 h-3.5" /> Nenhum ponto de atenção neste mês.
        </p>
      )}
    </section>
  );
}

function Mini({ t, rotulo, valor, cor }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={`text-[11px] font-mono uppercase tracking-wider ${t.textoSuave}`}>{rotulo}</span>
      <span className={`text-sm font-bold font-mono whitespace-nowrap ${cor}`}>{valor}</span>
    </div>
  );
}

function Lista({ t, titulo, icone, cor, itens }) {
  const Icone = icone;
  return (
    <div>
      <span className={`text-[10px] font-mono font-bold tracking-widest uppercase flex items-center gap-1.5 mb-2 ${t.textoSuave}`}>
        <Icone className={`w-3.5 h-3.5 ${cor}`} /> {titulo}
      </span>
      <ul className="space-y-1.5">
        {itens.map((txt) => (
          <li key={txt} className={`text-sm leading-snug flex gap-2 ${t.textoForte}`}>
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${cor.replace('text-', 'bg-')}`} />
            <span>{txt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
