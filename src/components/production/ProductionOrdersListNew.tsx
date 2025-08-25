import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Package, Wrench, Flame, Paintbrush, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  statusField: string;
  calcType: string;
}

const ordemTypes: OrdemType[] = [
  {
    id: 'separacao',
    title: 'Separação',
    icon: Package,
    statusField: 'separacao',
    calcType: 'separacao'
  },
  {
    id: 'perfiladeira',
    title: 'Perfiladeira',
    icon: Wrench,
    statusField: 'perfiladeira',
    calcType: 'perfiladeira'
  },
  {
    id: 'soldagem',
    title: 'Soldagem',
    icon: Flame,
    statusField: 'soldagem',
    calcType: 'soldagem'
  },
  {
    id: 'pintura',
    title: 'Pintura',
    icon: Paintbrush,
    statusField: 'pintura',
    calcType: 'pintura'
  }
];

export default function ProductionOrdersListNew({ pedido, onUpdate }: ProductionOrdersListProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [linhasOrdens, setLinhasOrdens] = useState<{ [key: string]: LinhaOrdem[] }>({});
  const [editingLines, setEditingLines] = useState<{ [key: string]: LinhaOrdem[] }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchLinhasOrdens();
  }, [pedido.id]);

  const fetchLinhasOrdens = async () => {
    const { data, error } = await supabase
      .from('linhas_ordens')
      .select('*')
      .eq('pedido_id', pedido.id);

    if (error) {
      console.error('Erro ao buscar linhas das ordens:', error);
      return;
    }

    const linhasPorTipo = data.reduce((acc, linha) => {
      if (!acc[linha.tipo_ordem]) {
        acc[linha.tipo_ordem] = [];
      }
      acc[linha.tipo_ordem].push(linha);
      return acc;
    }, {} as { [key: string]: LinhaOrdem[] });

    setLinhasOrdens(linhasPorTipo);
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

  const handleEditClick = (tipoOrdem: string) => {
    setEditingLines(prev => ({
      ...prev,
      [tipoOrdem]: [...(linhasOrdens[tipoOrdem] || [])]
    }));
    setExpandedOrder(tipoOrdem);
  };

  const addNewLine = (tipoOrdem: string) => {
    setEditingLines(prev => ({
      ...prev,
      [tipoOrdem]: [
        ...(prev[tipoOrdem] || []),
        {
          id: '',
          tipo_ordem: tipoOrdem,
          item: '',
          quantidade: 1,
          tamanho: ''
        }
      ]
    }));
  };

  const updateLine = (tipoOrdem: string, index: number, field: string, value: any) => {
    setEditingLines(prev => ({
      ...prev,
      [tipoOrdem]: prev[tipoOrdem].map((linha, i) => 
        i === index ? { ...linha, [field]: value } : linha
      )
    }));
  };

  const removeLine = (tipoOrdem: string, index: number) => {
    setEditingLines(prev => ({
      ...prev,
      [tipoOrdem]: prev[tipoOrdem].filter((_, i) => i !== index)
    }));
  };

  const saveLines = async (tipoOrdem: string) => {
    const linhas = editingLines[tipoOrdem] || [];
    
    try {
      // Deletar linhas existentes
      await supabase
        .from('linhas_ordens')
        .delete()
        .eq('pedido_id', pedido.id)
        .eq('tipo_ordem', tipoOrdem);

      // Inserir novas linhas
      if (linhas.length > 0) {
        const linhasParaInserir = linhas
          .filter(linha => linha.item.trim())
          .map(linha => ({
            pedido_id: pedido.id,
            tipo_ordem: tipoOrdem,
            item: linha.item,
            quantidade: linha.quantidade,
            tamanho: linha.tamanho || ''
          }));

        if (linhasParaInserir.length > 0) {
          const { error } = await supabase
            .from('linhas_ordens')
            .insert(linhasParaInserir);

          if (error) throw error;
        }
      }

      await fetchLinhasOrdens();
      setEditingLines(prev => {
        const newState = { ...prev };
        delete newState[tipoOrdem];
        return newState;
      });
      
      // Atualizar status da ordem para 'pronto'
      const novoStatusOrdem = { 
        ...pedido.status_ordens, 
        [tipoOrdem]: 'pronto' 
      };
      
      onUpdate({
        status_ordens: novoStatusOrdem
      });

      toast({
        title: "Sucesso",
        description: `Linhas da ordem de ${tipoOrdem} salvas com sucesso`,
      });

      setExpandedOrder(null);
    } catch (error) {
      console.error('Erro ao salvar linhas:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar linhas da ordem",
      });
    }
  };

  const cancelEdit = (tipoOrdem: string) => {
    setEditingLines(prev => {
      const newState = { ...prev };
      delete newState[tipoOrdem];
      return newState;
    });
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
          const linhas = linhasOrdens[ordem.id] || [];
          const status = pedido.status_ordens?.[ordem.statusField] || 'pendente';
          const isExpanded = expandedOrder === ordem.id;
          const isEditing = editingLines[ordem.id];
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
                      {linhas.length} linha(s) criada(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(status)}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(ordem.id);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {status === 'pronto' ? 'Editar' : 'Criar'}
                  </Button>
                </div>
              </div>
              
              {isExpanded && !isEditing && (
                <div className="px-4 pb-4 border-t bg-muted/25">
                  {linhas.length > 0 ? (
                    <div className="space-y-2 mt-4">
                      <h5 className="font-medium text-sm">Linhas da Ordem:</h5>
                      <div className="space-y-2">
                        {linhas.map((linha, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-background rounded border">
                            <span className="text-sm font-medium">{linha.item}</span>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>Qtd: {linha.quantidade}</span>
                              <span>Tamanho: {linha.tamanho || 'N/A'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 text-center text-muted-foreground text-sm">
                      Nenhuma linha criada ainda
                    </div>
                  )}
                </div>
              )}

              {isExpanded && isEditing && (
                <div className="px-4 pb-4 border-t bg-muted/25">
                  <div className="space-y-4 mt-4">
                    <div className="flex justify-between items-center">
                      <h5 className="font-medium text-sm">Editar Linhas da Ordem:</h5>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addNewLine(ordem.id)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Linha
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {(editingLines[ordem.id] || []).map((linha, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 bg-background rounded border">
                          <div className="col-span-5">
                            <Input
                              placeholder="Item"
                              value={linha.item}
                              onChange={(e) => updateLine(ordem.id, index, 'item', e.target.value)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              placeholder="Qtd"
                              value={linha.quantidade}
                              onChange={(e) => updateLine(ordem.id, index, 'quantidade', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="col-span-4">
                            <Input
                              placeholder="Tamanho"
                              value={linha.tamanho}
                              onChange={(e) => updateLine(ordem.id, index, 'tamanho', e.target.value)}
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeLine(ordem.id, index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => cancelEdit(ordem.id)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={() => saveLines(ordem.id)}
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}