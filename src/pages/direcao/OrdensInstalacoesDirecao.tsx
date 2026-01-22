import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, CheckCircle2, Phone, MapPin, Calendar, User, Ruler, Package, RefreshCw, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";

import { useOrdensInstalacao, OrdemInstalacao } from "@/hooks/useOrdensInstalacao";
import { cn } from "@/lib/utils";

export default function OrdensInstalacoesDirecao() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEquipe, setFilterEquipe] = useState<string>("todas");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; ordem: OrdemInstalacao | null }>({
    open: false,
    ordem: null
  });

  const { ordens, isLoading, concluirOrdem, isConcluindo } = useOrdensInstalacao();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Extrair equipes e estados únicos
  const { equipes, estados } = useMemo(() => {
    const equipesSet = new Set<string>();
    const estadosSet = new Set<string>();

    ordens.forEach(ordem => {
      if (ordem.equipe?.nome) equipesSet.add(ordem.equipe.nome);
      const estado = ordem.venda?.estado || ordem.estado;
      if (estado) estadosSet.add(estado);
    });

    return {
      equipes: Array.from(equipesSet).sort(),
      estados: Array.from(estadosSet).sort()
    };
  }, [ordens]);

  // Filtrar ordens
  const ordensFiltradas = useMemo(() => {
    return ordens.filter(ordem => {
      // Filtro de busca
      const nomeCliente = ordem.venda?.cliente_nome || ordem.nome_cliente || "";
      const numeroPedido = ordem.pedido?.numero_pedido || "";
      const matchSearch = searchTerm === "" || 
        nomeCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        numeroPedido.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de equipe
      const matchEquipe = filterEquipe === "todas" || ordem.equipe?.nome === filterEquipe;

      // Filtro de estado
      const estado = ordem.venda?.estado || ordem.estado;
      const matchEstado = filterEstado === "todos" || estado === filterEstado;

      return matchSearch && matchEquipe && matchEstado;
    });
  }, [ordens, searchTerm, filterEquipe, filterEstado]);

  // Formatar medidas do produto
  const formatMedidas = (ordem: OrdemInstalacao): string => {
    const produtos = ordem.venda?.produtos || [];
    const portasEnrolar = produtos.filter(p => p.tipo_produto === 'porta_enrolar');

    if (portasEnrolar.length === 0) return "—";

    if (portasEnrolar.length === 1) {
      const p = portasEnrolar[0];
      if (p.largura && p.altura) {
        return `${p.largura}x${p.altura}m`;
      }
      return p.tamanho || "—";
    }

    return `(${portasEnrolar.reduce((acc, p) => acc + p.quantidade, 0)}) portas`;
  };

  // Verificar se está atrasado
  const isAtrasado = (ordem: OrdemInstalacao): boolean => {
    if (!ordem.data_instalacao) return false;
    const dataInstalacao = new Date(ordem.data_instalacao);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataInstalacao.setHours(0, 0, 0, 0);
    return dataInstalacao < hoje;
  };

  const handleConcluir = async () => {
    if (!confirmDialog.ordem) return;
    try {
      await concluirOrdem(confirmDialog.ordem.id);
      setConfirmDialog({ open: false, ordem: null });
    } catch (error) {
      console.error("Erro ao concluir:", error);
    }
  };

  const breadcrumbItems = [
    { label: "Direção", href: "/direcao" },
    { label: "Gestão Instalação", href: "/direcao/gestao-instalacao" },
    { label: "Ordens de Instalação" }
  ];

  return (
    <MinimalistLayout title="Ordens de Instalação">
      
      
      <div className="min-h-screen p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className={cn(
            "flex flex-col gap-4 transition-all duration-500",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/direcao/gestao-instalacao")}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <AnimatedBreadcrumb items={breadcrumbItems} mounted={mounted} />
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Ordens de Instalação</h1>
                <p className="text-muted-foreground text-sm">
                  {ordensFiltradas.length} {ordensFiltradas.length === 1 ? 'instalação pendente' : 'instalações pendentes'}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="w-fit"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div className={cn(
            "grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-500 delay-100",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou pedido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterEquipe} onValueChange={setFilterEquipe}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as equipes</SelectItem>
                {equipes.map(equipe => (
                  <SelectItem key={equipe} value={equipe}>{equipe}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger>
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os estados</SelectItem>
                {estados.map(estado => (
                  <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Ordens */}
          <div className={cn(
            "space-y-3 transition-all duration-500 delay-200",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Carregando ordens...
              </div>
            ) : ordensFiltradas.length === 0 ? (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  {searchTerm || filterEquipe !== "todas" || filterEstado !== "todos"
                    ? "Nenhuma ordem encontrada com os filtros aplicados."
                    : "Nenhuma ordem de instalação pendente."
                  }
                </CardContent>
              </Card>
            ) : (
              ordensFiltradas.map((ordem, index) => {
                const atrasado = isAtrasado(ordem);
                const clienteNome = ordem.venda?.cliente_nome || ordem.nome_cliente;
                const telefone = ordem.venda?.cliente_telefone;
                const cidade = ordem.venda?.cidade || ordem.cidade;
                const estado = ordem.venda?.estado || ordem.estado;

                return (
                  <Card 
                    key={ordem.id}
                    className={cn(
                      "bg-card/50 backdrop-blur-sm border-border/50 transition-all duration-300",
                      atrasado && "border-red-500/50 bg-red-500/5"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
                        {/* Informações principais */}
                        <div className="space-y-3">
                          {/* Linha 1: Pedido + Cliente + Status */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              #{ordem.pedido?.numero_pedido || "—"}
                            </Badge>
                            <span className="font-semibold text-foreground">{clienteNome}</span>
                            {atrasado && (
                              <Badge variant="destructive" className="text-xs">
                                Atrasado
                              </Badge>
                            )}
                          </div>

                          {/* Linha 2: Detalhes */}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            {/* Medidas */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5">
                                  <Ruler className="h-4 w-4" />
                                  <span>{formatMedidas(ordem)}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Medidas da porta</TooltipContent>
                            </Tooltip>

                            {/* Equipe */}
                            {ordem.equipe && (
                              <div className="flex items-center gap-1.5">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: ordem.equipe.cor || '#888' }}
                                />
                                <span>{ordem.equipe.nome}</span>
                              </div>
                            )}

                            {/* Tipo */}
                            {ordem.tipo_instalacao && (
                              <Badge 
                                variant="secondary"
                                className={cn(
                                  "text-xs",
                                  ordem.tipo_instalacao === 'elisa' && "bg-blue-500/20 text-blue-600",
                                  ordem.tipo_instalacao === 'autorizados' && "bg-amber-500/20 text-amber-600"
                                )}
                              >
                                {ordem.tipo_instalacao === 'elisa' ? 'Elisa' : 'Autorizado'}
                              </Badge>
                            )}

                            {/* Localização */}
                            {(cidade || estado) && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {cidade}{cidade && estado && ", "}{estado}
                                </span>
                              </div>
                            )}

                            {/* Telefone */}
                            {telefone && (
                              <a 
                                href={`tel:${telefone}`}
                                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                              >
                                <Phone className="h-4 w-4" />
                                <span>{telefone}</span>
                              </a>
                            )}
                          </div>

                          {/* Linha 3: Data */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className={cn(
                              "flex items-center gap-1.5",
                              atrasado ? "text-red-600" : "text-green-600"
                            )}>
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">
                                {ordem.data_instalacao 
                                  ? format(new Date(ordem.data_instalacao), "dd/MM/yyyy", { locale: ptBR })
                                  : "Não agendado"
                                }
                              </span>
                              {ordem.hora && (
                                <span className="text-muted-foreground">às {ordem.hora}</span>
                              )}
                            </div>
                          </div>

                          {/* Observações */}
                          {ordem.observacoes && (
                            <p className="text-xs text-muted-foreground italic">
                              {ordem.observacoes}
                            </p>
                          )}
                        </div>

                        {/* Botão de Concluir */}
                        <div className="flex items-center">
                          <Button
                            onClick={() => setConfirmDialog({ open: true, ordem })}
                            disabled={isConcluindo}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Concluir
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Dialog de Confirmação */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, ordem: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir Instalação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja marcar esta instalação como concluída?
              <br /><br />
              <strong>Pedido:</strong> #{confirmDialog.ordem?.pedido?.numero_pedido}
              <br />
              <strong>Cliente:</strong> {confirmDialog.ordem?.venda?.cliente_nome || confirmDialog.ordem?.nome_cliente}
              <br /><br />
              O pedido será automaticamente movido para a etapa <strong>"Finalizado"</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConcluir}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirmar Conclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MinimalistLayout>
  );
}
