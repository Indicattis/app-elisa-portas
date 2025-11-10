import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { PedidoComOrdens } from "@/hooks/useOrdensProducao";
import { OrdemCard } from "./OrdemCard";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Hammer, Layers, Package, Paintbrush, CheckCircle, Wrench } from "lucide-react";

const ORDEM_ICONS = {
  soldagem: Hammer,
  perfiladeira: Layers,
  separacao: Package,
  pintura: Paintbrush,
  qualidade: CheckCircle,
  instalacao: Wrench,
};

const ORDEM_LABELS = {
  soldagem: 'Solda',
  perfiladeira: 'Perfil',
  separacao: 'Separ',
  pintura: 'Pint',
  qualidade: 'Qual',
  instalacao: 'Inst',
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
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-semibold text-left">{pedido.numero_pedido}</p>
                  <p className="text-sm text-muted-foreground text-left">{pedido.cliente_nome}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {Object.entries(pedido.contadores).map(([tipo, count]) => {
                  if (count === 0) return null;
                  const Icon = ORDEM_ICONS[tipo as keyof typeof ORDEM_ICONS];
                  return (
                    <Badge key={tipo} variant="outline" className="gap-1">
                      <Icon className="h-3 w-3" />
                      <span className="text-xs">{count} {ORDEM_LABELS[tipo as keyof typeof ORDEM_LABELS]}</span>
                    </Badge>
                  );
                })}
                <Badge variant="secondary" className="ml-2">
                  {pedido.total_ordens} {pedido.total_ordens === 1 ? 'ordem' : 'ordens'}
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 pt-2">
              <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Status:</span>{" "}
                  <Badge variant="outline" className="ml-2">{pedido.status}</Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  Criado em {format(new Date(pedido.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Ordens de Produção</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pedido.ordens.map((ordem) => (
                    <OrdemCard key={ordem.id} ordem={ordem} />
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
