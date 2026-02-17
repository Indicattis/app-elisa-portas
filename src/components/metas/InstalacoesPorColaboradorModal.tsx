import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, CalendarDays, Users, CheckCircle2, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InstalacaoItem {
  id: string;
  nome_cliente: string;
  cidade: string;
  estado: string;
  data_instalacao: string | null;
  concluida: boolean;
  equipe_nome: string | null;
  _source: "neo" | "legacy";
}

export function InstalacoesPorColaboradorModal({ userId, open, onOpenChange }: Props) {
  // Buscar dados do colaborador
  const { data: colaborador } = useQuery({
    queryKey: ["colaborador-modal", userId],
    enabled: open && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_users")
        .select("id, user_id, nome, foto_perfil_url, role")
        .eq("user_id", userId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Buscar instalações
  const { data: instalacoes, isLoading } = useQuery({
    queryKey: ["instalacoes-colaborador", userId],
    enabled: open && !!userId,
    queryFn: async () => {
      // 1. Buscar equipes do colaborador
      const { data: membrosData } = await supabase
        .from("equipes_instalacao_membros")
        .select("equipe_id")
        .eq("user_id", userId);

      const equipeIds = (membrosData || []).map((m) => m.equipe_id);

      const results: InstalacaoItem[] = [];
      const seenIds = new Set<string>();

      // 2. Buscar neo_instalacoes pelas equipes
      if (equipeIds.length > 0) {
        const { data: neoData } = await supabase
          .from("neo_instalacoes")
          .select("id, nome_cliente, cidade, estado, data_instalacao, concluida, equipe_nome")
          .in("equipe_id", equipeIds)
          .order("data_instalacao", { ascending: false });

        (neoData || []).forEach((inst) => {
          if (!seenIds.has(inst.id)) {
            seenIds.add(inst.id);
            results.push({ ...inst, _source: "neo" });
          }
        });
      }

      // 3. Buscar instalacoes legadas onde é responsável
      const { data: legacyData } = await supabase
        .from("instalacoes")
        .select("id, nome_cliente, cidade, estado, data_instalacao, instalacao_concluida, responsavel_instalacao_nome")
        .eq("responsavel_instalacao_id", userId)
        .order("data_instalacao", { ascending: false });

      (legacyData || []).forEach((inst) => {
        if (!seenIds.has(inst.id)) {
          seenIds.add(inst.id);
          results.push({
            id: inst.id,
            nome_cliente: inst.nome_cliente,
            cidade: inst.cidade || "",
            estado: inst.estado || "",
            data_instalacao: inst.data_instalacao,
            concluida: inst.instalacao_concluida,
            equipe_nome: inst.responsavel_instalacao_nome,
            _source: "legacy",
          });
        }
      });

      // Ordenar por data desc
      results.sort((a, b) => {
        const dateA = a.data_instalacao || "";
        const dateB = b.data_instalacao || "";
        return dateB.localeCompare(dateA);
      });

      return results;
    },
  });

  const getInitials = (nome: string) => {
    const parts = nome.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return nome.substring(0, 2).toUpperCase();
  };

  const concluidas = instalacoes?.filter((i) => i.concluida).length || 0;
  const total = instalacoes?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {colaborador && (
              <>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={colaborador.foto_perfil_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
                    {getInitials(colaborador.nome)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-base font-semibold">{colaborador.nome}</p>
                  <p className="text-xs text-muted-foreground font-normal">Desempenho Individual</p>
                </div>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Resumo */}
        <div className="flex gap-3 px-1">
          <div className="flex-1 rounded-lg bg-accent/50 border border-border p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="flex-1 rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{concluidas}</p>
            <p className="text-xs text-muted-foreground">Concluídas</p>
          </div>
          <div className="flex-1 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{total - concluidas}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
        </div>

        {/* Lista */}
        <ScrollArea className="flex-1 -mx-3 px-3">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          )}

          {!isLoading && instalacoes && instalacoes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Nenhuma instalação encontrada</p>
            </div>
          )}

          {!isLoading && instalacoes && instalacoes.length > 0 && (
            <div className="space-y-2 pb-2">
              {instalacoes.map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors"
                >
                  <div className="mt-0.5">
                    {inst.concluida ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{inst.nome_cliente}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {inst.cidade}/{inst.estado}
                      </span>
                      {inst.data_instalacao && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {format(new Date(inst.data_instalacao + "T00:00:00"), "dd/MM/yyyy")}
                        </span>
                      )}
                      {inst.equipe_nome && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {inst.equipe_nome}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={inst.concluida ? "default" : "outline"}
                    className={inst.concluida ? "bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/20" : "text-amber-600 border-amber-500/30"}
                  >
                    {inst.concluida ? "Concluída" : "Pendente"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
