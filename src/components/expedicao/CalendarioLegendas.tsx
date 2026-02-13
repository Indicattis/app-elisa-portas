interface CalendarioLegendasProps {
  activeLegend?: string | null;
  onToggle?: (legend: string) => void;
}

const legendas = [
  { id: 'elisa', label: 'Instalação Elisa', bgColor: 'rgb(59 130 246 / 0.15)', borderColor: 'rgb(59 130 246 / 0.5)' },
  { id: 'autorizados', label: 'Autorizado', bgColor: 'rgb(234 179 8 / 0.15)', borderColor: 'rgb(234 179 8 / 0.5)' },
  { id: 'entrega', label: 'Entrega', bgColor: 'rgb(34 197 94 / 0.15)', borderColor: 'rgb(34 197 94 / 0.5)' },
  { id: 'neo_instalacao', label: 'Neo Instalação', bgColor: 'rgb(249 115 22 / 0.15)', borderColor: 'rgb(249 115 22 / 0.5)' },
  { id: 'neo_correcao', label: 'Neo Correção', bgColor: 'rgb(147 51 234 / 0.15)', borderColor: 'rgb(147 51 234 / 0.5)' },
];

export const CalendarioLegendas = ({ activeLegend, onToggle }: CalendarioLegendasProps) => {
  return (
    <div className="flex flex-wrap gap-4 text-xs">
      {legendas.map((leg) => {
        const isActive = activeLegend === leg.id;
        const isDimmed = activeLegend != null && !isActive;

        return (
          <button
            key={leg.id}
            type="button"
            onClick={() => onToggle?.(leg.id)}
            className="flex items-center gap-2 transition-all duration-200 rounded-md px-1 py-0.5"
            style={{
              opacity: isDimmed ? 0.4 : 1,
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
              cursor: onToggle ? 'pointer' : 'default',
            }}
          >
            <div
              className="w-4 h-4 rounded border"
              style={{
                backgroundColor: leg.bgColor,
                borderColor: leg.borderColor,
                boxShadow: isActive ? `0 0 8px ${leg.borderColor}` : 'none',
              }}
            />
            <span>{leg.label}</span>
          </button>
        );
      })}
    </div>
  );
};
