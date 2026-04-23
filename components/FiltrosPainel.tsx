"use client";

import { useEffect, useMemo, useState } from 'react';
import { ValidadorDatas } from '../utils/validacoes';
import { formatarDataBR, dataHojeLocal, dataHaNDiasLocal } from '../utils/data';

interface Filtros {
  dataInicio: string;
  dataFim: string;
  nomeCampanha: string;
}

interface FiltrosProps {
  filtros: Filtros;
  setFiltros: React.Dispatch<React.SetStateAction<Filtros>>;
  onRecarregar: (filtrosEspecificos?: Filtros) => void;
  loading: boolean;
  totalCampanhas: number;
  campanhasFiltradas: number;
  filtrosPadrao: {
    dataInicio: string;
    dataFim: string;
  };
}

export default function FiltrosPainel({
  filtros,
  setFiltros,
  onRecarregar,
  loading,
  totalCampanhas,
  campanhasFiltradas,
  filtrosPadrao
}: FiltrosProps) {
  const [filtrosTemp, setFiltrosTemp] = useState({
    dataInicio: filtros.dataInicio,
    dataFim: filtros.dataFim
  });

  const [validacoes, setValidacoes] = useState<{
    dataInicio?: string;
    dataFim?: string;
    periodo?: string;
  }>({});

  useEffect(() => {
    setFiltrosTemp({
      dataInicio: filtros.dataInicio,
      dataFim: filtros.dataFim
    });
  }, [filtros.dataInicio, filtros.dataFim]);

  const temMudancasData =
    filtrosTemp.dataInicio !== filtros.dataInicio ||
    filtrosTemp.dataFim !== filtros.dataFim;

  const temErrosValidacao = Object.keys(validacoes).length > 0;

  const temFiltrosAtivos = useMemo(() => {
    return (
      !!filtros.nomeCampanha ||
      filtros.dataInicio !== filtrosPadrao.dataInicio ||
      filtros.dataFim !== filtrosPadrao.dataFim
    );
  }, [filtros, filtrosPadrao]);

  function validarCampos() {
    const novosErros: {
      dataInicio?: string;
      dataFim?: string;
      periodo?: string;
    } = {};

    if (filtrosTemp.dataInicio) {
      const validacaoInicio = ValidadorDatas.validarData(filtrosTemp.dataInicio);
      if (!validacaoInicio.valida) {
        novosErros.dataInicio = validacaoInicio.erro;
      }
    }

    if (filtrosTemp.dataFim) {
      const validacaoFim = ValidadorDatas.validarData(filtrosTemp.dataFim);
      if (!validacaoFim.valida) {
        novosErros.dataFim = validacaoFim.erro;
      }
    }

    if (filtrosTemp.dataInicio && filtrosTemp.dataFim && 
        ValidadorDatas.validarData(filtrosTemp.dataInicio).valida && 
        ValidadorDatas.validarData(filtrosTemp.dataFim).valida) {
      
      const validacaoPeriodo = ValidadorDatas.validarPeriodo(
        filtrosTemp.dataInicio,
        filtrosTemp.dataFim
      );

      if (!validacaoPeriodo.valida) {
        novosErros.periodo = validacaoPeriodo.erro;
      }
    }

    setValidacoes(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function aplicarFiltros() {
    if (!validarCampos()) return;

    const novosFiltros: Filtros = {
      dataInicio: filtrosTemp.dataInicio || filtrosPadrao.dataInicio,
      dataFim: filtrosTemp.dataFim || filtrosPadrao.dataFim,
      nomeCampanha: filtros.nomeCampanha
    };

    setFiltros(novosFiltros);
    onRecarregar(novosFiltros);
  }

  function aplicarPresetData(dias: number) {
    const dataFim = dataHojeLocal();
    const dataInicio = dataHaNDiasLocal(dias);

    setValidacoes({});
    setFiltrosTemp({ dataInicio, dataFim });

    const novosFiltros: Filtros = {
      dataInicio,
      dataFim,
      nomeCampanha: filtros.nomeCampanha
    };

    setFiltros(novosFiltros);
    onRecarregar(novosFiltros);
  }

  function limparFiltros() {
    setValidacoes({});

    const filtrosLimpos: Filtros = {
      dataInicio: '',
      dataFim: '',
      nomeCampanha: ''
    };

    //  filtros temporários imediatamente 
    setFiltrosTemp({
      dataInicio: '',
      dataFim: ''
    });

    // att filtros principais
    setFiltros(filtrosLimpos);
    // chamar onRecarregar com campos vazios pois geraria erro na API
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Filtros de Pesquisa</h3>

        <button
          onClick={limparFiltros}
          className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
          disabled={loading}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Limpar Tudo
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => aplicarPresetData(7)}
          type="button"
          className="px-3 py-1.5 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          Últimos 7 dias
        </button>

        <button
          onClick={() => aplicarPresetData(15)}
          type="button"
          className="px-3 py-1.5 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          Últimos 15 dias
        </button>

        <button
          onClick={() => aplicarPresetData(30)}
          type="button"
          className="px-3 py-1.5 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          Últimos 30 dias
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">
            Data Início
          </label>
          <input
            type="date"
            value={filtrosTemp.dataInicio}
            onChange={(e) => {
              const novoValor = e.target.value;
              setFiltrosTemp((prev) => ({ ...prev, dataInicio: novoValor }));

              if (validacoes.dataInicio || validacoes.periodo) {
                setValidacoes((prev) => ({
                  ...prev,
                  dataInicio: undefined,
                  periodo: undefined
                }));
              }
            }}
            className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-white focus:outline-none transition-colors ${
              validacoes.dataInicio
                ? 'border-red-500 focus:border-red-400'
                : 'border-gray-700 focus:border-blue-500'
            }`}
          />
          {validacoes.dataInicio && (
            <p className="text-red-400 text-xs mt-1">⚠️ {validacoes.dataInicio}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">
            Data Fim
          </label>
          <input
            type="date"
            value={filtrosTemp.dataFim}
            onChange={(e) => {
              const novoValor = e.target.value;
              setFiltrosTemp((prev) => ({ ...prev, dataFim: novoValor }));

              if (validacoes.dataFim || validacoes.periodo) {
                setValidacoes((prev) => ({
                  ...prev,
                  dataFim: undefined,
                  periodo: undefined
                }));
              }
            }}
            className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-white focus:outline-none transition-colors ${
              validacoes.dataFim
                ? 'border-red-500 focus:border-red-400'
                : 'border-gray-700 focus:border-blue-500'
            }`}
          />
          {validacoes.dataFim && (
            <p className="text-red-400 text-xs mt-1">⚠️ {validacoes.dataFim}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">
            Nome da Campanha
          </label>
          <input
            type="text"
            placeholder="Buscar campanha..."
            value={filtros.nomeCampanha}
            onChange={(e) =>
              setFiltros((prev) => ({ ...prev, nomeCampanha: e.target.value }))
            }
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={aplicarFiltros}
            disabled={loading || temErrosValidacao}
            className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
              temErrosValidacao
                ? 'bg-red-600/50 text-red-200 cursor-not-allowed'
                : loading
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Carregando...' : 'Aplicar Filtros'}
          </button>
        </div>
      </div>

      {validacoes.periodo && (
        <div className="mb-4 p-3 rounded-lg bg-red-600/10 border border-red-600/30 text-red-300 text-sm">
          ⚠️ {validacoes.periodo}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400 border-t border-gray-800 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            Período atual: <span className="text-gray-200">{formatarDataBR(filtros.dataInicio)}</span> até{' '}
            <span className="text-gray-200">{formatarDataBR(filtros.dataFim)}</span>
          </span>

          {filtros.nomeCampanha && (
            <span>
              Nome: <span className="text-gray-200">"{filtros.nomeCampanha}"</span>
            </span>
          )}

          {temFiltrosAtivos && (
            <span className="text-blue-300">Filtros ativos</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span>Total carregado: {totalCampanhas}</span>
          <span>Exibidas: {campanhasFiltradas}</span>
        </div>
      </div>
    </div>
  );
}