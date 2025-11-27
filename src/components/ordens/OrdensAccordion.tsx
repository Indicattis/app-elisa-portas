import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { PedidoComOrdens } from "@/hooks/useOrdensProducao";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Hammer, Layers, Package, Paintbrush, CheckCircle, Wrench, Truck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

export function OrdensAccordion({ pedidos }: OrdensAccordionProps) {
  if (pedidos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum pedido com ordens encontrado.</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      {pedidos.map((pedido) => (
        <AccordionItem 
          key={pedido.id} 
          value={pedido.id}
          className="border rounded-lg bg-card"
        >
          <AccordionTrigger className="px-4 hover:no-underline h-12">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-semibold text-left text-sm">{pedido.numero_pedido}</p>
                  <p className="text-xs text-muted-foreground text-left">{pedido.cliente_nome}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
  );
}
