import React, { useMemo } from 'react';

// Seção de cards rápidos do Dashboard (indicadores do estoque)
export default function CardsRapidos({ t, pecas = [], movimentacoes = [], agora }) {
  const indicadores = useMemo(() => {
    const totalEstoque = pecas.reduce((soma, p) => soma + p.quantidade, 0);
    const rupturas = pecas.filter((p) => p.status === 'critico').length;
    const atencao = pecas.filter((p) => p.status === 'atencao').length;

    // Giro do mês = unidades que saíram nos últimos 30 dias / unidades em estoque
    // "agora" = horário da última sincronização (vem da página)
    const limite = (agora ? agora.getTime() : 0) - 30 * 86400000;
    const saidas30d = movimentacoes
      .filter((m) => m.tipo === 'saida' && new Date(m.dataHora).getTime() >= limite)
      .reduce((soma, m) => soma + Number(m.quantidade || 0), 0);
    const giro = totalEstoque > 0 ? saidas30d / totalEstoque : 0;

    return [
      {
        titulo: 'Vol. em estoque',
        valor: totalEstoque.toLocaleString('pt-BR'),
        cor: t.textoForte,
        unidade: 'un.',
        badge: `${pecas.length} SKUs`,
        badgeCor: 'bg-gray-500/10 text-gray-500',
      },
      {
        titulo: 'Giro médio',
        valor: giro.toFixed(1),
        cor: 'text-[#2f9e5b]',
        unidade: '×/mês',
        badge: `${saidas30d} saídas`,
        badgeCor: 'bg-emerald-500/10 text-[#2f9e5b]',
      },
      {
        titulo: 'Rupturas',
        valor: rupturas,
        cor: 'text-[#d64545]',
        unidade: 'SKUs no mínimo',
        badge: rupturas > 0 ? 'repor' : 'ok',
        badgeCor: rupturas > 0 ? 'bg-red-500/10 text-[#d64545]' : 'bg-emerald-500/10 text-[#2f9e5b]',
      },
      {
        titulo: 'Atenção',
        valor: atencao,
        cor: 'text-[#c9900c]',
        unidade: 'perto do ponto',
        badge: atencao > 0 ? 'acompanhar' : '–',
        badgeCor: atencao > 0 ? 'bg-amber-500/10 text-[#c9900c]' : 'bg-gray-500/10 text-gray-500',
      },
    ];
  }, [pecas, movimentacoes, t, agora]);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {indicadores.map((ind) => (
        <div key={ind.titulo} className={`border rounded-xl px-5 py-5 shadow-xs ${t.card}`}>
          <span className={`text-[11px] font-mono tracking-widest uppercase block ${t.textoSuave}`}>{ind.titulo}</span>
          <h3 className={`text-4xl font-black mt-2 mb-2 ${ind.cor}`}>{ind.valor}</h3>
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-mono ${t.textoSuave}`}>{ind.unidade}</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${ind.badgeCor}`}>{ind.badge}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
