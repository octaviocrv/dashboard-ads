"use client";

import { useState, useEffect } from 'react';
import FiltrosPainel from '../components/FiltrosPainel';
import ErrorDisplay, { EstadoVazio, LoadingState } from '../components/ErrorDisplay';
import { TratadorErros, EstadoErro, filtrarCampanhasPorNome } from '../utils/validacoes';

// 1. Interface para os filtros
interface Filtros {
  dataInicio: string;
  dataFim: string;
  nomeCampanha: string;
}

// 2. Interface completa com todas as métricas
interface Campanha {
  id: string;
  nome: string;
  gasto: string;
  cpc: string;
  mqls: number;
  reunioes: number;
  ctr: string;
  frequencia: string;
  custoPorMql: string;
  custoPorReuniao: string;
}

export default function Dashboard() {
  // Estados principais
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [todasCampanhas, setTodasCampanhas] = useState<Campanha[]>([]); // Para filtros locais
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<EstadoErro | null>(null);
  
  // Estados dos filtros
  const [filtros, setFiltros] = useState<Filtros>({
    dataInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias atrás
    dataFim: new Date().toISOString().split('T')[0], // hoje
    nomeCampanha: ''
  });  
  // 5. Estado para controlar visibilidade dos filtros
  const [mostrarFiltros, setMostrarFiltros] = useState(false);  
  // Carregamento inicial apenas - sem reagir automaticamente às mudanças de filtro
  useEffect(() => {
    carregarDados();
  }, []); // Array vazio = executa apenas uma vez no mount

  async function carregarDados() {
    setLoading(true);
    setErro(null);
    
    try {
      const params = new URLSearchParams({
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim
      });
      
      const res = await fetch(`/api/campanhas?${params.toString()}`);
      const dados = await res.json();
      
      // Tratar erros específicos da API
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

      // Tratar caso de dados vazios
      if (!dados || (Array.isArray(dados.data) && dados.data.length === 0)) {
        setErro({
          tipo: 'empty',
          mensagem: dados.message || 'Nenhuma campanha encontrada',
          detalhes: `Período pesquisado: ${new Date(filtros.dataInicio).toLocaleDateString('pt-BR')} até ${new Date(filtros.dataFim).toLocaleDateString('pt-BR')}`
        });
        setCampanhas([]);
        setTodasCampanhas([]);
        return;
      }

      // Dados válidos
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

  // Aplicar filtro de nome localmente em tempo real
  useEffect(() => {
    const campanhasFiltradas = filtrarCampanhasPorNome(todasCampanhas, filtros.nomeCampanha);
    setCampanhas(campanhasFiltradas);
  }, [filtros.nomeCampanha, todasCampanhas]);

  // Estados de renderização  
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
      {/* Header com Título e Botão de Filtros */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard de Tráfego</h1>
        
        <div className="flex items-center gap-4">
          {/* Indicador de filtros ativos */}
          {(filtros.nomeCampanha || 
            filtros.dataInicio !== new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ||
            filtros.dataFim !== new Date().toISOString().split('T')[0]) && (
            <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {mostrarFiltros ? 'Ocultar Filtros' : 'Filtros'}
          </button>
        </div>
      </div>
      
      {/* Painel de Filtros - Exibido Condicionalmente */}
      {mostrarFiltros && (
        <FiltrosPainel
          filtros={filtros}
          setFiltros={setFiltros}
          onRecarregar={carregarDados}
          loading={loading}
          totalCampanhas={todasCampanhas.length}
          campanhasFiltradas={campanhas.length}
        />
      )}
      
      {/* Resumo dos filtros ativos quando painel está oculto */}
      {!mostrarFiltros && (filtros.nomeCampanha || 
        filtros.dataInicio !== new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ||
        filtros.dataFim !== new Date().toISOString().split('T')[0]) && (
        <div className="mb-6 p-3 bg-gray-900/50 border border-gray-800 rounded-lg">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span>Filtros ativos:</span>
            
            {/* Período personalizado */}
            {(filtros.dataInicio !== new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ||
              filtros.dataFim !== new Date().toISOString().split('T')[0]) && (
              <span className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs">
                📅 {new Date(filtros.dataInicio).toLocaleDateString('pt-BR')} até {new Date(filtros.dataFim).toLocaleDateString('pt-BR')}
              </span>
            )}
            
            {/* Filtro de nome */}
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

      {/* Mostrar erro se houver */}
      {erro && (
        <ErrorDisplay 
          erro={erro}
          onTentarNovamente={erro.tipo !== 'empty' ? carregarDados : undefined}
          className="mb-6"
        />
      )}

      {/* Mostrar campanhas ou estado vazio */}
      {!erro && campanhas.length === 0 && todasCampanhas.length > 0 ? (
        <EstadoVazio
          titulo="Nenhuma campanha encontrada com esse filtro"
          descricao={`Não há campanhas que contenham "${filtros.nomeCampanha}" no nome`}
          acao={{
            texto: 'Limpar Filtro',
            onClick: () => setFiltros(prev => ({ ...prev, nomeCampanha: '' }))
          }}
        />
      ) : !erro && campanhas.length > 0 ? (
        <>
          {/* Contador de resultados quando filtros estão ocultos */}
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
                  <span className="text-white font-medium">{todasCampanhas.length}</span> campanha{todasCampanhas.length !== 1 ? 's' : ''} encontrada{todasCampanhas.length !== 1 ? 's' : ''}
                  {' • '}
                  <span className="text-gray-500">
                    Período: {new Date(filtros.dataInicio).toLocaleDateString('pt-BR')} até {new Date(filtros.dataFim).toLocaleDateString('pt-BR')}
                  </span>
                </span>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campanhas.map((camp) => (
          <div key={camp.id} className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg hover:border-blue-500 transition-colors">
            <h2 className="text-sm text-gray-400 mb-4 truncate" title={camp.nome}>{camp.nome}</h2>
            
            {/* Métricas principais */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Valor Gasto</p>
                <p className="text-2xl font-bold text-white">{camp.gasto}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">CPC</p>
                <p className="text-lg font-semibold text-gray-300">{camp.cpc}</p>
              </div>
            </div>

            {/* Métricas de conversão */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-800 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-400 mb-1">MQLs Agendados</p>
                <p className="text-xl font-bold text-blue-400">{camp.mqls}</p>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="text-gray-600">Custo/MQL:</span> {camp.custoPorMql}
                </p>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-400 mb-1">Reuniões</p>
                <p className="text-xl font-bold text-emerald-400">{camp.reunioes}</p>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="text-gray-600">Custo/Reunião:</span> {camp.custoPorReuniao}
                </p>
              </div>
            </div>

            {/* Métricas de performance */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">CTR</p>
                <p className="text-sm font-semibold text-cyan-400">{camp.ctr}</p>
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