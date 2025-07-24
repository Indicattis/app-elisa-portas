
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, Package, Phone, MapPin, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProducaoChecklist } from "./ProducaoChecklist";
import { EditPedidoModal } from "./EditPedidoModal";

interface Pedido {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  cliente_telefone: string;
  produto_tipo: string;
  produto_cor: string;
  produto_altura: string;
  produto_largura: string;
  data_entrega: string | null;
  status: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_cep?: string;
  endereco_estado?: string;
  observacoes?: string;
}

interface ProductionSidebarProps {
  pedidos: Pedido[];
  catalogoCores: { nome: string; codigo_hex: string }[];
  onPedidoDoubleClick: (pedido: Pedido) => void;
  onPedidoDragStart: (pedidoId: string) => void;
  onPedidoDragEnd: () => void;
  onPedidosUpdated: () => void;
  selectedPedido?: Pedido | null;
  isDragHovering?: boolean;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onStatusUpdate?: (pedidoId: string, novoStatus: string) => void;
  statusOptions?: { value: string; label: string; color: string }[];
}

export function ProductionSidebar({ 
  pedidos, 
  catalogoCores, 
  onPedidoDoubleClick,
  onPedidoDragStart,
  onPedidoDragEnd,
  onPedidosUpdated,
  selectedPedido,
  isDragHovering,
  onDrop,
  onDragOver,
  onDragLeave,
  onStatusUpdate,
  statusOptions
}: ProductionSidebarProps) {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [editModalOpen, setEditModalOpen] = useState(false);

  const getCorStyle = (nomeCor: string) => {
    const cor = catalogoCores.find(c => c.nome === nomeCor);
    return cor ? { backgroundColor: cor.codigo_hex } : {};
  };

  const handlePedidoDoubleClick = (pedido: Pedido) => {
    onPedidoDoubleClick(pedido);
    setView('detail');
  };

  const handleBackToList = () => {
    setView('list');
  };

  const handleEditClick = () => {
    setEditModalOpen(true);
  };

  const handleEditSave = () => {
    onPedidosUpdated();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em_producao':
        return 'bg-blue-100 text-blue-800';
      case 'pendente_pintura':
        return 'bg-orange-100 text-orange-800';
      case 'pendente_instalacao':
        return 'bg-red-100 text-red-800';
      case 'autorizado':
        return 'bg-gray-100 text-gray-800';
      case 'instalada':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-muted/10 text-muted-foreground';
    }
  };

  const pedidosSemData = pedidos.filter(p => !p.data_entrega);
  const pedidosComData = pedidos.filter(p => p.data_entrega);

  if (view === 'detail' && selectedPedido) {
    return (
      <>
        <div className="w-80 bg-card border-l border-border flex flex-col h-full">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="p-1 h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-semibold flex-1">Detalhes do Pedido</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditClick}
                className="p-1 h-8 w-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-1">
                  Pedido {selectedPedido.numero_pedido}
                </h4>
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  getStatusColor(selectedPedido.status)
                )}>
                  {selectedPedido.status}
                </span>
              </div>

              <Separator />

              <div>
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Cliente
                </h5>
                <p className="text-sm">{selectedPedido.cliente_nome}</p>
                {selectedPedido.cliente_telefone && (
                  <p className="text-sm text-muted-foreground">
                    {selectedPedido.cliente_telefone}
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produto
                </h5>
                <p className="text-sm">
                  {selectedPedido.produto_tipo} - {selectedPedido.produto_altura} x {selectedPedido.produto_largura}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div 
                    className="h-4 w-4 rounded-full border border-gray-300" 
                    style={getCorStyle(selectedPedido.produto_cor)}
                  />
                  <span className="text-sm">Cor: {selectedPedido.produto_cor}</span>
                </div>
              </div>

              <Separator />

              <ProducaoChecklist 
                pedidoId={selectedPedido.id}
                onStatusChange={onPedidosUpdated}
              />

              {(selectedPedido.endereco_rua || selectedPedido.endereco_cidade) && (
                <>
                  <Separator />
                  <div>
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereço
                    </h5>
                    <div className="text-sm space-y-1">
                      {selectedPedido.endereco_rua && (
                        <p>{selectedPedido.endereco_rua}, {selectedPedido.endereco_numero}</p>
                      )}
                      {selectedPedido.endereco_bairro && (
                        <p>{selectedPedido.endereco_bairro}</p>
                      )}
                      {selectedPedido.endereco_cidade && (
                        <p>{selectedPedido.endereco_cidade} - {selectedPedido.endereco_estado}</p>
                      )}
                      {selectedPedido.endereco_cep && (
                        <p>CEP: {selectedPedido.endereco_cep}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {selectedPedido.data_entrega && (
                <>
                  <Separator />
                  <div>
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data de Entrega
                    </h5>
                    <p className="text-sm">
                      {new Date(selectedPedido.data_entrega + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </>
              )}

              {selectedPedido.observacoes && (
                <>
                  <Separator />
                  <div>
                    <h5 className="font-medium mb-2">Observações</h5>
                    <p className="text-sm text-muted-foreground">
                      {selectedPedido.observacoes}
                    </p>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        <EditPedidoModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          pedido={selectedPedido}
          onSave={handleEditSave}
          catalogoCores={catalogoCores}
        />
      </>
    );
  }

  return (
    <div 
      className={cn(
        "w-80 bg-card border-l border-border flex flex-col h-full",
        isDragHovering && "bg-blue-50 border-blue-200"
      )}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">Lista de Pedidos</h3>
        <p className="text-sm text-muted-foreground">
          {pedidos.length} pedidos • Duplo clique para detalhes
        </p>
        {isDragHovering && (
          <p className="text-sm text-blue-600 mt-2">
            Solte aqui para remover data de entrega
          </p>
        )}
      </div>

      <ScrollArea className="flex-1">
        {/* Pedidos sem data de entrega */}
        <div className="p-4">
          <h4 className="font-medium text-sm mb-3 text-muted-foreground">
            Sem Data de Entrega ({pedidosSemData.length})
          </h4>
          
          <div className="space-y-2">
            {pedidosSemData.map((pedido) => (
              <div
                key={pedido.id}
                className={cn(
                  "border rounded-lg p-3 cursor-move hover:bg-accent/50 transition-colors",
                  pedido.status === 'para_instalacao' ? 'bg-green-50 border-green-200' : 'bg-background border-border'
                )}
                draggable
                onDragStart={() => onPedidoDragStart(pedido.id)}
                onDragEnd={onPedidoDragEnd}
                onDoubleClick={() => handlePedidoDoubleClick(pedido)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{pedido.numero_pedido}</span>
                    {onStatusUpdate && statusOptions ? (
                      <Select
                        value={pedido.status}
                        onValueChange={(novoStatus) => onStatusUpdate(pedido.id, novoStatus)}
                      >
                        <SelectTrigger className="h-6 w-auto p-1 text-xs">
                          <span className={cn(
                            "px-2 py-1 rounded-full",
                            getStatusColor(pedido.status)
                          )}>
                            {statusOptions.find(s => s.value === pedido.status)?.label || pedido.status}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className={`h-2 w-2 rounded-full bg-${option.color}-500`}
                                />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        getStatusColor(pedido.status)
                      )}>
                        {pedido.status}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {pedido.cliente_nome}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full border border-gray-300" 
                      style={getCorStyle(pedido.produto_cor)}
                    />
                    <span className="text-xs">{pedido.produto_cor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Pedidos com data de entrega */}
        <div className="p-4">
          <h4 className="font-medium text-sm mb-3 text-muted-foreground">
            Com Data de Entrega ({pedidosComData.length})
          </h4>
          
          <div className="space-y-2">
            {pedidosComData.map((pedido) => (
              <div
                key={pedido.id}
                className={cn(
                  "border rounded-lg p-3 cursor-move hover:bg-accent/50 transition-colors",
                  pedido.status === 'para_instalacao' ? 'bg-green-50 border-green-200' : 'bg-background border-border'
                )}
                draggable
                onDragStart={() => onPedidoDragStart(pedido.id)}
                onDragEnd={onPedidoDragEnd}
                onDoubleClick={() => handlePedidoDoubleClick(pedido)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{pedido.numero_pedido}</span>
                    {onStatusUpdate && statusOptions ? (
                      <Select
                        value={pedido.status}
                        onValueChange={(novoStatus) => onStatusUpdate(pedido.id, novoStatus)}
                      >
                        <SelectTrigger className="h-6 w-auto p-1 text-xs">
                          <span className={cn(
                            "px-2 py-1 rounded-full",
                            getStatusColor(pedido.status)
                          )}>
                            {statusOptions.find(s => s.value === pedido.status)?.label || pedido.status}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className={`h-2 w-2 rounded-full bg-${option.color}-500`}
                                />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        getStatusColor(pedido.status)
                      )}>
                        {pedido.status}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {pedido.cliente_nome}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full border border-gray-300" 
                      style={getCorStyle(pedido.produto_cor)}
                    />
                    <span className="text-xs">{pedido.produto_cor}</span>
                  </div>

                  {pedido.data_entrega && (
                    <div className="text-xs text-blue-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(pedido.data_entrega + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
