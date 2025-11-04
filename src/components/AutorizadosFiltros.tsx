import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ETAPAS, AutorizadoEtapa } from "@/utils/etapas";
import { X, Filter } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface FiltrosAutorizados {
  busca: string;
  etapa: AutorizadoEtapa | 'todos';
  atendente: string;
}

interface AutorizadosFiltrosProps {
  filtros: FiltrosAutorizados;
  onFiltrosChange: (filtros: FiltrosAutorizados) => void;
  atendentes: Array<{ id: string; nome: string }>;
}

const filtrosIniciais: FiltrosAutorizados = {
  busca: '',
  etapa: 'todos',
  atendente: 'todos'
};

export function AutorizadosFiltros({ filtros, onFiltrosChange, atendentes }: AutorizadosFiltrosProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFiltroChange = <K extends keyof FiltrosAutorizados>(key: K, value: FiltrosAutorizados[K]) => {
    onFiltrosChange({
      ...filtros,
      [key]: value
    });
  };

  const limparFiltros = () => {
    onFiltrosChange(filtrosIniciais);
  };

  const contarFiltrosAtivos = () => {
    let count = 0;
    if (filtros.busca) count++;
    if (filtros.etapa !== 'todos') count++;
    if (filtros.atendente && filtros.atendente !== 'todos') count++;
    return count;
  };

  const filtrosAtivos = contarFiltrosAtivos();

  return (
    <Card className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" />
                Filtros Avançados
                {filtrosAtivos > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {filtrosAtivos}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {filtrosAtivos > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      limparFiltros();
                    }}
                    className="h-8"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Busca */}
              <div className="space-y-2">
                <Label htmlFor="busca">Buscar</Label>
                <Input
                  id="busca"
                  placeholder="Nome, email, cidade..."
                  value={filtros.busca}
                  onChange={(e) => handleFiltroChange('busca', e.target.value)}
                />
              </div>

              {/* Etapa */}
              <div className="space-y-2">
                <Label>Etapa</Label>
                <Select 
                  value={filtros.etapa} 
                  onValueChange={(value: AutorizadoEtapa | 'todos') => handleFiltroChange('etapa', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as etapas</SelectItem>
                    {Object.entries(ETAPAS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Atendente */}
              <div className="space-y-2">
                <Label>Atendente</Label>
                <Select 
                  value={filtros.atendente} 
                  onValueChange={(value) => handleFiltroChange('atendente', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar atendente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os atendentes</SelectItem>
                    {atendentes.map((atendente) => (
                      <SelectItem key={atendente.id} value={atendente.id}>
                        {atendente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}