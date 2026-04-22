import { useState, useEffect } from 'react';

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

interface UseCampanhasReturn {
  campanhas: Campanha[];
  loading: boolean;
  erro: string | null;
  recarregar: () => void;
}

export function useCampanhas(autoRefresh = false): UseCampanhasReturn {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const buscarCampanhas = async () => {
    try {
      setErro(null);
      const res = await fetch('/api/campanhas');
      
      if (!res.ok) {
        throw new Error(`Erro ${res.status}: ${res.statusText}`);
      }
      
      const dados = await res.json();
      
      if (dados.error) {
        throw new Error(dados.error);
      }
      
      setCampanhas(dados.data || dados);
    } catch (error: any) {
      console.error('Erro ao carregar campanhas:', error);
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarCampanhas();

    // Auto-refresh opcional a cada 5 minutos
    if (autoRefresh) {
      const interval = setInterval(buscarCampanhas, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  return {
    campanhas,
    loading,
    erro,
    recarregar: buscarCampanhas
  };
}