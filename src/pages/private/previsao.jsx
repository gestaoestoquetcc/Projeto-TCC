import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiRefreshCw,
  FiLoader,
  FiAlertCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiShoppingCart,
  FiInfo,
} from 'react-icons/fi';

import Sidebar from '@components/layout/Sidebar';
import PainelAnalise from '@components/previsao/PainelAnalise';
import { getPecas } from '../../services/pecasService';
import { getMovimentacoes } from '../../services/movimentacoesService';
import {
  preverTodas,
  serieSemanal,
  pedirAnaliseIA,
  gerarAnaliseLocal,
  DIAS_HISTORICO,
  DIAS_PREVISAO,
  HORIZONTES,
} from '../../services/previsaoService';

// Cores do tema claro / escuro
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
    linha: 'hover:bg-[#fcfbf9]',
    divisor: 'divide-[#ece7dd] border-[#ece7dd]',
    grade: '#ece8e1',
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
    linha: 'hover:bg-[#1e2430]',
    divisor: 'divide-[#262c38] border-[#262c38]',
    grade: '#262c38',
  },
};

const RISCOS = {
  alto: { texto: 'Alto', classe: 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]' },
  medio: { texto: 'Médio', classe: 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]' },
  baixo: { texto: 'Baixo', classe: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]' },
};

export default function PrevisaoPage() {
  const navigate = useNavigate();
  const [pecas, setPecas] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [filtroRisco, setFiltroRisco] = useState('todos');
  const [horizonte, setHorizonte] = useState(DIAS_PREVISAO); // 15, 30 ou 60 dias
  const [atualizadoEm, setAtualizadoEm] = useState(null);

  // Estado da análise da IA
  const [analise, setAnalise] = useState(null); // { origem, dados, texto?, geradoEm }
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [erroIA, setErroIA] = useState('');

  const t = isDark ? TEMAS.escuro : TEMAS.claro;

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
        setAtualizadoEm(new Date());
        setErro('');
      })
      .catch((err) => {
        console.error(err);
        if (ativo) setErro('Não foi possível carregar os dados do Supabase. Verifique sua conexão ou o arquivo .env.');
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

  // Cálculo da previsão (roda de novo sempre que os dados mudam)
  const previsoes = useMemo(() => preverTodas(pecas, movimentacoes, horizonte), [pecas, movimentacoes, horizonte]);
  const serie = useMemo(
    () => serieSemanal(pecas, movimentacoes, previsoes, horizonte),
    [pecas, movimentacoes, previsoes, horizonte]
  );

  // A análise automática aparece sozinha; a da IA externa só quando o usuário pede
  const analiseExibida = useMemo(() => {
    if (analise) return analise;
    if (!atualizadoEm || previsoes.length === 0) return null;
    return { origem: 'local', dados: gerarAnaliseLocal(previsoes, horizonte), geradoEm: atualizadoEm };
  }, [analise, atualizadoEm, previsoes, horizonte]);

  // Trocar o horizonte invalida a análise da IA (ela foi feita para outro período)
  const trocarHorizonte = (dias) => {
    setHorizonte(dias);
    setAnalise(null);
  };

  const resumo = useMemo(() => {
    const comHistorico = previsoes.filter((p) => p.totalHistorico > 0);
    return {
      demandaTotal: previsoes.reduce((s, p) => s + p.demandaPrevista, 0),
      emRisco: previsoes.filter((p) => p.risco === 'alto').length,
      compraTotal: previsoes.reduce((s, p) => s + p.compraSugerida, 0),
      confiancaMedia: comHistorico.length
        ? Math.round(comHistorico.reduce((s, p) => s + p.confianca, 0) / comHistorico.length)
        : 0,
    };
  }, [previsoes]);

  const lista = filtroRisco === 'todos' ? previsoes : previsoes.filter((p) => p.risco === filtroRisco);

  const handlePedirAnalise = async () => {
    try {
      setCarregandoIA(true);
      setErroIA('');
      const resultado = await pedirAnaliseIA(previsoes, horizonte);
      setAnalise(resultado);
    } catch (err) {
      setErroIA(err.message);
    } finally {
      setCarregandoIA(false);
    }
  };

  return (
    <div className={`flex min-h-screen ${t.pagina}`}>
      <Sidebar activeTab="previsao" isDark={isDark} onToggleDark={() => setIsDark((prev) => !prev)} />

      <main className="flex-1 min-w-0 flex flex-col px-4 sm:px-8 py-8 overflow-y-auto">
        {/* Cabeçalho */}
        <header className="mb-8">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a89e90] block mb-1">Inteligência</span>
          <div className="flex items-center justify-between gap-4">
            <h1 className={`text-3xl font-black tracking-tight uppercase ${t.titulo}`}>Previsão de Demanda</h1>
            <div className="flex items-center gap-3">
            {/* Horizonte da previsão */}
            <div className={`inline-flex items-center p-1 gap-0.5 border rounded-lg ${t.abas}`} title="Para quantos dias à frente prever">
              <span className={`px-2 text-[10px] font-mono uppercase tracking-wider ${t.textoFraco}`}>Prever</span>
              {HORIZONTES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => trocarHorizonte(d)}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors ${
                    horizonte === d ? 'bg-[#c8672b] text-white shadow-xs' : t.abaInativa
                  }`}
                >
                  {d} dias
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={carregarDados}
              disabled={loading}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold p-2 rounded-lg hover:bg-black/5 disabled:opacity-50 ${t.textoSuave}`}
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            </div>
          </div>
          <p className={`text-xs mt-2 flex items-center gap-1.5 ${t.textoSuave}`}>
            <FiInfo className="w-3.5 h-3.5" />
            Baseado nos últimos {DIAS_HISTORICO} dias de saídas · previsão para os próximos {horizonte} dias
          </p>
        </header>

        {erro && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {loading && pecas.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-24 border rounded-xl ${t.card}`}>
            <FiLoader className="w-8 h-8 text-amber-600 animate-spin mb-3" />
            <span className={`text-sm font-semibold ${t.textoSuave}`}>Calculando previsões...</span>
          </div>
        ) : (
          <>
            {/* Cards de resumo */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <Card t={t} rotulo="Demanda prevista" valor={resumo.demandaTotal} sufixo={`un. / ${horizonte} dias`} cor={t.textoForte} />
              <Card t={t} rotulo="Peças em risco" valor={resumo.emRisco} sufixo="risco alto" cor="text-[#d64545]" />
              <Card t={t} rotulo="Compra sugerida" valor={resumo.compraTotal} sufixo="unidades" cor="text-[#1e6fbe]" />
              <Card
                t={t}
                rotulo="Confiança média"
                valor={`${resumo.confiancaMedia}%`}
                sufixo={nivelConfianca(resumo.confiancaMedia).texto}
                cor={nivelConfianca(resumo.confiancaMedia).cor}
              />
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6 items-start">
              {/* Gráfico histórico x previsão */}
              <section className={`xl:col-span-7 border rounded-xl p-6 shadow-xs flex flex-col ${t.card}`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <span className={`text-[11px] font-mono tracking-widest uppercase block ${t.textoSuave}`}>Saídas por semana</span>
                    <h2 className={`text-lg font-semibold mt-1 ${t.textoForte}`}>Histórico × Previsão</h2>
                  </div>
                  <div className="flex gap-4 text-xs font-mono">
                    <span className={`inline-flex items-center gap-1.5 ${t.textoForte}`}>
                      <span className="w-3 h-0.5 bg-[#c8672b]" /> Real
                    </span>
                    <span className={`inline-flex items-center gap-1.5 ${t.textoForte}`}>
                      <span className="w-3 border-t-2 border-dashed border-[#1e6fbe]" /> Previsto
                    </span>
                  </div>
                </div>
                <GraficoPrevisao t={t} serie={serie} />

                {/* Aviso quando há poucos dados */}
                {serie.totalHistorico < 10 && (
                  <div className="mt-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] text-xs flex gap-2">
                    <FiInfo className="w-4 h-4 text-[#c9900c] shrink-0" />
                    <span className={t.textoSuave}>
                      <strong className="text-[#b36d1b]">Poucos dados para prever com precisão.</strong> Só{' '}
                      {serie.totalHistorico} {serie.totalHistorico === 1 ? 'unidade saiu' : 'unidades saíram'} nas últimas 8 semanas.
                      Quanto mais saídas forem registradas em Entrada/Saída, melhor fica a previsão.
                    </span>
                  </div>
                )}

                {/* Resumo embaixo do gráfico */}
                <div className={`mt-4 pt-4 grid grid-cols-3 gap-3 border-t ${t.divisor}`}>
                  <MiniStat t={t} rotulo="Saídas (8 sem.)" valor={serie.totalHistorico} sufixo="un." />
                  <MiniStat t={t} rotulo="Média semanal" valor={serie.mediaSemanal.toLocaleString('pt-BR')} sufixo="un./sem." />
                  <MiniStat
                    t={t}
                    rotulo={`Previsto (${horizonte} dias)`}
                    valor={resumo.demandaTotal}
                    sufixo="un."
                    cor="text-[#1e6fbe]"
                  />
                </div>
              </section>

              {/* Painel da IA */}
              <div className="xl:col-span-5 flex flex-col">
                <PainelAnalise
                  t={t}
                  analise={analiseExibida}
                  carregando={carregandoIA}
                  erro={erroIA}
                  onGerar={handlePedirAnalise}
                  desabilitado={previsoes.length === 0}
                  onComprar={() => navigate('/movimentacao')}
                />
              </div>
            </div>

            {/* Tabela de previsão por peça */}
            <section className={`border rounded-xl p-6 shadow-xs ${t.card}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <span className={`text-[11px] font-mono tracking-widest uppercase ${t.textoSuave}`}>Previsão por peça</span>
                <div className={`inline-flex p-0.5 gap-0.5 border rounded-md ${t.abas}`}>
                  {[
                    ['todos', 'Todas'],
                    ['alto', 'Risco alto'],
                    ['medio', 'Médio'],
                    ['baixo', 'Baixo'],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setFiltroRisco(id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                        filtroRisco === id ? 'bg-[#c8672b] text-white' : t.abaInativa
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[760px]">
                  <thead>
                    <tr className={`text-left text-[10px] font-mono uppercase tracking-wider border-b ${t.divisor} ${t.textoSuave}`}>
                      <th className="py-2 pr-3">Peça</th>
                      <th className="py-2 px-3 text-right">Estoque</th>
                      <th className="py-2 px-3 text-right">Previsto {horizonte}d</th>
                      <th className="py-2 px-3">Tendência</th>
                      <th className="py-2 px-3">Acaba em</th>
                      <th className="py-2 px-3">Risco</th>
                      <th className="py-2 px-3 text-right">Comprar</th>
                      <th className="py-2 px-3 text-right">Confiança</th>
                      <th className="py-2 pl-3" />
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${t.divisor}`}>
                    {lista.length === 0 && (
                      <tr>
                        <td colSpan={9} className={`py-10 text-center text-xs ${t.textoFraco}`}>
                          Nenhuma peça neste filtro.
                        </td>
                      </tr>
                    )}
                    {lista.map((p) => (
                      <tr key={p.id} className={t.linha}>
                        <td className="py-3 pr-3">
                          <span className="font-mono text-xs font-bold text-[#b85824] block">{p.codigo}</span>
                          <span className={`text-sm ${t.textoForte}`}>{p.nome}</span>
                        </td>
                        <td className={`py-3 px-3 text-right font-mono ${t.textoForte}`}>{p.quantidade}</td>
                        <td className={`py-3 px-3 text-right font-mono ${t.textoForte}`}>{p.demandaPrevista}</td>
                        <td className="py-3 px-3">
                          <Tendencia valor={p.tendencia} percentual={p.variacaoPercentual} t={t} />
                        </td>
                        <td className={`py-3 px-3 font-mono text-xs ${t.textoSuave}`}>
                          {p.diasAteRuptura === null
                            ? 'sem saídas'
                            : p.diasAteRuptura === 0
                            ? 'hoje'
                            : `${p.diasAteRuptura} dias`}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${RISCOS[p.risco].classe}`}>
                            {RISCOS[p.risco].texto}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#1e6fbe]">
                          {p.compraSugerida > 0 ? `+${p.compraSugerida}` : '–'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <BarraConfianca valor={p.confianca} t={t} />
                        </td>
                        <td className="py-3 pl-3 text-right">
                          {p.compraSugerida > 0 && (
                            <button
                              type="button"
                              onClick={() => navigate('/movimentacao')}
                              title="Ir para Entrada/Saída"
                              className="p-1.5 rounded-md text-[#1e6fbe] hover:bg-[#1e6fbe]/10"
                            >
                              <FiShoppingCart className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

// ---------- Componentes pequenos desta tela ----------

// Cor e texto da confiança (baixa = vermelho, média = amarelo, alta = verde)
function nivelConfianca(valor) {
  if (valor >= 70) return { cor: 'text-[#2f9e5b]', texto: 'confiança alta' };
  if (valor >= 40) return { cor: 'text-[#c9900c]', texto: 'confiança média' };
  return { cor: 'text-[#d64545]', texto: 'baixa · poucos dados' };
}

function MiniStat({ t, rotulo, valor, sufixo, cor }) {
  return (
    <div>
      <span className={`text-[10px] font-mono uppercase tracking-wider block ${t.textoFraco}`}>{rotulo}</span>
      <span className={`text-lg font-black font-mono ${cor || t.textoForte}`}>{valor}</span>
      <span className={`text-[11px] font-mono ml-1 ${t.textoFraco}`}>{sufixo}</span>
    </div>
  );
}

function Card({ t, rotulo, valor, sufixo, cor }) {
  return (
    <div className={`border rounded-xl px-5 py-5 shadow-xs ${t.card}`}>
      <span className={`text-[11px] font-mono tracking-widest uppercase block ${t.textoSuave}`}>{rotulo}</span>
      <h3 className={`text-3xl font-black mt-2 ${cor}`}>{valor}</h3>
      <span className={`text-xs font-mono ${t.textoSuave}`}>{sufixo}</span>
    </div>
  );
}

function Tendencia({ valor, percentual, t }) {
  if (valor === 'subindo')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-mono text-[#d64545]">
        <FiTrendingUp className="w-3.5 h-3.5" /> +{percentual}%
      </span>
    );
  if (valor === 'caindo')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-mono text-[#2f9e5b]">
        <FiTrendingDown className="w-3.5 h-3.5" /> {percentual}%
      </span>
    );
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono ${t.textoFraco}`}>
      <FiMinus className="w-3.5 h-3.5" /> estável
    </span>
  );
}

function BarraConfianca({ valor, t }) {
  const cor = valor >= 70 ? 'bg-[#2f9e5b]' : valor >= 40 ? 'bg-[#c9900c]' : 'bg-gray-400';
  return (
    <span className="inline-flex items-center gap-2 justify-end">
      <span className="w-12 h-1.5 rounded-full bg-gray-500/20 overflow-hidden">
        <span className={`block h-full ${cor}`} style={{ width: `${valor}%` }} />
      </span>
      <span className={`text-xs font-mono w-8 text-right ${t.textoSuave}`}>{valor}%</span>
    </span>
  );
}

// Escolhe um passo "redondo" para o eixo (1, 2, 5, 10, 20, 50...)
function passoRedondo(maior) {
  const bruto = Math.max(maior, 1) / 4;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  return [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= bruto);
}

// Gráfico de linhas: parte sólida = real, parte tracejada = previsão
function GraficoPrevisao({ t, serie }) {
  const L = 1000;
  const A = 260;
  const M = { topo: 16, direita: 12, baixo: 30, esquerda: 44 };
  const { historico, previsto, rotulos } = serie;
  const todos = [...historico, ...previsto];
  const passo = passoRedondo(Math.max(...todos));
  const maximo = passo * 4;
  const base = A - M.baixo;

  const x = (i) => M.esquerda + (i / (todos.length - 1)) * (L - M.esquerda - M.direita);
  const y = (v) => M.topo + (A - M.topo - M.baixo) * (1 - v / maximo);
  const fmt = (v) => (Number.isInteger(v) ? v : v.toLocaleString('pt-BR', { maximumFractionDigits: 2 }));

  const ultimoReal = historico.length - 1;
  const linhaReal = historico.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
  const areaReal = `${linhaReal} L ${x(ultimoReal)} ${base} L ${x(0)} ${base} Z`;
  const pontosPrev = [[ultimoReal, historico[ultimoReal]], ...previsto.map((v, i) => [ultimoReal + 1 + i, v])];
  const linhaPrevista = pontosPrev.map(([i, v], k) => `${k === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
  const areaPrevista = `${linhaPrevista} L ${x(todos.length - 1)} ${base} L ${x(ultimoReal)} ${base} Z`;

  return (
    <svg viewBox={`0 0 ${L} ${A}`} className="w-full h-auto block">
      <defs>
        <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8672b" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#c8672b" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gradPrev" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e6fbe" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#1e6fbe" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Faixa da previsão */}
      <rect x={x(ultimoReal)} y={M.topo} width={x(todos.length - 1) - x(ultimoReal)} height={base - M.topo} fill="#1e6fbe" opacity="0.04" />
      <line x1={x(ultimoReal)} x2={x(ultimoReal)} y1={M.topo} y2={base} stroke="#1e6fbe" strokeDasharray="2 4" opacity="0.5" />
      <text x={x(ultimoReal) - 6} y={M.topo + 12} textAnchor="end" fontSize="13" fontFamily="monospace" fill="#9a9a9a">
        hoje
      </text>
      <text x={x(ultimoReal) + 6} y={M.topo + 12} fontSize="13" fontFamily="monospace" fill="#1e6fbe">
        previsão →
      </text>

      {/* Grade e eixo Y */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <line x1={M.esquerda} x2={L - M.direita} y1={y(passo * i)} y2={y(passo * i)} stroke={t.grade} strokeDasharray="3 4" />
          <text x={M.esquerda - 8} y={y(passo * i) + 4} textAnchor="end" fontSize="13" fontFamily="monospace" fill="#9a9a9a">
            {fmt(passo * i)}
          </text>
        </g>
      ))}

      {/* Rótulos das semanas */}
      {rotulos.map((r, i) => (
        <text
          key={i}
          x={x(i)}
          y={A - 8}
          textAnchor={i === 0 ? 'start' : i === rotulos.length - 1 ? 'end' : 'middle'}
          fontSize="13"
          fontFamily="monospace"
          fill={i > ultimoReal ? '#1e6fbe' : '#9a9a9a'}
        >
          {r}
        </text>
      ))}

      {/* Áreas e linhas */}
      <path d={areaReal} fill="url(#gradReal)" />
      <path d={areaPrevista} fill="url(#gradPrev)" />
      <path d={linhaReal} fill="none" stroke="#c8672b" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <path d={linhaPrevista} fill="none" stroke="#1e6fbe" strokeWidth="2.5" strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />

      {/* Pontos com valor ao passar o mouse */}
      {historico.map((v, i) => (
        <circle key={`r${i}`} cx={x(i)} cy={y(v)} r="4" fill="#c8672b" stroke="white" strokeWidth="1.5">
          <title>{`Semana de ${rotulos[i]}: ${fmt(v)} un. (real)`}</title>
        </circle>
      ))}
      {previsto.map((v, i) => (
        <circle key={`p${i}`} cx={x(ultimoReal + 1 + i)} cy={y(v)} r="4" fill="#1e6fbe" stroke="white" strokeWidth="1.5">
          <title>{`Semana de ${rotulos[ultimoReal + 1 + i]}: ~${fmt(v)} un. (previsto)`}</title>
        </circle>
      ))}
    </svg>
  );
}
