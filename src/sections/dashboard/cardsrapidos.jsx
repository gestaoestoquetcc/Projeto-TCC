import React from 'react';

// Converte o delta em texto e tom do badge. `positivoEhBom` inverte a leitura (ex.: rupturas subindo é ruim)
function formatarDelta(delta, { sufixo = '', casas = 0, positivoEhBom = true } = {}) {
  const arredondado = Number(delta.toFixed(casas));
  if (arredondado === 0) return { texto: '–', tom: 'neutro' };
  const sinal = arredondado > 0 ? '+' : '';
  const bom = arredondado > 0 === positivoEhBom;
  return { texto: `${sinal}${arredondado.toFixed(casas)}${sufixo}`, tom: bom ? 'bom' : 'ruim' };
}

const TONS_BADGE = {
  bom: 'bg-[var(--d-green-bg)] text-[var(--d-green)]',
  ruim: 'bg-[var(--d-red-bg)] text-[var(--d-red)]',
  neutro: 'bg-[var(--d-border)] text-[var(--d-faint)]',
};

function KpiCard({ rotulo, valor, unidade, corValor, delta, loading }) {
  return (
    <div className="rounded-md border border-[var(--d-border)] bg-[var(--d-surface)] px-5 pt-5 pb-4">
      <span className="block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--d-faint)]">
        {rotulo}
      </span>

      {loading ? (
        <div className="mt-3 h-8 w-16 rounded bg-[var(--d-border)] animate-pulse" />
      ) : (
        <span className={`mt-2 block font-display text-[34px] font-bold leading-none ${corValor}`}>
          {valor}
        </span>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[11px] text-[var(--d-faint)]">{unidade}</span>
        {!loading && delta && (
          <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${TONS_BADGE[delta.tom]}`}>
            {delta.texto}
          </span>
        )}
      </div>
    </div>
  );
}

export default function CardsRapidos({ kpis, loading }) {
  const cards = kpis
    ? [
        {
          rotulo: 'Vol. em estoque',
          valor: kpis.volume.valor.toLocaleString('pt-BR'),
          unidade: 'un.',
          corValor: 'text-[var(--d-text)]',
          delta: formatarDelta(kpis.volume.delta, { sufixo: '%', casas: 1 }),
        },
        {
          rotulo: 'Giro médio',
          valor: kpis.giroMedio.valor.toFixed(1),
          unidade: 'x/mês',
          corValor: 'text-[var(--d-green)]',
          delta: formatarDelta(kpis.giroMedio.delta, { casas: 1 }),
        },
        {
          rotulo: 'Rupturas',
          valor: kpis.rupturas.valor,
          unidade: 'SKUs',
          corValor: 'text-[var(--d-red)]',
          delta: formatarDelta(kpis.rupturas.delta, { positivoEhBom: false }),
        },
        {
          rotulo: 'Atenção',
          valor: kpis.atencao.valor,
          unidade: 'abaixo do ponto',
          corValor: 'text-[var(--d-amber)]',
          delta: formatarDelta(kpis.atencao.delta, { positivoEhBom: false }),
        },
      ]
    : ['Vol. em estoque', 'Giro médio', 'Rupturas', 'Atenção'].map((rotulo) => ({ rotulo }));

  return (
    <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <KpiCard key={card.rotulo} {...card} loading={loading || !kpis} />
      ))}
    </section>
  );
}
