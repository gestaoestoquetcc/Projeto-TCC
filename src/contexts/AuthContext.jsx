import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/SupaBase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função auxiliar para buscar os dados de perfil da tabela public.perfis
  const buscarPerfil = async (userId, userMetadata, email) => {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        // Se a coluna e-mail estiver vazia no banco, sincroniza com o e-mail real do Auth
        if (!data.email && email) {
          try {
            await supabase.from('perfis').update({ email }).eq('id', userId);
            data.email = email;
          } catch {
            // ignore
          }
        }
        setPerfil(data);
        return data;
      }
    } catch {
      // ignore
    }

    // Se o perfil ainda não existir na tabela (ex: primeiro acesso), cria o registro
    const nomeFallback = userMetadata?.nome || email?.split('@')[0] || 'Usuário';
    const cargoFallback = userMetadata?.cargo || (userMetadata?.role === 'master' ? 'Dono / Administrador' : 'Operador de Almoxarifado');
    const roleFallback = userMetadata?.role || 'master';
    const iniciaisFallback = nomeFallback
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'US';

    const novoPerfil = {
      id: userId,
      nome: nomeFallback,
      email: email || '',
      cargo: cargoFallback,
      role: roleFallback,
      avatar_iniciais: iniciaisFallback,
      ativo: true,
      permissoes: userMetadata?.permissoes || {
        dashboard: true,
        pecas: true,
        movimentacao: true,
        previsao: roleFallback === 'master',
        fornecedores: roleFallback === 'master',
        usuarios: roleFallback === 'master'
      }
    };

    try {
      await supabase.from('perfis').upsert(novoPerfil);
    } catch {
      // ignore
    }

    setPerfil(novoPerfil);
    return novoPerfil;
  };

  useEffect(() => {
    // 1. Obter a sessão atual ao iniciar o app
    const obterSessaoInicial = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await buscarPerfil(session.user.id, session.user.user_metadata, session.user.email);
        } else {
          setUser(null);
          setPerfil(null);
        }
      } catch (err) {
        console.error('Erro ao verificar sessão do Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

    obterSessaoInicial();

    // 2. Escutar eventos de autenticação em tempo real (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await buscarPerfil(session.user.id, session.user.user_metadata, session.user.email);
      } else {
        setUser(null);
        setPerfil(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Login com E-mail e Senha
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    if (data?.user) {
      const p = await buscarPerfil(data.user.id, data.user.user_metadata, data.user.email);
      // Checar se o usuário foi desativado pelo Administrador da Loja
      if (p && p.ativo === false) {
        await signOut();
        throw new Error('Acesso suspenso: Este usuário foi desativado pelo administrador da loja. Entre em contato com seu gestor.');
      }
    }

    return data;
  };

  // Cadastro de Nova Loja / Dono da Empresa (Role Master)
  const signUp = async ({ nome, email, password, nomeLoja = '', cargo = 'Dono / Administrador' }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome: nome.trim(),
          cargo: cargo.trim(),
          nome_loja: nomeLoja.trim(),
          role: 'master',
          permissoes: {
            dashboard: true,
            pecas: true,
            movimentacao: true,
            previsao: true,
            fornecedores: true,
            usuarios: true
          }
        }
      }
    });

    if (error) throw error;

    if (data?.user) {
      await buscarPerfil(data.user.id, data.user.user_metadata, email);
    }

    return data;
  };

  // Recuperação de Senha por E-mail (envia o link para /redefinir-senha)
  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`
    });

    if (error) throw error;
    return data;
  };

  // Atualização da Nova Senha (após clicar no link do e-mail)
  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return data;
  };

  // Atualizar dados de perfil (Nome, Cargo, Avatar)
  const atualizarPerfil = async ({ nome, cargo }) => {
    const iniciais = nome
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AT';

    const novosDados = {
      nome: nome.trim(),
      cargo: cargo.trim(),
      avatar_iniciais: iniciais
    };

    // Tentar persistir no Supabase se houver usuário autenticado
    if (user?.id) {
      try {
        await supabase
          .from('perfis')
          .update(novosDados)
          .eq('id', user.id);
      } catch (err) {
        console.warn('Erro ao atualizar perfil no Supabase:', err);
      }
    }

    setPerfil((prev) => ({
      ...prev,
      ...novosDados
    }));
  };

  // Logout robusto (garante limpeza de estado mesmo se a sessão do Supabase já estiver expirada)
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sessão remota já encerrada ou ausente no Supabase:', err);
    } finally {
      setUser(null);
      setPerfil(null);
      try {
        // Limpar todas as chaves de autenticação do Supabase do localStorage
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
            localStorage.removeItem(key);
          }
        }
      } catch (storageErr) {
        console.warn('Erro ao limpar localStorage de auth:', storageErr);
      }
    }
  };

  const isMaster = perfil?.role === 'master' || perfil?.cargo?.toLowerCase().includes('master') || perfil?.cargo?.toLowerCase().includes('dono') || perfil?.cargo?.toLowerCase().includes('diretor');

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
        loading,
        isAuthenticated: !!user,
        isMaster,
        signIn,
        signUp,
        resetPassword,
        updatePassword,
        atualizarPerfil,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para consumir a autenticação facilmente em qualquer componente
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
