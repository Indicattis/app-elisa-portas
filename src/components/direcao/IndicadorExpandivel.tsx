import { cn } from "@/lib/utils";

interface IndicadorExpandivelProps {
  icon: React.ReactNode;
  label: string;
  valor: string;
  lucro?: string;
  margemLucro?: string;
  colorClass: string;
  quantidadeVendas: number;
}

export function IndicadorExpandivel({
  icon,
  label,
  valor,
  lucro,
  margemLucro,
  colorClass,
  quantidadeVendas,
}: IndicadorExpandivelProps) {
  return (
    <div
      className="w-full text-center p-4 rounded-lg bg-white/5"
    >
      <div className="flex items-center justify-center gap-1 text-white/50 text-xs mb-2">
        {icon}
        {label}
      </div>
      <p className={cn("font-bold text-lg", colorClass)}>
        {valor}
      </p>
      {lucro && (
        <p className="text-emerald-400 text-sm mt-1">
          Lucro: {lucro}
        </p>
      )}
      {margemLucro && (
        <p className="text-emerald-300 font-semibold text-sm mt-1">
          {margemLucro}
        </p>
      )}
      <p className="text-white/30 text-[10px] mt-1">{quantidadeVendas} vendas</p>
    </div>
  );
}
