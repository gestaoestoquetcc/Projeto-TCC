import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiArrowRight } from 'react-icons/fi';

const ESTILOS = {
  ruptura: {
    tag: 'Ruptura',
    acao: 'Gerar Pedido',
    rota: '/movimentacao',
    card: 'bg-[var(--d-red-bg)] border-[var(--d-red-border)]',
    cor: 'text-[var(--d-red)]',
    barra: 'bg-[var(--d-red)]',
    chip: 'bg-[var(--d-red-border)]/60',
    botao: 'border-[var(--d-red-border)] hover:bg-[var(--d-red-border)]/40',
  },
  atencao: {
    tag: 'Atenção',
    acao: 'Ver Previsão',
    rota: '/pecas',
    card: 'bg-[var(--d-amber-bg)] border-[var(--d-amber-border)]',
    cor: 'text-[var(--d-amber)]',
    barra: 'bg-[var(--d-amber)]',
    chip: 'bg-[var(--d-amber-border)]/60',
    botao: 'border-[var(--d-amber-border)] hover:bg-[var(--d-amber-border)]/40',
  },
  previsao: {
    tag: 'Previsão',
    acao: 'Ver Análise',
    rota: '/pecas',
    card: 'bg-[var(--d-teal-bg)] border-[var(--d-teal-border)]',
    cor: 'text-[var(--d-teal)]',
    barra: 'bg-[var(--d-teal)]',
    chip: 'bg-[var(--d-teal-border)]/60',
    botao: 'border-[var(--d-teal-border)] hover:bg-[var(--d-teal-border)]/40',
  },
};

function AlertaCard({ alerta, onDispensar }) {
  const navigate = useNavigate();
  const e = ESTILOS[alerta.tipo];

  return (
    <article className={`relative flex flex-col rounded-md border px-5 pt-4 pb-4 ${e.card}`}>
      <button
        type="button"
        onClick={() => onDispensar(alerta.id)}
        aria-label="Dispensar alerta"
        className="absolute top-3.5 right-3.5 text-[var(--d-faint)] transition-colors hover:text-[var(--d-text)]"
      >
        <FiX className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-center gap-2.5">
        <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${e.chip} ${e.cor}`}>
          {e.tag}
        </span>
        <span className="font-mono text-[11px] text-[var(--d-faint)]">{alerta.codigo}</span>
      </div>

      <h3 className="mt-3 font-body text-[15px] font-semibold text-[var(--d-text)]">{alerta.titulo}</h3>
      <p className="mt-1.5 flex-1 font-body text-[13px] leading-relaxed text-[var(--d-muted)]">{alerta.descricao}</p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3" title="Confiança da previsão">
          <span className="relative h-[2px] w-[52px] overflow-hidden rounded bg-[var(--d-border)]">
            <span className={`absolute inset-y-0 left-0 ${e.barra}`} style={{ width: `${alerta.confianca}%` }} />
          </span>
          <span className={`font-mono text-[11px] ${e.cor}`}>{alerta.confianca}%</span>
        </div>

        <button
          type="button"
          onClick={() => navigate(e.rota)}
          className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border px-3 py-1.5 font-mono text-[11px] font-bold transition-colors ${e.cor} ${e.botao}`}
        >
          {e.acao}
          <FiArrowRight className="h-3 w-3" />
        </button>
      </div>
    </article>
  );
}

export default function Alertas({ alertas, loading, onDispensar }) {
  return (
    <section>
      <div className="mb-3.5 flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--d-border)]" />
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--d-faint)]">
          Alertas preditivos
        </span>
        <span className="rounded border border-[var(--d-teal-border)] bg-[var(--d-teal-bg)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--d-teal)]">
          {loading ? '…' : `${alertas.length} ${alertas.length === 1 ? 'ativo' : 'ativos'}`}
        </span>
        <span className="h-px flex-1 bg-[var(--d-border)]" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
          {[0, 1, 2].map((k) => (
            <div key={k} className="h-[174px] rounded-md border border-[var(--d-border)] bg-[var(--d-surface)] animate-pulse" />
          ))}
        </div>
      ) : alertas.length ? (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
          {alertas.map((alerta) => (
            <AlertaCard key={alerta.id} alerta={alerta} onDispensar={onDispensar} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-[var(--d-border)] py-8 text-center font-mono text-xs text-[var(--d-faint)]">
          Nenhum alerta ativo no momento.
        </div>
      )}
    </section>
  );
}
