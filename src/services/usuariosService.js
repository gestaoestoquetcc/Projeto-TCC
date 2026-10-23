import { createClient } from '@supabase/supabase-js';
import { supabase } from '../utils/SupaBase';

// Cliente secundário isolado (sem persistir sessão) para permitir que o Dono da Loja (Master)
// crie contas de funcionários no Supabase Auth sem deslogar sua própria sessão de administrador.
const secondaryAuthClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

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
        email: p.email || (p.role === 'master' ? 'dono@autostock.com.br' : 'colaborador@autostock.com.br'),
        cargo: p.cargo || 'Operador de Almoxarifado',
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

  return [];
}

/**
 * Cadastra um novo funcionário/colaborador no sistema:
 * 1. Cria a conta no Supabase Auth com email e senha providenciados pelo Dono da Loja
 * 2. Grava os dados na tabela public.perfis (nome, cargo, role, permissões, ativo)
 * 3. O colaborador passa a conseguir logar imediatamente no sistema com suas credenciais
 */
export async function criarUsuario(usuarioData) {
  const nome = usuarioData.nome.trim();
  const email = usuarioData.email.trim().toLowerCase();
  const senha = usuarioData.senha || 'AutoStock@2026';
  const cargo = usuarioData.cargo.trim() || 'Operador de Almoxarifado';
  const role = usuarioData.role || 'operador';

  const iniciais = nome
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'NV';

  const permissoes = usuarioData.permissoes || {
    dashboard: true,
    pecas: true,
    movimentacao: true,
    previsao: role === 'master' || role === 'gerente',
    fornecedores: role === 'master' || role === 'gerente',
    usuarios: role === 'master'
  };

  // 1. Criar usuário no Supabase Auth via cliente secundário
  const { data: authData, error: authError } = await secondaryAuthClient.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        nome,
        cargo,
        role,
        permissoes
      }
    }
  });

  if (authError) {
    if (authError.message?.includes('User already registered')) {
      throw new Error(`O e-mail ${email} já possui cadastro no sistema.`);
    }
    if (authError.message?.includes('confirmation email') || authError.status === 500) {
      throw new Error(
        'Aviso do Supabase: Limite de envio de e-mails de confirmação atingido. ' +
        'Para cadastrar colaboradores diretamente, desmarque a opção "Confirm email" em Authentication -> Providers -> Email no painel do Supabase.'
      );
    }
    throw authError;
  }

  // No Supabase Auth, quando um e-mail já está em uso, a API retorna identities vazio ([])
  // para evitar enumeração pública de e-mails, sem criar novo registro no auth.users.
  if (authData?.user && (!authData.user.identities || authData.user.identities.length === 0)) {
    throw new Error(
      `O e-mail "${email}" já está cadastrado no sistema (é o e-mail de um administrador ou colaborador já existente). ` +
      `Para cadastrar um novo colaborador, informe um e-mail diferente.`
    );
  }

  const userId = authData?.user?.id;
  if (!userId) {
    throw new Error('Não foi possível gerar a credencial do usuário no Supabase Auth.');
  }

  // 2. Gravar os dados completos na tabela public.perfis
  const payloadPerfil = {
    id: userId,
    nome,
    email,
    cargo,
    role,
    avatar_iniciais: iniciais,
    ativo: true,
    permissoes
  };

  const { error: perfilError } = await supabase
    .from('perfis')
    .upsert(payloadPerfil);

  if (perfilError) {
    console.error('Erro ao salvar perfil no Supabase:', perfilError);
    throw new Error(`Conta criada no Auth, mas erro ao salvar na tabela perfis: ${perfilError.message}`);
  }

  return {
    id: userId,
    ...payloadPerfil,
    dataCriacao: new Date().toLocaleDateString('pt-BR')
  };
}

/**
 * Atualiza os dados de um usuário na tabela public.perfis
 */
export async function atualizarUsuario(id, updates) {
  const { error } = await supabase
    .from('perfis')
    .update({
      cargo: updates.cargo,
      role: updates.role,
      ativo: updates.ativo,
      permissoes: updates.permissoes
    })
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar perfil no Supabase:', error);
    throw error;
  }

  // Recarregar a lista atualizada
  return await getUsuarios();
}
