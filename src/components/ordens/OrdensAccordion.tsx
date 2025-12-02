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
import { Hammer, Layers, Package, Paintbrush, CheckCircle, Wrench, Truck, Printer, Calendar, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ImprimirEtiquetasModal } from "./ImprimirEtiquetasModal";
import { formatDuration } from "@/utils/timeFormat";

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
                      <TableHead className="text-xs w-[60px]">Ações</TableHead>
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
    </>
  );
}
