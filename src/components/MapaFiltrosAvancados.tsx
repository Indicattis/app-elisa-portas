import { useState } from "react";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ETAPAS_AUTORIZADO,
  ETAPAS_REPRESENTANTE,
  ETAPAS_LICENCIADO,
  AutorizadoEtapa,
  RepresentanteEtapa,
  LicenciadoEtapa,
} from "@/utils/etapas";

export interface MapaFiltros {
  autorizados: boolean;
  representantes: boolean;
  licenciados: boolean;
  etapasAutorizados: AutorizadoEtapa[];
  etapasRepresentantes: RepresentanteEtapa[];
  etapasLicenciados: LicenciadoEtapa[];
  instalacoes: boolean;
  statusInstalacoes: string[];
  tiposInstalacao: string[];
  apenasGeocodificados: boolean;
  apenasAtivos: boolean;
}

interface MapaFiltrosAvancadosProps {
  filtros: MapaFiltros;
  onChange: (filtros: MapaFiltros) => void;
  stats: {
    totalAutorizados: number;
    totalRepresentantes: number;
    totalLicenciados: number;
    totalInstalacoes: number;
  };
}

const STATUS_INSTALACOES = [
  { value: 'pendente_producao', label: 'Pendente Produção' },
  { value: 'pronta_fabrica', label: 'Pronta Fábrica' },
  { value: 'finalizada', label: 'Finalizada' },
];

const TIPOS_INSTALACAO = [
  { value: 'instalacao', label: 'Instalação' },
  { value: 'entrega', label: 'Entrega' },
  { value: 'correcao', label: 'Correção' },
];

export function MapaFiltrosAvancados({ filtros, onChange, stats }: MapaFiltrosAvancadosProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [secaoParceirosOpen, setSecaoParceirosOpen] = useState(true);
  const [secaoInstalacoesOpen, setSecaoInstalacoesOpen] = useState(true);
  const [secaoVisualizacaoOpen, setSecaoVisualizacaoOpen] = useState(true);

  const filtrosAtivos = calcularFiltrosAtivos(filtros);

  const handleLimparFiltros = () => {
    onChange({
      autorizados: true,
      representantes: true,
      licenciados: true,
      etapasAutorizados: [],
      etapasRepresentantes: [],
      etapasLicenciados: [],
      instalacoes: true,
      statusInstalacoes: [],
      tiposInstalacao: [],
      apenasGeocodificados: false,
      apenasAtivos: false,
    });
  };

  const toggleEtapaAutorizado = (etapa: AutorizadoEtapa) => {
    const novasEtapas = filtros.etapasAutorizados.includes(etapa)
      ? filtros.etapasAutorizados.filter((e) => e !== etapa)
      : [...filtros.etapasAutorizados, etapa];
    onChange({ ...filtros, etapasAutorizados: novasEtapas });
  };

  const toggleEtapaRepresentante = (etapa: RepresentanteEtapa) => {
    const novasEtapas = filtros.etapasRepresentantes.includes(etapa)
      ? filtros.etapasRepresentantes.filter((e) => e !== etapa)
      : [...filtros.etapasRepresentantes, etapa];
    onChange({ ...filtros, etapasRepresentantes: novasEtapas });
  };

  const toggleEtapaLicenciado = (etapa: LicenciadoEtapa) => {
    const novasEtapas = filtros.etapasLicenciados.includes(etapa)
      ? filtros.etapasLicenciados.filter((e) => e !== etapa)
      : [...filtros.etapasLicenciados, etapa];
    onChange({ ...filtros, etapasLicenciados: novasEtapas });
  };

  const toggleStatusInstalacao = (status: string) => {
    const novosStatus = filtros.statusInstalacoes.includes(status)
      ? filtros.statusInstalacoes.filter((s) => s !== status)
      : [...filtros.statusInstalacoes, status];
    onChange({ ...filtros, statusInstalacoes: novosStatus });
  };

  const toggleTipoInstalacao = (tipo: string) => {
    const novosTipos = filtros.tiposInstalacao.includes(tipo)
      ? filtros.tiposInstalacao.filter((t) => t !== tipo)
      : [...filtros.tiposInstalacao, tipo];
    onChange({ ...filtros, tiposInstalacao: novosTipos });
  };

  const ConteudoFiltros = () => (
    <div className="space-y-4">
      {/* Parceiros */}
      <Collapsible open={secaoParceirosOpen} onOpenChange={setSecaoParceirosOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-md">
          <span className="font-medium">Parceiros</span>
          {secaoParceirosOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          {/* Autorizados */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autorizados"
                checked={filtros.autorizados}
                onCheckedChange={(checked) =>
                  onChange({ ...filtros, autorizados: checked as boolean })
                }
              />
              <Label htmlFor="autorizados" className="cursor-pointer">
                Autorizados ({stats.totalAutorizados})
              </Label>
            </div>
            {filtros.autorizados && (
              <div className="ml-6 space-y-1">
                <div className="text-xs text-muted-foreground mb-1">
                  Etapas {filtros.etapasAutorizados.length === 0 && "(todas)"}:
                </div>
{(Object.entries(ETAPAS_AUTORIZADO) as [AutorizadoEtapa, string][]).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`etapa-autorizado-${key}`}
                      checked={
                        filtros.etapasAutorizados.length === 0 ||
                        filtros.etapasAutorizados.includes(key)
                      }
                      onCheckedChange={() => toggleEtapaAutorizado(key)}
                    />
                    <Label htmlFor={`etapa-autorizado-${key}`} className="cursor-pointer text-sm">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Representantes */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="representantes"
                checked={filtros.representantes}
                onCheckedChange={(checked) =>
                  onChange({ ...filtros, representantes: checked as boolean })
                }
              />
              <Label htmlFor="representantes" className="cursor-pointer">
                Representantes ({stats.totalRepresentantes})
              </Label>
            </div>
            {filtros.representantes && (
              <div className="ml-6 space-y-1">
                <div className="text-xs text-muted-foreground mb-1">
                  Etapas {filtros.etapasRepresentantes.length === 0 && "(todas)"}:
                </div>
{(Object.entries(ETAPAS_REPRESENTANTE) as [RepresentanteEtapa, string][]).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`etapa-representante-${key}`}
                      checked={
                        filtros.etapasRepresentantes.length === 0 ||
                        filtros.etapasRepresentantes.includes(key)
                      }
                      onCheckedChange={() => toggleEtapaRepresentante(key)}
                    />
                    <Label htmlFor={`etapa-representante-${key}`} className="cursor-pointer text-sm">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Licenciados */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="licenciados"
                checked={filtros.licenciados}
                onCheckedChange={(checked) =>
                  onChange({ ...filtros, licenciados: checked as boolean })
                }
              />
              <Label htmlFor="licenciados" className="cursor-pointer">
                Licenciados ({stats.totalLicenciados})
              </Label>
            </div>
            {filtros.licenciados && (
              <div className="ml-6 space-y-1">
                <div className="text-xs text-muted-foreground mb-1">
                  Etapas {filtros.etapasLicenciados.length === 0 && "(todas)"}:
                </div>
{(Object.entries(ETAPAS_LICENCIADO) as [LicenciadoEtapa, string][]).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`etapa-licenciado-${key}`}
                      checked={
                        filtros.etapasLicenciados.length === 0 ||
                        filtros.etapasLicenciados.includes(key)
                      }
                      onCheckedChange={() => toggleEtapaLicenciado(key)}
                    />
                    <Label htmlFor={`etapa-licenciado-${key}`} className="cursor-pointer text-sm">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Instalações */}
      <Collapsible open={secaoInstalacoesOpen} onOpenChange={setSecaoInstalacoesOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-md">
          <span className="font-medium">Instalações</span>
          {secaoInstalacoesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="instalacoes"
              checked={filtros.instalacoes}
              onCheckedChange={(checked) =>
                onChange({ ...filtros, instalacoes: checked as boolean })
              }
            />
            <Label htmlFor="instalacoes" className="cursor-pointer">
              Mostrar instalações ({stats.totalInstalacoes})
            </Label>
          </div>

          {filtros.instalacoes && (
            <div className="ml-6 space-y-3">
              {/* Status */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Status {filtros.statusInstalacoes.length === 0 && "(todos)"}:
                </div>
                <div className="space-y-1">
                  {STATUS_INSTALACOES.map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status.value}`}
                        checked={
                          filtros.statusInstalacoes.length === 0 ||
                          filtros.statusInstalacoes.includes(status.value)
                        }
                        onCheckedChange={() => toggleStatusInstalacao(status.value)}
                      />
                      <Label htmlFor={`status-${status.value}`} className="cursor-pointer text-sm">
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tipos */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Tipo {filtros.tiposInstalacao.length === 0 && "(todos)"}:
                </div>
                <div className="space-y-1">
                  {TIPOS_INSTALACAO.map((tipo) => (
                    <div key={tipo.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tipo-${tipo.value}`}
                        checked={
                          filtros.tiposInstalacao.length === 0 ||
                          filtros.tiposInstalacao.includes(tipo.value)
                        }
                        onCheckedChange={() => toggleTipoInstalacao(tipo.value)}
                      />
                      <Label htmlFor={`tipo-${tipo.value}`} className="cursor-pointer text-sm">
                        {tipo.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Visualização */}
      <Collapsible open={secaoVisualizacaoOpen} onOpenChange={setSecaoVisualizacaoOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-md">
          <span className="font-medium">Visualização</span>
          {secaoVisualizacaoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apenas-geocodificados"
              checked={filtros.apenasGeocodificados}
              onCheckedChange={(checked) =>
                onChange({ ...filtros, apenasGeocodificados: checked as boolean })
              }
            />
            <Label htmlFor="apenas-geocodificados" className="cursor-pointer">
              Apenas geocodificados
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apenas-ativos"
              checked={filtros.apenasAtivos}
              onCheckedChange={(checked) =>
                onChange({ ...filtros, apenasAtivos: checked as boolean })
              }
            />
            <Label htmlFor="apenas-ativos" className="cursor-pointer">
              Apenas ativos
            </Label>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Button variant="outline" onClick={handleLimparFiltros} className="w-full">
        Limpar filtros
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="secondary"
            size="lg"
            className="fixed bottom-4 right-4 z-[1000] shadow-lg"
          >
            <Filter className="mr-2 h-5 w-5" />
            Filtros
            {filtrosAtivos > 0 && (
              <Badge variant="destructive" className="ml-2">
                {filtrosAtivos}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>Filtros do Mapa</span>
              {filtrosAtivos > 0 && (
                <Badge variant="secondary">{filtrosAtivos} ativos</Badge>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <ConteudoFiltros />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Card className="fixed top-20 right-4 z-[1000] w-80 max-h-[calc(100vh-100px)] overflow-y-auto shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
          {filtrosAtivos > 0 && (
            <Badge variant="secondary" className="ml-2">
              {filtrosAtivos}
            </Badge>
          )}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8 p-0"
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>
      {isOpen && (
        <CardContent>
          <ConteudoFiltros />
        </CardContent>
      )}
    </Card>
  );
}

function calcularFiltrosAtivos(filtros: MapaFiltros): number {
  let count = 0;

  if (!filtros.autorizados) count++;
  if (!filtros.representantes) count++;
  if (!filtros.licenciados) count++;
  if (!filtros.instalacoes) count++;

  if (filtros.etapasAutorizados.length > 0) count++;
  if (filtros.etapasRepresentantes.length > 0) count++;
  if (filtros.etapasLicenciados.length > 0) count++;
  if (filtros.statusInstalacoes.length > 0) count++;
  if (filtros.tiposInstalacao.length > 0) count++;

  if (filtros.apenasGeocodificados) count++;
  if (filtros.apenasAtivos) count++;

  return count;
}
