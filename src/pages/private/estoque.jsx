import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  FiSearch, 
  FiPlus, 
  FiZap,
  FiLoader,
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi';
import { 
  RiGasStationLine, 
  RiMotorbikeLine 
} from 'react-icons/ri';

import Sidebar from '../../components/layout/Sidebar';
import PecasTable from '../../components/pecas/PecasTable';
import NovaPecaModal from '../../components/pecas/NovaPecaModal';
import { getPecas, insertPeca } from '../../services/pecasService';

export default function EstoquePage() {
  const [pecas, setPecas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [busca, setBusca] = useState('');
  const [filtroSegmento, setFiltroSegmento] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Carregar peças direto do Supabase
  const carregarPecas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPecas();
      setPecas(data);
    } catch (err) {
      console.error('Falha ao buscar peças:', err);
      setError('Não foi possível carregar os dados do Supabase. Verifique sua conexão ou credenciais.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarPecas();
  }, [carregarPecas]);

  // Filtragem de busca e segmento
  const pecasFiltradas = useMemo(() => {
    return pecas.filter((item) => {
      // Filtro de segmento
      if (filtroSegmento !== 'todos' && item.segmento !== filtroSegmento) {
        return false;
      }

      // Filtro de texto (busca por código, OEM, nome, categoria)
      if (!busca.trim()) return true;

      const query = busca.toLowerCase();
      return (
        item.codigo.toLowerCase().includes(query) ||
        item.oem.toLowerCase().includes(query) ||
        item.nome.toLowerCase().includes(query) ||
        item.categoria.toLowerCase().includes(query) ||
        item.fabricante.toLowerCase().includes(query)
      );
    });
  }, [pecas, busca, filtroSegmento]);

  // Cadastrar nova peça no Supabase
  const handleSalvarNovaPeca = async (novaPecaPayload) => {
    const novaPecaSalva = await insertPeca(novaPecaPayload);
    // Adiciona na lista sem precisar de reload completo
    setPecas((prev) => [novaPecaSalva, ...prev]);
  };

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-[#12161f] text-gray-100' : 'bg-[#f7f5f0] text-gray-900'}`}>
      {/* Sidebar AutoStock */}
      <Sidebar 
        activeTab="pecas" 
        isDark={isDark} 
        onToggleDark={() => setIsDark((prev) => !prev)} 
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col px-8 py-8 overflow-y-auto">
        {/* Header Breadcrumb & Title */}
        <header className="mb-8">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a89e90] block mb-1">
            Inventário
          </span>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
                Catálogo de Peças
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Supabase Conectado
              </span>
            </div>

            <button
              type="button"
              onClick={carregarPecas}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-amber-800 transition-colors p-2 rounded-lg hover:bg-black/5 disabled:opacity-50"
              title="Recarregar dados do Supabase"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </header>

        {/* Toolbar: Search, Filters & Action Button */}
        <section className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Campo de Busca */}
            <div className="relative min-w-[280px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FiSearch className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="SKU, OEM, nome, modelo..."
                className="w-full pl-9 pr-4 py-2 bg-white/90 border border-[#e5dfd4] rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-600 focus:border-amber-600 transition-all shadow-xs"
              />
            </div>

            {/* Filtros em Abas/Pills */}
            <div className="inline-flex items-center p-1 bg-white/70 border border-[#e5dfd4] rounded-lg gap-1 shadow-xs">
              <button
                type="button"
                onClick={() => setFiltroSegmento('todos')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                  filtroSegmento === 'todos'
                    ? 'bg-[#fcf5ec] text-[#b36d1b] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Todos
              </button>

              <button
                type="button"
                onClick={() => setFiltroSegmento('combustao')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                  filtroSegmento === 'combustao'
                    ? 'bg-[#fcf5ec] text-[#b36d1b] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <RiGasStationLine className="w-3.5 h-3.5" />
                Comb.
              </button>

              <button
                type="button"
                onClick={() => setFiltroSegmento('eletrico')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                  filtroSegmento === 'eletrico'
                    ? 'bg-[#eef5fc] text-[#1e6fbe] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <FiZap className="w-3.5 h-3.5" />
                EV
              </button>

              <button
                type="button"
                onClick={() => setFiltroSegmento('moto')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                  filtroSegmento === 'moto'
                    ? 'bg-[#f2f4f6] text-[#4b5563] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <RiMotorbikeLine className="w-3.5 h-3.5" />
                Moto
              </button>
            </div>
          </div>

          {/* Right side: Contador e Botão "+ Nova Peça" */}
          <div className="flex items-center justify-between lg:justify-end gap-5">
            <span className="text-xs font-semibold text-gray-400">
              {pecasFiltradas.length} {pecasFiltradas.length === 1 ? 'item' : 'itens'}
            </span>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#c8672b] hover:bg-[#b85b20] text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all active:scale-98"
            >
              <FiPlus className="w-4 h-4 stroke-[2.5]" />
              Nova Peça
            </button>
          </div>
        </section>

        {/* Estados de Loading, Erro ou Tabela */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/60 rounded-xl border border-[#e8e4db]">
            <FiLoader className="w-8 h-8 text-amber-600 animate-spin mb-3" />
            <span className="text-sm font-semibold text-gray-600">
              Carregando estoque do Supabase...
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 bg-red-50/80 rounded-xl border border-red-200 text-center px-4">
            <FiAlertCircle className="w-8 h-8 text-red-500 mb-2" />
            <h3 className="text-base font-bold text-red-800 mb-1">Falha na conexão</h3>
            <p className="text-xs text-red-600 max-w-md mb-4">{error}</p>
            <button
              type="button"
              onClick={carregarPecas}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <section className="bg-transparent mt-2">
            <PecasTable 
              pecas={pecasFiltradas} 
              onSelectPeca={(peca) => {
                console.log('Peça selecionada:', peca);
              }} 
            />
          </section>
        )}

        {/* Modal de Nova Peça */}
        <NovaPecaModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSalvar={handleSalvarNovaPeca}
        />
      </main>
    </div>
  );
}
