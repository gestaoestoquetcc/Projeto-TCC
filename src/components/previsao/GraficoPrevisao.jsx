import React, { useState } from 'react';

export default function GraficoPrevisao({ segmento = 'eletrico' }) {
  const [periodo, setPeriodo] = useState('30D'); // '30D', '60D', '90D'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Dados históricos e projeção baseados na referência
  const dados = [
    { mes: 'Jul', real: 200, previsto: null, isPrevisto: false },
    { mes: 'Ago', real: 235, previsto: null, isPrevisto: false },
    { mes: 'Set', real: 270, previsto: 270, isPrevisto: false, isCorte: true },
    { mes: 'Out', real: null, previsto: 310, faixaInferior: 285, faixaSuperior: 335, isPrevisto: true },
    ...(periodo === '60D' || periodo === '90D' ? [
      { mes: 'Nov', real: null, previsto: 345, faixaInferior: 310, faixaSuperior: 380, isPrevisto: true }
    ] : []),
    ...(periodo === '90D' ? [
      { mes: 'Dez', real: null, previsto: 390, faixaInferior: 340, faixaSuperior: 435, isPrevisto: true }
    ] : []),
  ];

  const maxVal = 340;
  const width = 800;
  const height = 240;
  const paddingX = 45;
  const paddingY = 25;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const getY = (val) => {
    return paddingY + chartHeight - (val / maxVal) * chartHeight;
  };

  const getX = (idx) => {
    return paddingX + (idx / (dados.length - 1)) * chartWidth;
  };

  const yTicks = [0, 85, 170, 255, 340];

  // Índice do corte (Setembro)
  const corteIndex = dados.findIndex((d) => d.isCorte);

  // Caminho da linha Real (Jul -> Ago -> Set)
  const pontosReais = dados.slice(0, corteIndex + 1);
  const pathReal = pontosReais.reduce((acc, curr, idx) => {
    const x = getX(idx);
    const y = getY(curr.real);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Caminho da linha Prevista (Set -> Out ...)
  const pontosPrevistos = dados.slice(corteIndex);
  const pathPrevisto = pontosPrevistos.reduce((acc, curr, idx) => {
    const x = getX(corteIndex + idx);
    const y = getY(curr.previsto);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Área do Intervalo de Confiança (faixa)
  const pontosFaixa = dados.filter((d) => d.isPrevisto);
  let pathIntervalo = '';
  if (pontosFaixa.length > 0) {
    const startX = getX(corteIndex);
    const startY = getY(dados[corteIndex].real);
    
    // Topo da faixa
    let topo = `M ${startX} ${startY}`;
    pontosFaixa.forEach((d) => {
      const idx = dados.indexOf(d);
      topo += ` L ${getX(idx)} ${getY(d.faixaSuperior)}`;
    });

    // Fundo da faixa voltando
    let fundo = '';
    [...pontosFaixa].reverse().forEach((d) => {
      const idx = dados.indexOf(d);
      fundo += ` L ${getX(idx)} ${getY(d.faixaInferior)}`;
    });
    fundo += ` L ${startX} ${startY} Z`;

    pathIntervalo = topo + fundo;
  }

  return (
    <div className="bg-white/90 border border-[#e5dfd4] rounded-xl p-6 shadow-xs">
      {/* Header do Gráfico */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold block mb-1">
            Segmento Elétrico
          </span>
          <h2 className="text-base font-bold text-gray-900">
            Previsão de Demanda
          </h2>
        </div>

        {/* Legenda e Abas de Período */}
        <div className="flex flex-wrap items-center gap-6">
          {/* Legenda */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#e06b26] rounded-full inline-block" />
              <span className="text-gray-600">Real</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 border-t-2 border-dashed border-[#0d9488] inline-block" />
              <span className="text-gray-600">Previsto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-[#0d9488]/15 border border-[#0d9488]/30 rounded-xs inline-block" />
              <span className="text-gray-600">Intervalo</span>
            </div>
          </div>

          {/* Abas 30D / 60D / 90D */}
          <div className="inline-flex items-center p-0.5 bg-[#f5f1e8] rounded-lg border border-[#e5dfd4]">
            {['30D', '60D', '90D'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPeriodo(tab)}
                className={`px-2.5 py-1 text-xs font-bold font-mono rounded-md transition-all ${
                  periodo === tab
                    ? 'bg-[#e6f7f3] text-[#0d9488] shadow-2xs border border-[#bbf0e4]'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Linhas de Grade e Ticks do Eixo Y */}
          {yTicks.map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#f1ede5"
                  strokeWidth="1"
                  strokeDasharray={val === 0 ? '0' : '4 4'}
                />
                <text
                  x={paddingX - 10}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-gray-400 font-medium"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Linha vertical separadora em Setembro (marco do presente) */}
          <line
            x1={getX(corteIndex)}
            y1={paddingY}
            x2={getX(corteIndex)}
            y2={height - paddingY}
            stroke="#d4cfc5"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Área sombreada do Intervalo de Confiança */}
          {pathIntervalo && (
            <path
              d={pathIntervalo}
              fill="#0d9488"
              fillOpacity="0.08"
              stroke="#0d9488"
              strokeWidth="0.5"
              strokeDasharray="2 2"
              strokeOpacity="0.4"
            />
          )}

          {/* Linha Real (Laranja) */}
          <path
            d={pathReal}
            fill="none"
            stroke="#e06b26"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Linha Prevista (Tracejada Teal) */}
          <path
            d={pathPrevisto}
            fill="none"
            stroke="#0d9488"
            strokeWidth="2.5"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />

          {/* Pontos da Linha Real */}
          {pontosReais.map((d, i) => {
            const x = getX(i);
            const y = getY(d.real);
            return (
              <g key={d.mes}>
                <circle cx={x} cy={y} r="4.5" fill="#e06b26" stroke="#ffffff" strokeWidth="2" />
              </g>
            );
          })}

          {/* Pontos da Linha Prevista */}
          {dados.slice(corteIndex + 1).map((d) => {
            const idx = dados.indexOf(d);
            const x = getX(idx);
            const y = getY(d.previsto);
            return (
              <g key={d.mes}>
                <circle cx={x} cy={y} r="5" fill="#0d9488" stroke="#ffffff" strokeWidth="2" />
              </g>
            );
          })}

          {/* Rótulos do Eixo X */}
          {dados.map((d, i) => {
            const x = getX(i);
            return (
              <g key={d.mes}>
                <text
                  x={x}
                  y={height - 4}
                  textAnchor="middle"
                  className={`text-[11px] font-mono font-medium ${
                    d.isPrevisto ? 'fill-[#0d9488] font-bold' : 'fill-gray-500'
                  }`}
                >
                  {d.mes}
                </text>

                {/* Área invisível para hover */}
                <rect
                  x={x - chartWidth / (dados.length * 2)}
                  y={0}
                  width={chartWidth / dados.length}
                  height={height}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip Hover */}
        {hoveredPoint && (
          <div
            className="absolute top-2 pointer-events-none bg-gray-900/95 backdrop-blur-xs text-white p-3 rounded-lg shadow-xl text-xs z-20 border border-gray-800 transition-all duration-75"
            style={{
              left: `${(getX(dados.indexOf(hoveredPoint)) / width) * 100}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-bold">
              {hoveredPoint.mes} / 2026 {hoveredPoint.isPrevisto ? '(Projeção IA)' : '(Histórico Real)'}
            </div>
            {hoveredPoint.real !== null && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-orange-400 font-semibold">Demanda Real:</span>
                <span className="font-mono font-bold">{hoveredPoint.real} un</span>
              </div>
            )}
            {hoveredPoint.previsto !== null && hoveredPoint.isPrevisto && (
              <>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-teal-400 font-semibold">Previsão IA:</span>
                  <span className="font-mono font-bold">{hoveredPoint.previsto} un</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-gray-400 text-[11px] mt-0.5">
                  <span>Margem (+/-):</span>
                  <span className="font-mono">{hoveredPoint.faixaInferior} ~ {hoveredPoint.faixaSuperior} un</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
