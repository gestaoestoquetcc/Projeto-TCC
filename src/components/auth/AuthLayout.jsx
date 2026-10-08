import React from 'react';
import { RiShieldFlashFill } from 'react-icons/ri';
import { FiTrendingUp, FiFileText, FiBell } from 'react-icons/fi';

const DESTAQUES = [
  { icone: FiTrendingUp, titulo: 'Previsão IA', texto: 'Saiba o que vai faltar antes de faltar.' },
  { icone: FiFileText, titulo: 'Orçamentos', texto: 'Monte, imprima e aprove em segundos.' },
  { icone: FiBell, titulo: 'Alertas de estoque', texto: 'Peças abaixo do mínimo em destaque.' },
];

function Logo({ claro = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md shadow-amber-900/30">
        <RiShieldFlashFill className="w-5 h-5 text-white" />
      </div>
      <div>
        <h1 className={`font-bold text-lg tracking-tight leading-none ${claro ? 'text-white' : 'text-[#1c1d1f]'}`}>AutoStock</h1>
        <span className="text-[10px] text-amber-600 font-mono tracking-widest uppercase block mt-1">Distribuidor Pro</span>
      </div>
    </div>
  );
}

/**
 * Moldura das telas de Login, Cadastro, Esqueci a senha e Nova senha.
 * Esquerda: painel escuro com a marca (some no celular). Direita: o formulário.
 */
export default function AuthLayout({ titulo, subtitulo, children, rodape }) {
  return (
    <div className="min-h-screen flex bg-[#f7f5f0]">
      {/* Painel da marca */}
      <aside className="hidden lg:flex w-[44%] max-w-[620px] bg-[#0d1117] text-gray-300 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 w-96 h-96 rounded-full bg-amber-900/20 blur-3xl" />

        <div className="relative">
          <Logo claro />
        </div>

        <div className="relative">
          <span className="text-[11px] font-mono tracking-widest uppercase text-amber-500/90">Gestão de autopeças</span>
          <h2 className="mt-3 text-4xl font-extrabold text-white leading-tight tracking-tight">
            Seu estoque sob controle,
            <br />
            <span className="text-amber-500">hoje e amanhã.</span>
          </h2>

          <ul className="mt-10 space-y-5">
            {DESTAQUES.map(({ icone, titulo, texto }) => {
              const Icone = icone;
              return (
              <li key={titulo} className="flex items-start gap-3.5">
                <span className="w-9 h-9 shrink-0 rounded-lg bg-[#161b22] border border-[#21262d] flex items-center justify-center">
                  <Icone className="w-4 h-4 text-amber-500" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-100">{titulo}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{texto}</p>
                </div>
              </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-[11px] text-gray-500 font-mono">© {new Date().getFullYear()} AutoStock · Projeto TCC</p>
      </aside>

      {/* Formulário */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-[#1c1d1f]">{titulo}</h2>
          {subtitulo && <p className="mt-1.5 text-sm text-gray-500">{subtitulo}</p>}

          <div className="mt-7">{children}</div>

          {rodape && <div className="mt-8 text-center text-sm text-gray-500">{rodape}</div>}
        </div>
      </main>
    </div>
  );
}
