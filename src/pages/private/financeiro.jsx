import React, { useState, useEffect, useMemo } from 'react';
import { FiRefreshCw, FiLoader, FiAlertCircle, FiChevronLeft, FiChevronRight, FiDatabase } from 'react-icons/fi';

import Sidebar from '@components/layout/Sidebar';
import GraficoFinanceiro from '@components/financeiro/GraficoFinanceiro';
import AnaliseFinanceira from '@components/financeiro/AnaliseFinanceira';
import PainelCaixa from '@components/financeiro/PainelCaixa';
import { getPecas } from '../../services/pecasService';
import { getMovimentacoes } from '../../services/movimentacoesService';
import {
  listarLancamentos,
  criarLancamento,
  excluirLancamento,
  vendasDasSaidas,
  montarResumo,
  gerarAnaliseFinanceira,
  variacao,
} from '../../services/financeiroService';

// Mesmas cores do Dashboard (tema claro / escuro)
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

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const nomeMes = (ano, mes) => {
  const s = new Date(ano, mes, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function FinanceiroPage() {
  const [pecas, setPecas] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [tabelaFaltando, setTabelaFaltando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [ultimaSync, setUltimaSync] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [versao, setVersao] = useState(0);
  // Mês exibido; começa no mês atual quando os dados chegam
  const [mesEscolhido, setMesEscolhido] = useState(null);

  const t = isDark ? TEMAS.escuro : TEMAS.claro;

  // Busca peças, movimentações e o livro caixa
  useEffect(() => {
    let ativo = true;
    Promise.allSettled([getPecas(), getMovimentacoes(), listarLancamentos()]).then(([rPecas, rMovs, rCaixa]) => {
      if (!ativo) return;
      if (rPecas.status === 'rejected' || rMovs.status === 'rejected') {
        setErro('Não foi possível carregar os dados do Supabase. Verifique sua conexão ou o arquivo .env.');
      } else {
        setPecas(rPecas.value);
        setMovimentacoes(rMovs.value);
        setErro('');
      }
      if (rCaixa.status === 'fulfilled') {
        setLancamentos(rCaixa.value);
        setTabelaFaltando(false);
      } else {
        setTabelaFaltando(!!rCaixa.reason?.tabelaFaltando);
        if (!rCaixa.reason?.tabelaFaltando) setErro(rCaixa.reason?.message || 'Erro ao carregar o caixa.');
      }
      const agora = new Date();
      setUltimaSync(agora);
      setMesEscolhido((m) => m || { ano: agora.getFullYear(), mes: agora.getMonth() });
      setLoading(false);
    });
    return () => {
      ativo = false;
    };
  }, [versao]);

  const carregarDados = () => {
    setLoading(true);
    setVersao((v) => v + 1);
  };

  const trocarMes = (delta) =>
    setMesEscolhido((m) => {
      const d = new Date(m.ano, m.mes + delta, 1);
      return { ano: d.getFullYear(), mes: d.getMonth() };
    });

  const vendas = useMemo(() => vendasDasSaidas(movimentacoes, pecas), [movimentacoes, pecas]);

  const resumo = useMemo(() => {
    if (!mesEscolhido || !ultimaSync) return null;
    return montarResumo({ vendas, lancamentos, ano: mesEscolhido.ano, mes: mesEscolhido.mes, hoje: ultimaSync });
  }, [vendas, lancamentos, mesEscolhido, ultimaSync]);

  const analise = useMemo(() => (resumo ? gerarAnaliseFinanceira(resumo) : null), [resumo]);

  // Meses que aparecem no filtro: do mais antigo com dados (mínimo 12 meses atrás) até o mês atual
  const opcoesMeses = useMemo(() => {
    if (!ultimaSync) return [];
    const datas = [...vendas.map((v) => v.data), ...lancamentos.map((l) => new Date(`${l.data}T12:00:00`))];
    const doze = new Date(ultimaSync.getFullYear(), ultimaSync.getMonth() - 11, 1);
    const maisAntiga = datas.reduce((min, d) => (d < min ? d : min), doze);
    const lista = [];
    for (let d = new Date(ultimaSync.getFullYear(), ultimaSync.getMonth(), 1); d >= new Date(maisAntiga.getFullYear(), maisAntiga.getMonth(), 1) && lista.length < 36; d = new Date(d.getFullYear(), d.getMonth() - 1, 1)) {
      lista.push({ ano: d.getFullYear(), mes: d.getMonth() });
    }
    return lista;
  }, [vendas, lancamentos, ultimaSync]);

  async function salvarLancamento(dados) {
    const novo = await criarLancamento(dados);
    setLancamentos((lista) => [novo, ...lista]);
    // Mostra o mês do lançamento
    const [a, m] = dados.data.split('-').map(Number);
    setMesEscolhido({ ano: a, mes: m - 1 });
  }

  async function apagarLancamento(id) {
    try {
      await excluirLancamento(id);
      setLancamentos((lista) => lista.filter((l) => l.id !== id));
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div className={`flex min-h-screen ${t.pagina}`}>
      <Sidebar activeTab="financeiro" isDark={isDark} onToggleDark={() => setIsDark((prev) => !prev)} />

      <main className="flex-1 min-w-0 flex flex-col gap-6 px-4 sm:px-8 py-8 overflow-y-auto">
        {/* Cabeçalho */}
        <header className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-[#e5dfd4]/70">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#a89e90] block mb-1">Caixa · lucro · prejuízo</span>
            <h1 className={`text-3xl font-black tracking-tight uppercase ${t.titulo}`}>Financeiro</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={carregarDados}
              disabled={loading}
              className={`inline-flex items-center gap-2 text-xs font-mono transition-colors p-2 rounded-lg hover:bg-black/5 disabled:opacity-50 ${t.textoSuave}`}
              title="Recarregar dados do Supabase"
            >
              {loading ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span className={`w-2 h-2 rounded-full ${erro ? 'bg-red-500' : 'bg-emerald-500'}`} />}
              {ultimaSync ? `sync ${ultimaSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'sincronizando...'}
            </button>
          </div>
        </header>

        {erro && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{erro}</span>
            <button type="button" onClick={carregarDados} className="ml-auto shrink-0 px-3 py-1 bg-red-600 text-white text-[11px] font-bold rounded-md hover:bg-red-700">
              Tentar novamente
            </button>
          </div>
        )}

        {tabelaFaltando && (
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 flex flex-wrap items-center gap-3">
            <FiDatabase className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-[220px] text-sm">
              <strong className="block">O livro caixa ainda não está ativado no banco de dados</strong>
              As vendas já aparecem, mas para lançar despesas e o saldo inicial falta rodar o arquivo{' '}
              <code className="px-1 rounded bg-amber-100 font-mono text-xs">supabase/financeiro.sql</code> no SQL Editor do Supabase.
            </div>
            <button type="button" onClick={carregarDados} className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold">
              Verificar de novo
            </button>
          </div>
        )}

        {!resumo ? (
          <div className={`flex flex-col items-center justify-center py-24 border rounded-xl ${t.card}`}>
            <FiLoader className="w-8 h-8 text-amber-600 animate-spin mb-3" />
            <span className={`text-sm font-semibold ${t.textoSuave}`}>Carregando o financeiro do Supabase...</span>
          </div>
        ) : (
          <>
            <FiltroMes t={t} escolhido={mesEscolhido} opcoes={opcoesMeses} onEscolher={setMesEscolhido} onPassar={trocarMes} />
            <Indicadores t={t} r={resumo} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              <div className="xl:col-span-2 flex flex-col gap-6 min-w-0">
                <section className={`border rounded-xl shadow-xs p-6 ${t.card}`}>
                  <div className="flex items-baseline justify-between gap-3 mb-4">
                    <h2 className={`text-sm font-bold ${t.textoForte}`}>Últimos 6 meses</h2>
                    <span className={`text-[11px] font-mono ${t.textoSuave}`}>até {nomeMes(mesEscolhido.ano, mesEscolhido.mes).toLowerCase()}</span>
                  </div>
                  <GraficoFinanceiro t={t} serie={resumo.serie} />
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Ranking
                    t={t}
                    titulo="Peças que mais faturaram"
                    vazio="Nenhuma venda neste mês."
                    itens={resumo.topPecas.map((p) => ({ nome: p.nome, extra: `${p.sku} · ${p.quantidade} un.`, valor: p.valor }))}
                    total={resumo.faturamento}
                    cor="bg-[#2f9e5b]"
                  />
                  <Ranking
                    t={t}
                    titulo="Para onde foi o dinheiro"
                    vazio="Nenhuma saída lançada no caixa neste mês."
                    itens={resumo.saidasPorCategoria.map(([cat, valor]) => ({ nome: cat, valor }))}
                    total={resumo.saidas}
                    cor="bg-[#d64545]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-6 min-w-0">
                <AnaliseFinanceira t={t} analise={analise} />
                <PainelCaixa
                  t={t}
                  lancamentos={resumo.lancLista}
                  faturamento={resumo.faturamento}
                  pecasVendidas={resumo.pecasVendidas}
                  onSalvar={salvarLancamento}
                  onExcluir={apagarLancamento}
                  bloqueado={tabelaFaltando}
                />
              </div>
            </div>

            <p className={`text-[11px] ${t.textoFraco}`}>
              Vendas = saídas de estoque × preço de venda atual da peça. Lucro = entradas − saídas do mês. Saldo em caixa = tudo que entrou − tudo que saiu até o fim do mês.
            </p>
          </>
        )}
      </main>
    </div>
  );
}

// ---------- Partes da tela ----------

/** Filtro de mês: atalhos rápidos + lista com todos os meses + setas */
function FiltroMes({ t, escolhido, opcoes, onEscolher, onPassar }) {
  const igual = (a, b) => a && b && a.ano === b.ano && a.mes === b.mes;
  const atalhos = [
    { rotulo: 'Este mês', valor: opcoes[0] },
    { rotulo: 'Mês passado', valor: opcoes[1] },
    { rotulo: 'Há 2 meses', valor: opcoes[2] },
  ].filter((a) => a.valor);
  const valorSelect = `${escolhido.ano}-${escolhido.mes}`;
  const naLista = opcoes.some((o) => igual(o, escolhido));

  return (
    <section className={`border rounded-xl px-4 py-3 flex flex-wrap items-center gap-3 ${t.card}`} aria-label="Filtrar por mês">
      <span className={`text-[11px] font-mono font-bold uppercase tracking-widest ${t.textoSuave}`}>Filtrar mês</span>

      <div className={`flex flex-wrap gap-1 p-1 rounded-lg border ${t.abas}`}>
        {atalhos.map((a) => {
          const ativo = igual(a.valor, escolhido);
          return (
            <button
              key={a.rotulo}
              type="button"
              onClick={() => onEscolher(a.valor)}
              aria-pressed={ativo}
              className={`px-3 h-8 rounded-md text-xs font-bold transition-colors ${
                ativo ? 'bg-gradient-to-r from-[#e8772e] to-[#c8672b] text-white shadow-sm' : t.abaInativa
              }`}
            >
              {a.rotulo}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <button type="button" onClick={() => onPassar(-1)} aria-label="Mês anterior" className={`w-8 h-8 rounded-lg border flex items-center justify-center hover:text-[#c8672b] ${t.card} ${t.textoSuave}`}>
          <FiChevronLeft />
        </button>
        <label htmlFor="filtro-mes" className="sr-only">Escolher mês</label>
        <select
          id="filtro-mes"
          value={valorSelect}
          onChange={(e) => {
            const [ano, mes] = e.target.value.split('-').map(Number);
            onEscolher({ ano, mes });
          }}
          className={`h-8 min-w-[170px] rounded-lg border px-2 text-sm font-bold bg-transparent outline-none focus:border-[#c8672b] ${t.card} ${t.textoForte}`}
        >
          {!naLista && <option value={valorSelect}>{nomeMes(escolhido.ano, escolhido.mes)}</option>}
          {opcoes.map((o) => (
            <option key={`${o.ano}-${o.mes}`} value={`${o.ano}-${o.mes}`}>
              {nomeMes(o.ano, o.mes)}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => onPassar(1)} aria-label="Próximo mês" className={`w-8 h-8 rounded-lg border flex items-center justify-center hover:text-[#c8672b] ${t.card} ${t.textoSuave}`}>
          <FiChevronRight />
        </button>
      </div>
    </section>
  );
}

function Indicadores({ t, r }) {
  const vFat = variacao(r.faturamento, r.anterior.faturamento);
  const vSai = variacao(r.saidas, r.anterior.saidas);
  const positivo = r.lucro >= 0;

  const cards = [
    {
      titulo: 'Faturamento (vendas)',
      valor: brl(r.faturamento),
      cor: t.textoForte,
      sub: `${r.pecasVendidas} peças vendidas`,
      badge: vFat === null ? '—' : `${vFat >= 0 ? '+' : ''}${vFat}% vs mês ant.`,
      badgeCor: vFat === null ? 'bg-gray-500/10 text-gray-500' : vFat >= 0 ? 'bg-emerald-500/10 text-[#2f9e5b]' : 'bg-red-500/10 text-[#d64545]',
    },
    {
      titulo: 'Saídas (compras + despesas)',
      valor: brl(r.saidas),
      cor: 'text-[#d64545]',
      sub: `compras ${brl(r.compras)}`,
      badge: vSai === null ? '—' : `${vSai >= 0 ? '+' : ''}${vSai}% vs mês ant.`,
      badgeCor: vSai === null ? 'bg-gray-500/10 text-gray-500' : vSai <= 0 ? 'bg-emerald-500/10 text-[#2f9e5b]' : 'bg-red-500/10 text-[#d64545]',
    },
    {
      titulo: positivo ? 'Lucro do mês' : 'Prejuízo do mês',
      valor: brl(r.lucro),
      cor: positivo ? 'text-[#2f9e5b]' : 'text-[#d64545]',
      sub: r.margem === null ? 'sem entradas no mês' : `margem de ${Math.round(r.margem)}%`,
      badge: positivo ? (r.lucro > 0 ? 'lucro' : 'empate') : 'prejuízo',
      badgeCor: positivo ? 'bg-emerald-500/10 text-[#2f9e5b]' : 'bg-red-500/10 text-[#d64545]',
    },
    {
      titulo: 'Saldo em caixa',
      valor: brl(r.saldoCaixa),
      cor: r.saldoCaixa < 0 ? 'text-[#d64545]' : 'text-[#c8672b]',
      sub: r.temSaldoInicial ? 'até o fim do mês' : 'sem saldo inicial lançado',
      badge: r.saldoCaixa < 0 ? 'negativo' : 'disponível',
      badgeCor: r.saldoCaixa < 0 ? 'bg-red-500/10 text-[#d64545]' : 'bg-amber-500/10 text-[#c8672b]',
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.titulo} className={`border rounded-xl px-5 py-5 shadow-xs ${t.card}`}>
          <span className={`text-[11px] font-mono tracking-widest uppercase block ${t.textoSuave}`}>{c.titulo}</span>
          <h3 className={`text-2xl 2xl:text-3xl font-black font-mono tracking-tight mt-2 mb-2 ${c.cor}`}>{c.valor}</h3>
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-mono ${t.textoSuave}`}>{c.sub}</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded whitespace-nowrap ${c.badgeCor}`}>{c.badge}</span>
          </div>
        </div>
      ))}
    </section>
  );
}

function Ranking({ t, titulo, itens, total, cor, vazio }) {
  const maior = itens[0]?.valor || 1;
  return (
    <section className={`border rounded-xl shadow-xs p-6 ${t.card}`}>
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className={`text-sm font-bold ${t.textoForte}`}>{titulo}</h2>
        {total > 0 && <span className={`text-[11px] font-mono ${t.textoSuave}`}>{brl(total)}</span>}
      </div>
      {itens.length === 0 ? (
        <p className={`text-xs py-4 ${t.textoSuave}`}>{vazio}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {itens.slice(0, 6).map((it) => (
            <li key={it.nome}>
              <div className="flex items-baseline justify-between gap-3">
                <span className={`text-sm truncate ${t.textoForte}`}>
                  {it.nome}
                  {total > 0 && <span className={`ml-1.5 text-[11px] font-mono ${t.textoFraco}`}>{Math.round((it.valor / total) * 100)}%</span>}
                </span>
                <span className={`text-sm font-mono font-bold whitespace-nowrap ${t.textoForte}`}>{brl(it.valor)}</span>
              </div>
              {it.extra && <span className={`block text-[11px] font-mono ${t.textoSuave}`}>{it.extra}</span>}
              <div className="mt-1.5 h-1.5 rounded-full bg-gray-500/15 overflow-hidden">
                <div className={`h-full rounded-full ${cor}`} style={{ width: `${Math.max(3, (it.valor / maior) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
