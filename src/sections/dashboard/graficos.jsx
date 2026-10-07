import React, { useMemo, useState } from 'react';

// ---------- Configuração ----------
const SEGMENTOS = [
  { id: 'combustao', nome: 'Combustão', cor: '#c9900c' },
  { id: 'eletrico', nome: 'Elétrico', cor: '#4a8fd8' },
  { id: 'moto', nome: 'Motos', cor: '#8a8f99' },
];

// Filtros de período: quantos dias e em quantos pontos o gráfico divide
const PERIODOS = {
  '7d': { label: '7 dias', titulo: 'Últimos 7 dias', dias: 7, pontos: 7 },
  '30d': { label: '30 dias', titulo: 'Últimos 30 dias', dias: 30, pontos: 6 },
  '90d': { label: '90 dias', titulo: 'Últimos 90 dias', dias: 90, pontos: 6 },
  '6m': { label: '6 meses', titulo: 'Últimos 6 meses', meses: 6 },
};

const DIA = 86400000;
const LARGURA = 1000;
const ALTURA = 260;
const MARGEM = { topo: 10, direita: 10, baixo: 30, esquerda: 45 };

// ---------- Funções de cálculo ----------

// Separa as saídas em "baldes" (dias, semanas ou meses) por segmento
function montarDados(periodoId, pecas, movimentacoes) {
  const periodo = PERIODOS[periodoId];
  const segmentoDaPeca = {};
  pecas.forEach((p) => (segmentoDaPeca[p.id] = p.segmento));

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let rotulos = [];
  let indiceDaData;

  if (periodo.meses) {
    // Um ponto por mês
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - (periodo.meses - 1), 1);
    for (let i = 0; i < periodo.meses; i++) {
      const d = new Date(inicio.getFullYear(), inicio.getMonth() + i, 1);
      const mes = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      rotulos.push(mes.charAt(0).toUpperCase() + mes.slice(1));
    }
    indiceDaData = (data) =>
      (data.getFullYear() - inicio.getFullYear()) * 12 + (data.getMonth() - inicio.getMonth());
  } else {
    // Pontos com o mesmo número de dias cada
    const inicio = new Date(hoje.getTime() - (periodo.dias - 1) * DIA);
    const tamanho = periodo.dias / periodo.pontos;
    for (let i = 0; i < periodo.pontos; i++) {
      const d = new Date(inicio.getTime() + Math.floor(i * tamanho) * DIA);
      rotulos.push(
        periodo.dias === 7
          ? d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
          : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      );
    }
    indiceDaData = (data) => Math.floor((data.getTime() - inicio.getTime()) / DIA / tamanho);
  }

  const series = SEGMENTOS.map((s) => ({ ...s, dados: rotulos.map(() => 0), total: 0 }));

  movimentacoes.forEach((m) => {
    if (m.tipo !== 'saida' || !m.dataHora) return;
    const i = indiceDaData(new Date(m.dataHora));
    if (i < 0 || i >= rotulos.length) return; // fora do período
    const serie = series.find((s) => s.id === (segmentoDaPeca[m.pecaId] || 'combustao'));
    serie.dados[i] += Number(m.quantidade || 0);
    serie.total += Number(m.quantidade || 0);
  });

  return { rotulos, series };
}

// Valor máximo "redondo" para o eixo (ex.: 20, 120, 600)
function calcularMaximo(series) {
  const maior = Math.max(0, ...series.flatMap((s) => s.dados));
  if (maior === 0) return 4;
  const passoBruto = maior / 4;
  const potencia = 10 ** Math.floor(Math.log10(passoBruto));
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= passoBruto);
  return Math.max(4, passo * 4);
}

function pontos(dados, maximo) {
  const larguraUtil = LARGURA - MARGEM.esquerda - MARGEM.direita;
  const alturaUtil = ALTURA - MARGEM.topo - MARGEM.baixo;
  return dados.map((v, i) => ({
    x: MARGEM.esquerda + (i / Math.max(1, dados.length - 1)) * larguraUtil,
    y: MARGEM.topo + alturaUtil - (v / maximo) * alturaUtil,
  }));
}

// Curva suave passando pelos pontos (sem deixar a linha passar abaixo do zero)
function curva(pts) {
  const base = ALTURA - MARGEM.baixo;
  const limitar = (y) => Math.min(base, Math.max(MARGEM.topo, y));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = limitar(p1.y + (p2.y - p0.y) / 6);
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = limitar(p2.y - (p3.y - p1.y) / 6);
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

// ---------- Seção do gráfico ----------
export default function Graficos({ t, pecas = [], movimentacoes = [] }) {
  const [periodo, setPeriodo] = useState('6m');

  const { rotulos, series } = useMemo(
    () => montarDados(periodo, pecas, movimentacoes),
    [periodo, pecas, movimentacoes]
  );
  const maximo = calcularMaximo(series);
  const base = ALTURA - MARGEM.baixo;
  const linhasY = [0, 1, 2, 3, 4].map((i) => Math.round((maximo / 4) * i));
  const semDados = series.every((s) => s.total === 0);

  return (
    <section className={`border rounded-xl p-6 shadow-xs ${t.card}`}>
      {/* Topo: título, filtro e legenda */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <span className={`text-[11px] font-mono tracking-widest uppercase block ${t.textoSuave}`}>
            Saídas por segmento
          </span>
          <h2 className={`text-xl font-semibold mt-1 ${t.textoForte}`}>{PERIODOS[periodo].titulo} · unidades</h2>
        </div>

        <div className="flex flex-col md:items-end gap-3">
          {/* Filtro de período */}
          <div className={`inline-flex p-1 gap-0.5 border rounded-lg ${t.abas}`}>
            {Object.entries(PERIODOS).map(([id, p]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPeriodo(id)}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                  periodo === id ? 'bg-[#c8672b] text-white shadow-xs' : t.abaInativa
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Legenda com o total de cada segmento */}
          <div className="flex flex-wrap gap-4 text-xs font-mono">
            {series.map((s) => (
              <span key={s.id} className={`inline-flex items-center gap-1.5 ${t.textoForte}`}>
                <span className="w-2.5 h-0.5 rounded" style={{ background: s.cor }} />
                {s.nome}
                <span className={t.textoFraco}>{s.total}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico em SVG */}
      <div className="relative">
        <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="w-full h-auto block">
          <defs>
            {series.map((s) => (
              <linearGradient key={s.id} id={`grad-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.cor} stopOpacity="0.14" />
                <stop offset="100%" stopColor={s.cor} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* Linhas horizontais + valores */}
          {linhasY.map((v) => {
            const y = pontos([v], maximo)[0].y;
            return (
              <g key={v}>
                <line x1={MARGEM.esquerda} x2={LARGURA - MARGEM.direita} y1={y} y2={y} stroke={t.grade} strokeDasharray="3 4" />
                <text x={MARGEM.esquerda - 10} y={y + 4} textAnchor="end" fontSize="10" fontFamily="monospace" fill="#9a9a9a">
                  {v}
                </text>
              </g>
            );
          })}

          {/* Linhas verticais + rótulos */}
          {pontos(rotulos.map(() => 0), maximo).map((p, i) => (
            <g key={`${periodo}-${i}`}>
              <line x1={p.x} x2={p.x} y1={MARGEM.topo} y2={base} stroke={t.grade} strokeDasharray="3 4" />
              <text
                x={p.x}
                y={ALTURA - 8}
                textAnchor={i === 0 ? 'start' : i === rotulos.length - 1 ? 'end' : 'middle'}
                fontSize="10"
                fontFamily="monospace"
                fill="#9a9a9a"
              >
                {rotulos[i]}
              </text>
            </g>
          ))}

          {/* Área + linha de cada segmento */}
          {series.map((s) => {
            const pts = pontos(s.dados, maximo);
            const linha = curva(pts);
            const area = `${linha} L ${pts[pts.length - 1].x} ${base} L ${pts[0].x} ${base} Z`;
            return (
              <g key={`${periodo}-${s.id}`} className="animate-[fadeIn_0.4s_ease]">
                <path d={area} fill={`url(#grad-${s.id})`} />
                <path d={linha} fill="none" stroke={s.cor} strokeWidth="2" vectorEffect="non-scaling-stroke">
                  <title>
                    {s.nome}: {s.dados.join(', ')}
                  </title>
                </path>
              </g>
            );
          })}
        </svg>

        {semDados && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xs font-mono px-3 py-1.5 rounded-md border ${t.card} ${t.textoSuave}`}>
              Nenhuma saída registrada neste período
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
