import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PedidoComOrdens, OrdemBase } from "@/hooks/useOrdensProducao";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Hammer, Layers, Package, Paintbrush, CheckCircle, Wrench, Truck, Printer, Calendar, MapPin, Trash2, Loader2, UserMinus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ImprimirEtiquetasModal } from "./ImprimirEtiquetasModal";
import { formatDuration } from "@/utils/timeFormat";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
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

const ORDEM_ICONS = {
  soldagem: Hammer,
  perfiladeira: Layers,
  separacao: Package,
  pintura: Paintbrush,
  qualidade: CheckCircle,
  instalacao: Wrench,
  carregamento: Truck,
};

const ORDEM_LABELS = {
  soldagem: 'Soldagem',
  perfiladeira: 'Perfiladeira',
  separacao: 'Separação',
  pintura: 'Pintura',
  qualidade: 'Qualidade',
  instalacao: 'Instalação',
  carregamento: 'Carregamento',
};

const STATUS_COLORS = {
  pendente: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  em_andamento: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  concluido: 'bg-green-500/10 text-green-700 border-green-500/20',
  cancelado: 'bg-red-500/10 text-red-700 border-red-500/20',
};

interface OrdensAccordionProps {
  pedidos: PedidoComOrdens[];
}

interface EtiquetaModalState {
  open: boolean;
  pedidoId: string;
  numeroPedido: string;
  clienteNome: string;
  tipoOrdem: string;
  responsavelNome?: string;
}

export function OrdensAccordion({ pedidos }: OrdensAccordionProps) {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingOrdemId, setDeletingOrdemId] = useState<string | null>(null);
  const [ordemToDelete, setOrdemToDelete] = useState<{ id: string; tipo: string; numero: string } | null>(null);
  const [ordemToRemoveResponsavel, setOrdemToRemoveResponsavel] = useState<{ 
    id: string; 
    tipo: string; 
    numero: string;
    responsavelNome: string;
  } | null>(null);
  const [removingResponsavelId, setRemovingResponsavelId] = useState<string | null>(null);
  const [etiquetaModal, setEtiquetaModal] = useState<EtiquetaModalState>({
    open: false,
    pedidoId: '',
    numeroPedido: '',
    clienteNome: '',
    tipoOrdem: ''
  });

  const handleImprimirEtiquetas = (pedido: PedidoComOrdens, ordem: OrdemBase) => {
    setEtiquetaModal({
      open: true,
      pedidoId: pedido.id,
      numeroPedido: pedido.numero_pedido,
      clienteNome: pedido.cliente_nome,
      tipoOrdem: ordem.tipo,
      responsavelNome: ordem.responsavel_nome
    });
  };

  const handleDeleteOrdem = async () => {
    if (!ordemToDelete) return;
    
    setDeletingOrdemId(ordemToDelete.id);
    
    try {
      // Determinar tabela baseado no tipo
      const tableMap: Record<string, string> = {
        soldagem: 'ordens_soldagem',
        perfiladeira: 'ordens_perfiladeira',
        separacao: 'ordens_separacao',
        pintura: 'ordens_pintura',
        qualidade: 'ordens_qualidade',
        instalacao: 'ordens_instalacao',
        carregamento: 'ordens_carregamento',
      };
      
      const tableName = tableMap[ordemToDelete.tipo];
      if (!tableName) {
        throw new Error('Tipo de ordem inválido');
      }
      
      // Primeiro deletar linhas de ordens associadas
      await supabase
        .from('linhas_ordens')
        .delete()
        .eq('ordem_id', ordemToDelete.id);
      
      // Deletar pontuações associadas
      await supabase
        .from('pontuacao_colaboradores')
        .delete()
        .eq('ordem_id', ordemToDelete.id);
      
      // Remover referência do responsável antes de deletar (set to null)
      await supabase
        .from(tableName as any)
        .update({ responsavel_id: null })
        .eq('id', ordemToDelete.id);
      
      // Deletar a ordem
      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', ordemToDelete.id);
      
      if (error) throw error;
      
      toast({
        title: "Ordem excluída",
        description: `Ordem ${ordemToDelete.numero} foi excluída com sucesso.`,
      });
      
      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
      
    } catch (error: any) {
      console.error('Erro ao excluir ordem:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a ordem.",
        variant: "destructive",
      });
    } finally {
      setDeletingOrdemId(null);
      setOrdemToDelete(null);
    }
  };

  const handleRemoveResponsavel = async () => {
    if (!ordemToRemoveResponsavel) return;
    
    setRemovingResponsavelId(ordemToRemoveResponsavel.id);
    
    try {
      const tableMap: Record<string, string> = {
        soldagem: 'ordens_soldagem',
        perfiladeira: 'ordens_perfiladeira',
        separacao: 'ordens_separacao',
        pintura: 'ordens_pintura',
        qualidade: 'ordens_qualidade',
        instalacao: 'ordens_instalacao',
        carregamento: 'ordens_carregamento',
      };
      
      const tableName = tableMap[ordemToRemoveResponsavel.tipo];
      if (!tableName) {
        throw new Error('Tipo de ordem inválido');
      }
      
      const fieldName = ordemToRemoveResponsavel.tipo === 'carregamento' 
        ? 'responsavel_carregamento_id' 
        : 'responsavel_id';
      
      const { error } = await supabase
        .from(tableName as any)
        .update({ [fieldName]: null, capturada_em: null })
        .eq('id', ordemToRemoveResponsavel.id);
      
      if (error) throw error;
      
      toast({
        title: "Responsável removido",
        description: `${ordemToRemoveResponsavel.responsavelNome} foi removido da ordem ${ordemToRemoveResponsavel.numero}.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
      
    } catch (error: any) {
      console.error('Erro ao remover responsável:', error);
      toast({
        title: "Erro ao remover responsável",
        description: error.message || "Não foi possível remover o responsável.",
        variant: "destructive",
      });
    } finally {
      setRemovingResponsavelId(null);
      setOrdemToRemoveResponsavel(null);
    }
  };

  if (pedidos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum pedido com ordens encontrado.</p>
      </div>
    );
  }

  return (
    <>
      <Accordion type="single" collapsible className="w-full space-y-3">
        {pedidos.map((pedido) => (
          <AccordionItem 
            key={pedido.id} 
            value={pedido.id}
            className="border rounded-lg bg-card"
          >
            <AccordionTrigger className="px-4 hover:no-underline py-3">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full pr-4 gap-2">
                {/* Coluna 1: Número e Cliente */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-left text-sm">{pedido.numero_pedido}</p>
                  <p className="text-xs text-muted-foreground text-left truncate">{pedido.cliente_nome}</p>
                </div>
                
                {/* Coluna 2: Datas e Localização */}
                <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                  {pedido.data_entrega && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Entrega: {format(new Date(pedido.data_entrega), "dd/MM/yy", { locale: ptBR })}</span>
                    </div>
                  )}
                  {(pedido.endereco_cidade || pedido.endereco_estado) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {pedido.endereco_cidade}{pedido.endereco_cidade && pedido.endereco_estado ? '/' : ''}{pedido.endereco_estado}
                      </span>
                    </div>
                  )}
                </div>

                {/* Coluna 3: Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {pedido.em_backlog && (
                    <Badge variant="destructive" className="text-xs">
                      Backlog
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {pedido.etapa_atual || 'N/A'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {pedido.total_ordens} {pedido.total_ordens === 1 ? 'ordem' : 'ordens'}
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0">
              <div className="border-t">
                <Table>
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="text-xs">Tipo</TableHead>
                      <TableHead className="text-xs">Número</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Responsável</TableHead>
                      <TableHead className="text-xs">Data</TableHead>
                      <TableHead className="text-xs">Tempo</TableHead>
                      <TableHead className="text-xs w-[80px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedido.ordens.map((ordem) => {
                      const Icon = ORDEM_ICONS[ordem.tipo as keyof typeof ORDEM_ICONS];
                      return (
                        <TableRow key={ordem.id} className="h-[35px]">
                          <TableCell className="py-0">
                            <div className="flex items-center gap-2">
                              {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                              <span className="text-xs">{ORDEM_LABELS[ordem.tipo as keyof typeof ORDEM_LABELS]}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-0">
                            <span className="text-xs font-medium">{ordem.numero_ordem}</span>
                          </TableCell>
                          <TableCell className="py-0">
                            <Badge 
                              variant="outline" 
                              className={`text-xs h-5 ${STATUS_COLORS[ordem.status as keyof typeof STATUS_COLORS] || ''}`}
                            >
                              {ordem.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-0">
                            <span className="text-xs text-muted-foreground">
                              {ordem.responsavel_nome || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="py-0">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(ordem.created_at), "dd/MM/yy", { locale: ptBR })}
                            </span>
                          </TableCell>
                          <TableCell className="py-0">
                            {ordem.historico && ordem.tempo_conclusao_segundos ? (
                              <span className="text-xs text-green-600 font-medium">
                                {formatDuration(ordem.tempo_conclusao_segundos)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="py-0">
                            <div className="flex items-center gap-1">
                              {ordem.responsavel_id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOrdemToRemoveResponsavel({ 
                                      id: ordem.id, 
                                      tipo: ordem.tipo, 
                                      numero: ordem.numero_ordem,
                                      responsavelNome: ordem.responsavel_nome || 'Responsável'
                                    });
                                  }}
                                  disabled={removingResponsavelId === ordem.id}
                                  title="Remover responsável"
                                >
                                  {removingResponsavelId === ordem.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <UserMinus className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImprimirEtiquetas(pedido, ordem);
                                }}
                                title="Imprimir etiquetas"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </Button>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOrdemToDelete({ 
                                      id: ordem.id, 
                                      tipo: ordem.tipo, 
                                      numero: ordem.numero_ordem 
                                    });
                                  }}
                                  disabled={deletingOrdemId === ordem.id}
                                  title="Excluir ordem"
                                >
                                  {deletingOrdemId === ordem.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <ImprimirEtiquetasModal
        open={etiquetaModal.open}
        onOpenChange={(open) => setEtiquetaModal(prev => ({ ...prev, open }))}
        pedidoId={etiquetaModal.pedidoId}
        numeroPedido={etiquetaModal.numeroPedido}
        clienteNome={etiquetaModal.clienteNome}
        tipoOrdem={etiquetaModal.tipoOrdem}
        responsavelNome={etiquetaModal.responsavelNome}
      />

      <AlertDialog open={!!ordemToDelete} onOpenChange={(open) => !open && setOrdemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ordem de produção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a ordem <strong>{ordemToDelete?.numero}</strong>?
              Esta ação não pode ser desfeita e irá remover também as linhas e pontuações associadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrdem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog 
        open={!!ordemToRemoveResponsavel} 
        onOpenChange={(open) => !open && setOrdemToRemoveResponsavel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover responsável da ordem</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{ordemToRemoveResponsavel?.responsavelNome}</strong> como 
              responsável pela ordem <strong>{ordemToRemoveResponsavel?.numero}</strong>?
              <br /><br />
              A ordem ficará disponível para outro colaborador capturá-la.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveResponsavel}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Remover Responsável
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
