import { supabase } from '../utils/SupaBase';

/**
 * PREVISÃO DE DEMANDA
 * --------------------------------------------------------------
 * Tudo aqui é cálculo feito no próprio sistema (sem custo, sem API).
 * Usamos o histórico de SAÍDAS de cada peça para estimar quanto vai
 * sair nos próximos dias e quando o estoque acaba.
 *
 * Técnica usada (fácil de explicar na banca):
 *  1. Média móvel ponderada: os dias mais recentes "pesam" mais.
 *  2. Tendência por regressão linear: vemos se a venda está subindo ou caindo.
 *  3. Estoque de segurança: uma margem para a variação da demanda.
 */

const DIA = 86400000;
export const DIAS_HISTORICO = 90; // quantos dias de histórico analisamos
export const DIAS_PREVISAO = 30; // horizonte padrão (dias à frente)
export const HORIZONTES = [15, 30, 60]; // opções que a tela oferece

// Data de hoje à meia-noite
function hojeZerado() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Monta um vetor com as saídas de cada dia (posição 0 = dia mais antigo)
function saidasPorDia(movimentacoes, pecaId, dias) {
  const inicio = hojeZerado().getTime() - (dias - 1) * DIA;
  const serie = new Array(dias).fill(0);
  movimentacoes.forEach((m) => {
    if (m.tipo !== 'saida' || m.pecaId !== pecaId || !m.dataHora) return;
    const i = Math.floor((new Date(m.dataHora).getTime() - inicio) / DIA);
    if (i >= 0 && i < dias) serie[i] += Number(m.quantidade || 0);
  });
  return serie;
}

// Regressão linear simples: devolve a inclinação (quanto muda por dia)
function inclinacao(valores) {
  const n = valores.length;
  if (n < 2) return 0;
  const mediaX = (n - 1) / 2;
  const mediaY = valores.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  valores.forEach((y, x) => {
    num += (x - mediaX) * (y - mediaY);
    den += (x - mediaX) ** 2;
  });
  return den === 0 ? 0 : num / den;
}

// Média em que o dia mais recente tem o maior peso
function mediaPonderada(valores) {
  let soma = 0;
  let pesos = 0;
  valores.forEach((v, i) => {
    const peso = i + 1;
    soma += v * peso;
    pesos += peso;
  });
  return pesos === 0 ? 0 : soma / pesos;
}

function desvioPadrao(valores) {
  const media = valores.reduce((a, b) => a + b, 0) / (valores.length || 1);
  const variancia = valores.reduce((a, v) => a + (v - media) ** 2, 0) / (valores.length || 1);
  return Math.sqrt(variancia);
}

/**
 * Calcula a previsão de UMA peça
 */
export function preverPeca(peca, movimentacoes, dias = DIAS_PREVISAO) {
  const historico = saidasPorDia(movimentacoes, peca.id, DIAS_HISTORICO);
  const ultimos30 = historico.slice(-30);
  const totalHistorico = historico.reduce((a, b) => a + b, 0);
  const diasComSaida = historico.filter((v) => v > 0).length;

  // 1) Demanda diária base (média ponderada dos últimos 30 dias)
  const base = mediaPonderada(ultimos30);

  // 2) Tendência: quanto a demanda diária muda por dia (limitada para não exagerar)
  const tendenciaDia = inclinacao(historico);
  const ajuste = Math.max(-0.5, Math.min(0.5, base > 0 ? (tendenciaDia * dias) / 2 / base : 0));
  const demandaDia = Math.max(0, base * (1 + ajuste));

  // 3) Demanda prevista para os próximos 30 dias
  const demandaPrevista = Math.round(demandaDia * dias);

  // 4) Quando acaba o estoque
  const diasAteRuptura = demandaDia > 0 ? Math.floor(peca.quantidade / demandaDia) : null;
  const dataRuptura = diasAteRuptura !== null ? new Date(hojeZerado().getTime() + diasAteRuptura * DIA) : null;

  // 5) Estoque de segurança (cobre a variação da demanda por ~7 dias)
  const seguranca = Math.ceil(desvioPadrao(ultimos30) * Math.sqrt(7) * 1.65);

  // 6) Sugestão de compra: cobrir 30 dias + segurança, respeitando o mínimo cadastrado
  const alvo = Math.max(demandaPrevista + seguranca, peca.pontoReposicao);
  const compraSugerida = Math.max(0, Math.ceil(alvo - peca.quantidade));

  // 7) Confiança: mais dias com venda e menos variação = previsão mais confiável
  const cobertura = Math.min(1, diasComSaida / 20);
  const media30 = ultimos30.reduce((a, b) => a + b, 0) / 30;
  const variacao = media30 > 0 ? Math.min(1, desvioPadrao(ultimos30) / media30 / 3) : 1;
  const confianca = totalHistorico === 0 ? 0 : Math.round((0.4 + 0.6 * cobertura) * (1 - 0.5 * variacao) * 100);

  // 8) Nível de risco para ordenar e colorir
  let risco = 'baixo';
  if (peca.quantidade <= peca.pontoReposicao || (diasAteRuptura !== null && diasAteRuptura <= 7)) risco = 'alto';
  else if (diasAteRuptura !== null && diasAteRuptura <= 20) risco = 'medio';

  const tendencia = ajuste > 0.08 ? 'subindo' : ajuste < -0.08 ? 'caindo' : 'estavel';

  return {
    ...peca,
    demandaDia,
    demandaPrevista,
    diasAteRuptura,
    dataRuptura,
    compraSugerida,
    confianca,
    risco,
    tendencia,
    variacaoPercentual: Math.round(ajuste * 100),
    totalHistorico,
  };
}

/**
 * Calcula a previsão de TODAS as peças, ordenadas da mais urgente para a menos
 */
export function preverTodas(pecas, movimentacoes, dias = DIAS_PREVISAO) {
  const ordemRisco = { alto: 0, medio: 1, baixo: 2 };
  return pecas
    .map((p) => preverPeca(p, movimentacoes, dias))
    .sort((a, b) => {
      if (ordemRisco[a.risco] !== ordemRisco[b.risco]) return ordemRisco[a.risco] - ordemRisco[b.risco];
      return (a.diasAteRuptura ?? 9999) - (b.diasAteRuptura ?? 9999);
    });
}

/**
 * Série semanal para o gráfico: 8 semanas de histórico + 4 semanas previstas
 */
export function serieSemanal(pecas, movimentacoes, previsoes, dias = DIAS_PREVISAO) {
  const semanasHistorico = 8;
  const semanasPrevisao = Math.max(2, Math.ceil(dias / 7));
  const hoje = hojeZerado().getTime();
  const pecasIds = new Set(pecas.map((p) => p.id));

  const historico = new Array(semanasHistorico).fill(0);
  const inicio = hoje - (semanasHistorico * 7 - 1) * DIA;
  movimentacoes.forEach((m) => {
    if (m.tipo !== 'saida' || !pecasIds.has(m.pecaId) || !m.dataHora) return;
    const i = Math.floor((new Date(m.dataHora).getTime() - inicio) / DIA / 7);
    if (i >= 0 && i < semanasHistorico) historico[i] += Number(m.quantidade || 0);
  });

  const demandaSemana = previsoes.reduce((soma, p) => soma + p.demandaDia * 7, 0);
  const previsto = new Array(semanasPrevisao).fill(Math.round(demandaSemana * 10) / 10); // 1 casa decimal: mostra até demandas pequenas

  const rotulos = [];
  for (let i = -semanasHistorico + 1; i <= semanasPrevisao; i++) {
    const d = new Date(hoje + i * 7 * DIA);
    rotulos.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
  }

  const totalHistorico = historico.reduce((a, b) => a + b, 0);
  return {
    historico,
    previsto,
    rotulos,
    totalHistorico,
    mediaSemanal: Math.round((totalHistorico / semanasHistorico) * 10) / 10,
    totalPrevisto: Math.round(demandaSemana * semanasPrevisao * 10) / 10,
  };
}

/**
 * Monta um resumo pequeno para mandar à IA (só o necessário, sem dados sensíveis)
 */
export function montarResumoParaIA(previsoes) {
  return previsoes.slice(0, 15).map((p) => ({
    sku: p.codigo,
    nome: p.nome,
    segmento: p.segmento,
    estoque_atual: p.quantidade,
    estoque_minimo: p.pontoReposicao,
    demanda_prevista_30d: p.demandaPrevista,
    dias_ate_ruptura: p.diasAteRuptura,
    tendencia: p.tendencia,
    variacao_percentual: p.variacaoPercentual,
    compra_sugerida: p.compraSugerida,
    confianca_percentual: p.confianca,
  }));
}

/**
 * Plano B: monta a análise aqui mesmo, usando os números da previsão.
 * Devolve os dados ORGANIZADOS (não só texto), para a tela mostrar em cards.
 */
export function gerarAnaliseLocal(previsoes, dias = DIAS_PREVISAO) {
  // 1) Prioridade de compra: risco alto/médio com compra sugerida (até 3)
  const urgentes = previsoes
    .filter((p) => p.compraSugerida > 0 && p.risco !== 'baixo')
    .slice(0, 3)
    .map((p) => {
      let motivo;
      let tipoMotivo;
      if (p.quantidade <= p.pontoReposicao) {
        motivo = p.quantidade === 0 ? 'Sem estoque' : 'Abaixo do mínimo';
        tipoMotivo = 'critico';
      } else if (p.diasAteRuptura !== null) {
        motivo = `Acaba em ~${p.diasAteRuptura} ${p.diasAteRuptura === 1 ? 'dia' : 'dias'}`;
        tipoMotivo = 'prazo';
      } else {
        motivo = 'Perto do mínimo';
        tipoMotivo = 'prazo';
      }
      return {
        id: p.id,
        nome: p.nome,
        codigo: p.codigo,
        compra: p.compraSugerida,
        quantidade: p.quantidade,
        minimo: p.pontoReposicao,
        risco: p.risco,
        motivo,
        tipoMotivo,
      };
    });

  // 2) Peças com demanda subindo (até 4)
  const emAlta = previsoes
    .filter((p) => p.tendencia === 'subindo')
    .sort((a, b) => b.variacaoPercentual - a.variacaoPercentual)
    .slice(0, 4)
    .map((p) => ({ id: p.id, nome: p.nome, codigo: p.codigo, variacao: p.variacaoPercentual }));

  // 3) Recomendação geral
  const altos = previsoes.filter((p) => p.risco === 'alto').length;
  const totalCompra = previsoes.reduce((s, p) => s + p.compraSugerida, 0);
  const semHistorico = previsoes.filter((p) => p.totalHistorico === 0).length;

  let recomendacao;
  if (previsoes.length === 0) {
    recomendacao = 'Nenhuma peça cadastrada para analisar.';
  } else if (altos > 0) {
    recomendacao = `Priorize ${altos === 1 ? 'a peça' : `as ${altos} peças`} de risco alto esta semana. No total, compre ${totalCompra} ${totalCompra === 1 ? 'unidade' : 'unidades'} para cobrir os próximos ${dias} dias.`;
  } else if (totalCompra > 0) {
    recomendacao = `Sem urgências. Planeje a compra de ${totalCompra} unidades para os próximos ${dias} dias.`;
  } else {
    recomendacao = 'Estoque saudável. Continue acompanhando as saídas semanalmente.';
  }

  const observacao =
    semHistorico > 0
      ? `${semHistorico} ${semHistorico === 1 ? 'peça não tem' : 'peças não têm'} saídas recentes. A previsão delas é menos confiável.`
      : null;

  return { urgentes, emAlta, recomendacao, observacao, totalCompra, altos };
}

/**
 * Pede a análise.
 * 1º tenta a IA externa (Edge Function "analise-ia" do Supabase, que guarda a chave em segredo).
 * Se ela não estiver configurada ou der erro, usa o plano B (gerarAnaliseLocal).
 *
 * Devolve: { origem: 'ia' | 'local', texto?, dados?, geradoEm }
 */
export async function pedirAnaliseIA(previsoes, dias = DIAS_PREVISAO) {
  try {
    const { data, error } = await supabase.functions.invoke('analise-ia', {
      body: { pecas: montarResumoParaIA(previsoes) },
    });

    if (error || !data?.analise) {
      throw error || new Error(data?.erro || 'Resposta vazia da IA');
    }

    return { origem: 'ia', texto: data.analise, dados: gerarAnaliseLocal(previsoes, dias), geradoEm: new Date() };
  } catch (err) {
    console.warn('IA externa indisponível, usando análise automática:', err);
    return { origem: 'local', dados: gerarAnaliseLocal(previsoes, dias), geradoEm: new Date() };
  }
}
