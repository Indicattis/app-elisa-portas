import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface QuickFilter {
  id: string;
  label: string;
  active: boolean;
}

interface QuickFiltersBarProps {
  filters: QuickFilter[];
  onFilterToggle: (filterId: string) => void;
  onClearAll: () => void;
}

export function QuickFiltersBar({ filters, onFilterToggle, onClearAll }: QuickFiltersBarProps) {
  const hasActiveFilters = filters.some(f => f.active);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm text-muted-foreground">Filtros Rápidos:</span>
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={filter.active ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterToggle(filter.id)}
        >
          {filter.label}
        </Button>
      ))}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-muted-foreground"
        >
          <X className="w-4 h-4 mr-1" />
          Limpar Filtros
        </Button>
      )}
    </div>
  );
}
