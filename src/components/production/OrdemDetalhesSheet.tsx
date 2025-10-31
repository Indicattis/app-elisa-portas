import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Circle, Package } from "lucide-react";

type TipoOrdem = 'soldagem' | 'perfiladeira' | 'separacao';

interface LinhaOrdem {
  id: string;
  item: string;
  quantidade: number;
  tamanho?: string;
  concluida: boolean;
}

interface Ordem {
  id: string;
  numero_ordem: string;
  pedido_id: string;
  status: string;
  observacoes?: string;
  linhas?: LinhaOrdem[];
  pedido?: {
    cliente_nome: string;
  };
}

interface OrdemDetalhesSheetProps {
  ordem: Ordem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoOrdem: TipoOrdem;
  onMarcarLinha: (linhaId: string, concluida: boolean) => void;
  onConcluirOrdem: (ordemId: string) => void;
  isUpdating?: boolean;
}

const TIPO_LABELS: Record<TipoOrdem, string> = {
  soldagem: 'Soldagem',
  perfiladeira: 'Perfiladeira',
  separacao: 'Separação',
};

export function OrdemDetalhesSheet({
  ordem,
  open,
  onOpenChange,
  tipoOrdem,
  onMarcarLinha,
  onConcluirOrdem,
  isUpdating = false,
}: OrdemDetalhesSheetProps) {
  if (!ordem) return null;

  const linhas = ordem.linhas || [];
  const linhasConcluidas = linhas.filter(l => l.concluida).length;
  const todasConcluidas = linhas.length > 0 && linhas.every(l => l.concluida);
  const progresso = linhas.length > 0 ? Math.round((linhasConcluidas / linhas.length) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {ordem.numero_ordem}
          </SheetTitle>
          <SheetDescription>
            Detalhes da ordem de {TIPO_LABELS[tipoOrdem].toLowerCase()}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Informações da ordem */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cliente</span>
              <span className="text-sm font-medium">{ordem.pedido?.cliente_nome}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={ordem.status === 'concluido' ? 'default' : 'secondary'}>
                {ordem.status === 'concluido' ? 'Concluído' : 'Pendente'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Progresso</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {linhasConcluidas}/{linhas.length}
                </span>
                <Badge variant="outline">{progresso}%</Badge>
              </div>
            </div>
          </div>

          {ordem.observacoes && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm font-medium">Observações</span>
                <p className="text-sm text-muted-foreground">{ordem.observacoes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Lista de linhas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Itens de Produção</span>
              {todasConcluidas && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Todas concluídas
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {linhas.map((linha) => (
                <div
                  key={linha.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={linha.concluida}
                    onCheckedChange={(checked) => onMarcarLinha(linha.id, checked as boolean)}
                    disabled={ordem.status === 'concluido' || isUpdating}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {linha.concluida ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={`text-sm font-medium ${linha.concluida ? 'line-through text-muted-foreground' : ''}`}>
                        {linha.item}
                      </span>
                    </div>
                    
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Qtd: {linha.quantidade}</span>
                      {linha.tamanho && <span>Tamanho: {linha.tamanho}</span>}
                    </div>
                  </div>
                </div>
              ))}

              {linhas.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Nenhum item de produção cadastrado
                </div>
              )}
            </div>
          </div>

          {/* Botão de concluir ordem */}
          {ordem.status !== 'concluido' && (
            <>
              <Separator />
              <Button
                className="w-full"
                disabled={!todasConcluidas || isUpdating}
                onClick={() => onConcluirOrdem(ordem.id)}
              >
                {isUpdating ? "Concluindo..." : "Concluir Ordem"}
              </Button>
              {!todasConcluidas && linhas.length > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Marque todos os itens como concluídos para finalizar a ordem
                </p>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
