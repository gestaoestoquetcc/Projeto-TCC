import React, { useState } from 'react';
import { FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle, FiCheck } from 'react-icons/fi';
import { avaliarSenha } from '../../services/authService';

/** Campo com rótulo e ícone. Se for senha, ganha o botão de mostrar/esconder. */
export function Campo({ id, rotulo, icone, tipo = 'text', extra, ...props }) {
  const [mostrar, setMostrar] = useState(false);
  const Icone = icone;
  const ehSenha = tipo === 'password';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-[11px] font-mono font-bold tracking-wider uppercase text-gray-600">
          {rotulo}
        </label>
        {extra}
      </div>
      <div className="relative">
        {Icone && <Icone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />}
        <input
          id={id}
          type={ehSenha && mostrar ? 'text' : tipo}
          className={`w-full h-11 rounded-lg border border-[#e4ded3] bg-white text-sm text-[#1c1d1f] placeholder:text-gray-400 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 disabled:opacity-60 ${
            Icone ? 'pl-10' : 'pl-3.5'
          } ${ehSenha ? 'pr-11' : 'pr-3.5'}`}
          {...props}
        />
        {ehSenha && (
          <button
            type="button"
            onClick={() => setMostrar((m) => !m)}
            aria-label={mostrar ? 'Esconder senha' : 'Mostrar senha'}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            {mostrar ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

/** Caixa de erro (vermelha) ou de sucesso (verde) */
export function Aviso({ tipo = 'erro', children }) {
  if (!children) return null;
  const erro = tipo === 'erro';
  return (
    <div
      role={erro ? 'alert' : 'status'}
      className={`flex gap-2.5 p-3 rounded-lg border text-sm ${
        erro ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
      }`}
    >
      {erro ? (
        <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
      ) : (
        <FiCheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
      )}
      <span>{children}</span>
    </div>
  );
}

/** Botão laranja principal, com "carregando" */
export function BotaoPrincipal({ carregando, textoCarregando = 'Aguarde...', children, ...props }) {
  return (
    <button
      type="submit"
      disabled={carregando}
      className="w-full h-11 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-bold shadow-sm shadow-amber-900/20 transition-all disabled:opacity-70 disabled:cursor-wait inline-flex items-center justify-center gap-2"
      {...props}
    >
      {carregando && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
      {carregando ? textoCarregando : children}
    </button>
  );
}

const CORES_NIVEL = ['bg-gray-200', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500'];
const NOMES_NIVEL = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];

/** Barrinha de força da senha */
export function ForcaSenha({ senha }) {
  if (!senha) return null;
  const { regras, nivel } = avaliarSenha(senha);
  return (
    <div className="mt-2">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={`h-1 flex-1 rounded-full transition-colors ${n <= nivel ? CORES_NIVEL[nivel] : 'bg-gray-200'}`} />
        ))}
        <span className="ml-1 w-16 text-right text-[11px] font-semibold text-gray-500">{NOMES_NIVEL[nivel]}</span>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {regras.map((r) => (
          <li key={r.texto} className={`inline-flex items-center gap-1 text-[11px] ${r.ok ? 'text-emerald-700' : 'text-gray-400'}`}>
            <FiCheck className="w-3 h-3" />
            {r.texto}
          </li>
        ))}
      </ul>
    </div>
  );
}
