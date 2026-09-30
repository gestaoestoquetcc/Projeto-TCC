import React, { useState, useEffect, useCallback } from 'react';
import { FiRefreshCw } from 'react-icons/fi';

import Sidebar from '@components/layout/Sidebar';
import CardsRapidos from '@sections/dashboard/cardsrapidos';
import Alertas from '@sections/dashboard/alertas';
import Graficos from '@sections/dashboard/graficos';
import ItensCriticos from '@sections/dashboard/itenscriticos';
import MaiorGiro from '@sections/dashboard/maiorgiro';
import { getDashboardData } from '@services/dashboardService';
import { dashboardMock } from '@data/dashboardMock';

//puxando todas as sessoes da pagina dashboard

const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

// Semana ISO-8601 do ano
function semanaDoAno(data) {
  const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
  const dia = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dia);
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - inicioAno) / 86400000 + 1) / 7);
}

export default function DashboardPage() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [sync, setSync] = useState(null);
  const [dispensados, setDispensados] = useState([]);
  const [isDark, setIsDark] = useState(true);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      const resultado = await getDashboardData();
      setDados(resultado || dashboardMock);
      setDemo(!resultado);
    } catch (err) {
      console.error('Falha ao carregar dashboard:', err);
      setDados(dashboardMock);
      setDemo(true);
    } finally {
      setSync(new Date());
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const hoje = new Date();
  const alertasAtivos = (dados?.alertas || []).filter((a) => !dispensados.includes(a.id));

  return (
    <div className={`dash ${isDark ? '' : 'dash-light'} flex min-h-screen bg-[var(--d-bg)] font-body text-[var(--d-text)]`}>
      <Sidebar activeTab="dashboard" isDark={isDark} onToggleDark={() => setIsDark((prev) => !prev)} />

      <main className="flex min-w-0 flex-1 flex-col gap-7 overflow-y-auto px-7 py-6">
        <header className="flex items-end justify-between border-b border-[var(--d-border)] pb-4">
          <div>
            <span className="block font-mono text-[11px] tracking-[0.18em] text-[var(--d-faint)]">
              {MESES[hoje.getMonth()]} {hoje.getFullYear()} · SEMANA {semanaDoAno(hoje)}
            </span>
            <h1 className="mt-1 font-display text-4xl font-bold uppercase leading-none tracking-wide">Visão Geral</h1>
          </div>

          <button
            type="button"
            onClick={carregar}
            disabled={loading}
            title={demo ? 'Supabase indisponível — exibindo dados de demonstração' : 'Recarregar dados'}
            className="group flex items-center gap-2 font-mono text-[11px] text-[var(--d-muted)] disabled:opacity-60"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${demo ? 'bg-[var(--d-amber)]' : 'bg-[var(--d-green)]'} ${loading ? 'animate-pulse' : ''}`} />
            {loading
              ? 'sincronizando...'
              : `${demo ? 'demo' : 'sync'} ${sync?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) ?? ''}`}
            <FiRefreshCw className={`h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 ${loading ? 'animate-spin opacity-100' : ''}`} />
          </button>
        </header>

        <CardsRapidos kpis={dados?.kpis} loading={loading} />

        <Alertas alertas={alertasAtivos} loading={loading} onDispensar={(id) => setDispensados((prev) => [...prev, id])} />

        <Graficos serie={dados?.serie} loading={loading} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ItensCriticos itens={dados?.criticos || []} loading={loading} />
          <MaiorGiro itens={dados?.maiorGiro || []} loading={loading} />
        </div>
      </main>
    </div>
  );
}
