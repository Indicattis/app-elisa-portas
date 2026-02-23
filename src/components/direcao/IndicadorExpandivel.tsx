import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ColumnConfig } from "@/hooks/useColumnConfig";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IndicadorExpandivelProps {
  icon: React.ReactNode;
  label: string;
  valor: string;
  lucro?: string;
  colorClass: string;
  vendas: any[];
  visibleColumns: ColumnConfig[];
  renderCell: (venda: any, columnId: string) => React.ReactNode;
  getColumnAlignment: (columnId: string) => string;
  getColumnResponsiveClass: (columnId: string) => string;
  onVendaClick: (vendaId: string) => void;
  expanded: boolean;
  onToggle: () => void;
}

export function IndicadorExpandivel({
  icon,
  label,
  valor,
  lucro,
  colorClass,
  vendas,
  expanded,
  onToggle,
}: IndicadorExpandivelProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full text-center p-4 rounded-lg transition-colors cursor-pointer",
        expanded ? "bg-white/10 ring-1 ring-white/20" : "bg-white/5 hover:bg-white/[0.07]"
      )}
    >
      <div className="flex items-center justify-center gap-1 text-white/50 text-xs mb-2">
        {icon}
        {label}
        {vendas.length > 0 && (
          expanded 
            ? <ChevronUp className="h-3 w-3 ml-0.5 text-white/40" />
            : <ChevronDown className="h-3 w-3 ml-0.5 text-white/40" />
        )}
      </div>
      <p className={cn("font-bold text-lg", colorClass)}>
        {valor}
      </p>
      {lucro && (
        <p className="text-emerald-400 text-sm mt-1">
          Lucro: {lucro}
        </p>
      )}
      <p className="text-white/30 text-[10px] mt-1">{vendas.length} vendas</p>
    </button>
  );
}

interface IndicadorTableProps {
  label: string;
  colorClass: string;
  vendas: any[];
  visibleColumns: ColumnConfig[];
  renderCell: (venda: any, columnId: string) => React.ReactNode;
  getColumnAlignment: (columnId: string) => string;
  getColumnResponsiveClass: (columnId: string) => string;
  onVendaClick: (vendaId: string) => void;
}

export function IndicadorTable({
  label,
  colorClass,
  vendas,
  visibleColumns,
  renderCell,
  getColumnAlignment,
  getColumnResponsiveClass,
  onVendaClick,
}: IndicadorTableProps) {
  if (vendas.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-white/10 overflow-hidden">
      <div className={cn("px-4 py-2 border-b border-white/10 bg-white/5")}>
        <span className={cn("text-sm font-medium", colorClass)}>{label}</span>
        <span className="text-white/40 text-xs ml-2">({vendas.length} vendas)</span>
      </div>
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <TooltipProvider delayDuration={200}>
          <Table>
            <TableHeader>
              <TableRow className="border-primary/10 hover:bg-transparent">
                {visibleColumns.map((column) => (
                  <TableHead
                    key={column.id}
                    className={cn(
                      "text-white/60 text-xs",
                      getColumnResponsiveClass(column.id),
                      getColumnAlignment(column.id)
                    )}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendas.map((venda) => (
                <TableRow
                  key={venda.id}
                  className="border-primary/10 hover:bg-primary/5 cursor-pointer"
                  onClick={() => onVendaClick(venda.id)}
                >
                  {visibleColumns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        getColumnResponsiveClass(column.id),
                        getColumnAlignment(column.id)
                      )}
                    >
                      {renderCell(venda, column.id)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>
    </div>
  );
}
