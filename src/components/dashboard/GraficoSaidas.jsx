import React, { useState } from 'react';

export default function GraficoSaidas() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Dados dos últimos 6 meses
  const dados = [
    { mes: 'Abr', combustao: 370, eletrico: 160, motos: 140 },
    { mes: 'Mai', combustao: 385, eletrico: 180, motos: 135 },
    { mes: 'Jun', combustao: 420, eletrico: 210, motos: 130 },
    { mes: 'Jul', combustao: 440, eletrico: 235, motos: 125 },
    { mes: 'Ago', combustao: 435, eletrico: 260, motos: 130 },
    { mes: 'Set', combustao: 490, eletrico: 310, motos: 145 },
  ];

  const maxVal = 600;
  const width = 800;
  const height = 240;
  const paddingX = 40;
  const paddingY = 20;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Converter valor em coordenada Y
  const getY = (val) => {
    return paddingY + chartHeight - (val / maxVal) * chartHeight;
  };

  // Converter índice do mês em coordenada X
  const getX = (idx) => {
    return paddingX + (idx / (dados.length - 1)) * chartWidth;
  };

  // Gerar caminho SVG suave (Curva de Bezier cúbica)
  const generateSmoothPath = (key) => {
    const points = dados.map((d, i) => ({ x: getX(i), y: getY(d[key]) }));
    if (points.length === 0) return '';

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpX2 = cpX1;
      d += ` C ${cpX1} ${p0.y}, ${cpX2} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  // Gerar caminho de área fechada para o gradiente
  const generateAreaPath = (key) => {
    const linePath = generateSmoothPath(key);
    const bottomY = getY(0);
    const firstX = getX(0);
    const lastX = getX(dados.length - 1);
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const yTicks = [0, 150, 300, 450, 600];

  return (
    <div className="bg-white/90 border border-[#e5dfd4] rounded-xl p-6 shadow-xs">
      {/* Header do Gráfico com Legendas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold block mb-1">
            Saídas por Segmento
          </span>
          <h2 className="text-base font-bold text-gray-900">
            Últimos 6 meses · unidades
          </h2>
        </div>

        {/* Legendas */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#d97706] rounded-full inline-block" />
            <span className="text-gray-600">Combustão</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#2563eb] rounded-full inline-block" />
            <span className="text-gray-600">Elétrico</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#64748b] rounded-full inline-block" />
            <span className="text-gray-600">Motos</span>
          </div>
        </div>
      </div>

      {/* Área do Gráfico SVG */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            {/* Gradiente Combustão */}
            <linearGradient id="gradCombustao" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
            </linearGradient>
            {/* Gradiente Elétrico */}
            <linearGradient id="gradEletrico" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
            {/* Gradiente Motos */}
            <linearGradient id="gradMotos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#64748b" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#64748b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas de Grade Horizontais e Ticks do Eixo Y */}
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

          {/* Áreas com Gradiente */}
          <path d={generateAreaPath('combustao')} fill="url(#gradCombustao)" />
          <path d={generateAreaPath('eletrico')} fill="url(#gradEletrico)" />
          <path d={generateAreaPath('motos')} fill="url(#gradMotos)" />

          {/* Linhas Principais dos Segmentos */}
          <path
            d={generateSmoothPath('combustao')}
            fill="none"
            stroke="#d97706"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={generateSmoothPath('eletrico')}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={generateSmoothPath('motos')}
            fill="none"
            stroke="#64748b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Indicador de hover e pontos nos dados */}
          {dados.map((d, i) => {
            const x = getX(i);
            const isHovered = hoveredIndex === i;

            return (
              <g key={d.mes}>
                {/* Linha vertical no hover */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={height - paddingY}
                    stroke="#b45309"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.6"
                  />
                )}

                {/* Pontos nas linhas */}
                {isHovered && (
                  <>
                    <circle cx={x} cy={getY(d.combustao)} r="4" fill="#d97706" stroke="#ffffff" strokeWidth="2" />
                    <circle cx={x} cy={getY(d.eletrico)} r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                    <circle cx={x} cy={getY(d.motos)} r="4" fill="#64748b" stroke="#ffffff" strokeWidth="2" />
                  </>
                )}

                {/* Rótulo do Eixo X */}
                <text
                  x={x}
                  y={height - 2}
                  textAnchor="middle"
                  className={`text-[11px] font-mono font-medium transition-colors ${
                    isHovered ? 'fill-amber-800 font-bold' : 'fill-gray-400'
                  }`}
                >
                  {d.mes}
                </text>

                {/* Área invisível clicável/hoverável para interação */}
                <rect
                  x={x - chartWidth / (dados.length * 2)}
                  y={0}
                  width={chartWidth / dados.length}
                  height={height}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip flutuante no hover */}
        {hoveredIndex !== null && (
          <div
            className="absolute top-2 pointer-events-none bg-gray-900/95 backdrop-blur-xs text-white p-3 rounded-lg shadow-xl text-xs z-20 border border-gray-800 transition-all duration-75"
            style={{
              left: `${(getX(hoveredIndex) / width) * 100}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-1.5 font-bold">
              Mês: {dados[hoveredIndex].mes} / 2026
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#fbbf24] font-semibold">Combustão:</span>
                <span className="font-mono font-bold">{dados[hoveredIndex].combustao} un</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#60a5fa] font-semibold">Elétrico:</span>
                <span className="font-mono font-bold">{dados[hoveredIndex].eletrico} un</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#94a3b8] font-semibold">Motos:</span>
                <span className="font-mono font-bold">{dados[hoveredIndex].motos} un</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
