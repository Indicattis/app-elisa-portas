import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { MapPin, Calendar, Users, DoorOpen } from "lucide-react";
import type { MetaInstalacao } from "@/hooks/useMetasInstalacao";

interface InstalacoesDaMetaModalProps {
  meta: MetaInstalacao;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstalacoesDaMetaModal({ meta, open, onOpenChange }: InstalacoesDaMetaModalProps) {
  const { data: instalacoes = [], isLoading } = useQuery({
    queryKey: ["instalacoes-da-meta", meta.id],
    enabled: open,
    queryFn: async () => {
      let query = supabase
        .from("neo_instalacoes" as any)
        .select("id, nome_cliente, cidade, estado, concluida_em, equipe_nome, autorizado_nome, tipo_responsavel")
        .eq("concluida", true)
        .gte("concluida_em", meta.data_inicio)
        .lte("concluida_em", meta.data_termino + "T23:59:59")
        .order("concluida_em", { ascending: false });

      if (meta.tipo === "equipe") {
        query = query.eq("equipe_id", meta.referencia_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DoorOpen className="h-5 w-5 text-primary" />
            Instalações da Meta
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border border-border">
          <div className="text-sm">
            <span className="text-muted-foreground">Progresso:</span>{" "}
            <span className="font-semibold text-foreground">{instalacoes.length} / {meta.quantidade_portas} portas</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {format(new Date(meta.data_inicio + "T00:00:00"), "dd/MM")} — {format(new Date(meta.data_termino + "T00:00:00"), "dd/MM")}
          </Badge>
        </div>

        <ScrollArea className="max-h-[55vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : instalacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma instalação concluída neste período.</p>
          ) : (
            <div className="space-y-2 pr-2">
              {instalacoes.map((inst: any) => (
                <div key={inst.id} className="p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors">
                  <p className="font-medium text-sm text-foreground">{inst.nome_cliente}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {inst.cidade}/{inst.estado}
                    </span>
                    {inst.concluida_em && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(inst.concluida_em), "dd/MM/yyyy")}
                      </span>
                    )}
                  </div>
                  {(inst.equipe_nome || inst.autorizado_nome) && (
                    <div className="mt-1.5">
                      <Badge variant="secondary" className="text-[10px]">
                        <Users className="h-3 w-3 mr-1" />
                        {inst.tipo_responsavel === "autorizado" ? inst.autorizado_nome : inst.equipe_nome}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
