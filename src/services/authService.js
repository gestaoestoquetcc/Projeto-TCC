import { supabase } from '../utils/SupaBase';

/**
 * LOGIN / CADASTRO / ESQUECI A SENHA
 * Usa o login que o próprio Supabase já tem (Supabase Auth).
 * As senhas ficam guardadas pelo Supabase, nunca numa tabela nossa.
 */

// Mensagens do Supabase (em inglês) traduzidas para o usuário
const MENSAGENS = [
  ['Invalid login credentials', 'E-mail ou senha incorretos.'],
  ['Email not confirmed', 'Confirme seu e-mail antes de entrar. Veja sua caixa de entrada.'],
  ['User already registered', 'Já existe uma conta com este e-mail.'],
  ['Password should be at least', 'A senha precisa ter pelo menos 6 caracteres.'],
  ['rate limit', 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.'],
  ['security purposes', 'Por segurança, aguarde alguns segundos antes de tentar de novo.'],
  ['Unable to validate email', 'E-mail inválido.'],
  ['invalid format', 'E-mail inválido.'],
  ['should be different', 'A nova senha precisa ser diferente da senha atual.'],
  ['Auth session missing', 'O link expirou ou já foi usado. Peça um novo link.'],
  ['Failed to fetch', 'Sem conexão com o servidor. Verifique sua internet.'],
];

function traduzirErro(error) {
  const msg = error?.message || '';
  const achou = MENSAGENS.find(([trecho]) => msg.toLowerCase().includes(trecho.toLowerCase()));
  return new Error(achou ? achou[1] : `Algo deu errado. ${msg}`);
}

// Endereço do sistema (ex.: http://localhost:5173), usado nos links enviados por e-mail
const enderecoDoSistema = () => window.location.origin;

/** Entrar com e-mail e senha */
export async function entrar(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: senha,
  });
  if (error) throw traduzirErro(error);
  return data.user;
}

/**
 * Criar conta nova.
 * Retorna { precisaConfirmar: true } quando o Supabase exige confirmar o e-mail.
 */
export async function cadastrar({ nome, email, senha }) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password: senha,
    options: {
      data: { nome: nome.trim() }, // vai para a tabela "perfis" pelo gatilho do usuarios.sql
      emailRedirectTo: `${enderecoDoSistema()}/login`,
    },
  });
  if (error) throw traduzirErro(error);

  // Quando o e-mail já existe, o Supabase não dá erro (por segurança), mas volta sem "identities"
  if (data.user && data.user.identities?.length === 0) {
    throw new Error('Já existe uma conta com este e-mail.');
  }

  return { precisaConfirmar: !data.session };
}

/** Sair do sistema */
export async function sair() {
  const { error } = await supabase.auth.signOut();
  if (error) throw traduzirErro(error);
}

/** Esqueci a senha: manda um link por e-mail que abre a tela /nova-senha */
export async function enviarLinkRecuperacao(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${enderecoDoSistema()}/nova-senha`,
  });
  if (error) throw traduzirErro(error);
}

/** Salvar a senha nova (o usuário chega aqui pelo link do e-mail) */
export async function atualizarSenha(novaSenha) {
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) throw traduzirErro(error);
}

/**
 * Busca nome e cargo na tabela "perfis".
 * Se a tabela ainda não existir, devolve null e o sistema usa o nome do cadastro.
 */
export async function buscarPerfil(userId) {
  const { data, error } = await supabase
    .from('perfis')
    .select('nome, cargo, ativo')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Perfil não encontrado (rode supabase/usuarios.sql):', error.message);
    return null;
  }
  return data;
}

/** Regras simples de senha, usadas no cadastro e na senha nova */
export function avaliarSenha(senha = '') {
  const regras = [
    { ok: senha.length >= 8, texto: '8 caracteres ou mais' },
    { ok: /[A-Za-z]/.test(senha) && /\d/.test(senha), texto: 'letras e números' },
    { ok: /[A-Z]/.test(senha) || /[^A-Za-z0-9]/.test(senha), texto: 'uma maiúscula ou símbolo' },
  ];
  const pontos = regras.filter((r) => r.ok).length;
  const nivel = senha.length === 0 ? 0 : senha.length < 6 ? 1 : pontos + 1; // 0 a 4
  return { regras, nivel, valida: senha.length >= 6 };
}
