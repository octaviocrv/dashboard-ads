"use client";

import { useState, useEffect } from 'react';
import FiltrosPainel from '../components/FiltrosPainel';
import ErrorDisplay, { EstadoVazio, LoadingState } from '../components/ErrorDisplay';
import { TratadorErros, EstadoErro, filtrarCampanhasPorNome } from '../utils/validacoes';
import { formatarDataBR, dataHojeLocal, dataHaNDiasLocal } from '../utils/data';

interface Filtros {
  dataInicio: string;
  dataFim: string;
  nomeCampanha: string;
}

interface Campanha {
  id: string;
  nome: string;

  gasto: string;
  cpc: string;
  cpm: string;
  ctr: string;
  frequencia: string;

  gastoNumerico: number;
  impressoes: number;
  linkClicks: number;
}

function formatarNumeroGrande(numero: number): string {
  if (numero >= 1000000) {
    return `${(numero / 1000000).toFixed(1)} mi`;
  }

  if (numero >= 1000) {
    return `${(numero / 1000).toFixed(1)} mil`;
  }

  return numero.toLocaleString('pt-BR');
}

export default function Dashboard() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [todasCampanhas, setTodasCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<EstadoErro | null>(null);

  const [filtros, setFiltros] = useState<Filtros>(() => ({
    dataInicio: dataHaNDiasLocal(30),
    dataFim: dataHojeLocal(),
    nomeCampanha: ''
  }));

  const [filtrosPadrao] = useState(() => ({
    dataInicio: dataHaNDiasLocal(30),
    dataFim: dataHojeLocal()
  }));

  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const temFiltrosAtivos =
    !!filtros.nomeCampanha ||
    filtros.dataInicio !== filtrosPadrao.dataInicio ||
    filtros.dataFim !== filtrosPadrao.dataFim;

  const temPeriodoCustomizado =
    filtros.dataInicio !== filtrosPadrao.dataInicio ||
    filtros.dataFim !== filtrosPadrao.dataFim;

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarDados(filtrosEspecificos?: Filtros) {
    setLoading(true);
    setErro(null);

    const filtrosParaUsar = filtrosEspecificos || filtros;

    try {
      const params = new URLSearchParams({
        dataInicio: filtrosParaUsar.dataInicio,
        dataFim: filtrosParaUsar.dataFim
      });

      const res = await fetch(`/api/campanhas?${params.toString()}`);
      const dados = await res.json();

      if (!res.ok || dados.error) {
        const estadoErro = TratadorErros.analisarErroAPI(
          new Error(dados.error || `${res.status} ${res.statusText}`),
          dados
        );
        setErro(estadoErro);
        setCampanhas([]);
        setTodasCampanhas([]);
        return;
      }

      if (!dados || (Array.isArray(dados.data) && dados.data.length === 0)) {
        setErro({
          tipo: 'empty',
          mensagem: dados.message || 'Nenhuma campanha encontrada',
          detalhes: `Período pesquisado: ${formatarDataBR(filtrosParaUsar.dataInicio)} até ${formatarDataBR(filtrosParaUsar.dataFim)}`
        });
        setCampanhas([]);
        setTodasCampanhas([]);
        return;
      }

      const campanhasValidas = Array.isArray(dados) ? dados : dados.data || [];
      setCampanhas(campanhasValidas);
      setTodasCampanhas(campanhasValidas);
      setErro(null);
    } catch (error: any) {
      console.error('Erro ao carregar campanhas:', error);
      const estadoErro = TratadorErros.analisarErroAPI(error);
      setErro(estadoErro);
      setCampanhas([]);
      setTodasCampanhas([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const campanhasFiltradas = filtrarCampanhasPorNome(
      todasCampanhas,
      filtros.nomeCampanha
    );
    setCampanhas(campanhasFiltradas);
  }, [filtros.nomeCampanha, todasCampanhas]);

  const limparSomenteNome = () => {
    setFiltros((prev) => ({ ...prev, nomeCampanha: '' }));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 p-8 text-white">
        <h1 className="text-3xl font-bold mb-8">Dashboard de Tráfego</h1>
        <LoadingState mensagem="Carregando métricas da Meta..." />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 p-8 text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard de Tráfego</h1>

        <div className="flex items-center gap-4">
          {temFiltrosAtivos && (
            <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filtros ativos
            </span>
          )}

          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              mostrarFiltros
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            {mostrarFiltros ? 'Ocultar Filtros' : 'Filtros'}
          </button>
        </div>
      </div>

      {mostrarFiltros && (
        <FiltrosPainel
          filtros={filtros}
          setFiltros={setFiltros}
          onRecarregar={carregarDados}
          loading={loading}
          totalCampanhas={todasCampanhas.length}
          campanhasFiltradas={campanhas.length}
          filtrosPadrao={filtrosPadrao}
        />
      )}

      {!mostrarFiltros && temFiltrosAtivos && (
        <div className="mb-6 p-3 bg-gray-900/50 border border-gray-800 rounded-lg">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span>Filtros ativos:</span>

            {temPeriodoCustomizado && (
              <span className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs">
                📅 {formatarDataBR(filtros.dataInicio)} até {formatarDataBR(filtros.dataFim)}
              </span>
            )}

            {filtros.nomeCampanha && (
              <span className="bg-emerald-600/20 text-emerald-300 px-2 py-1 rounded text-xs">
                🔍 "{filtros.nomeCampanha}"
              </span>
            )}

            <button
              onClick={() => setMostrarFiltros(true)}
              className="text-blue-400 hover:text-blue-300 text-xs underline ml-auto"
            >
              Editar filtros
            </button>
          </div>
        </div>
      )}

      {erro && (
        <ErrorDisplay
          erro={erro}
          onTentarNovamente={erro.tipo !== 'empty' ? () => carregarDados() : undefined}
          className="mb-6"
        />
      )}

      {!erro && campanhas.length === 0 && todasCampanhas.length > 0 ? (
        <EstadoVazio
          titulo="Nenhuma campanha encontrada com esse filtro"
          descricao={`Não há campanhas que contenham "${filtros.nomeCampanha}" no nome`}
          acao={{
            texto: 'Limpar Filtro',
            onClick: limparSomenteNome
          }}
        />
      ) : !erro && campanhas.length > 0 ? (
        <>
          {!mostrarFiltros && todasCampanhas.length > 0 && (
            <div className="mb-6 text-sm text-gray-400">
              {filtros.nomeCampanha ? (
                <span>
                  Mostrando <span className="text-white font-medium">{campanhas.length}</span> de{' '}
                  <span className="text-white font-medium">{todasCampanhas.length}</span> campanhas
                  {' • '}
                  <span className="text-blue-400">Filtradas por: "{filtros.nomeCampanha}"</span>
                </span>
              ) : (
                <span>
                  <span className="text-white font-medium">{todasCampanhas.length}</span> campanha
                  {todasCampanhas.length !== 1 ? 's' : ''} encontrada
                  {todasCampanhas.length !== 1 ? 's' : ''}
                  {' • '}
                  <span className="text-gray-500">
                    Período: {formatarDataBR(filtros.dataInicio)} até {formatarDataBR(filtros.dataFim)}
                  </span>
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {campanhas.map((camp) => (
              <div
                key={camp.id}
                className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg hover:border-blue-500 transition-colors"
              >
                <h2 className="text-sm text-gray-400 mb-4 truncate" title={camp.nome}>
                  {camp.nome}
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Investimento</p>
                    <p className="text-2xl font-bold text-white">{camp.gasto}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">CPM</p>
                    <p className="text-lg font-semibold text-gray-300">{camp.cpm}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-800 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-400 mb-1">CTR</p>
                    <p className="text-sm font-bold text-cyan-400">{camp.ctr}</p>
                  </div>

                  <div className="bg-gray-800 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-400 mb-1">CPC</p>
                    <p className="text-sm font-bold text-amber-300">{camp.cpc}</p>
                  </div>

                  <div className="bg-gray-800 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-400 mb-1">Cliques</p>
                    <p className="text-sm font-bold text-emerald-400">
                      {formatarNumeroGrande(camp.linkClicks)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Impressões</p>
                    <p className="text-sm font-semibold text-gray-300">
                      {formatarNumeroGrande(camp.impressoes)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Frequência</p>
                    <p className="text-sm font-semibold text-yellow-400">{camp.frequencia}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </main>
  );
}