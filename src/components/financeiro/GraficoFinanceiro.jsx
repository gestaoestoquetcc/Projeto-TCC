import React from 'react';

const LARGURA = 1000;
const ALTURA = 260;
const M = { topo: 14, direita: 12, baixo: 32, esquerda: 70 };

const COR = { receitas: '#2f9e5b', saidas: '#d64545', lucro: '#d4881c' };

// Passo "redondo" para o eixo (ex.: 500, 1.000, 2.500)
function passoRedondo(valor) {
  if (valor <= 0) return 500;
  const bruto = valor / 4;
  const base = Math.pow(10, Math.floor(Math.log10(bruto)));
  return [1, 2, 2.5, 5, 10].map((x) => x * base).find((x) => x >= bruto);
}

const curto = (v) => {
  const a = Math.abs(v);
  const s = a >= 1000 ? `${(a / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : a.toLocaleString('pt-BR');
  return (v < 0 ? '-' : '') + s;
};
const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Barras de entradas x saídas por mês + linha do lucro */
export default function GraficoFinanceiro({ t, serie }) {
  const maior = Math.max(0, ...serie.flatMap((s) => [s.receitas, s.saidas, s.lucro]));
  const menor = Math.min(0, ...serie.map((s) => s.lucro));
  const passo = passoRedondo(Math.max(maior, -menor));
  const topo = Math.ceil(maior / passo) * passo || passo;
  const fundo = Math.floor(menor / passo) * passo;

  const altUtil = ALTURA - M.topo - M.baixo;
  const y = (v) => M.topo + altUtil * (1 - (v - fundo) / (topo - fundo));
  const linhas = [];
  for (let v = fundo; v <= topo + 0.001; v += passo) linhas.push(v);

  const slot = (LARGURA - M.esquerda - M.direita) / serie.length;
  const larg = Math.min(34, slot / 3.4);
  const cx = (i) => M.esquerda + slot * i + slot / 2;
  const pontosLucro = serie.map((s, i) => `${cx(i).toFixed(1)},${y(s.lucro).toFixed(1)}`).join(' ');

  return (
    <div>
      <div className="flex flex-wrap gap-4 text-[11px] font-mono mb-3">
        <Legenda cor={COR.receitas} texto="Entradas" t={t} />
        <Legenda cor={COR.saidas} texto="Saídas" t={t} />
        <Legenda cor={COR.lucro} texto="Lucro / prejuízo" t={t} linha />
      </div>
      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="w-full h-auto" role="img" aria-label="Entradas, saídas e lucro dos últimos 6 meses">
        {linhas.map((v) => (
          <g key={v}>
            <line
              x1={M.esquerda} x2={LARGURA - M.direita} y1={y(v)} y2={y(v)}
              stroke={t.grade} strokeWidth={v === 0 ? 1.5 : 1} strokeDasharray={v === 0 ? undefined : '4 6'}
            />
            <text x={M.esquerda - 10} y={y(v) + 4} textAnchor="end" fontSize="12" fontFamily="monospace" fill="#8a8f99">
              {curto(v)}
            </text>
          </g>
        ))}

        {serie.map((s, i) => (
          <g key={s.rotulo + i}>
            {s.atual && (
              <rect x={cx(i) - slot / 2 + 6} y={M.topo} width={slot - 12} height={altUtil} rx="10" fill={t.grade} opacity="0.45" />
            )}
            <rect x={cx(i) - larg - 3} y={y(s.receitas)} width={larg} height={Math.max(0, y(0) - y(s.receitas))} rx="4" fill={COR.receitas}>
              <title>{`Entradas: ${brl(s.receitas)}`}</title>
            </rect>
            <rect x={cx(i) + 3} y={y(s.saidas)} width={larg} height={Math.max(0, y(0) - y(s.saidas))} rx="4" fill={COR.saidas}>
              <title>{`Saídas: ${brl(s.saidas)}`}</title>
            </rect>
            <text x={cx(i)} y={ALTURA - 10} textAnchor="middle" fontSize="13" fontWeight={s.atual ? 700 : 500} fill={s.atual ? '#c8672b' : '#8a8f99'}>
              {s.rotulo}
            </text>
          </g>
        ))}

        <polyline points={pontosLucro} fill="none" stroke={COR.lucro} strokeWidth="2.5" strokeLinejoin="round" />
        {serie.map((s, i) => (
          <circle key={`p${i}`} cx={cx(i)} cy={y(s.lucro)} r={s.atual ? 6 : 4} fill={s.lucro < 0 ? COR.saidas : COR.lucro} stroke="white" strokeWidth="2">
            <title>{`${s.lucro < 0 ? 'Prejuízo' : 'Lucro'}: ${brl(s.lucro)}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}

function Legenda({ cor, texto, t, linha }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${t.textoSuave}`}>
      <span className={linha ? 'w-4 h-0.5 rounded' : 'w-2.5 h-2.5 rounded-sm'} style={{ background: cor }} />
      {texto}
    </span>
  );
}
