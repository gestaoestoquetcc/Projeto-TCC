import React, { useEffect, useRef, useState } from 'react';

const SERIES = [
  { chave: 'combustao', rotulo: 'Combustão', cor: 'var(--d-comb)' },
  { chave: 'eletrico', rotulo: 'Elétrico', cor: 'var(--d-ev)' },
  { chave: 'moto', rotulo: 'Motos', cor: 'var(--d-moto)' },
];

const ALTURA = 230;
const MARGEM = { top: 12, right: 12, bottom: 26, left: 40 };
const DIVISOES = 4;

// Escolhe um passo "redondo" (1, 1.5, 2, 2.5, 5 × 10^n) para o eixo Y
function passoRedondo(bruto) {
  const pot = 10 ** Math.floor(Math.log10(bruto));
  const n = bruto / pot;
  const fator = n <= 1 ? 1 : n <= 1.5 ? 1.5 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return fator * pot;
}

// Curva suave (Catmull-Rom → Bézier), com os pontos de controle limitados à área do gráfico
function caminhoSuave(pontos, yMax) {
  if (pontos.length < 2) return '';
  const clamp = (y) => Math.min(y, yMax);
  let d = `M${pontos[0][0]},${pontos[0][1]}`;
  for (let i = 0; i < pontos.length - 1; i += 1) {
    const p0 = pontos[i - 1] || pontos[i];
    const p1 = pontos[i];
    const p2 = pontos[i + 1];
    const p3 = pontos[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, clamp(p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, clamp(p2[1] - (p3[1] - p1[1]) / 6)];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function useLargura() {
  const ref = useRef(null);
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    if (!ref.current) return undefined;
    const obs = new ResizeObserver(([entry]) => setLargura(entry.contentRect.width));
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return [ref, largura];
}

export default function Graficos({ serie, loading }) {
  const [ref, largura] = useLargura();
  const [hover, setHover] = useState(null);

  const temDados = serie && SERIES.some((s) => serie[s.chave].some((v) => v > 0));

  let conteudo = null;
  if (largura > 0 && serie && temDados) {
    const n = serie.meses.length;
    const maxValor = Math.max(...SERIES.flatMap((s) => serie[s.chave]));
    const passo = passoRedondo((maxValor * 1.25) / DIVISOES);
    const topo = passo * DIVISOES;

    const plotW = largura - MARGEM.left - MARGEM.right;
    const plotH = ALTURA - MARGEM.top - MARGEM.bottom;
    const base = MARGEM.top + plotH;
    const x = (i) => MARGEM.left + (plotW * i) / (n - 1);
    const y = (v) => MARGEM.top + plotH - (v / topo) * plotH;

    const handleMove = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - rect.left - MARGEM.left;
      setHover(Math.max(0, Math.min(n - 1, Math.round((px / plotW) * (n - 1)))));
    };

    conteudo = (
      <svg
        width={largura}
        height={ALTURA}
        className="block overflow-visible"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {SERIES.map((s) => (
            <linearGradient key={s.chave} id={`grad-${s.chave}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.cor} stopOpacity="0.16" />
              <stop offset="100%" stopColor={s.cor} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* Grade horizontal + eixo Y */}
        {Array.from({ length: DIVISOES + 1 }, (_, k) => {
          const v = passo * k;
          return (
            <g key={k}>
              <line x1={MARGEM.left} x2={MARGEM.left + plotW} y1={y(v)} y2={y(v)} stroke="var(--d-grid)" strokeDasharray="3 4" />
              <text x={MARGEM.left - 10} y={y(v) + 3} textAnchor="end" className="fill-[var(--d-faint)] font-mono text-[10px]">
                {v}
              </text>
            </g>
          );
        })}

        {/* Grade vertical + eixo X */}
        {serie.meses.map((mes, i) => (
          <g key={mes + i}>
            <line x1={x(i)} x2={x(i)} y1={MARGEM.top} y2={base} stroke="var(--d-grid)" strokeDasharray="3 4" />
            <text x={x(i)} y={ALTURA - 6} textAnchor="middle" className="fill-[var(--d-faint)] font-mono text-[10px]">
              {mes}
            </text>
          </g>
        ))}

        {SERIES.map((s) => {
          const pontos = serie[s.chave].map((v, i) => [x(i), y(v)]);
          const linha = caminhoSuave(pontos, base);
          return (
            <g key={s.chave}>
              <path d={`${linha} L${x(n - 1)},${base} L${x(0)},${base} Z`} fill={`url(#grad-${s.chave})`} />
              <path d={linha} fill="none" stroke={s.cor} strokeWidth="1.6" strokeLinecap="round" />
            </g>
          );
        })}

        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={MARGEM.top} y2={base} stroke="var(--d-muted)" strokeOpacity="0.5" />
            {SERIES.map((s) => (
              <circle key={s.chave} cx={x(hover)} cy={y(serie[s.chave][hover])} r="3.5" fill="var(--d-surface)" stroke={s.cor} strokeWidth="2" />
            ))}
          </g>
        )}
      </svg>
    );
  }

  const tooltipEsquerda = hover !== null && largura
    ? MARGEM.left + ((largura - MARGEM.left - MARGEM.right) * hover) / (serie.meses.length - 1)
    : 0;

  return (
    <section className="rounded-md border border-[var(--d-border)] bg-[var(--d-surface)] px-6 pt-6 pb-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--d-faint)]">
            Saídas por segmento
          </span>
          <h2 className="mt-1.5 font-body text-lg font-semibold text-[var(--d-text)]">Últimos 6 meses · unidades</h2>
        </div>

        <ul className="flex items-center gap-5">
          {SERIES.map((s) => (
            <li key={s.chave} className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--d-muted)]">
              <span className="h-[2px] w-2.5 rounded" style={{ background: s.cor }} />
              {s.rotulo}
            </li>
          ))}
        </ul>
      </header>

      <div ref={ref} className="relative mt-5" style={{ height: ALTURA }}>
        {loading ? (
          <div className="h-full w-full rounded bg-[var(--d-border)]/40 animate-pulse" />
        ) : !temDados ? (
          <div className="flex h-full items-center justify-center rounded border border-dashed border-[var(--d-border)] font-mono text-xs text-[var(--d-faint)]">
            Nenhuma saída registrada nos últimos 6 meses.
          </div>
        ) : (
          conteudo
        )}

        {!loading && temDados && hover !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-[130px] -translate-x-1/2 rounded border border-[var(--d-border)] bg-[var(--d-bg)] px-3 py-2 shadow-lg"
            style={{ left: Math.min(Math.max(tooltipEsquerda, 75), largura - 75) }}
          >
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[var(--d-faint)]">
              {serie.meses[hover]}
            </span>
            {SERIES.map((s) => (
              <div key={s.chave} className="flex items-center justify-between gap-4 font-mono text-[11px]">
                <span className="flex items-center gap-1.5 text-[var(--d-muted)]">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.cor }} />
                  {s.rotulo}
                </span>
                <span className="text-[var(--d-text)]">{serie[s.chave][hover]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
