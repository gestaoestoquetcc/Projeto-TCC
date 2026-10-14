import React, { useState, useRef } from 'react';
import { 
  FiX, 
  FiUploadCloud, 
  FiFileText, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiCheck, 
  FiPackage,
  FiTruck,
  FiArrowRight,
  FiDownload
} from 'react-icons/fi';

// Exemplo embutido de XML de NF-e para demonstração imediata
const XML_EXEMPLO = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35261009123456000192550010000120481001234567" versao="4.00">
      <ide>
        <nNF>12048</nNF>
        <serie>1</serie>
        <dhEmi>2026-10-06T14:30:00-03:00</dhEmi>
        <tpNF>1</tpNF>
      </ide>
      <emit>
        <CNPJ>09123456000192</CNPJ>
        <xNome>DISTRIBUIDORA DE AUTOPECAS BOSCH BRASIL LTDA</xNome>
        <xFant>BOSCH AUTOMOTIVE</xFant>
      </emit>
      <dest>
        <CNPJ>12987654000100</CNPJ>
        <xNome>AUTOSTOCK DISTRIBUIDOR PRO LTDA</xNome>
      </dest>
      <total>
        <ICMSTot>
          <vNF>4820.00</vNF>
        </ICMSTot>
      </total>
      <det nItem="1">
        <prod>
          <cProd>PST-2041</cProd>
          <cEAN>7891234567890</cEAN>
          <xProd>Pastilha de Freio Dianteira Cerâmica Bosch Pro</xProd>
          <NCM>87083090</NCM>
          <qCom>25.0000</qCom>
          <vUnCom>98.0000</vUnCom>
          <vProd>2450.00</vProd>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>DSC-1090</cProd>
          <cEAN>7899876543210</cEAN>
          <xProd>Disco de Freio Ventilado Dianteiro 280mm</xProd>
          <NCM>87083090</NCM>
          <qCom>15.0000</qCom>
          <vUnCom>120.0000</vUnCom>
          <vProd>1800.00</vProd>
        </prod>
      </det>
      <det nItem="3">
        <prod>
          <cProd>FLT-5011</cProd>
          <cEAN>7894561230001</cEAN>
          <xProd>Filtro de Óleo Blindado Alta Eficiência</xProd>
          <NCM>84212300</NCM>
          <qCom>30.0000</qCom>
          <vUnCom>19.0000</vUnCom>
          <vProd>570.00</vProd>
        </prod>
      </det>
    </infNFe>
  </NFe>
</nfeProc>`;

export default function ImportarNfeModal({ isOpen, onClose, onImportarItens }) {
  const [dragOver, setDragOver] = useState(false);
  const [arquivoNome, setArquivoNome] = useState('');
  const [erroXml, setErroXml] = useState('');
  const [dadosNfe, setDadosNfe] = useState(null);
  const [itensSelecionados, setItensSelecionados] = useState({});
  const [processando, setProcessando] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const parseNfeXml = (xmlString, nomeArquivo = 'arquivo.xml') => {
    try {
      setErroXml('');
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, 'text/xml');

      // Checar erro de parse
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        throw new Error('O arquivo selecionado não contém uma estrutura XML válida.');
      }

      // Extrair nós principais
      const infNFe = doc.querySelector('infNFe');
      const ide = doc.querySelector('ide');
      const emit = doc.querySelector('emit');
      const total = doc.querySelector('total');
      const detList = doc.querySelectorAll('det');

      if (!infNFe || !ide || detList.length === 0) {
        throw new Error('O XML não parece ser uma NF-e de entrada válida padrão SEFAZ (nó <infNFe> ou <det> ausente).');
      }

      const chaveAcesso = (infNFe.getAttribute('Id') || '').replace('NFe', '');
      const numeroNfe = ide.querySelector('nNF')?.textContent || 'S/N';
      const serie = ide.querySelector('serie')?.textContent || '1';
      const dhEmi = ide.querySelector('dhEmi')?.textContent || '';

      const emitNome = emit?.querySelector('xNome')?.textContent || 'Fornecedor Desconhecido';
      const emitCnpj = emit?.querySelector('CNPJ')?.textContent || '';
      const emitFantasia = emit?.querySelector('xFant')?.textContent || '';

      const valorTotal = Number(total?.querySelector('vNF')?.textContent || 0);

      const itens = [];
      const selecaoInicial = {};

      detList.forEach((det, index) => {
        const prod = det.querySelector('prod');
        if (prod) {
          const item = {
            index,
            codigo: prod.querySelector('cProd')?.textContent || `ITEM-${index + 1}`,
            ean: prod.querySelector('cEAN')?.textContent || '',
            nome: prod.querySelector('xProd')?.textContent || 'Peça sem descrição',
            ncm: prod.querySelector('NCM')?.textContent || '',
            quantidade: Math.round(Number(prod.querySelector('qCom')?.textContent || 1)),
            valorUnitario: Number(prod.querySelector('vUnCom')?.textContent || 0),
            valorTotal: Number(prod.querySelector('vProd')?.textContent || 0)
          };
          itens.push(item);
          selecaoInicial[index] = true;
        }
      });

      setArquivoNome(nomeArquivo);
      setDadosNfe({
        chaveAcesso,
        numeroNfe,
        serie,
        dataEmissao: dhEmi ? new Date(dhEmi).toLocaleDateString('pt-BR') : 'Hoje',
        fornecedor: emitNome,
        cnpj: emitCnpj,
        fantasia: emitFantasia,
        valorTotal,
        itens
      });
      setItensSelecionados(selecaoInicial);
    } catch (err) {
      console.error(err);
      setErroXml(err.message || 'Falha ao processar arquivo XML.');
      setDadosNfe(null);
    }
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.xml')) {
      setErroXml('Por favor, envie um arquivo com extensão .xml.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      parseNfeXml(e.target.result, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleCarregarExemplo = () => {
    parseNfeXml(XML_EXEMPLO, 'NFe_12048_BOSCH_AUTOPECAS.xml');
  };

  const toggleItem = (index) => {
    setItensSelecionados((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleTodos = () => {
    if (!dadosNfe) return;
    const todosMarcados = dadosNfe.itens.every((_, i) => itensSelecionados[i]);
    const novo = {};
    dadosNfe.itens.forEach((_, i) => {
      novo[i] = !todosMarcados;
    });
    setItensSelecionados(novo);
  };

  const itensParaImportar = dadosNfe
    ? dadosNfe.itens.filter((_, i) => itensSelecionados[i])
    : [];

  const handleConfirmar = async () => {
    if (!dadosNfe || itensParaImportar.length === 0) return;
    try {
      setProcessando(true);
      await onImportarItens({
        nfeInfo: dadosNfe,
        itens: itensParaImportar
      });
      onClose();
      // Reset
      setDadosNfe(null);
      setArquivoNome('');
    } catch (err) {
      console.error(err);
      setErroXml('Erro ao dar entrada no estoque.');
    } finally {
      setProcessando(false);
    }
  };

  const formatCnpj = (val) => {
    if (!val || val.length !== 14) return val;
    return val.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={() => !processando && onClose()} 
      />

      {/* Modal Box */}
      <div className="relative bg-[#fcfbfa] border border-[#e5dfd5] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#ece7de] bg-[#f5f1e8]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 flex items-center justify-center">
              <FiFileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">
                Importar XML de NF-e (Entrada Automática)
              </h3>
              <p className="text-xs text-gray-500">
                Leia automaticamente o XML da Nota Fiscal Eletrônica e dê entrada em lote nas peças
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processando}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#ece7de] transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {erroXml && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{erroXml}</span>
            </div>
          )}

          {/* Área de Upload / Dropzone */}
          {!dadosNfe ? (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-amber-600 bg-amber-50/50 scale-[0.99]'
                    : 'border-[#dcd6ca] bg-white hover:bg-gray-50/80 hover:border-gray-400'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xml"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                />
                <div className="w-12 h-12 rounded-full bg-amber-600/10 text-amber-700 flex items-center justify-center mx-auto mb-3">
                  <FiUploadCloud className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">
                  Arraste e solte o arquivo .xml da NF-e aqui
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  ou clique para selecionar o arquivo do seu computador
                </p>
                <span className="inline-block mt-3 px-3 py-1 bg-[#f5f1e8] text-[#8c531d] rounded-full text-[10px] font-mono font-bold tracking-wider uppercase">
                  Padrão SEFAZ NF-e 4.00
                </span>
              </div>

              {/* Botão de Exemplo Prático */}
              <div className="p-4 bg-white border border-[#e5dfd4] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Sem arquivo XML no momento?
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Carregue um exemplo real de NF-e da Bosch Automotive com 3 peças
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCarregarExemplo}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fcf5ec] text-[#b36d1b] border border-[#f0dac7] rounded-lg text-xs font-bold hover:bg-[#f8ebd9] transition-all"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  Carregar Exemplo
                </button>
              </div>
            </div>
          ) : (
            /* Visualização dos dados da NF-e processada */
            <div className="space-y-5">
              {/* Card Resumo da Nota */}
              <div className="bg-white p-4 rounded-xl border border-[#e5dfd4] shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase font-bold block">
                    EMITENTE / FORNECEDOR
                  </span>
                  <span className="text-xs font-black text-gray-900 block truncate mt-0.5">
                    {dadosNfe.fornecedor}
                  </span>
                  <span className="text-[11px] font-mono text-gray-500">
                    CNPJ: {formatCnpj(dadosNfe.cnpj)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase font-bold block">
                    DADOS DO DOCUMENTO
                  </span>
                  <span className="text-xs font-black text-gray-900 block mt-0.5">
                    NF-e nº {dadosNfe.numeroNfe} (Série {dadosNfe.serie})
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Emissão: {dadosNfe.dataEmissao}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase font-bold block">
                    VALOR TOTAL & ITENS
                  </span>
                  <span className="text-xs font-black text-emerald-700 block mt-0.5">
                    R$ {dadosNfe.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {itensParaImportar.length} de {dadosNfe.itens.length} itens selecionados
                  </span>
                </div>
              </div>

              {/* Tabela de Itens Detectados */}
              <div className="bg-white rounded-xl border border-[#e5dfd4] overflow-hidden shadow-xs">
                <div className="p-3 bg-[#fbf9f4] border-b border-[#ece7dd] flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">
                    Itens Identificados na Nota Fiscal ({dadosNfe.itens.length})
                  </span>
                  <button
                    type="button"
                    onClick={toggleTodos}
                    className="text-[11px] font-bold text-[#b36d1b] hover:underline"
                  >
                    Alternar Todos
                  </button>
                </div>

                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#faf8f4] text-gray-400 text-[10px] uppercase font-bold border-b border-[#ece7dd]">
                      <tr>
                        <th className="py-2.5 px-3 w-8">#</th>
                        <th className="py-2.5 px-3">Código / SKU</th>
                        <th className="py-2.5 px-3">Descrição da Peça</th>
                        <th className="py-2.5 px-3 text-center">Qtd. Nota</th>
                        <th className="py-2.5 px-3 text-right">Unitário</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ece7dd]">
                      {dadosNfe.itens.map((item) => {
                        const selecionado = itensSelecionados[item.index];
                        return (
                          <tr
                            key={item.index}
                            onClick={() => toggleItem(item.index)}
                            className={`cursor-pointer transition-colors ${
                              selecionado ? 'bg-[#f0fdf4]/50 hover:bg-[#f0fdf4]' : 'bg-gray-50/50 hover:bg-gray-100/70 text-gray-400'
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                  selecionado
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-gray-300 bg-white'
                                }`}
                              >
                                {selecionado && <FiCheck className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                              {item.codigo}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-gray-800 block truncate max-w-xs">
                                {item.nome}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                EAN: {item.ean || 'N/A'} • NCM: {item.ncm}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-gray-900">
                              +{item.quantidade} un.
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-gray-600">
                              R$ {item.valorUnitario.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                              R$ {item.valorTotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botão de Trocar Arquivo */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-mono text-[11px]">
                  Arquivo: {arquivoNome}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDadosNfe(null);
                    setArquivoNome('');
                  }}
                  className="text-xs text-gray-600 hover:text-red-600 underline font-semibold"
                >
                  Carregar outro XML
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-[#ece7de] bg-[#f5f1e8]/40 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={processando}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>

          {dadosNfe && (
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={processando || itensParaImportar.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              <FiCheckCircle className="w-4 h-4" />
              Confirmar Entrada de {itensParaImportar.length} Itens
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
