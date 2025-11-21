import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ContratosFiltersProps {
  onFiltersChange: (filters: {
    clienteNome: string;
    clienteCpf: string;
    dataInicio: Date | undefined;
    dataFim: Date | undefined;
  }) => void;
}

export function ContratosFilters({ onFiltersChange }: ContratosFiltersProps) {
  const [clienteNome, setClienteNome] = useState("");
  const [clienteCpf, setClienteCpf] = useState("");
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();

  // Debounce para os campos de texto
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({
        clienteNome,
        clienteCpf,
        dataInicio,
        dataFim
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [clienteNome, clienteCpf, dataInicio, dataFim]);

  const handleClearFilters = () => {
    setClienteNome("");
    setClienteCpf("");
    setDataInicio(undefined);
    setDataFim(undefined);
  };

  const hasActiveFilters = clienteNome || clienteCpf || dataInicio || dataFim;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Filtros</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca por nome */}
            <div className="space-y-2">
              <Label htmlFor="nome-cliente">Nome do Cliente</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nome-cliente"
                  placeholder="Buscar por nome..."
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Busca por CPF */}
            <div className="space-y-2">
              <Label htmlFor="cpf-cliente">CPF do Cliente</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cpf-cliente"
                  placeholder="Buscar por CPF..."
                  value={clienteCpf}
                  onChange={(e) => setClienteCpf(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Data Inicial */}
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataInicio && "text-muted-foreground"
                    )}
                  >
                    {dataInicio ? (
                      format(dataInicio, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      "Selecione uma data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Final */}
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataFim && "text-muted-foreground"
                    )}
                  >
                    {dataFim ? (
                      format(dataFim, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      "Selecione uma data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
