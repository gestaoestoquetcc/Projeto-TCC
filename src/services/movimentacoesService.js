import { supabase } from '../utils/SupaBase';

/**
 * Busca as movimentações (com informações da peça associada)
 */
export async function getMovimentacoes() {
  const { data, error } = await supabase
    .from('movimentacoes')
    .select(`
      id,
      peca_id,
      tipo_movimento,
      quantidade,
      data_hora,
      documento,
      motivo,
      pecas (
        id,
        sku,
        nome,
        quantidade_atual
      )
    `)
    .order('data_hora', { ascending: false });

  if (error) {
    // Caso as colunas documento/motivo ainda não existam no banco do usuário, faz fallback para as colunas padrão
    if (error.message?.includes('documento') || error.message?.includes('motivo')) {
      const fallback = await supabase
        .from('movimentacoes')
        .select(`
          id,
          peca_id,
          tipo_movimento,
          quantidade,
          data_hora,
          pecas (
            id,
            sku,
            nome,
            quantidade_atual
          )
        `)
        .order('data_hora', { ascending: false });

      if (fallback.error) throw fallback.error;
      return (fallback.data || []).map(formatarMovimentacao);
    }

    console.error('Erro ao buscar movimentações:', error);
    throw error;
  }

  return (data || []).map(formatarMovimentacao);
}

/**
 * Formata os dados de uma movimentação para exibição na UI
 */
export function formatarMovimentacao(item) {
  const dataObj = item.data_hora ? new Date(item.data_hora) : new Date();
  const hora = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dataFormatada = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  return {
    id: item.id,
    pecaId: item.peca_id,
    pecaNome: item.pecas?.nome || `Peça #${item.peca_id}`,
    sku: item.pecas?.sku || `SKU-${item.peca_id}`,
    tipo: item.tipo_movimento, // 'entrada' ou 'saida'
    quantidade: item.quantidade,
    documento: item.documento || (item.tipo_movimento === 'saida' ? 'OS-Balcão' : 'NF-e'),
    motivo: item.motivo || (item.tipo_movimento === 'saida' ? 'Balcão' : 'Entrada Fornecedor'),
    dataHora: item.data_hora,
    hora,
    dataFormatada
  };
}

/**
 * Registra uma nova movimentação (Entrada ou Saída) e atualiza o estoque da peça
 */
export async function registrarMovimentacao({ pecaId, tipo, quantidade, documento, motivo }) {
  const qtdNum = Number(quantidade);
  if (!pecaId || isNaN(qtdNum) || qtdNum <= 0) {
    throw new Error('Peça e quantidade válida são obrigatórias');
  }

  // 1. Buscar a peça atual para conferir estoque
  const { data: pecaAtual, error: pecaError } = await supabase
    .from('pecas')
    .select('id, quantidade_atual')
    .eq('id', pecaId)
    .single();

  if (pecaError || !pecaAtual) {
    throw new Error('Peça não encontrada no banco de dados');
  }

  if (tipo === 'saida' && pecaAtual.quantidade_atual < qtdNum) {
    throw new Error(`Estoque insuficiente! Disponível: ${pecaAtual.quantidade_atual} un.`);
  }

  // 2. Montar payload da movimentação
  const payload = {
    peca_id: pecaId,
    tipo_movimento: tipo,
    quantidade: qtdNum,
    data_hora: new Date().toISOString()
  };

  // Se o usuário já tiver adicionado as colunas no Supabase
  if (documento) payload.documento = documento;
  if (motivo) payload.motivo = motivo;

  let insertResult;
  try {
    insertResult = await supabase
      .from('movimentacoes')
      .insert([payload])
      .select(`
        id,
        peca_id,
        tipo_movimento,
        quantidade,
        data_hora,
        documento,
        motivo,
        pecas (
          id,
          sku,
          nome,
          quantidade_atual
        )
      `)
      .single();
  } catch {
    // Fallback sem documento/motivo caso as colunas ainda não estejam na tabela
    delete payload.documento;
    delete payload.motivo;
    insertResult = await supabase
      .from('movimentacoes')
      .insert([payload])
      .select(`
        id,
        peca_id,
        tipo_movimento,
        quantidade,
        data_hora,
        pecas (
          id,
          sku,
          nome,
          quantidade_atual
        )
      `)
      .single();
  }

  if (insertResult.error) {
    // Se deu erro de coluna não encontrada, tenta sem documento/motivo
    if (insertResult.error.message?.includes('documento') || insertResult.error.message?.includes('motivo')) {
      delete payload.documento;
      delete payload.motivo;
      const retry = await supabase
        .from('movimentacoes')
        .insert([payload])
        .select(`
          id,
          peca_id,
          tipo_movimento,
          quantidade,
          data_hora,
          pecas (
            id,
            sku,
            nome,
            quantidade_atual
          )
        `)
        .single();

      if (retry.error) throw retry.error;
      insertResult = retry;
    } else {
      throw insertResult.error;
    }
  }

  // 3. Atualizar a quantidade da peça diretamente no Supabase para garantir sincronia imediata
  const novaQuantidade = tipo === 'saida' 
    ? Math.max(0, pecaAtual.quantidade_atual - qtdNum)
    : pecaAtual.quantidade_atual + qtdNum;

  await supabase
    .from('pecas')
    .update({ quantidade_atual: novaQuantidade })
    .eq('id', pecaId);

  return formatarMovimentacao(insertResult.data);
}
