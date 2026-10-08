import { supabase } from '../utils/SupaBase';
import { registrarMovimentacao } from './movimentacoesService';

/**
 * ORÇAMENTOS
 * Um orçamento é uma "simulação de venda": lista peças, preços e total,
 * mas NÃO mexe no estoque. Só quando for aprovado vira saída de verdade.
 *
 * Tabelas (criadas pelo arquivo supabase/orcamentos.sql):
 *   orcamentos       -> cliente, desconto, status, validade
 *   orcamento_itens  -> peça, quantidade, preço unitário
 */

const SELECT_COMPLETO = `
  id, cliente, desconto, status, validade, observacao, created_at,
  orcamento_itens (
    id, peca_id, quantidade, preco_unitario,
    pecas ( id, sku, nome, quantidade_atual )
  )
`;

// Mensagem amigável quando as tabelas ainda não foram criadas no Supabase
function tratarErro(error, acao) {
  console.error(`Erro ao ${acao}:`, error);
  const msg = error?.message || '';
  if (error?.code === '42P01' || error?.code === 'PGRST205' || msg.includes('orcamento')) {
    const erro = new Error(
      'As tabelas de orçamento ainda não existem no Supabase. Rode o arquivo supabase/orcamentos.sql no SQL Editor do Supabase.'
    );
    erro.tabelasFaltando = true; // a tela usa isso para mostrar o aviso fixo
    return erro;
  }
  return new Error(`Não foi possível ${acao}. ${msg}`);
}

// Calcula subtotal, desconto e total
export function calcularTotais(itens, desconto = 0) {
  const subtotal = itens.reduce((s, i) => s + Number(i.quantidade) * Number(i.precoUnitario), 0);
  const valorDesconto = subtotal * (Number(desconto) / 100);
  return { subtotal, valorDesconto, total: subtotal - valorDesconto };
}

// Converte a linha do banco para o formato usado na tela
function formatarOrcamento(row) {
  const itens = (row.orcamento_itens || []).map((i) => ({
    id: i.id,
    pecaId: i.peca_id,
    sku: i.pecas?.sku || `SKU-${i.peca_id}`,
    nome: i.pecas?.nome || `Peça #${i.peca_id}`,
    estoque: Number(i.pecas?.quantidade_atual ?? 0),
    quantidade: Number(i.quantidade),
    precoUnitario: Number(i.preco_unitario),
  }));
  return {
    id: row.id,
    numero: `ORC-${String(row.id).padStart(4, '0')}`,
    cliente: row.cliente,
    desconto: Number(row.desconto),
    status: row.status,
    validade: row.validade,
    observacao: row.observacao,
    criadoEm: row.created_at,
    itens,
    ...calcularTotais(itens, row.desconto),
  };
}

/**
 * Lista os orçamentos (mais novos primeiro)
 */
export async function listarOrcamentos() {
  const { data, error } = await supabase
    .from('orcamentos')
    .select(SELECT_COMPLETO)
    .order('created_at', { ascending: false });

  if (error) throw tratarErro(error, 'carregar os orçamentos');
  return (data || []).map(formatarOrcamento);
}

/**
 * Salva um orçamento novo com seus itens
 * itens: [{ pecaId, quantidade, precoUnitario }]
 */
export async function salvarOrcamento({ cliente, desconto, validadeDias = 7, observacao, itens }) {
  if (!cliente?.trim()) throw new Error('Informe o nome do cliente.');
  if (!itens?.length) throw new Error('Adicione pelo menos uma peça ao orçamento.');

  const validade = new Date();
  validade.setDate(validade.getDate() + Number(validadeDias));

  // 1) Cabeçalho
  const { data: orc, error } = await supabase
    .from('orcamentos')
    .insert([
      {
        cliente: cliente.trim(),
        desconto: Number(desconto) || 0,
        validade: validade.toISOString().slice(0, 10),
        observacao: observacao?.trim() || null,
      },
    ])
    .select('id')
    .single();

  if (error) throw tratarErro(error, 'salvar o orçamento');

  // 2) Itens
  const { error: erroItens } = await supabase.from('orcamento_itens').insert(
    itens.map((i) => ({
      orcamento_id: orc.id,
      peca_id: i.pecaId,
      quantidade: Number(i.quantidade),
      preco_unitario: Number(i.precoUnitario) || 0,
    }))
  );

  if (erroItens) {
    // desfaz o cabeçalho para não ficar orçamento vazio
    await supabase.from('orcamentos').delete().eq('id', orc.id);
    throw tratarErro(erroItens, 'salvar os itens do orçamento');
  }

  const { data: completo, error: erroBusca } = await supabase
    .from('orcamentos')
    .select(SELECT_COMPLETO)
    .eq('id', orc.id)
    .single();

  if (erroBusca) throw tratarErro(erroBusca, 'carregar o orçamento salvo');
  return formatarOrcamento(completo);
}

/**
 * Cancela um orçamento (não apaga, só muda o status)
 */
export async function cancelarOrcamento(id) {
  const { error } = await supabase.from('orcamentos').update({ status: 'cancelado' }).eq('id', id);
  if (error) throw tratarErro(error, 'cancelar o orçamento');
}

/**
 * Aprova o orçamento: dá SAÍDA de cada peça no estoque e marca como aprovado.
 * Antes confere se tem estoque para tudo (para não aprovar pela metade).
 */
export async function aprovarOrcamento(orcamento, pecasAtuais = []) {
  const faltando = orcamento.itens.filter((i) => {
    const peca = pecasAtuais.find((p) => p.id === i.pecaId);
    const estoque = peca ? peca.quantidade : i.estoque;
    return estoque < i.quantidade;
  });

  if (faltando.length > 0) {
    throw new Error(
      `Estoque insuficiente para: ${faltando.map((i) => `${i.nome} (${i.quantidade} un.)`).join(', ')}. ` +
        'Registre o recebimento ou ajuste o orçamento antes de aprovar.'
    );
  }

  const movimentacoes = [];
  for (const item of orcamento.itens) {
    const mov = await registrarMovimentacao({
      pecaId: item.pecaId,
      tipo: 'saida',
      quantidade: item.quantidade,
      documento: orcamento.numero,
      motivo: 'Orçamento aprovado',
    });
    movimentacoes.push(mov);
  }

  const { error } = await supabase.from('orcamentos').update({ status: 'aprovado' }).eq('id', orcamento.id);
  if (error) throw tratarErro(error, 'marcar o orçamento como aprovado');

  return movimentacoes;
}
