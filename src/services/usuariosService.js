import { supabase } from '../utils/SupaBase';

const STORAGE_KEY = 'autostock_usuarios_sistema';

/**
 * Busca a lista de usuários reais cadastrados no Supabase (tabela perfis)
 * Retorna [] se nenhum usuário foi cadastrado (sem dados falsos/mocks).
 */
export async function getUsuarios() {
  try {
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((p) => ({
        id: p.id,
        nome: p.nome,
        email: p.email || `${p.nome?.toLowerCase().replace(/\s+/g, '.') || 'usuario'}@autostock.com.br`,
        cargo: p.cargo || 'Operador',
        role: p.role || (p.cargo?.toLowerCase().includes('master') ? 'master' : 'operador'),
        avatar_iniciais: p.avatar_iniciais || p.nome?.substring(0, 2).toUpperCase() || 'US',
        ativo: p.ativo !== false,
        dataCriacao: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'Recente',
        permissoes: p.permissoes || {
          dashboard: true,
          pecas: true,
          movimentacao: true,
          previsao: p.role === 'master' || p.role === 'gerente',
          fornecedores: p.role === 'master' || p.role === 'gerente',
          usuarios: p.role === 'master'
        }
      }));
    }
  } catch (err) {
    console.warn('Erro ao consultar perfis do Supabase:', err);
  }

  // Fallback para usuários cadastrados localmente
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) return JSON.parse(salvo);
  } catch {
    // ignore
  }

  return [];
}

/**
 * Cadastra um novo usuário
 */
export async function criarUsuario(usuarioData) {
  const nome = usuarioData.nome.trim();
  const iniciais = nome
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'NV';

  const novoUsuario = {
    id: `usr_${Date.now()}`,
    nome,
    email: usuarioData.email.trim(),
    cargo: usuarioData.cargo.trim() || 'Operador de Almoxarifado',
    role: usuarioData.role || 'operador',
    avatar_iniciais: iniciais,
    ativo: true,
    dataCriacao: new Date().toLocaleDateString('pt-BR'),
    permissoes: usuarioData.permissoes || {
      dashboard: true,
      pecas: true,
      movimentacao: true,
      previsao: usuarioData.role === 'master' || usuarioData.role === 'gerente',
      fornecedores: usuarioData.role === 'master' || usuarioData.role === 'gerente',
      usuarios: usuarioData.role === 'master'
    }
  };

  // Tentar cadastrar no Supabase (tabela perfis)
  try {
    const { data, error } = await supabase
      .from('perfis')
      .insert([{
        nome: novoUsuario.nome,
        cargo: novoUsuario.cargo,
        role: novoUsuario.role,
        avatar_iniciais: novoUsuario.avatar_iniciais,
        ativo: novoUsuario.ativo,
        permissoes: novoUsuario.permissoes
      }])
      .select();

    if (!error && data && data.length > 0) {
      novoUsuario.id = data[0].id;
    }
  } catch (err) {
    console.warn('Não foi possível gravar perfil no Supabase, salvando localmente:', err);
  }

  try {
    const listaAtual = await getUsuarios();
    const atualizada = [novoUsuario, ...listaAtual.filter((u) => u.id !== novoUsuario.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizada));
  } catch (err) {
    console.error('Erro ao salvar localmente:', err);
  }

  return novoUsuario;
}

/**
 * Atualiza os dados de um usuário
 */
export async function atualizarUsuario(id, updates) {
  try {
    await supabase
      .from('perfis')
      .update({
        cargo: updates.cargo,
        role: updates.role,
        ativo: updates.ativo,
        permissoes: updates.permissoes
      })
      .eq('id', id);
  } catch (err) {
    console.warn('Erro ao atualizar perfil no Supabase:', err);
  }

  try {
    const listaAtual = await getUsuarios();
    const atualizada = listaAtual.map((u) => (u.id === id ? { ...u, ...updates } : u));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizada));
    return atualizada;
  } catch {
    return [];
  }
}
