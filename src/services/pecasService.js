import { supabase } from '../utils/SupaBase';

/**
 * Calcula dinamicamente o status do estoque
 */
export function calcularStatus(quantidade, estoqueMinimo) {
  const qtd = Number(quantidade) || 0;
  const min = Number(estoqueMinimo) || 0;
  if (qtd <= min) return 'critico';
  if (qtd <= min * 1.25) return 'atencao';
  return 'normal';
}

/**
 * Normaliza o valor da categoria para um dos segmentos suportados pelo layout:
 * 'eletrico', 'combustao' ou 'moto'
 */
export function normalizarSegmento(categoria) {
  if (!categoria) return 'combustao';
  const cat = categoria.toLowerCase();
  if (cat.includes('elet') || cat.includes('ev')) return 'eletrico';
  if (cat.includes('moto')) return 'moto';
  return 'combustao';
}

/**
 * Mapeia os dados retornados do Supabase para o formato consumido pelos componentes de UI
 */
export function mapRowToPeca(row) {
  const segmento = normalizarSegmento(row.categoria);
  const status = calcularStatus(row.quantidade_atual, row.estoque_minimo);
  const ratio = (Number(row.quantidade_atual || 0) / Number(row.estoque_minimo || 1));
  const giro = `${(Math.max(1.2, ratio * 2.4)).toFixed(1)}x`;

  return {
    id: row.id,
    codigo: row.sku || `SKU-${row.id}`,
    oem: row.sku || '',
    nome: row.nome,
    fabricante: row.categoria || 'Geral',
    categoria: row.categoria || '',
    segmento,
    quantidade: Number(row.quantidade_atual) || 0,
    pontoReposicao: Number(row.estoque_minimo) || 0,
    precoVenda: Number(row.preco_venda) || 0,
    giro,
    status,
    createdAt: row.created_at
  };
}

/**
 * Busca todas as peças cadastradas na tabela 'pecas' do Supabase
 */
export async function getPecas() {
  const { data, error } = await supabase
    .from('pecas')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    console.error('Erro ao buscar peças no Supabase:', error);
    throw error;
  }

  return (data || []).map(mapRowToPeca);
}

/**
 * Insere uma nova peça na tabela 'pecas' do Supabase
 */
export async function insertPeca(pecaData) {
  const payload = {
    sku: (pecaData.sku || pecaData.codigo || '').toUpperCase().trim(),
    nome: pecaData.nome.trim(),
    categoria: pecaData.categoria || pecaData.segmento || 'Combustão',
    quantidade_atual: Number(pecaData.quantidade_atual ?? pecaData.quantidade) || 0,
    estoque_minimo: Number(pecaData.estoque_minimo ?? pecaData.pontoReposicao) || 0,
    preco_venda: Number(pecaData.preco_venda ?? pecaData.precoVenda) || 0
  };

  const { data, error } = await supabase
    .from('pecas')
    .insert([payload])
    .select();

  if (error) {
    console.error('Erro ao cadastrar peça no Supabase:', error);
    throw error;
  }

  return mapRowToPeca(data[0]);
}

/**
 * Remove uma peça pelo ID
 */
export async function deletePeca(id) {
  const { error } = await supabase
    .from('pecas')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir peça no Supabase:', error);
    throw error;
  }
}
