import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChamadosFilters as Filters } from "@/types/suporte";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChamadosFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function ChamadosFilters({
  filters,
  onFiltersChange,
}: ChamadosFiltersProps) {
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onFiltersChange({});
  };

  return (
    <div className="flex flex-wrap items-end gap-2 p-3 bg-muted/30 rounded-lg border">
      <div className="flex-1 min-w-[150px]">
        <Input
          placeholder="Nome..."
          value={localFilters.nome || ""}
          onChange={(e) => handleFilterChange("nome", e.target.value)}
          className="h-9"
        />
      </div>

      <div className="flex-1 min-w-[120px]">
        <Input
          placeholder="CPF..."
          value={localFilters.cpf || ""}
          onChange={(e) => handleFilterChange("cpf", e.target.value)}
          className="h-9"
        />
      </div>

      <div className="flex-1 min-w-[130px]">
        <Input
          placeholder="Telefone..."
          value={localFilters.telefone || ""}
          onChange={(e) => handleFilterChange("telefone", e.target.value)}
          className="h-9"
        />
      </div>

      <div className="min-w-[120px]">
        <Select
          value={localFilters.status || "todos"}
          onValueChange={(value) =>
            handleFilterChange("status", value === "todos" ? "" : value)
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="resolvido">Resolvido</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[140px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-9 w-full justify-start text-left font-normal text-sm",
                !localFilters.dataInicio && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {localFilters.dataInicio
                ? format(new Date(localFilters.dataInicio), "dd/MM/yy")
                : "Data inicial"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={
                localFilters.dataInicio
                  ? new Date(localFilters.dataInicio)
                  : undefined
              }
              onSelect={(date) =>
                handleFilterChange(
                  "dataInicio",
                  date ? date.toISOString() : ""
                )
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="min-w-[140px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-9 w-full justify-start text-left font-normal text-sm",
                !localFilters.dataFim && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {localFilters.dataFim
                ? format(new Date(localFilters.dataFim), "dd/MM/yy")
                : "Data final"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={
                localFilters.dataFim
                  ? new Date(localFilters.dataFim)
                  : undefined
              }
              onSelect={(date) =>
                handleFilterChange("dataFim", date ? date.toISOString() : "")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button variant="outline" onClick={handleClearFilters} size="sm" className="h-9">
        Limpar
      </Button>
    </div>
  );
}
