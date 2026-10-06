import React, { useState, useEffect, useMemo } from 'react';
import {
  FiArrowDown,
  FiArrowUp,
  FiMinus,
  FiPlus,
  FiLoader,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiX,
  FiPackage,
  FiShoppingCart,
} from 'react-icons/fi';

import Sidebar from '../../components/layout/Sidebar';
import { getPecas, calcularStatus } from '../../services/pecasService';
import { getMovimentacoes, registrarMovimentacao } from '../../services/movimentacoesService';

// ---------- Cores do tema claro / escuro ----------
// Como o Tailwind não sabe sozinho qual tema está ativo, guardamos as classes aqui
// e escolhemos de acordo com o "isDark".
const TEMAS = {
  claro: {
    pagina: 'bg-[#f7f5f0] text-gray-900',
    titulo: 'text-gray-900',
    textoForte: 'text-gray-900',
    textoMedio: 'text-gray-700',
    textoSuave: 'text-gray-500',
    textoFraco: 'text-gray-400',
    card: 'bg-white/90 border-[#e5dfd4]',
    abas: 'bg-white/70 border-[#e5dfd4]',
    abaInativa: 'text-gray-500 hover:text-gray-900',
    input: 'bg-[#fbf9f5] border-[#e5dfd4] text-gray-900 placeholder-gray-400',
    stepper: 'bg-[#f4f0e6] hover:bg-[#eae5d8] text-gray-700 border-[#e5dfd4]',
    dropdown: 'bg-white border-[#e5dfd4] divide-gray-100',
    dropdownItem: 'hover:bg-[#fcf5ec]',
    detalhe: 'bg-[#f8f6f1] border-[#ece7de]',
    linha: 'hover:bg-[#fcfbf9]',
    divisor: 'divide-[#ece7dd]',
    botaoAtualizar: 'text-gray-500 hover:text-amber-800 hover:bg-black/5',
    resumo: 'bg-[#fbf9f5] border-[#ece7de]',
  },
  escuro: {
    pagina: 'bg-[#12161f] text-gray-100',
    titulo: 'text-white',
    textoForte: 'text-gray-100',
    textoMedio: 'text-gray-300',
    textoSuave: 'text-gray-400',
    textoFraco: 'text-gray-500',
    card: 'bg-[#181d27] border-[#262c38]',
    abas: 'bg-[#181d27] border-[#262c38]',
    abaInativa: 'text-gray-400 hover:text-white',
    input: 'bg-[#11151d] border-[#2a3140] text-gray-100 placeholder-gray-500',
    stepper: 'bg-[#222836] hover:bg-[#2a3142] text-gray-200 border-[#2a3140]',
    dropdown: 'bg-[#1c222d] border-[#2a3140] divide-[#262c38]',
    dropdownItem: 'hover:bg-[#262c38]',
    detalhe: 'bg-[#11151d] border-[#262c38]',
    linha: 'hover:bg-[#1e2430]',
    divisor: 'divide-[#262c38]',
    botaoAtualizar: 'text-gray-400 hover:text-amber-400 hover:bg-white/5',
    resumo: 'bg-[#11151d] border-[#262c38]',
  },
};

// Configuração de cada aba (texto, cor e tipo de movimento)
const ABAS = {
  saida: {
    label: 'Saída Rápida',
    tituloForm: 'Baixa de Estoque',
    tipo: 'saida',
    rotuloDocumento: 'Ordem de Serviço',
    documentoPadrao: 'OS-4422',
    botao: 'Confirmar Saída',
    corBotao: 'bg-[#d33e3e] hover:bg-[#bb3232]',
    ativa: 'bg-[#fcf5ec] text-[#b36d1b] border-[#f0dac7]',
  },
  recebimento: {
    label: 'Recebimento',
    tituloForm: 'Recebimento de Estoque',
    tipo: 'entrada',
    rotuloDocumento: 'Nota Fiscal / Documento',
    documentoPadrao: 'NF-e 12048',
    botao: 'Confirmar Entrada',
    corBotao: 'bg-[#16a34a] hover:bg-[#15803d]',
    ativa: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]',
  },
  pedidos: {
    label: 'Pedidos',
    ativa: 'bg-[#eef5fc] text-[#1e6fbe] border-[#bad7f5]',
  },
};

// Verifica se uma data é de hoje
function ehHoje(dataHora) {
  if (!dataHora) return false;
  const d = new Date(dataHora);
  const hoje = new Date();
  return (
    d.getDate() === hoje.getDate() &&
    d.getMonth() === hoje.getMonth() &&
    d.getFullYear() === hoje.getFullYear()
  );
}

export default function MovimentacoesPage() {
  const [activeTab, setActiveTab] = useState('saida'); // 'saida', 'recebimento', 'pedidos'
  const [pecas, setPecas] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregar, setErroCarregar] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  const [isDark, setIsDark] = useState(false);

  // Filtros do histórico
  const [periodo, setPeriodo] = useState('hoje'); // 'hoje' | 'todos'
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos' | 'entrada' | 'saida'

  // Form states
  const [skuBusca, setSkuBusca] = useState('');
  const [pecaSelecionada, setPecaSelecionada] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [documento, setDocumento] = useState(ABAS.saida.documentoPadrao);

  const t = isDark ? TEMAS.escuro : TEMAS.claro;
  const aba = ABAS[activeTab];

  // "versao" muda quando clica em Atualizar, e isso faz o useEffect buscar de novo
  const [versao, setVersao] = useState(0);

  // Busca peças e movimentações no Supabase
  useEffect(() => {
    let ativo = true; // evita atualizar a tela se ela já foi fechada
    Promise.all([getPecas(), getMovimentacoes()])
      .then(([listaPecas, listaMovs]) => {
        if (!ativo) return;
        setPecas(listaPecas);
        setMovimentacoes(listaMovs);
        setErroCarregar('');
      })
      .catch((err) => {
        console.error(err);
        if (ativo) setErroCarregar('Não foi possível carregar os dados do Supabase. Verifique sua conexão ou o arquivo .env.');
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });
    return () => {
      ativo = false;
    };
  }, [versao]);

  // Botão de atualizar
  const carregarDados = () => {
    setLoading(true);
    setVersao((v) => v + 1);
  };

  // Troca de aba: já ajusta o documento padrão e limpa o erro
  const trocarAba = (id) => {
    setActiveTab(id);
    if (ABAS[id].documentoPadrao) setDocumento(ABAS[id].documentoPadrao);
    setMensagemErro('');
  };

  // Mensagem de sucesso some sozinha depois de 4 segundos
  useEffect(() => {
    if (!mensagemSucesso) return;
    const timer = setTimeout(() => setMensagemSucesso(''), 4000);
    return () => clearTimeout(timer);
  }, [mensagemSucesso]);

  // Sugestões de peças com base na busca por SKU ou Nome
  const sugestoes = useMemo(() => {
    if (!skuBusca.trim() || pecaSelecionada?.codigo === skuBusca) return [];
    const query = skuBusca.toLowerCase();
    return pecas
      .filter((p) => p.codigo.toLowerCase().includes(query) || p.nome.toLowerCase().includes(query))
      .slice(0, 5);
  }, [pecas, skuBusca, pecaSelecionada]);

  // Peças abaixo do ponto de reposição (aba "Pedidos")
  const pecasParaRepor = useMemo(() => {
    return pecas
      .filter((p) => p.status === 'critico' || p.status === 'atencao')
      .map((p) => ({
        ...p,
        // sugere comprar o suficiente para chegar ao dobro do mínimo
        sugestao: Math.max(1, p.pontoReposicao * 2 - p.quantidade),
      }))
      .sort((a, b) => a.quantidade / (a.pontoReposicao || 1) - b.quantidade / (b.pontoReposicao || 1));
  }, [pecas]);

  // Histórico filtrado
  const movsFiltradas = useMemo(() => {
    return movimentacoes.filter((m) => {
      if (periodo === 'hoje' && !ehHoje(m.dataHora)) return false;
      if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) return false;
      return true;
    });
  }, [movimentacoes, periodo, filtroTipo]);

  // Resumo do dia
  const resumoHoje = useMemo(() => {
    const deHoje = movimentacoes.filter((m) => ehHoje(m.dataHora));
    const soma = (tipo) =>
      deHoje.filter((m) => m.tipo === tipo).reduce((total, m) => total + Number(m.quantidade || 0), 0);
    return { entradas: soma('entrada'), saidas: soma('saida'), registros: deHoje.length };
  }, [movimentacoes]);

  // Quanto vai sobrar depois da operação (só para mostrar ao usuário)
  const estoqueDepois = pecaSelecionada
    ? aba.tipo === 'saida'
      ? pecaSelecionada.quantidade - quantidade
      : pecaSelecionada.quantidade + quantidade
    : null;
  const estoqueInsuficiente = aba.tipo === 'saida' && pecaSelecionada && estoqueDepois < 0;

  const limparFormulario = () => {
    setSkuBusca('');
    setPecaSelecionada(null);
    setQuantidade(1);
  };

  const handleSelectPeca = (p) => {
    setPecaSelecionada(p);
    setSkuBusca(p.codigo);
    setMensagemErro('');
  };

  // Na aba Pedidos: ao clicar em "Receber", vai para Recebimento já preenchido
  const handleReceberPedido = (p) => {
    trocarAba('recebimento');
    setPecaSelecionada(p);
    setSkuBusca(p.codigo);
    setQuantidade(p.sugestao);
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

    const tipo = aba.tipo;

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
        motivo: tipo === 'saida' ? 'Balcão' : 'Fornecedor',
      });

      // Atualizar lista local de movimentações
      setMovimentacoes((prev) => [novaMov, ...prev]);

      // Atualizar lista local de peças (quantidade e status)
      setPecas((prev) =>
        prev.map((item) => {
          if (item.id !== peca.id) return item;
          const novaQtd = tipo === 'saida' ? Math.max(0, item.quantidade - quantidade) : item.quantidade + quantidade;
          return { ...item, quantidade: novaQtd, status: calcularStatus(novaQtd, item.pontoReposicao) };
        })
      );

      setMensagemSucesso(
        `${tipo === 'saida' ? 'Baixa' : 'Entrada'} de ${quantidade} un. de "${peca.nome}" registrada com sucesso!`
      );
      limparFormulario();
    } catch (err) {
      console.error(err);
      setMensagemErro(err.message || 'Erro ao registrar movimentação.');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className={`flex min-h-screen ${t.pagina}`}>
      {/* Sidebar AutoStock com aba 'movimentacao' ativa */}
      <Sidebar activeTab="movimentacao" isDark={isDark} onToggleDark={() => setIsDark((prev) => !prev)} />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col px-4 sm:px-8 py-8 overflow-y-auto">
        {/* Header Breadcrumb & Title */}
        <header className="mb-6">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a89e90] block mb-1">
            Operações
          </span>
          <div className="flex items-center justify-between gap-4">
            <h1 className={`text-3xl font-black tracking-tight uppercase ${t.titulo}`}>Entrada / Saída</h1>

            <button
              type="button"
              onClick={carregarDados}
              disabled={loading}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors p-2 rounded-lg disabled:opacity-50 ${t.botaoAtualizar}`}
              title="Recarregar dados do Supabase"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </header>

        {/* Resumo do dia */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <ResumoCard t={t} rotulo="Entradas hoje" valor={`+${resumoHoje.entradas}`} cor="text-[#16a34a]" sufixo="un." />
          <ResumoCard t={t} rotulo="Saídas hoje" valor={`-${resumoHoje.saidas}`} cor="text-[#d33e3e]" sufixo="un." />
          <ResumoCard
            t={t}
            rotulo="Abaixo do mínimo"
            valor={pecasParaRepor.length}
            cor={pecasParaRepor.length > 0 ? 'text-amber-600' : t.textoForte}
            sufixo={pecasParaRepor.length === 1 ? 'peça' : 'peças'}
          />
        </section>

        {/* Sub-tabs Navigation */}
        <section className="mb-6">
          <div className={`inline-flex flex-wrap items-center p-1 border rounded-lg gap-1 shadow-xs ${t.abas}`}>
            {Object.entries(ABAS).map(([id, item]) => (
              <button
                key={id}
                type="button"
                onClick={() => trocarAba(id)}
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all border ${
                  activeTab === id ? `${item.ativa} shadow-xs` : `border-transparent ${t.abaInativa}`
                }`}
              >
                {item.label}
                {id === 'pedidos' && pecasParaRepor.length > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#1e6fbe] text-white text-[10px] flex items-center justify-center">
                    {pecasParaRepor.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Mensagens de Feedback */}
        {erroCarregar && (
          <Aviso tipo="erro" texto={erroCarregar} onFechar={() => setErroCarregar('')}>
            <button
              type="button"
              onClick={carregarDados}
              className="ml-auto shrink-0 px-3 py-1 bg-red-600 text-white text-[11px] font-bold rounded-md hover:bg-red-700"
            >
              Tentar novamente
            </button>
          </Aviso>
        )}
        {mensagemSucesso && <Aviso tipo="sucesso" texto={mensagemSucesso} onFechar={() => setMensagemSucesso('')} />}
        {mensagemErro && <Aviso tipo="erro" texto={mensagemErro} onFechar={() => setMensagemErro('')} />}

        {/* Main Grid: Form (ou Pedidos) à esquerda e Histórico à direita */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card Esquerdo */}
          <div className={`lg:col-span-5 border rounded-xl p-6 shadow-xs flex flex-col ${t.card}`}>
            {activeTab === 'pedidos' ? (
              <PainelPedidos t={t} pecas={pecasParaRepor} loading={loading} onReceber={handleReceberPedido} />
            ) : (
              <form onSubmit={handleConfirmar} className="flex flex-col gap-4 h-full">
                <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold block">
                  {aba.tituloForm}
                </span>

                {/* SKU / Código OEM */}
                <div className="relative">
                  <Rotulo t={t}>SKU / Código OEM</Rotulo>
                  <div className="relative">
                    <input
                      type="text"
                      value={skuBusca}
                      onChange={(e) => {
                        setSkuBusca(e.target.value);
                        setPecaSelecionada(null);
                      }}
                      placeholder="Ex: FRE-0142 ou nome da peça"
                      autoComplete="off"
                      className={`w-full px-3.5 py-2.5 pr-9 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-600 focus:border-amber-600 transition-all font-mono ${t.input}`}
                    />
                    {skuBusca && (
                      <button
                        type="button"
                        onClick={limparFormulario}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded ${t.textoFraco} hover:text-amber-600`}
                        aria-label="Limpar"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown de sugestões */}
                  {sugestoes.length > 0 && (
                    <div className={`absolute left-0 right-0 top-full mt-1 border rounded-lg shadow-lg z-20 overflow-hidden divide-y ${t.dropdown}`}>
                      {sugestoes.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPeca(p)}
                          className={`w-full text-left px-3.5 py-2 transition-colors flex items-center justify-between gap-3 ${t.dropdownItem}`}
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-[#b85824] block font-mono">{p.codigo}</span>
                            <span className={`text-xs truncate block ${t.textoMedio}`}>{p.nome}</span>
                          </div>
                          <span className={`text-[11px] font-mono shrink-0 ${t.textoFraco}`}>{p.quantidade} un</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Mensagem quando nada é encontrado */}
                  {skuBusca.trim() && !pecaSelecionada && sugestoes.length === 0 && !loading && (
                    <p className={`mt-1.5 text-[11px] ${t.textoFraco}`}>Nenhuma peça encontrada com esse código ou nome.</p>
                  )}

                  {/* Detalhe da peça selecionada */}
                  {pecaSelecionada && (
                    <div className={`mt-2 p-3 rounded-lg border text-xs ${t.detalhe}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className={`font-semibold block ${t.textoForte}`}>{pecaSelecionada.nome}</span>
                        <StatusBadge status={pecaSelecionada.status} />
                      </div>
                      <div className={`mt-2 grid grid-cols-3 gap-2 font-mono ${t.textoSuave}`}>
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider">Atual</span>
                          <strong className={t.textoForte}>{pecaSelecionada.quantidade} un</strong>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider">Mínimo</span>
                          <strong className={t.textoForte}>{pecaSelecionada.pontoReposicao} un</strong>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider">Depois</span>
                          <strong className={estoqueInsuficiente ? 'text-[#d33e3e]' : aba.tipo === 'saida' ? 'text-amber-600' : 'text-[#16a34a]'}>
                            {estoqueDepois} un
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quantidade com Stepper */}
                <div>
                  <Rotulo t={t}>Quantidade</Rotulo>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      disabled={quantidade <= 1}
                      className={`w-10 h-10 flex items-center justify-center rounded-l-lg border border-r-0 transition-colors disabled:opacity-40 ${t.stepper}`}
                      aria-label="Diminuir"
                    >
                      <FiMinus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantidade}
                      onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value) || 1))}
                      className={`w-full h-10 text-center font-bold text-sm border-y focus:outline-none ${t.input} ${estoqueInsuficiente ? '!text-[#d33e3e]' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={handleIncrement}
                      className={`w-10 h-10 flex items-center justify-center rounded-r-lg border border-l-0 transition-colors ${t.stepper}`}
                      aria-label="Aumentar"
                    >
                      <FiPlus className="w-4 h-4" />
                    </button>
                  </div>
                  {estoqueInsuficiente && (
                    <p className="mt-1.5 text-[11px] text-[#d33e3e] flex items-center gap-1">
                      <FiAlertTriangle className="w-3.5 h-3.5" />
                      Quantidade maior que o estoque disponível ({pecaSelecionada.quantidade} un).
                    </p>
                  )}
                </div>

                {/* Ordem de Serviço ou Documento */}
                <div>
                  <Rotulo t={t}>{aba.rotuloDocumento}</Rotulo>
                  <input
                    type="text"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    placeholder={aba.documentoPadrao}
                    className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-600 focus:border-amber-600 transition-all font-mono ${t.input}`}
                  />
                </div>

                {/* Botão de Confirmação */}
                <div className="pt-2 mt-auto">
                  <button
                    type="submit"
                    disabled={loadingAction || estoqueInsuficiente || loading}
                    className={`w-full py-3 px-4 rounded-lg font-bold text-sm text-white shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${aba.corBotao}`}
                  >
                    {loadingAction ? (
                      <>
                        <FiLoader className="w-4 h-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        {aba.tipo === 'saida' ? <FiArrowDown className="w-4 h-4" /> : <FiArrowUp className="w-4 h-4" />}
                        {aba.botao}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Card Direito: Histórico de movimentações */}
          <div className={`lg:col-span-7 border rounded-xl p-6 shadow-xs flex flex-col ${t.card}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold">
                {periodo === 'hoje' ? 'Movimentações de Hoje' : 'Todas as Movimentações'}
              </span>

              <div className="flex items-center gap-2">
                <Filtro t={t} opcoes={[['hoje', 'Hoje'], ['todos', 'Tudo']]} valor={periodo} onChange={setPeriodo} />
                <Filtro
                  t={t}
                  opcoes={[['todos', 'Todos'], ['entrada', 'Entradas'], ['saida', 'Saídas']]}
                  valor={filtroTipo}
                  onChange={setFiltroTipo}
                />
              </div>
            </div>

            {loading ? (
              <div className={`flex flex-col items-center justify-center py-20 ${t.textoFraco}`}>
                <FiLoader className="w-6 h-6 animate-spin text-amber-600 mb-2" />
                <span className="text-xs">Carregando histórico...</span>
              </div>
            ) : movsFiltradas.length === 0 ? (
              <div className={`py-16 text-center ${t.textoFraco}`}>
                <FiPackage className="w-8 h-8 mx-auto mb-3 opacity-60" />
                <p className="text-sm font-medium">
                  {periodo === 'hoje' ? 'Nenhuma movimentação registrada hoje.' : 'Nenhuma movimentação encontrada.'}
                </p>
                <p className="text-xs mt-1">Utilize o formulário ao lado para dar saída ou entrada.</p>
                {periodo === 'hoje' && movimentacoes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPeriodo('todos')}
                    className="mt-4 text-xs font-semibold text-amber-600 hover:underline"
                  >
                    Ver movimentações anteriores
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className={`divide-y -mx-2 overflow-y-auto max-h-[520px] ${t.divisor}`}>
                  {movsFiltradas.map((mov) => {
                    const isSaida = mov.tipo === 'saida';

                    return (
                      <div
                        key={mov.id}
                        className={`py-3.5 px-2 flex items-center justify-between gap-4 rounded-lg transition-colors group ${t.linha}`}
                      >
                        {/* Ícone de Seta e Nome da Peça */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${
                              isSaida ? 'bg-red-500/10 text-[#d33e3e]' : 'bg-emerald-500/10 text-[#16a34a]'
                            }`}
                          >
                            {isSaida ? <FiArrowDown className="w-4 h-4 stroke-[2.5]" /> : <FiArrowUp className="w-4 h-4 stroke-[2.5]" />}
                          </div>

                          <div className="min-w-0">
                            <h4 className={`font-semibold text-sm truncate group-hover:text-amber-600 transition-colors ${t.textoForte}`}>
                              {mov.pecaNome}
                            </h4>
                            <p className={`text-xs font-mono mt-0.5 truncate ${t.textoFraco}`}>
                              {mov.sku} · {mov.motivo} · {mov.documento}
                            </p>
                          </div>
                        </div>

                        {/* Quantidade e Horário */}
                        <div className="text-right shrink-0">
                          <span className={`text-base font-extrabold font-mono ${isSaida ? 'text-[#d33e3e]' : 'text-[#16a34a]'}`}>
                            {isSaida ? `-${mov.quantidade}` : `+${mov.quantidade}`}
                          </span>
                          <span className={`block text-[11px] font-mono mt-0.5 ${t.textoFraco}`}>
                            {periodo === 'todos' && !ehHoje(mov.dataHora) ? `${mov.dataFormatada} · ` : ''}
                            {mov.hora}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className={`pt-3 mt-1 text-[11px] font-mono text-right ${t.textoFraco}`}>
                  {movsFiltradas.length} {movsFiltradas.length === 1 ? 'registro' : 'registros'}
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ---------- Pequenos componentes usados só nesta tela ----------

function Rotulo({ t, children }) {
  return (
    <label className={`block text-[10px] font-mono tracking-wider uppercase font-semibold mb-1.5 ${t.textoSuave}`}>
      {children}
    </label>
  );
}

function ResumoCard({ t, rotulo, valor, cor, sufixo }) {
  return (
    <div className={`border rounded-xl px-5 py-4 shadow-xs ${t.card}`}>
      <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold block">{rotulo}</span>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={`text-2xl font-black font-mono ${cor}`}>{valor}</span>
        <span className={`text-xs font-mono ${t.textoFraco}`}>{sufixo}</span>
      </div>
    </div>
  );
}

function Filtro({ t, opcoes, valor, onChange }) {
  return (
    <div className={`inline-flex items-center p-0.5 border rounded-md gap-0.5 ${t.abas}`}>
      {opcoes.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
            valor === id ? 'bg-amber-600 text-white' : t.abaInativa
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Aviso({ tipo, texto, onFechar, children }) {
  const sucesso = tipo === 'sucesso';
  return (
    <div
      className={`mb-6 p-3 border text-xs rounded-xl flex items-center gap-2 ${
        sucesso ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
      }`}
    >
      {sucesso ? (
        <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
      ) : (
        <FiAlertCircle className="w-4 h-4 text-red-600 shrink-0" />
      )}
      <span>{texto}</span>
      {children}
      <button type="button" onClick={onFechar} className={`${children ? '' : 'ml-auto'} p-1 opacity-60 hover:opacity-100`} aria-label="Fechar">
        <FiX className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function StatusBadge({ status }) {
  const estilos = {
    critico: ['bg-[#fef2f2] text-[#dc2626] border-[#fecaca]', 'Crítico'],
    atencao: ['bg-[#fffbeb] text-[#d97706] border-[#fde68a]', 'Atenção'],
    normal: ['bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]', 'Normal'],
  };
  const [classe, texto] = estilos[status] || estilos.normal;
  return (
    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${classe}`}>
      {texto}
    </span>
  );
}

function PainelPedidos({ t, pecas, loading, onReceber }) {
  return (
    <div className="flex flex-col h-full">
      <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold block mb-1">
        Sugestão de Reposição
      </span>
      <p className={`text-xs mb-4 ${t.textoSuave}`}>
        Peças no ponto de pedido ou abaixo dele. Clique em <strong>Receber</strong> quando a mercadoria chegar.
      </p>

      {loading ? (
        <div className={`flex flex-col items-center justify-center py-16 ${t.textoFraco}`}>
          <FiLoader className="w-6 h-6 animate-spin text-amber-600 mb-2" />
          <span className="text-xs">Calculando reposição...</span>
        </div>
      ) : pecas.length === 0 ? (
        <div className={`py-16 text-center ${t.textoFraco}`}>
          <FiCheckCircle className="w-8 h-8 mx-auto mb-3 text-[#16a34a]" />
          <p className="text-sm font-medium">Estoque em dia!</p>
          <p className="text-xs mt-1">Nenhuma peça abaixo do ponto de reposição.</p>
        </div>
      ) : (
        <div className={`divide-y overflow-y-auto max-h-[460px] -mx-2 ${t.divisor}`}>
          {pecas.map((p) => (
            <div key={p.id} className={`py-3 px-2 flex items-center justify-between gap-3 rounded-lg ${t.linha}`}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#b85824] font-mono">{p.codigo}</span>
                  <StatusBadge status={p.status} />
                </div>
                <p className={`text-sm font-semibold truncate mt-0.5 ${t.textoForte}`}>{p.nome}</p>
                <p className={`text-[11px] font-mono mt-0.5 ${t.textoFraco}`}>
                  {p.quantidade} / mín. {p.pontoReposicao} un · sugerido: <strong className="text-[#1e6fbe]">+{p.sugestao}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => onReceber(p)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-[#eef5fc] text-[#1e6fbe] border border-[#bad7f5] hover:bg-[#dcebfa] transition-colors"
              >
                <FiShoppingCart className="w-3.5 h-3.5" />
                Receber
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
