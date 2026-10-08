import { supabase } from '../utils/SupaBase';

/**
 * FINANCEIRO (livro caixa)
 *
 * De onde vem cada número:
 *  - VENDAS: calculadas sozinhas pelas SAÍDAS de estoque (quantidade x preço de venda da peça).
 *  - Tabela "caixa": o resto do dinheiro que entra e sai (compras de peças, aluguel,
 *    salários, contas, impostos, outras receitas e o saldo inicial).
 *
 * Lucro do mês = (vendas + outras entradas) - (compras + despesas)
 * Saldo em caixa = tudo que entrou até o fim do mês - tudo que saiu até o fim do mês
 */

export const CATEGORIAS = {
  entrada: ['Saldo inicial', 'Venda avulsa', 'Serviço', 'Outras receitas'],
  saida: ['Compra de peças', 'Aluguel', 'Salários', 'Contas (luz, água, internet)', 'Impostos', 'Frete', 'Manutenção', 'Outras despesas'],
};

// Saídas grandes que acontecem poucas vezes no mês (não seguem o "ritmo do dia a dia" na previsão)
const DESPESAS_FIXAS = ['Aluguel', 'Salários', 'Contas (luz, água, internet)', 'Impostos', 'Compra de peças'];

function tratarErro(error, acao) {
  console.error(`Erro ao ${acao}:`, error);
  const msg = error?.message || '';
  if (error?.code === '42P01' || error?.code === 'PGRST205' || msg.includes('caixa')) {
    const erro = new Error('A tabela do caixa ainda não existe no Supabase. Rode o arquivo supabase/financeiro.sql no SQL Editor.');
    erro.tabelaFaltando = true;
    return erro;
  }
  return new Error(`Não foi possível ${acao}. ${msg}`);
}

// ---------- Banco de dados ----------

export async function listarLancamentos() {
  const { data, error } = await supabase
    .from('caixa')
    .select('id, tipo, categoria, descricao, valor, data, created_at')
    .order('data', { ascending: false })
    .order('id', { ascending: false });
  if (error) throw tratarErro(error, 'carregar o caixa');
  return (data || []).map((l) => ({ ...l, valor: Number(l.valor) }));
}

export async function criarLancamento({ tipo, categoria, descricao, valor, data }) {
  const v = Number(valor);
  if (!descricao?.trim()) throw new Error('Escreva uma descrição, por exemplo "Aluguel de outubro".');
  if (!Number.isFinite(v) || v <= 0) throw new Error('Informe um valor maior que zero.');
  const { data: novo, error } = await supabase
    .from('caixa')
    .insert([{ tipo, categoria, descricao: descricao.trim(), valor: Math.round(v * 100) / 100, data }])
    .select('id, tipo, categoria, descricao, valor, data, created_at')
    .single();
  if (error) throw tratarErro(error, 'salvar o lançamento');
  return { ...novo, valor: Number(novo.valor) };
}

export async function excluirLancamento(id) {
  const { error } = await supabase.from('caixa').delete().eq('id', id);
  if (error) throw tratarErro(error, 'apagar o lançamento');
}

// ---------- Cálculos ----------

const chaveMes = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
// "2026-10-08" vira data local (sem pular de dia por causa do fuso)
const dataLocal = (iso) => new Date(`${String(iso).slice(0, 10)}T12:00:00`);

/** Transforma as saídas de estoque em vendas com valor em R$ */
export function vendasDasSaidas(movimentacoes, pecas) {
  const preco = {};
  pecas.forEach((p) => (preco[p.id] = Number(p.precoVenda) || 0));
  return movimentacoes
    .filter((m) => m.tipo === 'saida' && m.dataHora)
    .map((m) => ({
      pecaId: m.pecaId,
      pecaNome: m.pecaNome,
      sku: m.sku,
      quantidade: Number(m.quantidade) || 0,
      valor: (Number(m.quantidade) || 0) * (preco[m.pecaId] || 0),
      data: new Date(m.dataHora),
    }));
}

/**
 * Monta tudo que a tela precisa para o mês escolhido.
 * ano/mes: mês exibido (mes de 0 a 11). hoje: data de referência.
 */
export function montarResumo({ vendas, lancamentos, ano, mes, hoje = new Date() }) {
  const k = chaveMes(new Date(ano, mes, 1));
  const fimDoMes = new Date(ano, mes + 1, 0, 23, 59, 59);

  // Mês em andamento? (usado para comparar com o mesmo período do mês anterior)
  const ehMesAtual = ano === hoje.getFullYear() && mes === hoje.getMonth();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const diaHoje = ehMesAtual ? hoje.getDate() : diasNoMes;

  // ateDia: conta só até esse dia do mês (ex.: 1 a 8 de setembro para comparar com 1 a 8 de outubro)
  const totaisDoMes = (chave, ateDia = 31) => {
    const v = vendas.filter((x) => chaveMes(x.data) === chave && x.data.getDate() <= ateDia);
    const l = lancamentos.filter((x) => chaveMes(dataLocal(x.data)) === chave && dataLocal(x.data).getDate() <= ateDia);
    const faturamento = v.reduce((s, x) => s + x.valor, 0);
    const outrasEntradas = l.filter((x) => x.tipo === 'entrada' && x.categoria !== 'Saldo inicial').reduce((s, x) => s + x.valor, 0);
    const compras = l.filter((x) => x.tipo === 'saida' && x.categoria === 'Compra de peças').reduce((s, x) => s + x.valor, 0);
    const despesas = l.filter((x) => x.tipo === 'saida' && x.categoria !== 'Compra de peças').reduce((s, x) => s + x.valor, 0);
    const receitas = faturamento + outrasEntradas;
    const saidas = compras + despesas;
    return { vendasLista: v, lancLista: l, faturamento, outrasEntradas, compras, despesas, receitas, saidas, lucro: receitas - saidas, pecasVendidas: v.reduce((s, x) => s + x.quantidade, 0) };
  };

  const atual = totaisDoMes(k);
  // Mês anterior: inteiro, ou só até o mesmo dia quando o mês atual ainda está em andamento
  const anterior = totaisDoMes(chaveMes(new Date(ano, mes - 1, 1)), ehMesAtual ? diaHoje : 31);

  // Saldo em caixa até o fim do mês escolhido
  const entrouAte = vendas.filter((x) => x.data <= fimDoMes).reduce((s, x) => s + x.valor, 0)
    + lancamentos.filter((x) => x.tipo === 'entrada' && dataLocal(x.data) <= fimDoMes).reduce((s, x) => s + x.valor, 0);
  const saiuAte = lancamentos.filter((x) => x.tipo === 'saida' && dataLocal(x.data) <= fimDoMes).reduce((s, x) => s + x.valor, 0);
  const temSaldoInicial = lancamentos.some((x) => x.categoria === 'Saldo inicial');

  // Últimos 6 meses (para o gráfico)
  const serie = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ano, mes - i, 1);
    const t = totaisDoMes(chaveMes(d));
    const nome = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    serie.push({ rotulo: nome.charAt(0).toUpperCase() + nome.slice(1), receitas: t.receitas, saidas: t.saidas, lucro: t.lucro, atual: i === 0 });
  }

  // Peças que mais faturaram no mês
  const porPeca = new Map();
  atual.vendasLista.forEach((x) => {
    const p = porPeca.get(x.pecaId) || { nome: x.pecaNome, sku: x.sku, quantidade: 0, valor: 0 };
    p.quantidade += x.quantidade;
    p.valor += x.valor;
    porPeca.set(x.pecaId, p);
  });
  const topPecas = [...porPeca.values()].sort((a, b) => b.valor - a.valor).slice(0, 5);

  // Para onde foi o dinheiro (saídas do mês por categoria)
  const porCategoria = new Map();
  atual.lancLista.filter((x) => x.tipo === 'saida').forEach((x) => porCategoria.set(x.categoria, (porCategoria.get(x.categoria) || 0) + x.valor));
  const saidasPorCategoria = [...porCategoria.entries()].sort((a, b) => b[1] - a[1]);

  return {
    chave: k,
    ...atual,
    anterior,
    saldoCaixa: entrouAte - saiuAte,
    temSaldoInicial,
    serie,
    topPecas,
    saidasPorCategoria,
    ehMesAtual,
    diasNoMes,
    diaHoje,
    margem: atual.receitas > 0 ? (atual.lucro / atual.receitas) * 100 : null,
  };
}

export const variacao = (agora, antes) => (antes > 0 ? Math.round(((agora - antes) / antes) * 100) : null);

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * "IA" automática do financeiro: lê o resumo e escreve a análise.
 * Funciona sem internet nem chave de IA externa.
 */
export function gerarAnaliseFinanceira(r) {
  const alertas = [];
  const dicas = [];
  const temDados = r.receitas > 0 || r.saidas > 0;

  if (!temDados) {
    return {
      resumo: 'Ainda não há vendas nem lançamentos neste mês. Registre as saídas de estoque e as despesas para ver a análise.',
      alertas, dicas, previsao: null, situacao: 'sem-dados',
    };
  }

  const situacao = r.lucro > 0 ? 'lucro' : r.lucro < 0 ? 'prejuizo' : 'empate';
  let resumo = `No mês entraram ${brl(r.receitas)} (${brl(r.faturamento)} em vendas) e saíram ${brl(r.saidas)}. `;
  resumo += situacao === 'lucro'
    ? `Resultado: lucro de ${brl(r.lucro)}${r.margem !== null ? `, margem de ${Math.round(r.margem)}%` : ''}.`
    : situacao === 'prejuizo'
      ? `Resultado: prejuízo de ${brl(-r.lucro)}.`
      : 'Resultado: empate, o que entrou cobriu exatamente o que saiu.';

  if (r.topPecas[0] && r.faturamento > 0) {
    const p = r.topPecas[0];
    resumo += ` A peça que mais faturou foi ${p.nome} (${Math.round((p.valor / r.faturamento) * 100)}% das vendas).`;
  }

  // Alertas
  if (situacao === 'prejuizo') alertas.push(`O mês está no prejuízo: as saídas passaram as entradas em ${brl(-r.lucro)}.`);
  if (r.receitas > 0 && r.saidas / r.receitas > 0.85 && situacao !== 'prejuizo') {
    alertas.push(`As saídas já consomem ${Math.round((r.saidas / r.receitas) * 100)}% do que entrou. Sobra pouco de margem.`);
  }
  const vFat = variacao(r.faturamento, r.anterior.faturamento);
  if (vFat !== null && vFat <= -15) alertas.push(`As vendas caíram ${-vFat}% em relação ao mês anterior.`);
  const vDesp = variacao(r.despesas, r.anterior.despesas);
  if (vDesp !== null && vDesp >= 20) alertas.push(`As despesas subiram ${vDesp}% em relação ao mês anterior.`);
  if (r.saldoCaixa < 0) alertas.push(`O saldo em caixa está negativo (${brl(r.saldoCaixa)}).`);
  if (r.topPecas[0] && r.faturamento > 0 && r.topPecas[0].valor / r.faturamento > 0.5) {
    alertas.push(`Mais da metade das vendas veio de uma única peça (${r.topPecas[0].nome}). Se ela faltar, o faturamento cai muito.`);
  }

  // Dicas
  if (!r.temSaldoInicial) dicas.push('Lance o "Saldo inicial" do caixa para o saldo mostrar o valor real que a loja tem.');
  if (r.faturamento > 0 && r.compras === 0) dicas.push('Registre as compras de peças dos fornecedores para o lucro ficar correto.');
  if (vFat !== null && vFat >= 15) dicas.push(`As vendas subiram ${vFat}%. Confira o estoque das peças mais vendidas para não faltar.`);
  if (r.saidasPorCategoria[0] && r.saidas > 0) {
    const [cat, val] = r.saidasPorCategoria[0];
    dicas.push(`O maior gasto foi com ${cat.toLowerCase()} (${Math.round((val / r.saidas) * 100)}% das saídas). Vale negociar ou revisar.`);
  }
  if (!dicas.length) dicas.push('Continue registrando tudo no caixa: quanto mais completo, melhor a análise.');

  // Previsão do fim do mês (só no mês atual)
  let previsao = null;
  if (r.ehMesAtual && r.diaHoje >= 7 && r.diaHoje < r.diasNoMes) {
    const restante = r.diasNoMes - r.diaHoje;
    const variaveis = r.lancLista
      .filter((x) => x.tipo === 'saida' && !DESPESAS_FIXAS.includes(x.categoria))
      .reduce((s, x) => s + x.valor, 0);
    const receitaPrev = r.receitas + (r.receitas / r.diaHoje) * restante;
    const saidaPrev = r.saidas + (variaveis / r.diaHoje) * restante;
    previsao = { receitas: receitaPrev, saidas: saidaPrev, lucro: receitaPrev - saidaPrev };
  }

  return { resumo, alertas: alertas.slice(0, 4), dicas: dicas.slice(0, 3), previsao, situacao };
}
