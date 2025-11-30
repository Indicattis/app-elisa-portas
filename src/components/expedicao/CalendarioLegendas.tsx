export const CalendarioLegendas = () => {
  return (
    <div className="flex flex-wrap gap-4 text-xs">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border" style={{ backgroundColor: 'rgb(239 68 68 / 0.15)', borderColor: 'rgb(239 68 68 / 0.5)' }} />
        <span>Instalação Elisa</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border" style={{ backgroundColor: 'rgb(59 130 246 / 0.15)', borderColor: 'rgb(59 130 246 / 0.5)' }} />
        <span>Instalação Autorizado</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border" style={{ backgroundColor: 'rgb(107 114 128 / 0.15)', borderColor: 'rgb(107 114 128 / 0.5)' }} />
        <span>Entrega</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border" style={{ backgroundColor: 'rgb(234 179 8 / 0.15)', borderColor: 'rgb(234 179 8 / 0.5)' }} />
        <span>Sem Responsável</span>
      </div>
    </div>
  );
};
