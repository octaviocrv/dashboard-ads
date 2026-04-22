import { useState } from 'react';
import { ValidadorDatas, ValidacaoData } from '../utils/validacoes';

interface FiltrosProps {
  filtros: {
    dataInicio: string;
    dataFim: string;
    nomeCampanha: string;
  };
  setFiltros: React.Dispatch<React.SetStateAction<{
    dataInicio: string;
    dataFim: string;
    nomeCampanha: string;
  }>>;
  onRecarregar: () => void;
  loading: boolean;
  totalCampanhas: number;
  campanhasFiltradas: number;
}

export default function FiltrosPainel({ 
  filtros, 
  setFiltros, 
  onRecarregar, 
  loading, 
  totalCampanhas, 
  campanhasFiltradas 
}: FiltrosProps) {
  
  // Estado local para filtros de data temporários (antes de aplicar)
  const [filtrosTemp, setFiltrosTemp] = useState({
    dataInicio: filtros.dataInicio,
    dataFim: filtros.dataFim
  });
  
  // Estado para validações
  const [validacoes, setValidacoes] = useState<{
    dataInicio?: string;
    dataFim?: string;
    periodo?: string;
  }>({});
  
  // Verifica se há mudanças não aplicadas nos filtros de data
  const temMudancasData = 
    filtrosTemp.dataInicio !== filtros.dataInicio || 
    filtrosTemp.dataFim !== filtros.dataFim;

  // Verifica se há erros de validação
  const temErrosValidacao = Object.keys(validacoes).length > 0;

  function validarCampos() {
    const novosErros: any = {};
    
    // Validar data início
    const validacaoInicio = ValidadorDatas.validarData(filtrosTemp.dataInicio);
    if (!validacaoInicio.valida) {
      novosErros.dataInicio = validacaoInicio.erro;
    }
    
    // Validar data fim
    const validacaoFim = ValidadorDatas.validarData(filtrosTemp.dataFim);
    if (!validacaoFim.valida) {
      novosErros.dataFim = validacaoFim.erro;
    }
    
    // Se datas individuais são válidas, validar período
    if (validacaoInicio.valida && validacaoFim.valida) {
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
    if (!validarCampos()) {
      return; // Não aplicar se há erros
    }
    
    setFiltros(prev => ({
      ...prev,
      dataInicio: filtrosTemp.dataInicio,
      dataFim: filtrosTemp.dataFim
    }));
    onRecarregar();
  }
  
  function aplicarPresetData(dias: number) {
    const dataFim = new Date().toISOString().split('T')[0];
    const dataInicio = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    setFiltrosTemp({ dataInicio, dataFim });
    setFiltros(prev => ({ ...prev, dataInicio, dataFim }));
    onRecarregar();
  }

  function limparFiltros() {
    const filtrosReset = {
      dataInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dataFim: new Date().toISOString().split('T')[0],
      nomeCampanha: ''
    };
    setFiltrosTemp({ dataInicio: filtrosReset.dataInicio, dataFim: filtrosReset.dataFim });
    setFiltros(filtrosReset);
    onRecarregar();
  }

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Filtros de Pesquisa</h3>
          <button
            onClick={limparFiltros}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Filtro de Data Início */}
          <div>
            <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">
              Data Início
            </label>
            <input
              type="date"
              value={filtrosTemp.dataInicio}
              onChange={(e) => {
                setFiltrosTemp(prev => ({ ...prev, dataInicio: e.target.value }));
                // Limpar erro ao alterar
                if (validacoes.dataInicio || validacoes.periodo) {
                  setValidacoes(prev => ({ ...prev, dataInicio: undefined, periodo: undefined }));
                }
              }}
              className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-white focus:outline-none transition-colors ${
                validacoes.dataInicio 
                  ? 'border-red-500 focus:border-red-400' 
                  : 'border-gray-700 focus:border-blue-500'
              }`}
            />
            {validacoes.dataInicio && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                ⚠️ {validacoes.dataInicio}
              </p>
            )}
          </div>
          
          {/* Filtro de Data Fim */}
          <div>
            <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">
              Data Fim
            </label>
            <input
              type="date"
              value={filtrosTemp.dataFim}
              onChange={(e) => {
                setFiltrosTemp(prev => ({ ...prev, dataFim: e.target.value }));
                // Limpar erro ao alterar
                if (validacoes.dataFim || validacoes.periodo) {
                  setValidacoes(prev => ({ ...prev, dataFim: undefined, periodo: undefined }));
                }
              }}
              className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-white focus:outline-none transition-colors ${
                validacoes.dataFim 
                  ? 'border-red-500 focus:border-red-400' 
                  : 'border-gray-700 focus:border-blue-500'
              }`}
            />
            {validacoes.dataFim && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                ⚠️ {validacoes.dataFim}
              </p>
            )}
          </div>
          
          {/* Busca por Nome */}
          <div>
            <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">
              Nome da Campanha
            </label>
            <input
              type="text"
              placeholder="Buscar campanha..."
              value={filtros.nomeCampanha}
              onChange={(e) => setFiltros(prev => ({ ...prev, nomeCampanha: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          {/* Botão de Recarregar */}
          <div className="flex items-end">
            <button
              onClick={aplicarFiltros}
              disabled={loading || (!temMudancasData && !temErrosValidacao)}
              className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                temErrosValidacao
                  ? 'bg-red-600/50 text-red-200 cursor-not-allowed'
                  : temMudancasData && !loading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : loading 
                      ? 'bg-gray-700 text-gray-400' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Carregando...
                </>
              ) : temErrosValidacao ? (
                <>
                  ⚠️ Corrigir Erros
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {temMudancasData ? 'Aplicar Filtros' : 'Atualizar'}
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Erro de período (afeta ambas as datas) */}
        {validacoes.periodo && (
          <div className="mt-4 p-3 bg-red-600/20 border border-red-600/30 rounded-lg flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-400 text-sm">
              <strong>Período inválido:</strong> {validacoes.periodo}
            </span>
          </div>
        )}
        
        {/* Alerta de mudanças não aplicadas */}
        {temMudancasData && !temErrosValidacao && (
          <div className="mt-4 p-3 bg-yellow-600/20 border border-yellow-600/30 rounded-lg flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-yellow-400 text-sm">
              Você alterou as datas. Clique em <strong>"Aplicar Filtros"</strong> para atualizar os dados.
            </span>
          </div>
        )}
        
        {/* Presets de Data */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs text-gray-400 mr-2 flex items-center">Períodos rápidos:</span>
          {[
            { label: 'Últimos 7 dias', dias: 7 },
            { label: 'Últimos 15 dias', dias: 15 },
            { label: 'Últimos 30 dias', dias: 30 },
            { label: 'Últimos 60 dias', dias: 60 },
            { label: 'Últimos 90 dias', dias: 90 }
          ].map((preset) => (
            <button
              key={preset.dias}
              onClick={() => aplicarPresetData(preset.dias)}
              className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded text-xs transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Indicador de Dados */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-sm text-gray-400">
          Mostrando <span className="text-white font-medium">{campanhasFiltradas}</span> de <span className="text-white font-medium">{totalCampanhas}</span> campanhas
          {filtros.nomeCampanha && (
            <>
              {' • '}
              <span className="text-blue-400">Filtro: "{filtros.nomeCampanha}"</span>
            </>
          )}
          {temMudancasData && (
            <>
              {' • '}
              <span className="text-yellow-400 font-medium">Filtros alterados</span>
            </>
          )}
        </p>
        <p className="text-xs text-gray-500">
          Período: {new Date(filtros.dataInicio).toLocaleDateString('pt-BR')} até {new Date(filtros.dataFim).toLocaleDateString('pt-BR')}
        </p>
      </div>
    </>
  );
}