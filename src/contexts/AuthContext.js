import { createContext, useContext } from 'react';

// Guarda quem está logado para qualquer tela poder usar
export const AuthContext = createContext(null);

/** Use em qualquer tela: const { usuario, sair } = useAuth(); */
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro do <AuthProvider>');
  return contexto;
}
