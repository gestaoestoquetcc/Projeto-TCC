import React, { useState, useEffect, useMemo } from 'react';
import {
  FiPlus,
  FiMinus,
  FiTrash2,
  FiPrinter,
  FiSave,
  FiCheck,
  FiX,
  FiLoader,
  FiFileText,
  FiAlertTriangle,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
} from 'react-icons/fi';

import {
  listarOrcamentos,
  salvarOrcamento,
  cancelarOrcamento,
  aprovarOrcamento,
  calcularTotais,
} from '../../services/orcamentosService';

const real = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = (d) => (d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('pt-BR') : '–');

const STATUS = {
  aberto: { texto: 'Aberto', classe: 'bg-[#eef5fc] text-[#1e6fbe] border-[#bad7f5]' },
  aprovado: { texto: 'Aprovado', classe: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]' },
  cancelado: { texto: 'Cancelado', classe: 'bg-gray-100 text-gray-500 border-gray-200' },
  vencido: { texto: 'Vencido', classe: 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]' },
};

// Situação do estoque para a quantidade pedida
function disponibilidade(estoque, quantidade) {
  if (estoque >= quantidade) return { tipo: 'ok', texto: 'Disponível', cor: 'text-[#16a34a]', Icone: FiCheckCircle };
  if (estoque > 0) return { tipo: 'parcial', texto: `Só ${estoque} un.`, cor: 'text-[#d97706]', Icone: FiAlertTriangle };
  return { tipo: 'sem', texto: 'Sem estoque', cor: 'text-[#dc2626]', Icone: FiAlertCircle };
}

// Abre uma janela com o orçamento formatado e manda imprimir (ou salvar em PDF)
function imprimirOrcamento(orc) {
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const linhas = orc.itens
    .map(
      (i) => `<tr><td>${esc(i.sku)}</td><td>${esc(i.nome)}</td><td class="n">${i.quantidade}</td>
      <td class="n">${real(i.precoUnitario)}</td><td class="n">${real(i.quantidade * i.precoUnitario)}</td></tr>`
    )
    .join('');
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(orc.numero)}</title>
  <style>
    body{font-family:Arial,sans-serif;color:#1c1d1f;margin:40px}
    h1{margin:0;font-size:22px} .topo{display:flex;justify-content:space-between;border-bottom:3px solid #c8672b;padding-bottom:12px;margin-bottom:20px}
    .marca{color:#c8672b;font-weight:bold;font-size:20px} .info{font-size:13px;color:#555;line-height:1.6}
    table{width:100%;border-collapse:collapse;font-size:13px;margin-top:10px} th{background:#f7f5f0;text-align:left;padding:8px;border-bottom:1px solid #ddd}
    td{padding:8px;border-bottom:1px solid #eee} .n{text-align:right} .totais{margin-left:auto;width:280px;margin-top:16px;font-size:14px}
    .totais div{display:flex;justify-content:space-between;padding:4px 0} .total{font-weight:bold;font-size:18px;border-top:2px solid #1c1d1f;margin-top:6px;padding-top:8px!important}
    .rodape{margin-top:40px;font-size:11px;color:#888}
  </style></head><body>
  <div class="topo"><div><div class="marca">AutoStock</div><div class="info">Distribuidor de Autopeças</div></div>
  <div class="info" style="text-align:right"><h1>Orçamento ${esc(orc.numero)}</h1>
  Emitido em ${dataBR(orc.criadoEm || new Date().toISOString())}<br>Válido até ${dataBR(orc.validade)}</div></div>
  <div class="info"><strong>Cliente:</strong> ${esc(orc.cliente)}${orc.observacao ? `<br><strong>Obs.:</strong> ${esc(orc.observacao)}` : ''}</div>
  <table><thead><tr><th>SKU</th><th>Peça</th><th class="n">Qtd.</th><th class="n">Preço un.</th><th class="n">Subtotal</th></tr></thead><tbody>${linhas}</tbody></table>
  <div class="totais"><div><span>Subtotal</span><span>${real(orc.subtotal)}</span></div>
  ${orc.desconto > 0 ? `<div><span>Desconto (${orc.desconto}%)</span><span>- ${real(orc.valorDesconto)}</span></div>` : ''}
  <div class="total"><span>Total</span><span>${real(orc.total)}</span></div></div>
  <div class="rodape">Este documento é um orçamento e não garante reserva das peças. Preços e disponibilidade sujeitos a alteração.</div>
  <script>window.onload=()=>window.print()</script></body></html>`;

  const janela = window.open('', '_blank', 'width=900,height=700');
  if (!janela) return false;
  janela.document.write(html);
  janela.document.close();
  return true;
}

/**
 * Aba "Orçamento" da tela Entrada/Saída
 */
export default function PainelOrcamento({ t, pecas = [], onEstoqueAlterado }) {
  // --- Montagem do orçamento ---
  const [busca, setBusca] = useState('');
  const [itens, setItens] = useState([]); // { peca, quantidade, precoUnitario }
  const [cliente, setCliente] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [validadeDias, setValidadeDias] = useState(7);
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  // --- Lista de orçamentos salvos ---
  const [orcamentos, setOrcamentos] = useState([]);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [versaoLista, setVersaoLista] = useState(0);
  const [filtro, setFiltro] = useState('aberto');
  const [aberto, setAberto] = useState(null); // id do orçamento expandido
  const [confirmando, setConfirmando] = useState(null); // id aguardando confirmação de aprovação
  const [processando, setProcessando] = useState(null);

  const [mensagem, setMensagem] = useState(null); // { tipo: 'sucesso' | 'erro', texto }
  const [tabelasFaltando, setTabelasFaltando] = useState(false); // banco ainda sem as tabelas de orçamento

  // Carrega a lista
  useEffect(() => {
    let ativo = true;
    listarOrcamentos()
      .then((lista) => {
        if (!ativo) return;
        setOrcamentos(lista);
        setTabelasFaltando(false);
      })
      .catch((err) => {
        if (!ativo) return;
        // Tabelas faltando: mostra o aviso fixo em vez da mensagem que some sozinha
        if (err.tabelasFaltando) setTabelasFaltando(true);
        else setMensagem({ tipo: 'erro', texto: err.message });
      })
      .finally(() => ativo && setCarregandoLista(false));
    return () => {
      ativo = false;
    };
  }, [versaoLista]);

  const recarregarLista = () => {
    setCarregandoLista(true);
    setVersaoLista((v) => v + 1);
  };

  // Mensagem some sozinha
  useEffect(() => {
    if (!mensagem) return;
    const timer = setTimeout(() => setMensagem(null), 6000);
    return () => clearTimeout(timer);
  }, [mensagem]);

  // Sugestões da busca (esconde peças já adicionadas)
  const sugestoes = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return [];
    const ja = new Set(itens.map((i) => i.peca.id));
    return pecas
      .filter((p) => !ja.has(p.id) && (p.codigo.toLowerCase().includes(q) || p.nome.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [busca, pecas, itens]);

  const totais = calcularTotais(itens, desconto);
  const resumoDisp = itens.reduce(
    (acc, i) => {
      acc[disponibilidade(i.peca.quantidade, i.quantidade).tipo] += 1;
      return acc;
    },
    { ok: 0, parcial: 0, sem: 0 }
  );

  // --- Ações da montagem ---
  const adicionar = (peca) => {
    setItens((prev) => [...prev, { peca, quantidade: 1, precoUnitario: peca.precoVenda || 0 }]);
    setBusca('');
  };
  const alterarItem = (id, campo, valor) =>
    setItens((prev) => prev.map((i) => (i.peca.id === id ? { ...i, [campo]: valor } : i)));
  const remover = (id) => setItens((prev) => prev.filter((i) => i.peca.id !== id));
  const limpar = () => {
    setItens([]);
    setCliente('');
    setDesconto(0);
    setObservacao('');
    setValidadeDias(7);
  };

  const montarParaImpressao = () => {
    const hoje = new Date();
    const validade = new Date(hoje);
    validade.setDate(validade.getDate() + validadeDias);
    return {
    numero: 'RASCUNHO',
    cliente: cliente || '—',
    desconto: Number(desconto) || 0,
    validade: validade.toISOString().slice(0, 10),
    observacao,
    criadoEm: hoje.toISOString(),
    itens: itens.map((i) => ({
      sku: i.peca.codigo,
      nome: i.peca.nome,
      quantidade: i.quantidade,
      precoUnitario: Number(i.precoUnitario) || 0,
    })),
    ...totais,
    };
  };

  const handleImprimir = (orc) => {
    if (!imprimirOrcamento(orc)) {
      setMensagem({ tipo: 'erro', texto: 'O navegador bloqueou a janela de impressão. Permita pop-ups para este site.' });
    }
  };

  const handleSalvar = async () => {
    try {
      setSalvando(true);
      const novo = await salvarOrcamento({
        cliente,
        desconto,
        validadeDias,
        observacao,
        itens: itens.map((i) => ({ pecaId: i.peca.id, quantidade: i.quantidade, precoUnitario: i.precoUnitario })),
      });
      setOrcamentos((prev) => [novo, ...prev]);
      setFiltro('aberto');
      setAberto(novo.id);
      setMensagem({ tipo: 'sucesso', texto: `Orçamento ${novo.numero} salvo para ${novo.cliente} (${real(novo.total)}).` });
      limpar();
    } catch (err) {
      if (err.tabelasFaltando) setTabelasFaltando(true);
      else setMensagem({ tipo: 'erro', texto: err.message });
    } finally {
      setSalvando(false);
    }
  };

  // --- Ações da lista ---
  const handleAprovar = async (orc) => {
    if (confirmando !== orc.id) {
      setConfirmando(orc.id);
      return;
    }
    try {
      setProcessando(orc.id);
      await aprovarOrcamento(orc, pecas);
      setOrcamentos((prev) => prev.map((o) => (o.id === orc.id ? { ...o, status: 'aprovado' } : o)));
      setMensagem({ tipo: 'sucesso', texto: `${orc.numero} aprovado! Saída de ${orc.itens.length} peça(s) registrada no estoque.` });
      onEstoqueAlterado?.();
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message });
    } finally {
      setProcessando(null);
      setConfirmando(null);
    }
  };

  const handleCancelar = async (orc) => {
    try {
      setProcessando(orc.id);
      await cancelarOrcamento(orc.id);
      setOrcamentos((prev) => prev.map((o) => (o.id === orc.id ? { ...o, status: 'cancelado' } : o)));
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message });
    } finally {
      setProcessando(null);
    }
  };

  // Status considerando a validade (aberto + data passada = vencido)
  const hojeISO = new Date().toISOString().slice(0, 10);
  const statusDe = (o) => (o.status === 'aberto' && o.validade < hojeISO ? 'vencido' : o.status);
  const listaFiltrada = orcamentos.filter((o) => filtro === 'todos' || statusDe(o) === filtro);
  const contagem = orcamentos.reduce((acc, o) => ({ ...acc, [statusDe(o)]: (acc[statusDe(o)] || 0) + 1 }), {});

  const inputCls = `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-600 focus:border-amber-600 ${t.input}`;

  return (
    <div className="space-y-4">
      {/* Aviso fixo enquanto o banco não tiver as tabelas de orçamento */}
      {tabelasFaltando && (
        <div className="p-4 border border-amber-300 bg-amber-50 text-amber-900 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3">
          <FiAlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs leading-relaxed flex-1">
            <strong className="block text-sm mb-0.5">Orçamentos ainda não estão ativados no banco de dados</strong>
            Você pode montar e imprimir orçamentos, mas para <strong>salvar</strong> falta criar as tabelas no Supabase.
            Quem é dono do projeto deve abrir o <strong>SQL Editor</strong>, colar o arquivo{' '}
            <code className="px-1 py-0.5 rounded bg-amber-100 font-mono">supabase/orcamentos.sql</code> e clicar em <strong>Run</strong>.
          </div>
          <button
            type="button"
            onClick={recarregarLista}
            disabled={carregandoLista}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-60"
          >
            {carregandoLista ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
            Verificar de novo
          </button>
        </div>
      )}

      {mensagem && (
        <div
          className={`p-3 border text-xs rounded-xl flex items-center gap-2 ${
            mensagem.tipo === 'sucesso' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {mensagem.tipo === 'sucesso' ? <FiCheckCircle className="w-4 h-4 shrink-0" /> : <FiAlertCircle className="w-4 h-4 shrink-0" />}
          <span>{mensagem.texto}</span>
          <button type="button" onClick={() => setMensagem(null)} className="ml-auto p-1 opacity-60 hover:opacity-100" aria-label="Fechar">
            <FiX className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ================= NOVO ORÇAMENTO ================= */}
        <section className={`xl:col-span-7 border rounded-xl p-6 shadow-xs ${t.card}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold">Novo orçamento</span>
            <span className={`text-[11px] ${t.textoFraco}`}>Não mexe no estoque até ser aprovado</span>
          </div>

          {/* Cliente e validade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="sm:col-span-2">
              <label className={`block text-[10px] font-mono tracking-wider uppercase font-semibold mb-1.5 ${t.textoSuave}`}>Cliente</label>
              <input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nome do cliente ou oficina" className={inputCls} />
            </div>
            <div>
              <label className={`block text-[10px] font-mono tracking-wider uppercase font-semibold mb-1.5 ${t.textoSuave}`}>Validade</label>
              <select value={validadeDias} onChange={(e) => setValidadeDias(Number(e.target.value))} className={inputCls}>
                {[3, 7, 15, 30].map((d) => (
                  <option key={d} value={d}>
                    {d} dias
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Busca de peças */}
          <div className="relative mb-4">
            <label className={`block text-[10px] font-mono tracking-wider uppercase font-semibold mb-1.5 ${t.textoSuave}`}>Adicionar peça</label>
            <div className="relative">
              <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${t.textoFraco}`} />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite o SKU ou o nome da peça"
                autoComplete="off"
                className={`${inputCls} pl-9 font-mono`}
              />
            </div>
            {sugestoes.length > 0 && (
              <div className={`absolute left-0 right-0 top-full mt-1 border rounded-lg shadow-lg z-20 overflow-hidden divide-y ${t.dropdown}`}>
                {sugestoes.map((p) => {
                  const d = disponibilidade(p.quantidade, 1);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => adicionar(p)}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-3 ${t.dropdownItem}`}
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-[#b85824] font-mono">{p.codigo}</span>
                        <span className={`text-xs truncate block ${t.textoMedio}`}>{p.nome}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-mono font-bold block ${t.textoForte}`}>{real(p.precoVenda)}</span>
                        <span className={`text-[10px] font-mono ${d.cor}`}>{p.quantidade} un.</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Itens */}
          {itens.length === 0 ? (
            <div className={`py-10 text-center border border-dashed rounded-lg ${t.textoFraco}`}>
              <FiFileText className="w-7 h-7 mx-auto mb-2 opacity-60" />
              <p className="text-sm">Nenhuma peça no orçamento ainda.</p>
              <p className="text-xs mt-1">Busque acima e clique para adicionar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className={`text-left text-[10px] font-mono uppercase tracking-wider border-b ${t.divisor} ${t.textoSuave}`}>
                    <th className="py-2 px-2">Peça</th>
                    <th className="py-2 px-2 text-center">Qtd.</th>
                    <th className="py-2 px-2 text-right">Preço un.</th>
                    <th className="py-2 px-2 text-right">Subtotal</th>
                    <th className="py-2 px-2" />
                  </tr>
                </thead>
                <tbody className={`divide-y ${t.divisor}`}>
                  {itens.map((i) => {
                    const d = disponibilidade(i.peca.quantidade, i.quantidade);
                    return (
                      <tr key={i.peca.id}>
                        <td className="py-2.5 px-2">
                          <span className={`block font-semibold text-sm ${t.textoForte}`}>{i.peca.nome}</span>
                          <span className="text-[10px] font-mono text-[#b85824]">{i.peca.codigo}</span>
                          <span className={`ml-2 inline-flex items-center gap-1 text-[10px] font-medium ${d.cor}`}>
                            <d.Icone className="w-3 h-3" /> {d.texto}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => alterarItem(i.peca.id, 'quantidade', Math.max(1, i.quantidade - 1))}
                              className={`w-7 h-7 flex items-center justify-center rounded-l-md border ${t.stepper}`}
                              aria-label="Diminuir"
                            >
                              <FiMinus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={i.quantidade}
                              onChange={(e) => alterarItem(i.peca.id, 'quantidade', Math.max(1, Number(e.target.value) || 1))}
                              className={`w-12 h-7 text-center text-sm font-bold border-y focus:outline-none ${t.input}`}
                            />
                            <button
                              type="button"
                              onClick={() => alterarItem(i.peca.id, 'quantidade', i.quantidade + 1)}
                              className={`w-7 h-7 flex items-center justify-center rounded-r-md border ${t.stepper}`}
                              aria-label="Aumentar"
                            >
                              <FiPlus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={i.precoUnitario}
                            onChange={(e) => alterarItem(i.peca.id, 'precoUnitario', Math.max(0, Number(e.target.value) || 0))}
                            className={`w-24 h-7 px-2 text-right text-sm font-mono border rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600 ${t.input}`}
                            title="Preço por unidade (pode ajustar)"
                          />
                        </td>
                        <td className={`py-2.5 px-2 text-right font-mono font-bold ${t.textoForte}`}>
                          {real(i.quantidade * i.precoUnitario)}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => remover(i.peca.id)}
                            className={`p-1.5 rounded-md hover:bg-red-500/10 hover:text-[#dc2626] ${t.textoFraco}`}
                            aria-label="Remover"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Totais e observação */}
          {itens.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-[10px] font-mono tracking-wider uppercase font-semibold mb-1.5 ${t.textoSuave}`}>Observação</label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={3}
                  placeholder="Ex.: veículo, placa, prazo de entrega..."
                  className={`${inputCls} resize-none`}
                />
                <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-mono">
                  {resumoDisp.ok > 0 && <span className="text-[#16a34a]">✓ {resumoDisp.ok} disponível</span>}
                  {resumoDisp.parcial > 0 && <span className="text-[#d97706]">⚠ {resumoDisp.parcial} parcial</span>}
                  {resumoDisp.sem > 0 && <span className="text-[#dc2626]">✕ {resumoDisp.sem} sem estoque</span>}
                </div>
              </div>

              <div className={`rounded-lg p-4 border ${t.detalhe}`}>
                <div className={`flex justify-between text-sm ${t.textoSuave}`}>
                  <span>Subtotal</span>
                  <span className="font-mono">{real(totais.subtotal)}</span>
                </div>
                <div className={`flex justify-between items-center text-sm mt-2 ${t.textoSuave}`}>
                  <span className="flex items-center gap-2">
                    Desconto
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={desconto}
                      onChange={(e) => setDesconto(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                      className={`w-14 h-6 px-1.5 text-right text-xs font-mono border rounded ${t.input}`}
                    />
                    %
                  </span>
                  <span className="font-mono">- {real(totais.valorDesconto)}</span>
                </div>
                <div className={`flex justify-between items-baseline mt-3 pt-3 border-t ${t.divisor}`}>
                  <span className={`text-sm font-bold ${t.textoForte}`}>Total</span>
                  <span className="text-2xl font-black font-mono text-[#c8672b]">{real(totais.total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
            {itens.length > 0 && (
              <button type="button" onClick={limpar} className={`px-3 py-2 rounded-lg text-xs font-semibold ${t.textoSuave} hover:text-[#dc2626]`}>
                Limpar
              </button>
            )}
            <button
              type="button"
              onClick={() => handleImprimir(montarParaImpressao())}
              disabled={itens.length === 0}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold disabled:opacity-40 ${t.card} ${t.textoForte} hover:border-[#c8672b]/60`}
            >
              <FiPrinter className="w-4 h-4" /> Imprimir
            </button>
            <button
              type="button"
              onClick={handleSalvar}
              disabled={itens.length === 0 || salvando || tabelasFaltando}
              title={tabelasFaltando ? 'Falta criar as tabelas de orçamento no Supabase' : undefined}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c8672b] hover:bg-[#b85b20] text-white text-sm font-bold shadow-xs disabled:opacity-40"
            >
              {salvando ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />}
              Salvar orçamento
            </button>
          </div>
        </section>

        {/* ================= ORÇAMENTOS SALVOS ================= */}
        <section className={`xl:col-span-5 border rounded-xl p-6 shadow-xs ${t.card}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold">Orçamentos salvos</span>
            <button type="button" onClick={recarregarLista} className={`text-[11px] font-semibold ${t.textoSuave} hover:text-[#c8672b]`}>
              Atualizar
            </button>
          </div>

          <div className={`inline-flex flex-wrap p-0.5 gap-0.5 border rounded-md mb-4 ${t.abas}`}>
            {[
              ['aberto', 'Abertos'],
              ['vencido', 'Vencidos'],
              ['aprovado', 'Aprovados'],
              ['cancelado', 'Cancelados'],
              ['todos', 'Todos'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFiltro(id)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold ${filtro === id ? 'bg-[#c8672b] text-white' : t.abaInativa}`}
              >
                {label}
                {id !== 'todos' && contagem[id] ? ` (${contagem[id]})` : ''}
              </button>
            ))}
          </div>

          {carregandoLista ? (
            <div className={`py-14 flex flex-col items-center ${t.textoFraco}`}>
              <FiLoader className="w-6 h-6 animate-spin text-amber-600 mb-2" />
              <span className="text-xs">Carregando orçamentos...</span>
            </div>
          ) : tabelasFaltando ? (
            <div className={`py-14 text-center ${t.textoFraco}`}>
              <FiAlertTriangle className="w-7 h-7 mx-auto mb-2 text-amber-500" />
              <p className="text-sm">Os orçamentos salvos aparecem aqui</p>
              <p className="text-xs mt-1">depois que as tabelas forem criadas no Supabase.</p>
            </div>
          ) : listaFiltrada.length === 0 ? (
            <div className={`py-14 text-center ${t.textoFraco}`}>
              <FiFileText className="w-7 h-7 mx-auto mb-2 opacity-60" />
              <p className="text-sm">Nenhum orçamento {filtro !== 'todos' ? 'neste filtro' : 'salvo'}.</p>
            </div>
          ) : (
            <ul className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {listaFiltrada.map((o) => {
                const st = STATUS[statusDe(o)];
                const expandido = aberto === o.id;
                const podeAgir = o.status === 'aberto';
                return (
                  <li key={o.id} className={`border rounded-lg ${t.card}`}>
                    <button
                      type="button"
                      onClick={() => setAberto(expandido ? null : o.id)}
                      className="w-full text-left p-3 flex items-center gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#b85824]">{o.numero}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${st.classe}`}>{st.texto}</span>
                        </div>
                        <p className={`text-sm font-semibold truncate mt-0.5 ${t.textoForte}`}>{o.cliente}</p>
                        <p className={`text-[11px] font-mono ${t.textoFraco}`}>
                          {o.itens.length} {o.itens.length === 1 ? 'peça' : 'peças'} · {dataBR(o.criadoEm)} · válido até {dataBR(o.validade)}
                        </p>
                      </div>
                      <span className={`text-sm font-black font-mono ${t.textoForte}`}>{real(o.total)}</span>
                      {expandido ? <FiChevronUp className={`w-4 h-4 ${t.textoFraco}`} /> : <FiChevronDown className={`w-4 h-4 ${t.textoFraco}`} />}
                    </button>

                    {expandido && (
                      <div className={`px-3 pb-3 border-t ${t.divisor}`}>
                        <ul className="py-2 space-y-1">
                          {o.itens.map((i) => (
                            <li key={i.id} className="flex justify-between text-xs gap-2">
                              <span className={`truncate ${t.textoMedio}`}>
                                {i.quantidade}× {i.nome}
                              </span>
                              <span className={`font-mono shrink-0 ${t.textoSuave}`}>{real(i.quantidade * i.precoUnitario)}</span>
                            </li>
                          ))}
                          {o.desconto > 0 && (
                            <li className="flex justify-between text-xs text-[#16a34a]">
                              <span>Desconto {o.desconto}%</span>
                              <span className="font-mono">- {real(o.valorDesconto)}</span>
                            </li>
                          )}
                        </ul>
                        {o.observacao && <p className={`text-[11px] italic mb-2 ${t.textoFraco}`}>Obs.: {o.observacao}</p>}

                        <div className="flex flex-wrap gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => handleImprimir(o)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold ${t.card} ${t.textoSuave}`}
                          >
                            <FiPrinter className="w-3.5 h-3.5" /> Imprimir
                          </button>
                          {podeAgir && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCancelar(o)}
                                disabled={processando === o.id}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold hover:bg-red-500/10 hover:text-[#dc2626] disabled:opacity-50 ${t.textoSuave}`}
                              >
                                <FiX className="w-3.5 h-3.5" /> Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAprovar(o)}
                                disabled={processando === o.id}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold text-white disabled:opacity-50 ${
                                  confirmando === o.id ? 'bg-[#d33e3e] hover:bg-[#bb3232]' : 'bg-[#16a34a] hover:bg-[#15803d]'
                                }`}
                              >
                                {processando === o.id ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
                                {confirmando === o.id ? 'Confirmar saída do estoque?' : 'Aprovar e dar saída'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
