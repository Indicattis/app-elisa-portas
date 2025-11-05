import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useInstalacoesDisponiveis } from "@/hooks/useInstalacoesDisponiveis";
import { cn } from "@/lib/utils";

interface SelecionarInstalacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipId: string;
  equipNome: string;
  data: Date;
  onSelectInstalacao: (instalacaoId: string, equipId: string, data: Date) => Promise<void>;
}

export function SelecionarInstalacaoModal({
  open,
  onOpenChange,
  equipId,
  equipNome,
  data,
  onSelectInstalacao,
}: SelecionarInstalacaoModalProps) {
  const { fetchInstalacoesDisponiveis, loading } = useInstalacoesDisponiveis();
  const [instalacoes, setInstalacoes] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadInstalacoes();
      setSelectedId(null);
    }
  }, [open]);

  const loadInstalacoes = async () => {
    const data = await fetchInstalacoesDisponiveis();
    setInstalacoes(data);
  };

  const handleConfirm = async () => {
    if (selectedId) {
      setSubmitting(true);
      try {
        await onSelectInstalacao(selectedId, equipId, data);
        onOpenChange(false);
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Agendar Instalação - {format(data, "dd/MM/yyyy", { locale: ptBR })}
          </DialogTitle>
          <DialogDescription>
            Equipe: {equipNome}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : instalacoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">Nenhuma instalação disponível</p>
              <p className="text-sm mt-2">
                Não há instalações com pedidos em "Aguardando Coleta" ou "Finalizado"
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {instalacoes.map((inst) => (
                <Card
                  key={inst.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedId === inst.id && "border-primary bg-accent ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedId(inst.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-1">
                          {inst.nome_cliente}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {inst.cidade}/{inst.estado}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">
                            Pedido #{inst.pedido?.numero_pedido}
                          </Badge>
                          <Badge 
                            variant={
                              inst.pedido?.etapa_atual === 'aguardando_coleta' 
                                ? 'secondary' 
                                : 'default'
                            }
                          >
                            {inst.pedido?.etapa_atual === 'aguardando_coleta'
                              ? 'Aguardando Coleta'
                              : 'Finalizado'}
                          </Badge>
                        </div>
                      </div>
                      {inst.data_instalacao && (
                        <Badge variant="outline" className="shrink-0">
                          Agendado: {format(new Date(inst.data_instalacao), "dd/MM", { locale: ptBR })}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedId || submitting}
          >
            {submitting ? "Agendando..." : "Confirmar Agendamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
