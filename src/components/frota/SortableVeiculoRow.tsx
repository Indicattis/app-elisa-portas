import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit, Trash2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, isAfter, nextMonday } from "date-fns";
import { ptBR } from "date-fns/locale";

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/frota/StatusBadge";
import { Veiculo } from "@/hooks/useVeiculos";

function isConferenciaEmDia(data: string | null | undefined): boolean {
  if (!data) return false;
  const lastMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
  return isAfter(new Date(data), lastMonday);
}

interface Props {
  veiculo: Veiculo;
  onDelete: (id: string) => void;
}

export function SortableVeiculoRow({ veiculo, onDelete }: Props) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: veiculo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleRowClick = () => {
    navigate(`/logistica/frota/${veiculo.id}/conferencias`);
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      onClick={handleRowClick}
      className="cursor-pointer border-white/10 hover:bg-blue-500/5 text-white/90"
    >
      <TableCell className="w-8">
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab active:cursor-grabbing p-1 text-white/40 hover:text-white/70 touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell>
        {veiculo.foto_url ? (
          <img
            src={veiculo.foto_url}
            alt={veiculo.nome}
            className="w-10 h-10 object-cover rounded"
          />
        ) : (
          <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-[10px] text-white/50">
            -
          </div>
        )}
      </TableCell>
      <TableCell>{veiculo.nome}</TableCell>
      <TableCell>{veiculo.placa || "-"}</TableCell>
      <TableCell>{veiculo.ano}</TableCell>
      <TableCell className="font-medium">{veiculo.modelo}</TableCell>
      <TableCell>{veiculo.responsavel || "-"}</TableCell>
      <TableCell>{veiculo.mecanico || "-"}</TableCell>
      <TableCell>{veiculo.km_atual.toLocaleString("pt-BR")} km</TableCell>
      <TableCell>
        {veiculo.km_proxima_troca_oleo
          ? `${veiculo.km_proxima_troca_oleo.toLocaleString('pt-BR')} km`
          : "-"}
      </TableCell>
      <TableCell>
        <StatusBadge status={veiculo.status} />
      </TableCell>
      <TableCell>
        {veiculo.aviso_justificativa ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-default">
                <AlertTriangle className="h-4 w-4 text-amber-400 animate-pulse" />
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{veiculo.aviso_justificativa}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-white/20">—</span>
        )}
      </TableCell>
      <TableCell>
        {(() => {
          const emDia = isConferenciaEmDia(veiculo.ultima_conferencia_data);
          const lastMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
          const proxSegunda = nextMonday(new Date());
          const tooltipMsg = emDia
            ? `Próxima conferência: ${format(proxSegunda, "dd/MM/yy", { locale: ptBR })}`
            : `Deveria ter sido conferido em ${format(lastMonday, "dd/MM/yy", { locale: ptBR })}`;
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`cursor-default ${emDia ? "text-green-400" : "text-red-400"}`}>
                  {veiculo.ultima_conferencia_data
                    ? format(new Date(veiculo.ultima_conferencia_data), "dd/MM/yy", { locale: ptBR })
                    : "Nunca"}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltipMsg}</p>
              </TooltipContent>
            </Tooltip>
          );
        })()}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-white/70 hover:text-blue-400 hover:bg-blue-500/10"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/logistica/frota/${veiculo.id}/editar`);
            }}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(veiculo.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
