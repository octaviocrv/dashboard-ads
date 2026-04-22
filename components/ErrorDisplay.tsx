import { TratadorErros, EstadoErro } from '../utils/validacoes';

interface ErrorDisplayProps {
  erro: EstadoErro | null;
  onTentarNovamente?: () => void;
  className?: string;
}

export default function ErrorDisplay({ erro, onTentarNovamente, className = '' }: ErrorDisplayProps) {
  if (!erro) return null;

  const icone = TratadorErros.obterIconeErro(erro.tipo);
  const cores = TratadorErros.obterCorErro(erro.tipo);

  return (
    <div className={`p-4 rounded-lg border flex items-start gap-3 ${cores} ${className}`}>
      <span className="text-2xl flex-shrink-0">{icone}</span>
      
      <div className="flex-1">
        <h3 className="font-medium text-sm mb-1">
          {erro.mensagem}
        </h3>
        
        {erro.detalhes && (
          <p className="text-xs opacity-80 mb-2">
            {erro.detalhes}
          </p>
        )}
        
        <div className="flex gap-2">
          {onTentarNovamente && erro.tipo !== 'validation' && (
            <button
              onClick={onTentarNovamente}
              className="text-xs px-3 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
            >
              Tentar Novamente
            </button>
          )}
          
          {erro.tipo === 'network' && (
            <span className="text-xs opacity-60">
              Verifique sua conexão
            </span>
          )}
          
          {erro.tipo === 'api' && (
            <span className="text-xs opacity-60">
              Configure as credenciais
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Estados visuais para diferentes cenários
interface EstadoVazioProps {
  titulo?: string;
  descricao?: string;
  acao?: {
    texto: string;
    onClick: () => void;
  };
}

export function EstadoVazio({ 
  titulo = "Nenhuma campanha encontrada",
  descricao = "Experimente alterar o período ou verificar se existem campanhas ativas",
  acao
}: EstadoVazioProps) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📭</div>
      <h3 className="text-xl font-medium text-white mb-2">{titulo}</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">{descricao}</p>
      
      {acao && (
        <button
          onClick={acao.onClick}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition-colors"
        >
          {acao.texto}
        </button>
      )}
    </div>
  );
}

interface LoadingStateProps {
  mensagem?: string;
}

export function LoadingState({ mensagem = "Carregando dados..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="w-8 h-8 border-4 border-transparent border-t-blue-300 rounded-full animate-spin absolute top-2 left-2"></div>
      </div>
      <p className="text-gray-400 mt-4">{mensagem}</p>
    </div>
  );
}