import { supabase } from '../utils/SupaBase';

const STORAGE_KEY = 'autostock_fornecedores_data';

/**
 * Busca a lista de fornecedores reais.
 * Busca no Supabase; se não houver dados no banco, busca no armazenamento local de novos fornecedores.
 * Retorna [] se nenhum fornecedor foi cadastrado (sem dados falsos/mocks).
 */
export async function getFornecedores() {
  try {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .order('id', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((f) => ({
        id: f.id.toString(),
        nome: f.nome,
        cnpj: f.cnpj,
        categoria: f.categoria,
        skus: f.skus || 0,
        pedidosAbertos: f.pedidos_abertos || 0,
        rating: Number(f.rating) || 5.0,
        ultimoRecebimento: f.ultimo_recebimento || 'Recente',
        contato: f.contato || f.email,
        telefone: f.telefone || '',
        leadTimeDias: f.lead_time_dias || 4,
        pontualidade: f.pontualidade || '100%',
        cidadeUf: f.cidade_uf || ''
      }));
    }
  } catch {
    // Tabela ainda não configurada no Supabase, segue para checagem local
  }

  // Persistência local de novos fornecedores cadastrados pelo usuário
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }

  return [];
}

/**
 * Cadastra um novo fornecedor
 */
export async function insertFornecedor(fornecedorData) {
  const novoItem = {
    id: Date.now().toString(),
    nome: fornecedorData.nome.trim(),
    cnpj: fornecedorData.cnpj.trim(),
    categoria: fornecedorData.categoria.trim() || 'Geral',
    skus: Number(fornecedorData.skus) || 1,
    pedidosAbertos: Number(fornecedorData.pedidosAbertos) || 0,
    rating: Number(fornecedorData.rating) || 5.0,
    ultimoRecebimento: new Date().toLocaleDateString('pt-BR'),
    contato: fornecedorData.contato.trim(),
    telefone: fornecedorData.telefone?.trim() || '',
    leadTimeDias: Number(fornecedorData.leadTimeDias) || 4,
    pontualidade: '100%',
    cidadeUf: fornecedorData.cidadeUf?.trim() || ''
  };

  // Tenta persistir no Supabase se existir a tabela
  try {
    const payload = {
      nome: novoItem.nome,
      cnpj: novoItem.cnpj,
      categoria: novoItem.categoria,
      skus: novoItem.skus,
      pedidos_abertos: novoItem.pedidosAbertos,
      rating: novoItem.rating,
      ultimo_recebimento: novoItem.ultimoRecebimento,
      contato: novoItem.contato,
      telefone: novoItem.telefone,
      lead_time_dias: novoItem.leadTimeDias,
      pontualidade: novoItem.pontualidade,
      cidade_uf: novoItem.cidadeUf
    };

    const { data, error } = await supabase
      .from('fornecedores')
      .insert([payload])
      .select();

    if (!error && data && data.length > 0) {
      return {
        ...novoItem,
        id: data[0].id.toString()
      };
    }
  } catch (err) {
    console.warn('Persistindo fornecedor em armazenamento local:', err);
  }

  // Fallback para persistência local
  try {
    const salvos = await getFornecedores();
    const atualizados = [novoItem, ...salvos];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizados));
  } catch (err) {
    console.error('Erro ao salvar localmente:', err);
  }

  return novoItem;
}

/**
 * Remove um fornecedor por ID
 */
export async function deleteFornecedor(id) {
  try {
    await supabase.from('fornecedores').delete().eq('id', id);
  } catch {
    // ignore
  }

  try {
    const salvos = await getFornecedores();
    const filtrados = salvos.filter((f) => f.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtrados));
  } catch (err) {
    console.error('Erro ao deletar localmente:', err);
  }
}
