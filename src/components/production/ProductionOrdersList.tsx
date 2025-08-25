import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Package, Wrench, Flame, Paintbrush, Plus } from "lucide-react";
import OrdemSeparacaoForm from "./OrdemSeparacaoForm";
import OrdemPerfiladeiraForm from "./OrdemPerfiladeiraForm";
import OrdemSoldagemForm from "./OrdemSoldagemForm";
import OrdemPinturaForm from "./OrdemPinturaForm";

interface LinhaOrdem {
  id: string;
  tipo_ordem: string;
  item: string;
  quantidade: number;
  tamanho: string;
}

interface PedidoCompleto {
  id: string;
  produtos: any[];
  ordens_separacao?: any[];
  ordens_perfiladeira?: any[];
  ordens_soldagem?: any[];
  ordens_pintura?: any[];
  status_ordens?: any;
}

interface ProductionOrdersListProps {
  pedido: PedidoCompleto;
  onUpdate: (updatedPedido: Partial<PedidoCompleto>) => void;
}

interface OrdemType {
  id: string;
  title: string;
  icon: any;
  field: keyof PedidoCompleto;
  statusField: string;
  calcType: string;
}

const ordemTypes: OrdemType[] = [
  {
    id: 'separacao',
    title: 'Separação',
    icon: Package,
    field: 'ordens_separacao',
    statusField: 'separacao',
    calcType: 'separacao'
  },
  {
    id: 'perfiladeira',
    title: 'Perfiladeira',
    icon: Wrench,
    field: 'ordens_perfiladeira',
    statusField: 'perfiladeira',
    calcType: 'perfiladeira'
  },
  {
    id: 'soldagem',
    title: 'Soldagem',
    icon: Flame,
    field: 'ordens_soldagem',
    statusField: 'soldagem',
    calcType: 'soldagem'
  },
  {
    id: 'pintura',
    title: 'Pintura',
    icon: Paintbrush,
    field: 'ordens_pintura',
    statusField: 'pintura',
    calcType: 'pintura'
  }
];

export default function ProductionOrdersList({ pedido, onUpdate }: ProductionOrdersListProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeForm, setActiveForm] = useState<string | null>(null);

  // Função para calcular quantas ordens são necessárias baseado nos produtos
  const calcularOrdensNecessarias = (tipoOrdem: string) => {
    if (!pedido?.produtos) return 0;
    
    let totalOrdens = 0;
    pedido.produtos.forEach((produto) => {
      const quantidade = produto?.quantidade || 1;
      const tipoProduto = produto?.tipo_produto || '';
      
      if (tipoOrdem === 'pintura') {
        if (tipoProduto.includes('pintura_epoxi')) {
          totalOrdens += quantidade;
        }
      } else if (['soldagem', 'separacao', 'perfiladeira'].includes(tipoOrdem)) {
        if (tipoProduto.includes('porta_enrolar')) {
          totalOrdens += quantidade;
        }
      }
    });
    
    return totalOrdens;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pendente': { label: 'Pendente', variant: 'secondary' as const },
      'pronto': { label: 'Pronto', variant: 'default' as const },
      'em_andamento': { label: 'Em Andamento', variant: 'outline' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pendente;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const salvarOrdem = async (tipoOrdem: string, items: any[]) => {
    const campoOrdem = `ordens_${tipoOrdem}` as keyof PedidoCompleto;
    const novoStatusOrdem = { 
      ...pedido.status_ordens, 
      [tipoOrdem]: 'pronto' 
    };
    
    onUpdate({
      [campoOrdem]: items,
      status_ordens: novoStatusOrdem
    });
    
    setActiveForm(null);
    setExpandedOrder(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ordens de Produção</CardTitle>
        <p className="text-sm text-muted-foreground">
          Gerencie as ordens de produção do pedido
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {ordemTypes.map((ordem) => {
          const ordensNecessarias = calcularOrdensNecessarias(ordem.calcType);
          const ordensExistentes = (pedido[ordem.field] as any[]) || [];
          const status = pedido.status_ordens?.[ordem.statusField] || 'pendente';
          const isExpanded = expandedOrder === ordem.id;
          const Icon = ordem.icon;

          return (
            <div key={ordem.id} className="border rounded-lg">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                onClick={() => setExpandedOrder(isExpanded ? null : ordem.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <Icon className="w-5 h-5" />
                  <div>
                    <h4 className="font-medium">{ordem.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {ordensNecessarias} ordem(ns) necessária(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(status)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveForm(ordem.id);
                    }}
                    disabled={ordensNecessarias === 0}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {status === 'pronto' ? 'Editar' : 'Criar'}
                  </Button>
                </div>
              </div>
              
              {isExpanded && (
                <div className="px-4 pb-4 border-t bg-muted/25">
                  {ordensExistentes.length > 0 ? (
                    <div className="space-y-2 mt-4">
                      <h5 className="font-medium text-sm">Itens da Ordem:</h5>
                      <div className="space-y-2">
                        {ordensExistentes.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-background rounded border">
                            <span className="text-sm">{item.item}</span>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>Qtd: {item.quantidade}</span>
                              <span>Medidas: {item.medidas}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 text-center text-muted-foreground text-sm">
                      Nenhuma ordem criada ainda
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Formulários das Ordens */}
        <OrdemSeparacaoForm
          pedidoId={pedido.id}
          isOpen={activeForm === 'separacao'}
          onSave={(items) => salvarOrdem('separacao', items)}
          onCancel={() => setActiveForm(null)}
          maxOrdens={calcularOrdensNecessarias('separacao')}
        />
        
        <OrdemPerfiladeiraForm
          pedidoId={pedido.id}
          isOpen={activeForm === 'perfiladeira'}
          onSave={(items) => salvarOrdem('perfiladeira', items)}
          onCancel={() => setActiveForm(null)}
          maxOrdens={calcularOrdensNecessarias('perfiladeira')}
        />
        
        <OrdemSoldagemForm
          pedidoId={pedido.id}
          isOpen={activeForm === 'soldagem'}
          onSave={(items) => salvarOrdem('soldagem', items)}
          onCancel={() => setActiveForm(null)}
          maxOrdens={calcularOrdensNecessarias('soldagem')}
        />
        
        <OrdemPinturaForm
          pedidoId={pedido.id}
          isOpen={activeForm === 'pintura'}
          onSave={(items) => salvarOrdem('pintura', items)}
          onCancel={() => setActiveForm(null)}
          maxOrdens={calcularOrdensNecessarias('pintura')}
        />
      </CardContent>
    </Card>
  );
}