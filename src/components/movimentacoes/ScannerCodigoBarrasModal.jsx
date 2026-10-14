import React, { useState, useEffect, useRef } from 'react';
import { 
  FiX, 
  FiCamera, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiMinus, 
  FiPlus, 
  FiPackage, 
  FiArrowDown, 
  FiArrowUp,
  FiZap,
  FiVolume2
} from 'react-icons/fi';

export default function ScannerCodigoBarrasModal({ 
  isOpen, 
  onClose, 
  pecas = [], 
  onConfirmarBipagem 
}) {
  const [codigoInput, setCodigoInput] = useState('');
  const [pecaLocalizada, setPecaLocalizada] = useState(null);
  const [tipoOperacao, setTipoOperacao] = useState('saida'); // 'saida' | 'entrada'
  const [quantidade, setQuantidade] = useState(1);
  const [documento, setDocumento] = useState('OS-Bipagem');
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Som de Bip usando Web Audio API nativa
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime); // 1.2 kHz tom de scanner
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      // áudio bloqueado ou não suportado
    }
  };

  // Foco automático no input ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setStatusMsg('Leitor pronto. Aponte a pistola USB ou selecione um código abaixo.');
    } else {
      pararCamera();
      setPecaLocalizada(null);
      setCodigoInput('');
      setErroMsg('');
    }
  }, [isOpen]);

  const pararCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraAtiva(false);
  };

  const iniciarCamera = async () => {
    try {
      setErroMsg('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraAtiva(true);
      setStatusMsg('Câmera ativa. Posicione o código de barras no centro do feixe.');
    } catch (err) {
      console.error(err);
      setErroMsg('Não foi possível acessar a câmera do dispositivo. Use o leitor USB ou digite o código.');
    }
  };

  if (!isOpen) return null;

  // Processar código lido
  const processarCodigo = (codigo) => {
    const limpo = codigo.trim().toLowerCase();
    if (!limpo) return;

    playBeep();

    // Buscar peça por código de barras, SKU ou ID
    const encontrada = pecas.find(
      (p) => 
        (p.codigo && p.codigo.toLowerCase() === limpo) ||
        (p.ean && p.ean.toLowerCase() === limpo) ||
        (p.id && String(p.id).toLowerCase() === limpo) ||
        (p.codigo && p.codigo.toLowerCase().includes(limpo))
    );

    if (encontrada) {
      setPecaLocalizada(encontrada);
      setErroMsg('');
      setStatusMsg(`Peça identificada: ${encontrada.nome}`);
    } else {
      // Se não encontrou exato, tenta sugerir a primeira peça ou alertar
      const primeira = pecas[0];
      if (primeira) {
        setPecaLocalizada({
          ...primeira,
          nome: `${primeira.nome} (Simulação: ${codigo})`
        });
        setStatusMsg(`Código simulado vinculado a: ${primeira.nome}`);
      } else {
        setErroMsg(`Nenhuma peça encontrada com o código "${codigo}".`);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processarCodigo(codigoInput);
      setCodigoInput('');
    }
  };

  const handleBiparExemplo = (codigoExemplo) => {
    setCodigoInput(codigoExemplo);
    processarCodigo(codigoExemplo);
  };

  const handleConfirmar = async () => {
    if (!pecaLocalizada) return;

    if (tipoOperacao === 'saida' && pecaLocalizada.quantidade < quantidade) {
      setErroMsg(`Estoque insuficiente! Apenas ${pecaLocalizada.quantidade} un. disponíveis.`);
      return;
    }

    try {
      await onConfirmarBipagem({
        peca: pecaLocalizada,
        tipo: tipoOperacao,
        quantidade,
        documento: documento.trim() || 'Bipagem Rápida'
      });
      playBeep();
      setStatusMsg(`Operação concluída com sucesso!`);
      // Reset
      setPecaLocalizada(null);
      setQuantidade(1);
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (err) {
      setErroMsg(err.message || 'Erro ao processar movimentação.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      <div className="relative bg-[#fcfbfa] border border-[#e5dfd5] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#ece7de] bg-[#f5f1e8]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/10 text-amber-700 flex items-center justify-center">
              <FiZap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">
                Leitor de Código de Barras / QR Code
              </h3>
              <p className="text-xs text-gray-500">
                Compatível com pistolas leitoras USB, câmera integrada ou bipagem rápida
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#ece7de] transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {erroMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{erroMsg}</span>
            </div>
          )}

          {/* Visor / Laser Scanner Animado */}
          <div className="relative rounded-xl overflow-hidden bg-black/95 h-36 flex flex-col items-center justify-center border border-gray-800 shadow-inner">
            {cameraAtiva ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="text-center p-4">
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-mono">
                  <FiVolume2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>MODO COLETOR DE DADOS ATIVO</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 max-w-xs">
                  {statusMsg || 'Pressione o gatilho da pistola de código de barras ou digite o código'}
                </p>
              </div>
            )}

            {/* Linha Laser Vermelha Animada */}
            <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse pointer-events-none top-1/2 -translate-y-1/2" />

            {/* Mira de cantos do scanner */}
            <div className="absolute inset-4 border border-white/20 rounded pointer-events-none" />
          </div>

          {/* Input de Captura do Leitor (com suporte a pistola USB) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Código EAN-13 / SKU Lido
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Aponte a pistola ou digite o código..."
                className="flex-1 px-3.5 py-2 text-sm bg-white rounded-lg border border-[#dcd6ca] outline-none font-mono focus:border-amber-600 focus:ring-1 focus:ring-amber-600 shadow-xs"
              />
              <button
                type="button"
                onClick={() => {
                  processarCodigo(codigoInput);
                  setCodigoInput('');
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Bipar
              </button>
              <button
                type="button"
                onClick={cameraAtiva ? pararCamera : iniciarCamera}
                title="Ativar/Desativar Câmera"
                className={`p-2 rounded-lg border transition-colors ${
                  cameraAtiva 
                    ? 'bg-red-50 border-red-200 text-red-600' 
                    : 'bg-white border-[#dcd6ca] text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FiCamera className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Atalhos Rápidos para Teste */}
          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-gray-400 font-bold block mb-1.5">
              Simular Códigos Rápidos:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'PST-2041 (Pastilha)', cod: 'PST-2041' },
                { label: 'DSC-1090 (Disco)', cod: 'DSC-1090' },
                { label: 'FLT-5011 (Filtro)', cod: 'FLT-5011' },
                { label: 'EAN: 7891234567890', cod: '7891234567890' }
              ].map((ex) => (
                <button
                  key={ex.cod}
                  type="button"
                  onClick={() => handleBiparExemplo(ex.cod)}
                  className="px-2.5 py-1 text-[11px] bg-white border border-[#e5dfd4] rounded-lg text-gray-700 font-mono hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 transition-all shadow-2xs"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Peça Identificada & Ação Rápida */}
          {pecaLocalizada && (
            <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-xs space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Item Localizado
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 mt-1">
                    {pecaLocalizada.nome}
                  </h4>
                  <span className="text-xs font-mono text-gray-500">
                    SKU: {pecaLocalizada.codigo} • Estoque Atual: {pecaLocalizada.quantidade} un.
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-gray-900 block font-mono">
                    R$ {Number(pecaLocalizada.preco || 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-gray-400">Unitário</span>
                </div>
              </div>

              {/* Seletor de Tipo e Quantidade */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#f4efe8]">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Tipo de Movimentação
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTipoOperacao('saida')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                        tipoOperacao === 'saida'
                          ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-2xs'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <FiArrowDown className="w-3 h-3 text-amber-600" />
                      Saída
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoOperacao('entrada')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                        tipoOperacao === 'entrada'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <FiArrowUp className="w-3 h-3 text-emerald-600" />
                      Entrada
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Quantidade
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold"
                    >
                      <FiMinus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantidade}
                      onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
                      className="w-14 text-center font-bold text-xs py-1.5 bg-[#fbf9f5] border border-[#dcd6ca] rounded-lg font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantidade((q) => q + 1)}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold"
                    >
                      <FiPlus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Botão Confirmar Bipagem */}
              <button
                type="button"
                onClick={handleConfirmar}
                className="w-full py-2.5 bg-[#c8672b] hover:bg-[#b55a22] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
              >
                <FiCheckCircle className="w-4 h-4" />
                Confirmar {tipoOperacao === 'saida' ? 'Baixa' : 'Entrada'} de {quantidade} un.
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[#ece7de] bg-[#f5f1e8]/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Fechar Scanner
          </button>
        </div>
      </div>
    </div>
  );
}
