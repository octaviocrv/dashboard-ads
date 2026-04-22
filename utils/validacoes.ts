// Utilitários para validação de datas e tratamento de erros

export interface ValidacaoData {
  valida: boolean;
  erro?: string;
}

export interface EstadoErro {
  tipo: 'validation' | 'api' | 'network' | 'empty' | null;
  mensagem: string;
  detalhes?: string;
}

export class ValidadorDatas {
  static validarData(dataStr: string): ValidacaoData {
    if (!dataStr || dataStr.trim() === '') {
      return { valida: false, erro: 'Data é obrigatória' };
    }

    const data = new Date(dataStr);
    
    // Verifica se é uma data válida
    if (isNaN(data.getTime())) {
      return { valida: false, erro: 'Data inválida ou mal formatada' };
    }

    // Verifica se não é uma data futura demais (mais de 1 dia no futuro)
    const hoje = new Date();
    const umDiaNoFuturo = new Date(hoje.getTime() + 24 * 60 * 60 * 1000);
    
    if (data > umDiaNoFuturo) {
      return { valida: false, erro: 'Data não pode ser no futuro' };
    }

    // Verifica se não é muito antiga (mais de 2 anos)
    const doisAnosAtras = new Date();
    doisAnosAtras.setFullYear(doisAnosAtras.getFullYear() - 2);
    
    if (data < doisAnosAtras) {
      return { valida: false, erro: 'Data não pode ser superior a 2 anos atrás' };
    }

    return { valida: true };
  }

  static validarPeriodo(dataInicio: string, dataFim: string): ValidacaoData {
    // Valida datas individualmente primeiro
    const validacaoInicio = this.validarData(dataInicio);
    if (!validacaoInicio.valida) {
      return { valida: false, erro: `Data inicial: ${validacaoInicio.erro}` };
    }

    const validacaoFim = this.validarData(dataFim);
    if (!validacaoFim.valida) {
      return { valida: false, erro: `Data final: ${validacaoFim.erro}` };
    }

    // Verifica se data inicial é menor que final
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    
    if (inicio >= fim) {
      return { 
        valida: false, 
        erro: 'Data inicial deve ser anterior à data final' 
      };
    }

    // Verifica se o período não é muito longo (máximo 1 ano)
    const umAno = 365 * 24 * 60 * 60 * 1000; // 1 ano em millisegundos
    if (fim.getTime() - inicio.getTime() > umAno) {
      return { 
        valida: false, 
        erro: 'Período não pode ser superior a 1 ano' 
      };
    }

    // Verifica se o período não é muito curto (mínimo 1 dia)
    const umDia = 24 * 60 * 60 * 1000;
    if (fim.getTime() - inicio.getTime() < umDia) {
      return { 
        valida: false, 
        erro: 'Período deve ter pelo menos 1 dia' 
      };
    }

    return { valida: true };
  }

  static formatarDataPtBr(dataStr: string): string {
    try {
      return new Date(dataStr).toLocaleDateString('pt-BR');
    } catch {
      return dataStr;
    }
  }
}

export class TratadorErros {
  static analisarErroAPI(error: any, data?: any): EstadoErro {
    // Erro de rede
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        tipo: 'network',
        mensagem: 'Erro de conexão',
        detalhes: 'Verifique sua conexão com a internet'
      };
    }

    // Erro de autenticação/autorização  
    if (error.message?.includes('401') || error.message?.includes('403')) {
      return {
        tipo: 'api',
        mensagem: 'Erro de autenticação',
        detalhes: 'Token do Facebook pode estar expirado ou inválido'
      };
    }

    // Erro de rate limit
    if (error.message?.includes('429')) {
      return {
        tipo: 'api',
        mensagem: 'Muitas requisições',
        detalhes: 'Aguarde alguns minutos antes de tentar novamente'
      };
    }

    // Dados vazios mas requisição OK
    if (data && Array.isArray(data) && data.length === 0) {
      return {
        tipo: 'empty',
        mensagem: 'Nenhuma campanha encontrada',
        detalhes: 'Experimente alterar o período ou verificar se existem campanhas ativas'
      };
    }

    // Erro genérico da API
    if (error.message?.includes('API') || error.message?.includes('Facebook')) {
      return {
        tipo: 'api',
        mensagem: 'Erro na API do Facebook',
        detalhes: error.message || 'Erro desconhecido da API'
      };
    }

    // Erro genérico
    return {
      tipo: 'api',
      mensagem: 'Erro inesperado',
      detalhes: error.message || 'Algo deu errado, tente novamente'
    };
  }

  static obterIconeErro(tipo: EstadoErro['tipo']): string {
    switch (tipo) {
      case 'validation':
        return '⚠️';
      case 'network':
        return '🌐'; 
      case 'api':
        return '🔧';
      case 'empty':
        return '📭';
      default:
        return '❌';
    }
  }

  static obterCorErro(tipo: EstadoErro['tipo']): string {
    switch (tipo) {
      case 'validation':
        return 'text-yellow-400 border-yellow-600/30 bg-yellow-600/20';
      case 'network':
        return 'text-blue-400 border-blue-600/30 bg-blue-600/20';
      case 'api':
        return 'text-red-400 border-red-600/30 bg-red-600/20';
      case 'empty':
        return 'text-gray-400 border-gray-600/30 bg-gray-600/20';
      default:
        return 'text-red-400 border-red-600/30 bg-red-600/20';
    }
  }
}

export function filtrarCampanhasPorNome(campanhas: any[], filtroNome: string): any[] {
  if (!filtroNome || filtroNome.trim() === '') {
    return campanhas;
  }

  const termo = filtroNome.toLowerCase().trim();
  
  return campanhas.filter(campanha => {
    // Verifica se a campanha tem nome válido
    if (!campanha.nome || typeof campanha.nome !== 'string') {
      return false;
    }
    
    return campanha.nome.toLowerCase().includes(termo);
  });
}