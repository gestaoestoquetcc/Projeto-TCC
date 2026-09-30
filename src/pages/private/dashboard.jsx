import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPackage, 
  FiRepeat, 
  FiAlertTriangle, 
  FiAlertOctagon, 
  FiTrendingUp, 
  FiPlus, 
  FiArrowRight, 
  FiCpu, 
  FiRefreshCw 
} from 'react-icons/fi';

import Sidebar from '../../components/layout/Sidebar';
import MetricCard from '../../components/dashboard/MetricCard';
import AlertasPreditivos from '../../components/dashboard/AlertasPreditivos';
import GraficoSaidas from '../../components/dashboard/GraficoSaidas';
import PaineisEstoque from '../../components/dashboard/PaineisEstoque';
import { getPecas } from '../../services/pecasService';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [pecas, setPecas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [horaSincronizacao, setHoraSincronizacao] = useState('09:14');

  // Buscar dados reais do Supabase
  const carregarDados = async () => {
    try {
      setLoading(true);
      const listaPecas = await getPecas();
      setPecas(listaPecas);
      const agora = new Date();
      setHoraSincronizacao(
        agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      );
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Cálculos dinâmicos dos KPIs a partir do Supabase
  const kpis = useMemo(() => {
    if (pecas.length === 0) {
      return {
        volumeTotal: 285,
        giroMedio: '6.3',
        rupturas: 2,
        atencao: 2
      };
    }

    const volumeTotal = pecas.reduce((acc, p) => acc + (p.quantidade || 0), 0);
    const rupturas = pecas.filter((p) => p.status === 'critico').length;
    const atencao = pecas.filter((p) => p.status === 'atencao').length;
    
    return {
      volumeTotal,
      giroMedio: '6.3',
      rupturas,
      atencao
    };
  }, [pecas]);



  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-[#12161f] text-gray-100' : 'bg-[#f7f5f0] text-gray-900'}`}>
      {/* Sidebar AutoStock com aba ativa no Dashboard */}
      <Sidebar 
        activeTab="dashboard" 
        isDark={isDark} 
        onToggleDark={() => setIsDark((prev) => !prev)} 
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col px-8 py-8 overflow-y-auto">
        {/* Top Header: Data, Título e Indicador de Sincronização */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a89e90] block mb-1">
              SET 2026 · SEMANA 37
            </span>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
              Visão Geral
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Indicador de Sincronização */}
            <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>sync {horaSincronizacao}</span>
            </div>

            {/* Botão de Atualização Rápida */}
            <button
              type="button"
              onClick={carregarDados}
              disabled={loading}
              className="p-2 rounded-lg text-gray-400 hover:text-amber-800 hover:bg-black/5 transition-colors disabled:opacity-50"
              title="Sincronizar com Supabase"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Ações Rápidas */}
            <button
              type="button"
              onClick={() => navigate('/movimentacao')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e5dfd4] rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors"
            >
              <FiRepeat className="w-3.5 h-3.5 text-amber-600" />
              Entrada/Saída
            </button>

            <button
              type="button"
              onClick={() => navigate('/pecas')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#c8672b] hover:bg-[#b85b20] text-white rounded-lg text-xs font-bold shadow-xs hover:shadow transition-all"
            >
              <FiPlus className="w-3.5 h-3.5 stroke-[2.5]" />
              Catálogo
            </button>
          </div>
        </header>

        {/* 4 Cards de Métricas / KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Vol. em Estoque"
            value={kpis.volumeTotal}
            unit="un."
            delta="+3.2%"
            deltaType="positive"
            icon={FiPackage}
          />

          <MetricCard
            title="Giro Médio"
            value={kpis.giroMedio}
            unit="x/mês"
            delta="+0.8"
            deltaType="positive"
            icon={FiTrendingUp}
          />

          <MetricCard
            title="Rupturas"
            value={kpis.rupturas}
            unit="SKUs"
            delta={`+${kpis.rupturas}`}
            deltaType="critical"
            icon={FiAlertOctagon}
          />

          <MetricCard
            title="Atenção"
            value={kpis.atencao}
            unit="abaixo do ponto"
            delta="-"
            deltaType="warning"
            icon={FiAlertTriangle}
          />
        </section>

        {/* Seção de Alertas Preditivos (IA) */}
        <AlertasPreditivos 
          onGerarPedido={(alerta) => {
            navigate('/movimentacao');
          }}
          onAbrirDetalheIA={(alerta) => {
            navigate('/previsao');
          }}
        />

        {/* Gráfico de Saídas por Segmento (Últimos 6 meses) */}
        <section className="mb-8">
          <GraficoSaidas />
        </section>

        {/* Paineis de Itens Críticos e Maior Giro */}
        <PaineisEstoque pecas={pecas} />

        {/* [EXTRA] Diagnóstico do Motor de IA AutoStock */}
        <section className="bg-gradient-to-br from-white to-[#fbf9f4] border border-[#e5dfd4] rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600/10 text-amber-700 flex items-center justify-center shrink-0">
              <FiCpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold">
                  Motor de IA AutoStock
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Operando normalmente
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Previsões calculadas automaticamente com base no histórico de saídas e sazonalidade automotiva.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/pecas')}
            className="text-xs font-bold text-amber-800 hover:text-amber-900 inline-flex items-center gap-1 transition-colors shrink-0"
          >
            Gerenciar Estoque Completo
            <FiArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      </main>
    </div>
  );
}