import React, { useState, useEffect, useCallback } from 'react';
import { FiRefreshCw, FiLoader, FiAlertCircle } from 'react-icons/fi';

import Sidebar from '@components/layout/Sidebar';
import CardsRapidos from '@sections/dashboard/cardsrapidos';
import AlertasPreditivos from '@sections/dashboard/alertas';
import Graficos from '@sections/dashboard/graficos';
import { getPecas } from '../../services/pecasService';
import { getMovimentacoes } from '../../services/movimentacoesService';

// Cores do tema claro / escuro (passadas para cada seção)
const TEMAS = {
  claro: {
    pagina: 'bg-[#f7f5f0] text-gray-900',
    titulo: 'text-gray-900',
    textoForte: 'text-gray-900',
    textoSuave: 'text-gray-500',
    textoFraco: 'text-gray-400',
    card: 'bg-white/90 border-[#e5dfd4]',
    abas: 'bg-[#f7f5f0] border-[#e5dfd4]',
    abaInativa: 'text-gray-500 hover:text-gray-900',
    grade: '#ece8e1',
    linhaDivisoria: 'bg-[#e5dfd4]',
  },
  escuro: {
    pagina: 'bg-[#12161f] text-gray-100',
    titulo: 'text-white',
    textoForte: 'text-gray-100',
    textoSuave: 'text-gray-400',
    textoFraco: 'text-gray-500',
    card: 'bg-[#181d27] border-[#262c38]',
    abas: 'bg-[#11151d] border-[#262c38]',
    abaInativa: 'text-gray-400 hover:text-white',
    grade: '#262c38',
    linhaDivisoria: 'bg-[#262c38]',
  },
};

// Ex.: "OUT 2026 · SEMANA 41"
function cabecalhoData() {
  const hoje = new Date();
  const mes = hoje.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
  const inicioAno = new Date(hoje.getFullYear(), 0, 1);
  const semana = Math.ceil(((hoje - inicioAno) / 86400000 + inicioAno.getDay() + 1) / 7);
  return `${mes} ${hoje.getFullYear()} · Semana ${semana}`;
}

export default function DashboardPage() {
  const [pecas, setPecas] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [ultimaSync, setUltimaSync] = useState(null);
  const [isDark, setIsDark] = useState(false);

  const t = isDark ? TEMAS.escuro : TEMAS.claro;

  // Busca peças e movimentações no Supabase
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      setErro('');
      const [listaPecas, listaMovs] = await Promise.all([getPecas(), getMovimentacoes()]);
      setPecas(listaPecas);
      setMovimentacoes(listaMovs);
      setUltimaSync(new Date());
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setErro('Não foi possível carregar os dados do Supabase. Verifique sua conexão ou o arquivo .env.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  return (
    <div className={`flex min-h-screen ${t.pagina}`}>
      <Sidebar activeTab="dashboard" isDark={isDark} onToggleDark={() => setIsDark((prev) => !prev)} />

      <main className="flex-1 min-w-0 flex flex-col px-4 sm:px-8 py-8 overflow-y-auto">
        {/* Cabeçalho */}
        <header className="flex items-end justify-between gap-4 pb-4 mb-8 border-b border-[#e5dfd4]/70">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#a89e90] block mb-1">
              {cabecalhoData()}
            </span>
            <h1 className={`text-3xl font-black tracking-tight uppercase ${t.titulo}`}>Visão Geral</h1>
          </div>

          <button
            type="button"
            onClick={carregarDados}
            disabled={loading}
            className={`inline-flex items-center gap-2 text-xs font-mono transition-colors p-2 rounded-lg hover:bg-black/5 disabled:opacity-50 ${t.textoSuave}`}
            title="Recarregar dados do Supabase"
          >
            {loading ? (
              <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span className={`w-2 h-2 rounded-full ${erro ? 'bg-red-500' : 'bg-emerald-500'}`} />
            )}
            {ultimaSync
              ? `sync ${ultimaSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
              : 'sincronizando...'}
          </button>
        </header>

        {erro && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{erro}</span>
            <button
              type="button"
              onClick={carregarDados}
              className="ml-auto shrink-0 px-3 py-1 bg-red-600 text-white text-[11px] font-bold rounded-md hover:bg-red-700"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {loading && pecas.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-24 border rounded-xl ${t.card}`}>
            <FiLoader className="w-8 h-8 text-amber-600 animate-spin mb-3" />
            <span className={`text-sm font-semibold ${t.textoSuave}`}>Carregando dashboard do Supabase...</span>
          </div>
        ) : (
          <>
            <CardsRapidos t={t} pecas={pecas} movimentacoes={movimentacoes} />
            <AlertasPreditivos t={t} pecas={pecas} movimentacoes={movimentacoes} />
            <Graficos t={t} pecas={pecas} movimentacoes={movimentacoes} />
          </>
        )}
      </main>
    </div>
  );
}
