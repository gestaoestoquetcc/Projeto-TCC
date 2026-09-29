import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FiArrowDown, 
  FiArrowUp, 
  FiMinus, 
  FiPlus, 
  FiLoader, 
  FiRefreshCw, 
  FiCheckCircle, 
  FiAlertCircle 
} from 'react-icons/fi';

import Sidebar from '../../components/layout/Sidebar';
import { getPecas } from '../../services/pecasService';
import { getMovimentacoes, registrarMovimentacao } from '../../services/movimentacoesService';

export default function MovimentacoesPage() {
  const [activeTab, setActiveTab] = useState('saida'); // 'saida', 'recebimento', 'pedidos'
  const [pecas, setPecas] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  const [isDark, setIsDark] = useState(false);

  // Form states
  const [skuBusca, setSkuBusca] = useState('');
  const [pecaSelecionada, setPecaSelecionada] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [documento, setDocumento] = useState('OS-4422');

  // Carregar dados de peças e histórico
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const [listaPecas, listaMovs] = await Promise.all([
        getPecas(),
        getMovimentacoes()
      ]);
      setPecas(listaPecas);
      setMovimentacoes(listaMovs);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Atualizar documento padrão de acordo com a aba
  useEffect(() => {
    if (activeTab === 'saida') {
      setDocumento('OS-4422');
    } else if (activeTab === 'recebimento') {
      setDocumento('NF-e 12048');
    }
  }, [activeTab]);

  // Sugestões de peças com base na busca por SKU ou Nome
  const sugestoes = useMemo(() => {
    if (!skuBusca.trim() || pecaSelecionada?.codigo === skuBusca) return [];
    const query = skuBusca.toLowerCase();
    return pecas.filter(
      (p) => p.codigo.toLowerCase().includes(query) || p.nome.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [pecas, skuBusca, pecaSelecionada]);

  const handleSelectPeca = (p) => {
    setPecaSelecionada(p);
    setSkuBusca(p.codigo);
  };

  const handleIncrement = () => setQuantidade((prev) => prev + 1);
  const handleDecrement = () => setQuantidade((prev) => Math.max(1, prev - 1));

  const handleConfirmar = async (e) => {
    e.preventDefault();
    setMensagemSucesso('');
    setMensagemErro('');

    // Localizar a peça se digitou o SKU direto sem clicar na sugestão
    let peca = pecaSelecionada;
    if (!peca && skuBusca.trim()) {
      peca = pecas.find((p) => p.codigo.toLowerCase() === skuBusca.trim().toLowerCase());
    }

    if (!peca) {
      setMensagemErro('Selecione ou digite um SKU válido de uma peça cadastrada.');
      return;
    }

    const tipo = activeTab === 'recebimento' ? 'entrada' : 'saida';

    if (tipo === 'saida' && peca.quantidade < quantidade) {
      setMensagemErro(`Estoque insuficiente! Esta peça tem apenas ${peca.quantidade} un. disponíveis.`);
      return;
    }

    try {
      setLoadingAction(true);
      const novaMov = await registrarMovimentacao({
        pecaId: peca.id,
        tipo,
        quantidade,
        documento: documento.trim() || (tipo === 'saida' ? 'OS-Balcão' : 'NF-e'),
        motivo: tipo === 'saida' ? 'Balcão' : 'Fornecedor'
      });

      // Atualizar lista local de movimentações
      setMovimentacoes((prev) => [novaMov, ...prev]);

      // Atualizar lista local de peças
      setPecas((prev) =>
        prev.map((item) => {
          if (item.id === peca.id) {
            const novaQtd = tipo === 'saida' 
              ? Math.max(0, item.quantidade - quantidade)
              : item.quantidade + quantidade;
            return { ...item, quantidade: novaQtd };
          }
          return item;
        })
      );

      setMensagemSucesso(
        `${tipo === 'saida' ? 'Baixa' : 'Entrada'} de ${quantidade} un. de "${peca.nome}" registrada com sucesso!`
      );

      // Limpar formulário
      setSkuBusca('');
      setPecaSelecionada(null);
      setQuantidade(1);
    } catch (err) {
      console.error(err);
      setMensagemErro(err.message || 'Erro ao registrar movimentação.');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-[#12161f] text-gray-100' : 'bg-[#f7f5f0] text-gray-900'}`}>
      {/* Sidebar AutoStock com aba 'movimentacao' ativa */}
      <Sidebar 
        activeTab="movimentacao" 
        isDark={isDark} 
        onToggleDark={() => setIsDark((prev) => !prev)} 
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col px-8 py-8 overflow-y-auto">
        {/* Header Breadcrumb & Title */}
        <header className="mb-6">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a89e90] block mb-1">
            Operações
          </span>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
              Entrada / Saída
            </h1>

            <button
              type="button"
              onClick={carregarDados}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-amber-800 transition-colors p-2 rounded-lg hover:bg-black/5 disabled:opacity-50"
              title="Recarregar dados do Supabase"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </header>

        {/* Sub-tabs Navigation */}
        <section className="mb-6">
          <div className="inline-flex items-center p-1 bg-white/70 border border-[#e5dfd4] rounded-lg gap-1 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('saida')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'saida'
                  ? 'bg-[#fcf5ec] text-[#b36d1b] border border-[#f0dac7] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Saída Rápida
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('recebimento')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'recebimento'
                  ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Recebimento
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pedidos')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'pedidos'
                  ? 'bg-[#eef5fc] text-[#1e6fbe] border border-[#bad7f5] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Pedidos
            </button>
          </div>
        </section>

        {/* Mensagens de Feedback */}
        {mensagemSucesso && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{mensagemSucesso}</span>
          </div>
        )}

        {mensagemErro && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{mensagemErro}</span>
          </div>
        )}

        {/* Main Grid: Form à esquerda e Histórico à direita */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card Esquerdo: Baixa ou Recebimento de Estoque */}
          <div className="lg:col-span-5 bg-white/90 border border-[#e5dfd4] rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <form onSubmit={handleConfirmar} className="space-y-5">
              <div>
                <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold block mb-4">
                  {activeTab === 'saida' ? 'Baixa de Estoque' : activeTab === 'recebimento' ? 'Recebimento de Estoque' : 'Novo Pedido'}
                </span>

                {/* SKU / Código OEM */}
                <div className="relative">
                  <label className="block text-[10px] font-mono tracking-wider text-gray-500 uppercase font-semibold mb-1.5">
                    SKU / Código OEM
                  </label>
                  <input
                    type="text"
                    value={skuBusca}
                    onChange={(e) => {
                      setSkuBusca(e.target.value);
                      setPecaSelecionada(null);
                    }}
                    placeholder="Ex: FRE-0142"
                    className="w-full px-3.5 py-2.5 bg-[#fbf9f5] border border-[#e5dfd4] rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-600 focus:border-amber-600 transition-all font-mono"
                  />

                  {/* Dropdown de sugestões */}
                  {sugestoes.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e5dfd4] rounded-lg shadow-lg z-20 overflow-hidden divide-y divide-gray-100">
                      {sugestoes.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPeca(p)}
                          className="w-full text-left px-3.5 py-2 hover:bg-[#fcf5ec] transition-colors flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-xs text-[#b85824] block">{p.codigo}</span>
                            <span className="text-xs text-gray-700">{p.nome}</span>
                          </div>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {p.quantidade} un
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Detalhe da peça selecionada */}
                  {pecaSelecionada && (
                    <div className="mt-2 p-2.5 bg-[#f8f6f1] rounded-lg border border-[#ece7de] text-xs">
                      <span className="font-semibold text-gray-800 block">{pecaSelecionada.nome}</span>
                      <span className="text-gray-500">
                        Disponível em estoque: <strong className="text-amber-800">{pecaSelecionada.quantidade} unidades</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Quantidade com Stepper */}
                <div className="mt-4">
                  <label className="block text-[10px] font-mono tracking-wider text-gray-500 uppercase font-semibold mb-1.5">
                    Quantidade
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      className="w-10 h-10 flex items-center justify-center bg-[#f4f0e6] hover:bg-[#eae5d8] text-gray-700 rounded-l-lg border border-r-0 border-[#e5dfd4] transition-colors"
                    >
                      <FiMinus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantidade}
                      onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full h-10 text-center font-bold text-sm bg-[#fbf9f5] border-y border-[#e5dfd4] text-gray-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleIncrement}
                      className="w-10 h-10 flex items-center justify-center bg-[#f4f0e6] hover:bg-[#eae5d8] text-gray-700 rounded-r-lg border border-l-0 border-[#e5dfd4] transition-colors"
                    >
                      <FiPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Ordem de Serviço ou Documento */}
                <div className="mt-4">
                  <label className="block text-[10px] font-mono tracking-wider text-gray-500 uppercase font-semibold mb-1.5">
                    {activeTab === 'saida' ? 'Ordem de Serviço' : 'Nota Fiscal / Documento'}
                  </label>
                  <input
                    type="text"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    placeholder={activeTab === 'saida' ? 'OS-4422' : 'NF-e 12048'}
                    className="w-full px-3.5 py-2.5 bg-[#fbf9f5] border border-[#e5dfd4] rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-600 focus:border-amber-600 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Botão de Confirmação */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className={`w-full py-3 px-4 rounded-lg font-bold text-sm text-white shadow-xs transition-all active:scale-99 flex items-center justify-center gap-2 ${
                    activeTab === 'saida'
                      ? 'bg-[#d33e3e] hover:bg-[#bb3232]'
                      : 'bg-[#16a34a] hover:bg-[#15803d]'
                  } disabled:opacity-60`}
                >
                  {loadingAction ? (
                    <>
                      <FiLoader className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    activeTab === 'saida' ? 'Confirmar Saída' : 'Confirmar Entrada'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Card Direito: Movimentações de Hoje */}
          <div className="lg:col-span-7 bg-white/90 border border-[#e5dfd4] rounded-xl p-6 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold">
                Movimentações de Hoje
              </span>
              <span className="text-xs font-semibold text-gray-400">
                {movimentacoes.length} registros
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <FiLoader className="w-6 h-6 animate-spin text-amber-600 mb-2" />
                <span className="text-xs">Carregando histórico...</span>
              </div>
            ) : movimentacoes.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <p className="text-sm font-medium">Nenhuma movimentação registrada hoje.</p>
                <p className="text-xs mt-1">Utilize o formulário ao lado para dar saída ou entrada.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#ece7dd] -mx-6 px-6 overflow-y-auto max-h-[500px]">
                {movimentacoes.map((mov) => {
                  const isSaida = mov.tipo === 'saida';

                  return (
                    <div
                      key={mov.id}
                      className="py-3.5 flex items-center justify-between hover:bg-[#fcfbf9] px-2 rounded-lg transition-colors group"
                    >
                      {/* Ícone de Seta e Nome da Peça */}
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          isSaida ? 'bg-red-50 text-[#d33e3e]' : 'bg-emerald-50 text-[#16a34a]'
                        }`}>
                          {isSaida ? (
                            <FiArrowDown className="w-4 h-4 stroke-[2.5]" />
                          ) : (
                            <FiArrowUp className="w-4 h-4 stroke-[2.5]" />
                          )}
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm text-gray-900 group-hover:text-amber-900 transition-colors">
                            {mov.pecaNome}
                          </h4>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">
                            {mov.sku} · {mov.motivo} · {mov.documento}
                          </p>
                        </div>
                      </div>

                      {/* Quantidade e Horário */}
                      <div className="text-right">
                        <span className={`text-base font-extrabold ${
                          isSaida ? 'text-[#d33e3e]' : 'text-[#16a34a]'
                        }`}>
                          {isSaida ? `-${mov.quantidade}` : `+${mov.quantidade}`}
                        </span>
                        <span className="block text-[11px] text-gray-400 font-mono mt-0.5">
                          {mov.hora}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
