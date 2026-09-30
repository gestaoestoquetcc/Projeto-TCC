import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

const COR_STATUS = {
  critico: { barra: 'bg-[var(--d-red)]', texto: 'text-[var(--d-red)]' },
  atencao: { barra: 'bg-[var(--d-amber)]', texto: 'text-[var(--d-amber)]' },
};

export default function ItensCriticos({ itens, loading }) {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col rounded-md border border-[var(--d-border)] bg-[var(--d-surface)] px-5 pt-5 pb-3">
      <header className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--d-faint)]">Itens críticos</span>
        <button
          type="button"
          onClick={() => navigate('/pecas')}
          className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--d-orange)] hover:underline"
        >
          ver todos <FiArrowRight className="h-3 w-3" />
        </button>
      </header>

      {loading ? (
        <div className="space-y-4 py-2">
          {[0, 1, 2, 3].map((k) => (
            <div key={k} className="h-10 rounded bg-[var(--d-border)]/50 animate-pulse" />
          ))}
        </div>
      ) : itens.length === 0 ? (
        <p className="py-10 text-center font-mono text-xs text-[var(--d-faint)]">Nenhum item abaixo do ponto de reposição.</p>
      ) : (
        <ul>
          {itens.map((item) => {
            const cor = COR_STATUS[item.status] || COR_STATUS.atencao;
            return (
              <li key={item.id} className="flex items-center gap-3.5 py-3">
                <span className={`w-[2px] self-stretch rounded ${cor.barra}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm font-medium text-[var(--d-text)]">{item.nome}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-[var(--d-faint)]">{item.codigo}</p>
                </div>
                <div className="text-right">
                  <p className={`font-display text-lg font-bold leading-none ${cor.texto}`}>{item.quantidade}</p>
                  <p className="mt-1 font-mono text-[10px] text-[var(--d-faint)]">/{item.pontoReposicao}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
