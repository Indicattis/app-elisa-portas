import { format, addDays, isSameDay } from "date-fns";
import { useState } from "react";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { useOrdensCarregamentoInstalacao } from "@/hooks/useOrdensCarregamentoInstalacao";
import { useEquipesMembros } from "@/hooks/useEquipesMembros";
import { CelulaDia } from "./CelulaDia";
import { SelecionarPedidoInstalacaoModal } from "@/components/instalacoes/SelecionarPedidoInstalacaoModal";
import { EquipeMembrosList } from "./EquipeMembrosList";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { OrdemCarregamentoInstalacao } from "@/hooks/useOrdensCarregamentoInstalacao";

interface CronogramaInstalacaoProps {
  currentWeek: Date;
  onEditPonto: (instalacao: any) => void;
  equipesFiltradas?: any[];
}

const DIAS_SEMANA = [
  { label: "Segunda", value: 1 },
  { label: "Terça", value: 2 },
  { label: "Quarta", value: 3 },
  { label: "Quinta", value: 4 },
  { label: "Sexta", value: 5 },
  { label: "Sábado", value: 6 },
  { label: "Domingo", value: 0 },
];

// Componente para exibir ordem de carregamento de instalação
function OrdemCarregamentoCard({ 
  ordem, 
  cor, 
  onDragStart, 
  onDragEnd, 
  onClick 
}: { 
  ordem: OrdemCarregamentoInstalacao; 
  cor: string; 
  onDragStart: (item: any) => void; 
  onDragEnd: () => void; 
  onClick: () => void;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    onDragStart({
      id: ordem.id,
      equipId: ordem.responsavel_carregamento_id,
      tipo: 'ordem_carregamento'
    });
  };

  const getResponsavelNome = () => {
    if (ordem.responsavel_carregamento_nome) {
      return ordem.responsavel_carregamento_nome;
    }
    if (ordem.equipe?.nome) {
      return ordem.equipe.nome;
    }
    return 'Sem responsável';
  };

  const cidade = ordem.venda?.cidade;
  const estado = ordem.venda?.estado;

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="p-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
      style={{ 
        backgroundColor: `${cor}15`,
        borderLeft: `3px solid ${cor}`
      }}
    >
      <div className="space-y-1">
        <p className="text-xs font-medium truncate">{ordem.nome_cliente}</p>
        <Badge variant="outline" className="text-[10px]">
          {getResponsavelNome()}
        </Badge>
        {cidade && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground inline-block ml-1" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{cidade}{estado ? `, ${estado}` : ''}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </Card>
  );
}

export function CronogramaInstalacao({ currentWeek, onEditPonto, equipesFiltradas }: CronogramaInstalacaoProps) {
  const { equipes } = useEquipesInstalacao();
  const { ordens, updateOrdem } = useOrdensCarregamentoInstalacao(currentWeek, 'week');
  const { draggedItem, handleDragStart, handleDragEnd } = useDragAndDrop();
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemCarregamentoInstalacao | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    equipId: string;
    equipNome: string;
    diaSemana: number;
    data: Date;
  } | null>(null);
  const { toast } = useToast();

  const equipesParaExibir = equipesFiltradas || equipes;

  // Wrapper para carregar membros de cada equipe
  function EquipeMembrosEquipeWrapper({ equipeId }: { equipeId: string }) {
    const { membros } = useEquipesMembros(equipeId);
    return <EquipeMembrosList membros={membros} compact />;
  }


  const handleDrop = async (equipId: string, diaSemana: number) => {
    if (draggedItem && draggedItem.equipId !== equipId) {
      // Calcular a nova data baseada no dia da semana
      const index = DIAS_SEMANA.findIndex(d => d.value === diaSemana);
      const novaData = addDays(currentWeek, index);
      const equipe = equipesParaExibir.find(e => e.id === equipId);
      
      await updateOrdem({
        id: draggedItem.id,
        data: {
          responsavel_carregamento_id: equipId,
          responsavel_carregamento_nome: equipe?.nome || null,
          data_carregamento: format(novaData, 'yyyy-MM-dd')
        }
      });
      
      toast({
        title: "Ordem atualizada",
        description: "A ordem foi movida para a nova data/equipe."
      });
    }
  };

  const handleCellDoubleClick = (equipId: string, diaSemana: number, data: Date) => {
    const equipe = equipesParaExibir.find(e => e.id === equipId);
    if (equipe) {
      setSelectedCell({
        equipId,
        equipNome: equipe.nome,
        diaSemana,
        data
      });
      setModalOpen(true);
    }
  };

  const handleSelectPedido = async () => {
    // Recarregar instalações após criar uma nova
    setModalOpen(false);
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header com dias da semana */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-4 font-medium border-r bg-muted/50">Equipe</div>
          {DIAS_SEMANA.map((dia, index) => {
            const dataAtual = addDays(currentWeek, index);
            const diaNumero = dataAtual.getDate();
            const mesNumero = dataAtual.getMonth() + 1;
            
            return (
              <div key={dia.value} className="p-4 text-center border-r last:border-r-0">
                <div className="font-medium">{dia.label}</div>
                <div className="text-sm text-muted-foreground">
                  {String(diaNumero).padStart(2, '0')}/{String(mesNumero).padStart(2, '0')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid com equipes e pontos */}
        <div className="divide-y">
          {equipesParaExibir.map((equipe) => (
            <div key={equipe.id} className="grid grid-cols-8 min-h-[100px]">
              {/* Coluna da equipe */}
              <div className="p-4 border-r bg-muted/30 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: equipe.cor }}
                  />
                  <span className="font-medium">{equipe.nome}</span>
                </div>
                <EquipeMembrosEquipeWrapper equipeId={equipe.id} />
              </div>

              {/* Colunas dos dias */}
              {DIAS_SEMANA.map((dia, index) => {
                const dataAtual = addDays(currentWeek, index);
                const ordensNoDia = ordens.filter(
                  o => o.responsavel_carregamento_id === equipe.id && 
                       o.data_carregamento && 
                       isSameDay(new Date(o.data_carregamento), dataAtual)
                );

                return (
                  <CelulaDia
                    key={`${equipe.id}-${dia.value}`}
                    equipId={equipe.id}
                    diaSemana={dia.value}
                    data={dataAtual}
                    onDrop={handleDrop}
                    onDoubleClick={handleCellDoubleClick}
                    draggedItem={draggedItem}
                  >
                    {ordensNoDia.map((ordem) => (
                      <OrdemCarregamentoCard
                        key={ordem.id}
                        ordem={ordem}
                        cor={equipe.cor || '#888'}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedOrdem(ordem)}
                      />
                    ))}
                  </CelulaDia>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selectedOrdem && (
        <OrdemDetalheSheet 
          ordem={selectedOrdem} 
          open={!!selectedOrdem} 
          onOpenChange={(open) => !open && setSelectedOrdem(null)} 
        />
      )}

      {selectedCell && (
        <SelecionarPedidoInstalacaoModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          dataSelecionada={selectedCell.data}
          onPedidoSelecionado={handleSelectPedido}
        />
      )}
    </div>
  );
}

// Componente simples para exibir detalhes da ordem
function OrdemDetalheSheet({ 
  ordem, 
  open, 
  onOpenChange 
}: { 
  ordem: OrdemCarregamentoInstalacao; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <div 
      className={`fixed inset-0 z-50 ${open ? 'block' : 'hidden'}`}
      onClick={() => onOpenChange(false)}
    >
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
      <div 
        className="fixed right-0 top-0 h-full w-[400px] bg-background border-l shadow-lg p-6 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Detalhes da Ordem</h2>
            <button 
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Cliente</label>
              <p className="font-medium">{ordem.nome_cliente}</p>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground">Data Carregamento</label>
              <p className="font-medium">{ordem.data_carregamento || '-'}</p>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground">Responsável</label>
              <p className="font-medium">{ordem.responsavel_carregamento_nome || ordem.equipe?.nome || '-'}</p>
            </div>
            
            {ordem.venda && (
              <>
                <div>
                  <label className="text-sm text-muted-foreground">Localização</label>
                  <p className="font-medium">
                    {ordem.venda.cidade}{ordem.venda.estado ? `, ${ordem.venda.estado}` : ''}
                  </p>
                </div>
                
                {ordem.venda.endereco_completo && (
                  <div>
                    <label className="text-sm text-muted-foreground">Endereço</label>
                    <p className="font-medium">{ordem.venda.endereco_completo}</p>
                  </div>
                )}
              </>
            )}
            
            {ordem.pedido && (
              <div>
                <label className="text-sm text-muted-foreground">Pedido</label>
                <p className="font-medium">#{ordem.pedido.numero_pedido}</p>
              </div>
            )}
            
            {ordem.observacoes && (
              <div>
                <label className="text-sm text-muted-foreground">Observações</label>
                <p className="font-medium">{ordem.observacoes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
