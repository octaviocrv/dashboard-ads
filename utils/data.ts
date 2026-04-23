export function dataHojeLocal(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function dataHaNDiasLocal(diasAtras: number): string {
  const data = new Date();
  data.setDate(data.getDate() - diasAtras);
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function formatarDataBR(dataStr: string): string {
  try {
    const partes = dataStr.split("-");
    if (partes.length !== 3) {
      return dataStr;
    }

    const ano = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);

    const data = new Date(ano, mes, dia);

    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dataStr;
  }
}

export interface ValidacaoData {
  valida: boolean;
  erro?: string;
}

export interface EstadoErro {
  tipo: "validation" | "api" | "network" | "empty" | null;
  mensagem: string;
  detalhes?: string;
}

export class ValidadorDatas {
  private static parseDataLocal(dataStr: string): Date | null {
    const partes = dataStr.split("-");
    if (partes.length !== 3) return null;

    const ano = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);

    if (isNaN(ano) || isNaN(mes) || isNaN(dia)) return null;

    return new Date(ano, mes, dia);
  }

  static validarData(dataStr: string): ValidacaoData {
    if (!dataStr || dataStr.trim() === "") {
      return { valida: false, erro: "Data é obrigatória" };
    }

    const data = this.parseDataLocal(dataStr);

    if (!data || isNaN(data.getTime())) {
      return { valida: false, erro: "Data inválida ou mal formatada" };
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const umDiaNoFuturo = new Date(hoje);
    umDiaNoFuturo.setDate(umDiaNoFuturo.getDate() + 1);

    if (data > umDiaNoFuturo) {
      return { valida: false, erro: "Data não pode ser no futuro" };
    }

    const doisAnosAtras = new Date();
    doisAnosAtras.setFullYear(doisAnosAtras.getFullYear() - 2);
    doisAnosAtras.setHours(0, 0, 0, 0);

    if (data < doisAnosAtras) {
      return {
        valida: false,
        erro: "Data não pode ser superior a 2 anos atrás",
      };
    }

    return { valida: true };
  }

  static validarPeriodo(dataInicio: string, dataFim: string): ValidacaoData {
    const validacaoInicio = this.validarData(dataInicio);
    if (!validacaoInicio.valida) {
      return { valida: false, erro: `Data inicial: ${validacaoInicio.erro}` };
    }

    const validacaoFim = this.validarData(dataFim);
    if (!validacaoFim.valida) {
      return { valida: false, erro: `Data final: ${validacaoFim.erro}` };
    }

    const inicio = this.parseDataLocal(dataInicio);
    const fim = this.parseDataLocal(dataFim);

    if (!inicio || !fim) {
      return { valida: false, erro: "Erro no processamento das datas" };
    }

    if (inicio >= fim) {
      return {
        valida: false,
        erro: "Data inicial deve ser anterior à data final",
      };
    }

    const umAno = 365 * 24 * 60 * 60 * 1000;
    if (fim.getTime() - inicio.getTime() > umAno) {
      return {
        valida: false,
        erro: "Período não pode ser superior a 1 ano",
      };
    }

    const umDia = 24 * 60 * 60 * 1000;
    if (fim.getTime() - inicio.getTime() < umDia) {
      return {
        valida: false,
        erro: "Período deve ter pelo menos 1 dia",
      };
    }

    return { valida: true };
  }
}

export class TratadorErros {
  static analisarErroAPI(error: any, data?: any): EstadoErro {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return {
        tipo: "network",
        mensagem: "Erro de conexão",
        detalhes: "Verifique sua conexão com a internet",
      };
    }

    if (error.message?.includes("401") || error.message?.includes("403")) {
      return {
        tipo: "api",
        mensagem: "Erro de autenticação",
        detalhes: "Token do Facebook pode estar expirado ou inválido",
      };
    }

    if (error.message?.includes("429")) {
      return {
        tipo: "api",
        mensagem: "Muitas requisições",
        detalhes: "Aguarde alguns minutos antes de tentar novamente",
      };
    }

    if (data && Array.isArray(data) && data.length === 0) {
      return {
        tipo: "empty",
        mensagem: "Nenhuma campanha encontrada",
        detalhes:
          "Experimente alterar o período ou verificar se existem campanhas ativas",
      };
    }

    if (error.message?.includes("API") || error.message?.includes("Facebook")) {
      return {
        tipo: "api",
        mensagem: "Erro na API do Facebook",
        detalhes: error.message || "Erro desconhecido da API",
      };
    }

    return {
      tipo: "api",
      mensagem: "Erro inesperado",
      detalhes: error.message || "Algo deu errado, tente novamente",
    };
  }

  static obterIconeErro(tipo: EstadoErro["tipo"]): string {
    switch (tipo) {
      case "validation":
        return "⚠️";
      case "network":
        return "🌐";
      case "api":
        return "🔧";
      case "empty":
        return "📭";
      default:
        return "❌";
    }
  }

  static obterCorErro(tipo: EstadoErro["tipo"]): string {
    switch (tipo) {
      case "validation":
        return "text-yellow-400 border-yellow-600/30 bg-yellow-600/20";
      case "network":
        return "text-blue-400 border-blue-600/30 bg-blue-600/20";
      case "api":
        return "text-red-400 border-red-600/30 bg-red-600/20";
      case "empty":
        return "text-gray-400 border-gray-600/30 bg-gray-600/20";
      default:
        return "text-red-400 border-red-600/30 bg-red-600/20";
    }
  }
}

export function filtrarCampanhasPorNome(
  campanhas: any[],
  filtroNome: string,
): any[] {
  if (!filtroNome || filtroNome.trim() === "") {
    return campanhas;
  }

  const termo = filtroNome.toLowerCase().trim();

  return campanhas.filter((campanha) => {
    // Verifica se a campanha tem nome válido
    if (!campanha.nome || typeof campanha.nome !== "string") {
      return false;
    }

    return campanha.nome.toLowerCase().includes(termo);
  });
}
