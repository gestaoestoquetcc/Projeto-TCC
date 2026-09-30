import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FiSearch, 
  FiPlus, 
  FiRefreshCw, 
  FiStar, 
  FiMail, 
  FiCheckCircle, 
  FiLoader,
  FiChevronRight
} from 'react-icons/fi';

import Sidebar from '../../components/layout/Sidebar';
import NovoFornecedorModal from '../../components/fornecedores/NovoFornecedorModal';
import DetalheFornecedorModal from '../../components/fornecedores/DetalheFornecedorModal';
import { getFornecedores, insertFornecedor } from '../../services/fornecedoresService';

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroPedidos, setFiltroPedidos] = useState('todos'); // 'todos', 'com_pedidos'
  const [isDark, setIsDark] = useState(false);
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);
  const [msgSucesso, setMsgSucesso] = useState('');

  const carregarFornecedores = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFornecedores();
      setFornecedores(data);
    } catch (err) {
      console.error('Erro ao carregar fornecedores:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarFornecedores();
  }, [carregarFornecedores]);

  // KPIs Dinâmicos
  const kpis = useMemo(() => {
    const totalAtivos = fornecedores.length;
    const pedidosAbertos = fornecedores.reduce((acc, f) => acc + (Number(f.pedidosAbertos) || 0), 0);
    const mediaRating = totalAtivos > 0
      ? (fornecedores.reduce((acc, f) => acc + (Number(f.rating) || 0), 0) / totalAtivos).toFixed(1)
      : '4.6';

    return {
      totalAtivos,
      pedidosAbertos,
      mediaRating
    };
  }, [fornecedores]);

  // Filtragem
  const fornecedoresFiltrados = useMemo(() => {
    return fornecedores.filter((f) => {
      if (filtroPedidos === 'com_pedidos' && (!f.pedidosAbertos || f.pedidosAbertos === 0)) {
        return false;
      }

      if (!busca.trim()) return true;
      const query = busca.toLowerCase();
      return (
        f.nome.toLowerCase().includes(query) ||
        f.cnpj.toLowerCase().includes(query) ||
        f.categoria.toLowerCase().includes(query) ||
        f.contato.toLowerCase().includes(query)
      );
    });
  }, [fornecedores, busca, filtroPedidos]);

  const handleSalvarFornecedor = async (formData) => {
    const novo = await insertFornecedor(formData);
    setFornecedores((prev) => [novo, ...prev]);
    setMsgSucesso(`Fornecedor "${novo.nome}" cadastrado com sucesso!`);
    setTimeout(() => setMsgSucesso(''), 4000);
  };

  const renderStars = (rating) => {
    const stars = [];
    const num = Math.round(Number(rating) || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= num ? 'text-amber-500' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-[#12161f] text-gray-100' : 'bg-[#f7f5f0] text-gray-900'}`}>
      {/* Sidebar AutoStock com aba 'fornecedores' ativa */}
      <Sidebar 
        activeTab="fornecedores" 
        isDark={isDark} 
        onToggleDark={() => setIsDark((prev) => !prev)} 
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col px-8 py-8 overflow-y-auto">
        {/* Top Header */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a89e90] block mb-1">
              Rede de Suprimentos
            </span>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
              Fornecedores
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={carregarFornecedores}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-amber-800 transition-colors p-2 rounded-lg hover:bg-black/5 disabled:opacity-50"
              title="Recarregar fornecedores"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>

            <button
              type="button"
              onClick={() => setIsNovoModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#c8672b] hover:bg-[#b85b20] text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all active:scale-98"
            >
              <FiPlus className="w-4 h-4 stroke-[2.5]" />
              Novo Fornecedor
            </button>
          </div>
        </header>

        {/* 3 KPI Cards no Topo */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {/* ATIVOS */}
          <div className="bg-white/90 border border-[#e5dfd4] rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold mb-2">
              Ativos
            </span>
            <div className="text-3xl font-black tracking-tight text-gray-900">
              {kpis.totalAtivos}
            </div>
          </div>

          {/* PEDIDOS EM ABERTO */}
          <div className="bg-white/90 border border-[#e5dfd4] rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold mb-2">
              Pedidos em Aberto
            </span>
            <div className="text-3xl font-black tracking-tight text-[#d97706]">
              {kpis.pedidosAbertos}
            </div>
          </div>

          {/* AVALIAÇÃO MÉDIA */}
          <div className="bg-white/90 border border-[#e5dfd4] rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold mb-2">
              Avaliação Média
            </span>
            <div className="text-3xl font-black tracking-tight text-[#d97706] flex items-center gap-1.5">
              <span>{kpis.mediaRating}</span>
              <span className="text-2xl text-amber-500">★</span>
            </div>
          </div>
        </section>

        {/* Toolbar de Pesquisa & Filtros Rápidos */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative min-w-[280px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FiSearch className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, CNPJ, categoria..."
                className="w-full pl-9 pr-4 py-2 bg-white/90 border border-[#e5dfd4] rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-600 focus:border-amber-600 transition-all shadow-xs"
              />
            </div>

            <div className="inline-flex items-center p-1 bg-white/70 border border-[#e5dfd4] rounded-lg gap-1 shadow-xs">
              <button
                type="button"
                onClick={() => setFiltroPedidos('todos')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                  filtroPedidos === 'todos'
                    ? 'bg-[#fcf5ec] text-[#b36d1b] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFiltroPedidos('com_pedidos')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                  filtroPedidos === 'com_pedidos'
                    ? 'bg-[#fcf5ec] text-[#b36d1b] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Com Pedidos
              </button>
            </div>
          </div>

          <span className="text-xs font-semibold text-gray-400 self-center">
            {fornecedoresFiltrados.length} {fornecedoresFiltrados.length === 1 ? 'fornecedor' : 'fornecedores'}
          </span>
        </section>

        {msgSucesso && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{msgSucesso}</span>
          </div>
        )}

        {/* Tabela de Fornecedores */}
        <div className="bg-white/95 border border-[#e5dfd4] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e5e0d5] text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-[#faf8f4]/60">
                  <th className="py-3.5 px-4 font-semibold">Fornecedor</th>
                  <th className="py-3.5 px-4 font-semibold">CNPJ</th>
                  <th className="py-3.5 px-4 font-semibold">Categoria</th>
                  <th className="py-3.5 px-4 font-semibold text-center">SKUs</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Pedidos</th>
                  <th className="py-3.5 px-4 font-semibold">Rating</th>
                  <th className="py-3.5 px-4 font-semibold">Último Rec.</th>
                  <th className="py-3.5 px-4 font-semibold">Contato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ece7dd]">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-16 text-center text-gray-400">
                      <FiLoader className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
                      <span className="text-xs">Carregando parceiros...</span>
                    </td>
                  </tr>
                ) : fornecedoresFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-gray-400 text-xs font-medium">
                      Nenhum fornecedor encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  fornecedoresFiltrados.map((forn) => {
                    const initialLetter = forn.nome.charAt(0) || 'F';
                    const temPedido = forn.pedidosAbertos > 0;

                    return (
                      <tr
                        key={forn.id}
                        onClick={() => setFornecedorSelecionado(forn)}
                        className="group hover:bg-[#fbf9f4] transition-colors cursor-pointer"
                      >
                        {/* Avatar & Nome */}
                        <td className="py-4 px-4 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#fcf5ec] border border-[#f4e2cb] text-[#b36d1b] font-bold text-xs flex items-center justify-center shadow-2xs group-hover:bg-[#f5ebe1] transition-colors">
                              {initialLetter}
                            </div>
                            <span className="font-semibold text-sm text-gray-900 group-hover:text-amber-900 transition-colors">
                              {forn.nome}
                            </span>
                          </div>
                        </td>

                        {/* CNPJ */}
                        <td className="py-4 px-4 align-middle whitespace-nowrap">
                          <span className="text-xs font-mono text-gray-400">
                            {forn.cnpj}
                          </span>
                        </td>

                        {/* Categoria */}
                        <td className="py-4 px-4 align-middle whitespace-nowrap">
                          <span className="text-xs text-gray-700 font-medium">
                            {forn.categoria}
                          </span>
                        </td>

                        {/* SKUs */}
                        <td className="py-4 px-4 align-middle text-center whitespace-nowrap">
                          <span className="text-xs font-bold text-gray-800">
                            {forn.skus}
                          </span>
                        </td>

                        {/* Pedidos */}
                        <td className="py-4 px-4 align-middle text-center whitespace-nowrap">
                          {temPedido ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
                              {forn.pedidosAbertos} aberto
                            </span>
                          ) : (
                            <span className="text-gray-300 font-mono text-xs">
                              —
                            </span>
                          )}
                        </td>

                        {/* Rating */}
                        <td className="py-4 px-4 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-bold text-amber-800 font-mono">
                              {forn.rating}
                            </span>
                            <span className="tracking-tighter text-amber-500 font-mono text-xs">
                              {renderStars(forn.rating)}
                            </span>
                          </div>
                        </td>

                        {/* Último Rec. */}
                        <td className="py-4 px-4 align-middle whitespace-nowrap">
                          <span className="text-xs font-mono text-gray-400">
                            {forn.ultimoRecebimento}
                          </span>
                        </td>

                        {/* Contato */}
                        <td className="py-4 px-4 align-middle whitespace-nowrap">
                          <a
                            href={`mailto:${forn.contato}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-mono text-[#b85824] hover:underline"
                          >
                            {forn.contato}
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Cadastro de Novo Fornecedor */}
        <NovoFornecedorModal
          isOpen={isNovoModalOpen}
          onClose={() => setIsNovoModalOpen(false)}
          onSalvar={handleSalvarFornecedor}
        />

        {/* Modal de Detalhe 360 do Fornecedor */}
        {fornecedorSelecionado && (
          <DetalheFornecedorModal
            fornecedor={fornecedorSelecionado}
            onClose={() => setFornecedorSelecionado(null)}
          />
        )}
      </main>
    </div>
  );
}
