import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw } from 'react-icons/fi';

import Sidebar from '../../components/layout/Sidebar';
import MetricCard from '../../components/dashboard/MetricCard';
import GraficoPrevisao from '../../components/previsao/GraficoPrevisao';
import SugestoesCompra from '../../components/previsao/SugestoesCompra';
import SimuladorParametros from '../../components/previsao/SimuladorParametros';

export default function PrevisaoPage() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [kpis, setKpis] = useState({
    precisao: '94.2%',
    sugestoesAtivas: 4,
    economia: 'R$ 12.400',
    demandaEV: '+27%'
  });
  const [modeloStatus, setModeloStatus] = useState('modelo v3.2 · atualizado agora');

  const handleAplicarParametros = ({ modo, bufferSeguranca, crescimentoFrotaEV }) => {
    // Atualizar dinamicamente os indicadores de acordo com a estratégia simulada
    if (modo === 'conservador') {
      setKpis({
        precisao: '92.8%',
        sugestoesAtivas: 3,
        economia: 'R$ 15.800',
        demandaEV: `+${Math.round(crescimentoFrotaEV * 0.8)}%`
      });
      setModeloStatus('modelo v3.2 · perfil conservador');
    } else if (modo === 'agressivo') {
      setKpis({
        precisao: '96.1%',
        sugestoesAtivas: 6,
        economia: 'R$ 9.200',
        demandaEV: `+${Math.round(crescimentoFrotaEV * 1.2)}%`
      });
      setModeloStatus('modelo v3.2 · perfil agressivo (zero ruptura)');
    } else {
      setKpis({
        precisao: '94.2%',
        sugestoesAtivas: 4,
        economia: 'R$ 12.400',
        demandaEV: `+${crescimentoFrotaEV}%`
      });
      setModeloStatus('modelo v3.2 · perfil equilibrado');
    }
  };

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-[#12161f] text-gray-100' : 'bg-[#f7f5f0] text-gray-900'}`}>
      {/* Sidebar AutoStock com aba 'previsao' ativa e badge LIVE */}
      <Sidebar 
        activeTab="previsao" 
        isDark={isDark} 
        onToggleDark={() => setIsDark((prev) => !prev)} 
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col px-8 py-8 overflow-y-auto">
        {/* Header Breadcrumb & Title */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a89e90] block mb-1">
              Módulo Preditivo
            </span>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
              Central de Previsão
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Status do Modelo de IA */}
            <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{modeloStatus}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setModeloStatus('modelo v3.2 · atualizado agora');
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-amber-800 hover:bg-black/5 transition-colors"
              title="Recalcular projeções"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* 4 Cards de Métricas da IA */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/90 border border-[#e5dfd4] rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold mb-2">
              Precisão do Modelo
            </span>
            <div className="text-3xl font-black tracking-tight text-[#0d9488]">
              {kpis.precisao}
            </div>
          </div>

          <div className="bg-white/90 border border-[#e5dfd4] rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold mb-2">
              Sugestões Ativas
            </span>
            <div className="text-3xl font-black tracking-tight text-gray-900">
              {kpis.sugestoesAtivas}
            </div>
          </div>

          <div className="bg-white/90 border border-[#e5dfd4] rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold mb-2">
              Economia Projetada
            </span>
            <div className="text-3xl font-black tracking-tight text-[#16a34a]">
              {kpis.economia}
            </div>
          </div>

          <div className="bg-white/90 border border-[#e5dfd4] rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold mb-2">
              Demanda EV +30D
            </span>
            <div className="text-3xl font-black tracking-tight text-[#d97706]">
              {kpis.demandaEV}
            </div>
          </div>
        </section>

        {/* Gráfico de Previsão de Demanda (Segmento Elétrico) */}
        <section className="mb-8">
          <GraficoPrevisao segmento="eletrico" />
        </section>

        {/* [ROBUSTEZ TCC] Simulador de Sensibilidade da IA */}
        <SimuladorParametros onAplicarParametros={handleAplicarParametros} />

        {/* Lista de Sugestões de Compra */}
        <SugestoesCompra 
          onAprovarItem={(item) => {
            console.log('Item aprovado:', item);
          }}
          onAprovarTodas={(itens) => {
            console.log('Todas aprovadas:', itens);
          }}
        />
      </main>
    </div>
  );
}
