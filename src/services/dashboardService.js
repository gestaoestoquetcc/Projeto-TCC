import { supabase } from '../utils/SupaBase';
import { getPecas, calcularStatus } from './pecasService';

const DIA_MS = 24 * 60 * 60 * 1000;
const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Busca as movimentações a partir de uma data (apenas os campos necessários para os cálculos)
 */
async function getMovimentosDesde(desde) {
  const { data, error } = await supabase
    .from('movimentacoes')
    .select('peca_id, tipo_movimento, quantidade, data_hora')
    .gte('data_hora', desde.toISOString());

  if (error) {
    console.error('Erro ao buscar movimentações para a dashboard:', error);
    throw error;
  }

  return data || [];
}

/**
 * Carrega peças + movimentações dos últimos 6 meses e monta todos os indicadores da dashboard.
 * Retorna null quando não há peças cadastradas.
 */
export async function getDashboardData() {
  const hoje = new Date();
  const inicioSerie = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
  const inicioComparativo = new Date(hoje.getTime() - 60 * DIA_MS);
  const desde = inicioSerie < inicioComparativo ? inicioSerie : inicioComparativo;

  const [pecas, movimentos] = await Promise.all([getPecas(), getMovimentosDesde(desde)]);
  if (!pecas.length) return null;

  return montarDashboard(pecas, movimentos, hoje);
}

function montarDashboard(pecas, movimentos, hoje) {
  const agora = hoje.getTime();
  const limite30 = agora - 30 * DIA_MS;
  const limite60 = agora - 60 * DIA_MS;

  // Estatísticas por peça (janela atual = últimos 30 dias, anterior = 30 a 60 dias atrás)
  const stats = new Map(
    pecas.map((p) => [p.id, { saidas30: 0, entradas30: 0, saidasAnt30: 0 }])
  );

  movimentos.forEach((m) => {
    const s = stats.get(m.peca_id);
    if (!s) return;
    const t = new Date(m.data_hora).getTime();
    const qtd = Number(m.quantidade) || 0;
    if (t >= limite30) {
      if (m.tipo_movimento === 'saida') s.saidas30 += qtd;
      else s.entradas30 += qtd;
    } else if (t >= limite60 && m.tipo_movimento === 'saida') {
      s.saidasAnt30 += qtd;
    }
  });

  const itens = pecas.map((p) => {
    const s = stats.get(p.id);
    // Reconstrói o estoque de 30 dias atrás a partir das movimentações do período
    const qtdAnterior = Math.max(0, p.quantidade - s.entradas30 + s.saidas30);
    const estoqueMedio = Math.max(1, (p.quantidade + qtdAnterior) / 2);
    return {
      ...p,
      ...s,
      qtdAnterior,
      giroAtual: s.saidas30 / estoqueMedio,
      giroAnterior: s.saidasAnt30 / Math.max(1, qtdAnterior),
      statusAnterior: calcularStatus(qtdAnterior, p.pontoReposicao),
    };
  });

  return {
    kpis: calcularKpis(itens),
    alertas: gerarAlertas(itens),
    serie: montarSerie(pecas, movimentos, hoje),
    criticos: listarCriticos(itens),
    maiorGiro: listarMaiorGiro(itens),
  };
}

function calcularKpis(itens) {
  const soma = (fn) => itens.reduce((acc, i) => acc + fn(i), 0);
  const conta = (fn) => itens.filter(fn).length;

  const volume = soma((i) => i.quantidade);
  const volumeAnterior = soma((i) => i.qtdAnterior);
  const giroMedio = soma((i) => i.giroAtual) / itens.length;
  const giroAnterior = soma((i) => i.giroAnterior) / itens.length;
  const rupturas = conta((i) => i.status === 'critico');
  const rupturasAnt = conta((i) => i.statusAnterior === 'critico');
  const atencao = conta((i) => i.status === 'atencao');
  const atencaoAnt = conta((i) => i.statusAnterior === 'atencao');

  return {
    volume: {
      valor: volume,
      delta: volumeAnterior > 0 ? ((volume - volumeAnterior) / volumeAnterior) * 100 : 0,
    },
    giroMedio: { valor: giroMedio, delta: giroMedio - giroAnterior },
    rupturas: { valor: rupturas, delta: rupturas - rupturasAnt },
    atencao: { valor: atencao, delta: atencao - atencaoAnt },
  };
}

// Heurística de confiança: cresce com o volume de movimentações observadas da peça
function confianca(item, base) {
  const amostras = item.saidas30 + item.saidasAnt30;
  return Math.min(98, Math.round(base + Math.min(amostras, 30) * 0.6));
}

/**
 * Alertas preditivos gerados a partir do consumo recente:
 *  - ruptura: peça crítica com menor cobertura
 *  - atenção: peça com maior aceleração de demanda
 *  - previsão: peça de maior giro, com janela de compra preventiva
 */
function gerarAlertas(itens) {
  const alertas = [];
  const usados = new Set();

  const consumoDiario = (i) => i.saidas30 / 30;

  const ruptura = itens
    .filter((i) => i.status === 'critico')
    .sort((a, b) => a.quantidade / Math.max(1, a.pontoReposicao) - b.quantidade / Math.max(1, b.pontoReposicao))[0];

  if (ruptura) {
    usados.add(ruptura.id);
    const consumo = consumoDiario(ruptura);
    const dias = consumo > 0 ? Math.floor(ruptura.quantidade / consumo) : null;
    alertas.push({
      id: `ruptura-${ruptura.id}`,
      tipo: 'ruptura',
      codigo: ruptura.codigo,
      titulo: ruptura.nome,
      descricao:
        ruptura.quantidade === 0
          ? `Estoque zerado — ruptura em andamento (ponto de reposição: ${ruptura.pontoReposicao}).`
          : dias !== null
          ? `Apenas ${ruptura.quantidade} unidades. Risco de desabastecimento em ${dias} ${dias === 1 ? 'dia' : 'dias'} com demanda atual.`
          : `Apenas ${ruptura.quantidade} unidades — abaixo do ponto de reposição (${ruptura.pontoReposicao}).`,
      confianca: confianca(ruptura, 82),
    });
  }

  const atencao = itens
    .filter((i) => !usados.has(i.id) && i.saidasAnt30 > 0 && i.saidas30 > i.saidasAnt30)
    .map((i) => ({ ...i, alta: ((i.saidas30 - i.saidasAnt30) / i.saidasAnt30) * 100 }))
    .sort((a, b) => b.alta - a.alta)[0]
    || itens.find((i) => !usados.has(i.id) && i.status === 'atencao');

  if (atencao) {
    usados.add(atencao.id);
    alertas.push({
      id: `atencao-${atencao.id}`,
      tipo: 'atencao',
      codigo: atencao.codigo,
      titulo: atencao.nome,
      descricao: atencao.alta
        ? `Alta de ${Math.round(atencao.alta)}% na demanda dos últimos 30 dias. Recomenda reforço.`
        : `Estoque de ${atencao.quantidade} un. próximo do ponto de reposição (${atencao.pontoReposicao}).`,
      confianca: confianca(atencao, 74),
    });
  }

  const previsao = itens
    .filter((i) => !usados.has(i.id) && i.saidas30 > 0)
    .sort((a, b) => b.giroAtual - a.giroAtual)[0];

  if (previsao) {
    const consumo = consumoDiario(previsao);
    const janela = Math.max(0, Math.floor((previsao.quantidade - previsao.pontoReposicao) / consumo));
    alertas.push({
      id: `previsao-${previsao.id}`,
      tipo: 'previsao',
      codigo: previsao.codigo,
      titulo: previsao.nome,
      descricao: `Consumo projetado de ${Math.round(consumo * 30)} un. nos próximos 30 dias. Janela de compra preventiva em ${janela} ${janela === 1 ? 'dia' : 'dias'}.`,
      confianca: confianca(previsao, 78),
    });
  }

  return alertas;
}

function montarSerie(pecas, movimentos, hoje) {
  const segmentoPorPeca = new Map(pecas.map((p) => [p.id, p.segmento]));
  const meses = [];
  const chaves = [];

  for (let k = 5; k >= 0; k -= 1) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - k, 1);
    meses.push(MESES_CURTOS[d.getMonth()]);
    chaves.push(`${d.getFullYear()}-${d.getMonth()}`);
  }

  const serie = {
    meses,
    combustao: Array(6).fill(0),
    eletrico: Array(6).fill(0),
    moto: Array(6).fill(0),
  };

  movimentos.forEach((m) => {
    if (m.tipo_movimento !== 'saida') return;
    const d = new Date(m.data_hora);
    const idx = chaves.indexOf(`${d.getFullYear()}-${d.getMonth()}`);
    const segmento = segmentoPorPeca.get(m.peca_id);
    if (idx === -1 || !segmento) return;
    serie[segmento][idx] += Number(m.quantidade) || 0;
  });

  return serie;
}

function listarCriticos(itens) {
  return itens
    .filter((i) => i.status !== 'normal')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'critico' ? -1 : 1;
      return a.quantidade / Math.max(1, a.pontoReposicao) - b.quantidade / Math.max(1, b.pontoReposicao);
    })
    .slice(0, 4)
    .map(({ id, nome, codigo, quantidade, pontoReposicao, status }) => ({
      id, nome, codigo, quantidade, pontoReposicao, status,
    }));
}

function listarMaiorGiro(itens) {
  return itens
    .filter((i) => i.giroAtual > 0)
    .sort((a, b) => b.giroAtual - a.giroAtual)
    .slice(0, 4)
    .map((i) => ({ id: i.id, nome: i.nome, giro: i.giroAtual }));
}
