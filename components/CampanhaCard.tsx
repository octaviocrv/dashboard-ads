interface CampanhaCardProps {
  campanha: {
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
  };
}

export default function CampanhaCard({ campanha }: CampanhaCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg hover:border-blue-500 transition-colors">
      <h2 className="text-sm text-gray-400 mb-4 truncate" title={campanha.nome}>
        {campanha.nome}
      </h2>
      
      {/* Métricas principais */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <MetricaItem 
          label="Valor Gasto" 
          value={campanha.gasto} 
          valueClass="text-2xl font-bold text-white"
        />
        <MetricaItem 
          label="CPC" 
          value={campanha.cpc} 
          valueClass="text-lg font-semibold text-gray-300"
        />
      </div>

      {/* Métricas de conversão */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <MetricaCard 
          label="MQLs Agendados" 
          value={campanha.mqls} 
          subValue={campanha.custoPorMql}
          valueClass="text-xl font-bold text-blue-400"
        />
        <MetricaCard 
          label="Reuniões" 
          value={campanha.reunioes} 
          subValue={campanha.custoPorReuniao}
          valueClass="text-xl font-bold text-emerald-400"
        />
      </div>

      {/* Métricas de performance */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
        <MetricaItem 
          label="CTR" 
          value={campanha.ctr} 
          valueClass="text-sm font-semibold text-cyan-400"
        />
        <MetricaItem 
          label="Frequência" 
          value={campanha.frequencia} 
          valueClass="text-sm font-semibold text-yellow-400"
        />
      </div>
    </div>
  );
}

function MetricaItem({ label, value, valueClass }: { 
  label: string; 
  value: string | number; 
  valueClass: string; 
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={valueClass}>{value}</p>
    </div>
  );
}

function MetricaCard({ label, value, subValue, valueClass }: { 
  label: string; 
  value: string | number; 
  subValue: string;
  valueClass: string; 
}) {
  return (
    <div className="bg-gray-800 p-3 rounded-lg text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={valueClass}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subValue}</p>
    </div>
  );
}