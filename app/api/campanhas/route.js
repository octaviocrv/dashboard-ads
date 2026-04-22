// src/app/api/campanhas/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  // Pegar parâmetros da URL
  const { searchParams } = new URL(request.url);
  const dataInicio = searchParams.get('dataInicio');
  const dataFim = searchParams.get('dataFim');
  
  // Validação de variáveis de ambiente
  const token = process.env.FB_ACCESS_TOKEN;
  const adAccountId = process.env.FB_AD_ACCOUNT_ID;

  if (!token || !adAccountId) {
    return NextResponse.json(
      { 
        error: "Variáveis de ambiente FB_ACCESS_TOKEN e FB_AD_ACCOUNT_ID são obrigatórias",
        tipo: "config"
      },
      { status: 500 }
    );
  }

  // Validação de parâmetros de data
  if (dataInicio && dataFim) {
    // Validar formato das datas
    const dataInicioObj = new Date(dataInicio);
    const dataFimObj = new Date(dataFim);
    
    if (isNaN(dataInicioObj.getTime())) {
      return NextResponse.json(
        { 
          error: "Data inicial inválida ou mal formatada",
          tipo: "validation" 
        },
        { status: 400 }
      );
    }
    
    if (isNaN(dataFimObj.getTime())) {
      return NextResponse.json(
        { 
          error: "Data final inválida ou mal formatada",
          tipo: "validation" 
        },
        { status: 400 }
      );
    }
    
    // Validar se data inicial é menor que final
    if (dataInicioObj >= dataFimObj) {
      return NextResponse.json(
        { 
          error: "Data inicial deve ser anterior à data final",
          tipo: "validation" 
        },
        { status: 400 }
      );
    }
    
    // Validar período não superior a 1 ano
    const umAno = 365 * 24 * 60 * 60 * 1000;
    if (dataFimObj.getTime() - dataInicioObj.getTime() > umAno) {
      return NextResponse.json(
        { 
          error: "Período não pode ser superior a 1 ano",
          tipo: "validation" 
        },
        { status: 400 }
      );
    }
  }

  const accountId = `act_${adAccountId}`;
  const baseUrl = `https://graph.facebook.com/v19.0/${accountId}/insights`;

  // Configurar parâmetros de data
  const paramsObj = {
    access_token: token,
    level: "campaign",
    fields: "campaign_name,campaign_id,spend,cpc,cpm,clicks,conversions,ctr,frequency",
  };

  // Se datas fornecidas, usar range personalizado, senão usar preset
  if (dataInicio && dataFim) {
    paramsObj.time_range = JSON.stringify({
      since: dataInicio,
      until: dataFim
    });
  } else {
    paramsObj.date_preset = "last_30d";
  }

  const params = new URLSearchParams(paramsObj);

  try {
    // Usando o fetch nativo do JavaScript (não precisa instalar axios)
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Erro da API Facebook: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();

    if (data.error) {
      console.error("Erro da API Facebook:", data.error);
      
      // Retornar erro específico baseado no tipo
      let tipoErro = 'api';
      let mensagem = data.error.message || 'Erro desconhecido da API Facebook';
      
      // Categorizar tipos de erro do Facebook
      if (data.error.code === 190 || data.error.type === 'OAuthException') {
        tipoErro = 'auth';
        mensagem = 'Token de acesso inválido ou expirado. Verifique suas credenciais do Facebook.';
      } else if (data.error.code === 17) {
        tipoErro = 'rate_limit';
        mensagem = 'Limite de requisições atingido. Tente novamente em alguns minutos.';
      } else if (data.error.code === 100) {
        tipoErro = 'validation';
        mensagem = 'Parâmetros inválidos enviados para a API Facebook.';
      }
      
      return NextResponse.json({ 
        error: mensagem,
        tipo: tipoErro,
        codigo: data.error.code 
      }, { status: 400 });
    }

    // Validação se há dados
    if (!data.data || data.data.length === 0) {
      return NextResponse.json({ 
        data: [], 
        message: "Nenhuma campanha encontrada para o período selecionado",
        tipo: "empty"
      });
    }

    // A mesma lógica de limpeza do Python, agora em JS!
    const campanhasLimpas = data.data.map((campanha) => {
      let mqlAgendado = 0;
      let reuniaoAgendada = 0;

      if (campanha.conversions) {
        // Puxando aquelas conversões personalizadas que vi na sua URL!
        campanha.conversions.forEach((acao) => {
          if (
            acao.action_type ===
            "offsite_conversion.fb_pixel_custom.MQL_Agendado"
          ) {
            mqlAgendado = parseFloat(acao.value);
          }
          if (
            acao.action_type ===
            "offsite_conversion.fb_pixel_custom.ReuniaoAgendada"
          ) {
            reuniaoAgendada = parseFloat(acao.value);
          }
        });
      }

      const custoMql =
        mqlAgendado > 0 ? parseFloat(campanha.spend) / mqlAgendado : 0;
      const custoReuniao =
        reuniaoAgendada > 0 ? parseFloat(campanha.spend) / reuniaoAgendada : 0;

      return {
        id: campanha.campaign_id,
        nome: campanha.campaign_name,
        gasto: parseFloat(campanha.spend || 0).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        cpc: parseFloat(campanha.cpc || 0).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        mqls: mqlAgendado,
        reunioes: reuniaoAgendada,
        ctr: parseFloat(campanha.ctr || 0).toFixed(2) + "%",
        frequencia: parseFloat(campanha.frequency || 0).toFixed(2),
        custoPorMql: custoMql.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        custoPorReuniao: custoReuniao.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
      };
    });

    return NextResponse.json(campanhasLimpas);
  } catch (error) {
    console.error("Erro interno:", error);
    return NextResponse.json(
      { error: "Falha ao buscar dados do Facebook" },
      { status: 500 },
    );
  }
}
