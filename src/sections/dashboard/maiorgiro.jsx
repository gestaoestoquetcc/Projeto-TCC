import React from 'react';

export default function MaiorGiro({ itens, loading }) {
  const maximo = Math.max(1, ...itens.map((i) => i.giro));

  return (
    <section className="flex flex-col rounded-md border border-[var(--d-border)] bg-[var(--d-surface)] px-5 pt-5 pb-3">
      <header className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--d-faint)]">Maior giro</span>
        <span className="font-mono text-[11px] text-[var(--d-faint)]">30 dias</span>
      </header>

      {loading ? (
        <div className="space-y-4 py-2">
          {[0, 1, 2, 3].map((k) => (
            <div key={k} className="h-7 rounded bg-[var(--d-border)]/50 animate-pulse" />
          ))}
        </div>
      ) : itens.length === 0 ? (
        <p className="py-10 text-center font-mono text-xs text-[var(--d-faint)]">Sem saídas nos últimos 30 dias.</p>
      ) : (
        <ol>
          {itens.map((item, idx) => (
            <li key={item.id} className="flex items-center gap-4 py-2.5">
              <span className="w-3 font-mono text-[11px] text-[var(--d-faint)]">{idx + 1}</span>
              <span className="min-w-0 flex-1 truncate font-body text-sm font-medium text-[var(--d-text)]">{item.nome}</span>
              <span className="relative h-[3px] w-16 overflow-hidden rounded bg-[var(--d-border)]">
                <span
                  className="absolute inset-y-0 left-0 rounded bg-[var(--d-orange)]"
                  style={{ width: `${(item.giro / maximo) * 85}%` }}
                />
              </span>
              <span className="w-12 text-right font-mono text-[11px] text-[var(--d-muted)]">{item.giro.toFixed(1)}×</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
