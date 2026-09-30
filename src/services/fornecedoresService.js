import { supabase } from '../utils/SupaBase';

const STORAGE_KEY = 'autostock_fornecedores_data';

export const initialFornecedores = [
  {
    id: '1',
    nome: 'Bosch Auto Parts',
    cnpj: '60.621.178/0001-52',
    categoria: 'Freios / Elétrico',
    skus: 12,
    pedidosAbertos: 1,
    rating: 4.8,
    ultimoRecebimento: '05/09/2026',
    contato: 'fornecedores@bosch.com.br',
    telefone: '(11) 4004-0000',
    leadTimeDias: 3,
    pontualidade: '98%',
    cidadeUf: 'Campinas - SP'
  },
  {
    id: '2',
    nome: 'Mahle Filtros',
    cnpj: '04.819.453/0001-80',
    categoria: 'Filtros / Combustão',
    skus: 20,
    pedidosAbertos: 0,
    rating: 4.6,
    ultimoRecebimento: '07/09/2026',
    contato: 'atendimento@mahle.com.br',
    telefone: '(19) 3861-9000',
    leadTimeDias: 5,
    pontualidade: '96%',
    cidadeUf: 'Mogi Guaçu - SP'
  },
  {
    id: '3',
    nome: 'Moura Baterias',
    cnpj: '07.245.004/0001-73',
    categoria: 'Baterias / Motos',
    skus: 8,
    pedidosAbertos: 0,
    rating: 4.9,
    ultimoRecebimento: '08/09/2026',
    contato: 'comercial@moura.com.br',
    telefone: '(81) 3411-1200',
    leadTimeDias: 4,
    pontualidade: '99%',
    cidadeUf: 'Belo Jardim - PE'
  },
  {
    id: '4',
    nome: 'Monroe Shocks',
    cnpj: '62.923.603/0001-45',
    categoria: 'Suspensão / EV',
    skus: 6,
    pedidosAbertos: 1,
    rating: 4.3,
    ultimoRecebimento: '03/09/2026',
    contato: 'aftermarket@monroe.com.br',
    telefone: '(19) 3878-9500',
    leadTimeDias: 6,
    pontualidade: '92%',
    cidadeUf: 'Cotia - SP'
  },
  {
    id: '5',
    nome: 'Delphi Technologies',
    cnpj: '09.131.074/0001-28',
    categoria: 'Sensores / ABS',
    skus: 15,
    pedidosAbertos: 0,
    rating: 4.5,
    ultimoRecebimento: '06/09/2026',
    contato: 'vendas@delphi.com.br',
    telefone: '(11) 4589-4000',
    leadTimeDias: 4,
    pontualidade: '95%',
    cidadeUf: 'Piracicaba - SP'
  },
  {
    id: '6',
    nome: 'Denso Brasil',
    cnpj: '61.756.695/0001-43',
    categoria: 'Injetores / Combustão',
    skus: 22,
    pedidosAbertos: 1,
    rating: 4.7,
    ultimoRecebimento: '05/09/2026',
    contato: 'comercial@denso.com.br',
    telefone: '(41) 3341-3000',
    leadTimeDias: 5,
    pontualidade: '97%',
    cidadeUf: 'Curitiba - PR'
  }
];

/**
 * Busca a lista de fornecedores.
 * Tenta buscar no Supabase se houver tabela, com fallback robusto para localStorage/mock.
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
        rating: Number(f.rating) || 4.5,
        ultimoRecebimento: f.ultimo_recebimento || 'Recente',
        contato: f.contato || f.email,
        telefone: f.telefone || '',
        leadTimeDias: f.lead_time_dias || 4,
        pontualidade: f.pontualidade || '95%',
        cidadeUf: f.cidade_uf || ''
      }));
    }
  } catch {
    // Tabela ainda não configurada no Supabase, segue para localStorage
  }

  // Fallback para persistência local
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }

  return initialFornecedores;
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

  // Tenta persistir no Supabase
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
      novoItem.id = data[0].id.toString();
    }
  } catch {
    // Se a tabela não existir, mantém salvo no localStorage
  }

  // Atualiza cache local
  try {
    const atuais = await getFornecedores();
    const atualizados = [novoItem, ...atuais];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizados));
  } catch {
    // ignore
  }

  return novoItem;
}
