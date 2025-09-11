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
  statusRisco: 'todos' | 'em_dia' | 'atencao' | 'critico';
  atendente: string;
  faixaAvaliacao: 'todos' | '0-2' | '2-3' | '3-4' | '4-5';
  tempoUltimaAvaliacao: 'todos' | '0-30' | '30-60' | '60-90' | '90+';
}

interface AutorizadosFiltrosProps {
  filtros: FiltrosAutorizados;
  onFiltrosChange: (filtros: FiltrosAutorizados) => void;
  atendentes: Array<{ id: string; nome: string }>;
}

const filtrosIniciais: FiltrosAutorizados = {
  busca: '',
  etapa: 'todos',
  statusRisco: 'todos',
  atendente: '',
  faixaAvaliacao: 'todos',
  tempoUltimaAvaliacao: 'todos'
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
    if (filtros.statusRisco !== 'todos') count++;
    if (filtros.atendente) count++;
    if (filtros.faixaAvaliacao !== 'todos') count++;
    if (filtros.tempoUltimaAvaliacao !== 'todos') count++;
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

              {/* Status de Risco */}
              <div className="space-y-2">
                <Label>Status de Risco</Label>
                <Select 
                  value={filtros.statusRisco} 
                  onValueChange={(value: typeof filtros.statusRisco) => handleFiltroChange('statusRisco', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="em_dia">Em dia</SelectItem>
                    <SelectItem value="atencao">Zona de risco</SelectItem>
                    <SelectItem value="critico">Crítico</SelectItem>
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
                    <SelectItem value="">Todos os atendentes</SelectItem>
                    {atendentes.map((atendente) => (
                      <SelectItem key={atendente.id} value={atendente.id}>
                        {atendente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Faixa de Avaliação */}
              <div className="space-y-2">
                <Label>Faixa de Avaliação</Label>
                <Select 
                  value={filtros.faixaAvaliacao} 
                  onValueChange={(value: typeof filtros.faixaAvaliacao) => handleFiltroChange('faixaAvaliacao', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as faixas</SelectItem>
                    <SelectItem value="4-5">4-5 estrelas</SelectItem>
                    <SelectItem value="3-4">3-4 estrelas</SelectItem>
                    <SelectItem value="2-3">2-3 estrelas</SelectItem>
                    <SelectItem value="0-2">0-2 estrelas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tempo da Última Avaliação */}
              <div className="space-y-2">
                <Label>Última Avaliação</Label>
                <Select 
                  value={filtros.tempoUltimaAvaliacao} 
                  onValueChange={(value: typeof filtros.tempoUltimaAvaliacao) => handleFiltroChange('tempoUltimaAvaliacao', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os períodos</SelectItem>
                    <SelectItem value="0-30">Últimos 30 dias</SelectItem>
                    <SelectItem value="30-60">30-60 dias atrás</SelectItem>
                    <SelectItem value="60-90">60-90 dias atrás</SelectItem>
                    <SelectItem value="90+">Mais de 90 dias</SelectItem>
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