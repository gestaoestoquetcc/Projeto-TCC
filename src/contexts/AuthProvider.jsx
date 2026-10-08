import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/SupaBase';
import { buscarPerfil, sair } from '../services/authService';
import { AuthContext } from './AuthContext';

/**
 * Fica "em volta" do sistema inteiro (no main.jsx) e avisa todas as telas
 * quando alguém entra, sai ou abre o link de recuperar senha.
 */
export default function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);

  // 1) Sessão atual + escuta entrar/sair
  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      setSessao(data.session);
      setCarregando(false);
    });

    const { data } = supabase.auth.onAuthStateChange((evento, novaSessao) => {
      if (!ativo) return;
      if (evento === 'PASSWORD_RECOVERY') setRecuperandoSenha(true);
      setSessao(novaSessao);
      setCarregando(false);
    });

    return () => {
      ativo = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // 2) Nome e cargo do usuário (tabela perfis)
  const userId = sessao?.user?.id;
  useEffect(() => {
    if (!userId) return;
    let ativo = true;
    buscarPerfil(userId).then((p) => {
      if (ativo) setPerfil(p ? { ...p, id: userId } : null);
    });
    return () => {
      ativo = false;
    };
  }, [userId]);

  const valor = useMemo(() => {
    const user = sessao?.user;
    const perfilAtual = perfil?.id === user?.id ? perfil : null;

    const usuario = user
      ? {
          id: user.id,
          email: user.email,
          nome: perfilAtual?.nome || user.user_metadata?.nome || user.email.split('@')[0],
          cargo: perfilAtual?.cargo || 'funcionario',
        }
      : null;

    return {
      usuario,
      carregando,
      recuperandoSenha,
      concluirRecuperacao: () => setRecuperandoSenha(false),
      sair,
    };
  }, [sessao, perfil, carregando, recuperandoSenha]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
