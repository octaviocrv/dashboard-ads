import { NextResponse } from "next/server";

const GRAPH_API_VERSION = "v25.0";
const PAGE_LIMIT = 500;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");

  const token = process.env.FB_ACCESS_TOKEN;
  const adAccountId = process.env.FB_AD_ACCOUNT_ID;

  if (!token || !adAccountId) {
    return NextResponse.json(
      {
        error: "Variáveis de ambiente FB_ACCESS_TOKEN e FB_AD_ACCOUNT_ID são obrigatórias",
        tipo: "config",
      },
      { status: 500 }
    );
  }

  const erroValidacao = validarPeriodo(dataInicio, dataFim);
  if (erroValidacao) {
    return NextResponse.json(erroValidacao, { status: 400 });
  }

  const paramsObj = {
    access_token: token,
    level: "campaign",
    fields: "campaign_name,campaign_id,spend,cpm,inline_link_clicks,impressions,frequency",
    limit: String(PAGE_LIMIT),
  };

  if (dataInicio && dataFim) {
    paramsObj.time_range = JSON.stringify({ since: dataInicio, until: dataFim });
  } else {
    paramsObj.date_preset = "last_30d";
  }

  const urlInicial = `https://graph.facebook.com/${GRAPH_API_VERSION}/act_${adAccountId}/insights?${new URLSearchParams(paramsObj).toString()}`;

  try {
    const campanhasBrutas = await buscarTodasPaginas(urlInicial);

    if (campanhasBrutas.length === 0) {
      return NextResponse.json({
        data: [],
        message: "Nenhuma campanha encontrada para o período selecionado",
        tipo: "empty",
      });
    }

    const campanhasLimpas = campanhasBrutas.map(processarCampanha);
    return NextResponse.json(campanhasLimpas);
  } catch (error) {
    return tratarErro(error);
  }
}

async function buscarTodasPaginas(urlInicial) {
  const campanhas = [];
  let url = urlInicial;

  while (url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erro da API Facebook: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      const err = new Error(data.error.message || "Erro desconhecido da API Facebook");
      err.fbError = data.error;
      throw err;
    }

    campanhas.push(...(data.data || []));
    url = data.paging?.next ?? null;
  }

  return campanhas;
}

function processarCampanha(campanha) {
  const impressions = parseFloat(campanha.impressions || 0);
  const spend = parseFloat(campanha.spend || 0);
  const linkClicks = parseFloat(campanha.inline_link_clicks || 0);
  const frequency = parseFloat(campanha.frequency || 0);

  const cpmValue =
    parseFloat(campanha.cpm || 0) || (impressions > 0 ? (spend / impressions) * 1000 : 0);
  const linkCtr = impressions > 0 ? (linkClicks / impressions) * 100 : 0;
  const linkCpc = linkClicks > 0 ? spend / linkClicks : 0;

  const moedaBRL = { style: "currency", currency: "BRL" };

  return {
    id: campanha.campaign_id,
    nome: campanha.campaign_name,
    gastoNumerico: spend,
    impressoes: impressions,
    linkClicks,
    gasto: spend.toLocaleString("pt-BR", moedaBRL),
    cpc: linkCpc.toLocaleString("pt-BR", moedaBRL),
    cpm: cpmValue.toLocaleString("pt-BR", moedaBRL),
    ctr: linkCtr.toFixed(2) + "%",
    frequencia: frequency.toFixed(2),
  };
}

function validarPeriodo(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return null;

  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);

  if (isNaN(inicio.getTime())) {
    return { error: "Data inicial inválida ou mal formatada", tipo: "validation" };
  }

  if (isNaN(fim.getTime())) {
    return { error: "Data final inválida ou mal formatada", tipo: "validation" };
  }

  if (inicio >= fim) {
    return { error: "Data inicial deve ser anterior à data final", tipo: "validation" };
  }

  const umAno = 365 * 24 * 60 * 60 * 1000;
  if (fim.getTime() - inicio.getTime() > umAno) {
    return { error: "Período não pode ser superior a 1 ano", tipo: "validation" };
  }

  return null;
}

function tratarErro(error) {
  const fbError = error.fbError;

  if (fbError) {
    let tipo = "api";
    let mensagem = fbError.message || "Erro desconhecido da API Facebook";

    if (fbError.code === 190 || fbError.type === "OAuthException") {
      tipo = "auth";
      mensagem = "Token de acesso inválido ou expirado. Verifique suas credenciais do Facebook.";
    } else if (fbError.code === 17) {
      tipo = "rate_limit";
      mensagem = "Limite de requisições atingido. Tente novamente em alguns minutos.";
    } else if (fbError.code === 100) {
      tipo = "validation";
      mensagem = "Parâmetros inválidos enviados para a API Facebook.";
    }

    return NextResponse.json(
      { error: mensagem, tipo, codigo: fbError.code },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: "Falha ao buscar dados do Facebook" },
    { status: 500 }
  );
}