import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Pencil, Trash2, Loader2, Wrench } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

import { useNeoInstalacoesListagem } from "@/hooks/useNeoInstalacoes";
import { useNeoCorrecoesListagem } from "@/hooks/useNeoCorrecoes";
import { NeoInstalacaoModal } from "@/components/expedicao/NeoInstalacaoModal";
import { NeoCorrecaoModal } from "@/components/expedicao/NeoCorrecaoModal";
import { NeoInstalacao, CriarNeoInstalacaoData } from "@/types/neoInstalacao";
import { NeoCorrecao, CriarNeoCorrecaoData } from "@/types/neoCorrecao";

const ETAPA_LABELS: Record<string, string> = {
  soldagem: "Produção (Soldagem)",
  perfiladeira: "Produção (Perfiladeira)",
  separacao: "Produção (Separação)",
  inspecao_qualidade: "Inspeção de Qualidade",
  pintura: "Pintura",
  expedicao: "Expedição",
  instalacao: "Instalação",
};

export default function NeosCadastro() {
  const queryClient = useQueryClient();
  const { neoInstalacoes, isLoading: isLoadingInst } = useNeoInstalacoesListagem();
  const { neoCorrecoes, isLoading: isLoadingCorr } = useNeoCorrecoesListagem();

  const [openInstalacaoModal, setOpenInstalacaoModal] = useState(false);
  const [openCorrecaoModal, setOpenCorrecaoModal] = useState(false);
  const [editingInstalacao, setEditingInstalacao] = useState<NeoInstalacao | null>(null);
  const [editingCorrecao, setEditingCorrecao] = useState<NeoCorrecao | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; tipo: "instalacao" | "correcao" } | null>(null);

  const isLoading = isLoadingInst || isLoadingCorr;

  // Create mutations
  const createInstalacao = useMutation({
    mutationFn: async (dados: CriarNeoInstalacaoData) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("neo_instalacoes").insert({
        ...dados,
        created_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Neo instalação criada!");
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_listagem"] });
    },
    onError: () => toast.error("Erro ao criar neo instalação"),
  });

  const createCorrecao = useMutation({
    mutationFn: async (dados: CriarNeoCorrecaoData) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("neo_correcoes").insert({
        ...dados,
        created_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Neo correção criada!");
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_listagem"] });
    },
    onError: () => toast.error("Erro ao criar neo correção"),
  });

  const updateInstalacao = useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: CriarNeoInstalacaoData }) => {
      const { error } = await supabase.from("neo_instalacoes").update({
        ...dados,
        updated_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Neo instalação atualizada!");
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_listagem"] });
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const updateCorrecao = useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: CriarNeoCorrecaoData }) => {
      const { error } = await supabase.from("neo_correcoes").update({
        ...dados,
        updated_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Neo correção atualizada!");
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_listagem"] });
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, tipo }: { id: string; tipo: "instalacao" | "correcao" }) => {
      const table = tipo === "instalacao" ? "neo_instalacoes" : "neo_correcoes";
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro excluído!");
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_listagem"] });
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_listagem"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("Erro ao excluir"),
  });

  const handleConfirmInstalacao = async (dados: CriarNeoInstalacaoData) => {
    if (editingInstalacao) {
      await updateInstalacao.mutateAsync({ id: editingInstalacao.id, dados });
    } else {
      await createInstalacao.mutateAsync(dados);
    }
  };

  const handleConfirmCorrecao = async (dados: CriarNeoCorrecaoData) => {
    if (editingCorrecao) {
      await updateCorrecao.mutateAsync({ id: editingCorrecao.id, dados });
    } else {
      await createCorrecao.mutateAsync(dados);
    }
  };

  const allItems = useMemo(() => {
    const inst = neoInstalacoes.map(i => ({ ...i, _tipo: "neo_instalacao" as const }));
    const corr = neoCorrecoes.map(c => ({ ...c, _tipo: "neo_correcao" as const }));
    return [...inst, ...corr].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [neoInstalacoes, neoCorrecoes]);

  const renderRow = (item: (NeoInstalacao & { _tipo: "neo_instalacao" }) | (NeoCorrecao & { _tipo: "neo_correcao" })) => {
    const isInstalacao = item._tipo === "neo_instalacao";
    const data = isInstalacao ? (item as NeoInstalacao).data_instalacao : (item as NeoCorrecao).data_correcao;
    const responsavel = item.tipo_responsavel === "autorizado" ? item.autorizado_nome : item.equipe_nome;

    return (
      <div
        key={item.id}
        className="flex flex-col gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Badge
              variant="outline"
              className={isInstalacao
                ? "bg-orange-500/10 text-orange-400 border-orange-500/30 shrink-0"
                : "bg-purple-500/10 text-purple-400 border-purple-500/30 shrink-0"
              }
            >
              {isInstalacao ? "Instalação" : "Correção"}
            </Badge>
            <span className="font-medium text-foreground truncate">{item.nome_cliente}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (isInstalacao) {
                  setEditingInstalacao(item as NeoInstalacao);
                  setOpenInstalacaoModal(true);
                } else {
                  setEditingCorrecao(item as NeoCorrecao);
                  setOpenCorrecaoModal(true);
                }
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget({ id: item.id, tipo: isInstalacao ? "instalacao" : "correcao" })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>{item.cidade}/{item.estado}</span>
          <span>{responsavel || "—"}</span>
          <span>{item.etapa_causadora ? ETAPA_LABELS[item.etapa_causadora] || item.etapa_causadora : "—"}</span>
          <span>{data ? format(new Date(data + "T12:00:00"), "dd/MM/yyyy") : "Sem data"}</span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Total: <span className="text-foreground font-medium">R$ {(item.valor_total || 0).toFixed(2)}</span>
          </span>
          <span className="text-muted-foreground">
            A receber: <span className="text-foreground font-medium">R$ {(item.valor_a_receber || 0).toFixed(2)}</span>
          </span>
          <Badge variant="outline" className={
            item.status === "concluida" ? "bg-green-500/10 text-green-400 border-green-500/30" :
            data ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
            "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
          }>
            {item.status === "concluida" ? "Concluída" : data ? "Agendada" : "Pendente"}
          </Badge>
        </div>
      </div>
    );
  };

  const renderList = (items: typeof allItems) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum registro encontrado
        </div>
      );
    }
    return <div className="flex flex-col gap-3">{items.map(renderRow)}</div>;
  };

  return (
    <MinimalistLayout
      title="Serviços Neo"
      subtitle="Gerencie instalações e correções avulsas"
      backPath="/logistica"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Logística", path: "/logistica" },
        { label: "Serviços Neo" },
      ]}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Tabs defaultValue="todos" className="w-full">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <TabsList>
                <TabsTrigger value="todos">Todos ({allItems.length})</TabsTrigger>
                <TabsTrigger value="instalacoes">Instalações ({neoInstalacoes.length})</TabsTrigger>
                <TabsTrigger value="correcoes">Correções ({neoCorrecoes.length})</TabsTrigger>
              </TabsList>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setEditingInstalacao(null); setOpenInstalacaoModal(true); }}>
                    Neo Instalação
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setEditingCorrecao(null); setOpenCorrecaoModal(true); }}>
                    Neo Correção
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <TabsContent value="todos" className="mt-4">
              {renderList(allItems)}
            </TabsContent>
            <TabsContent value="instalacoes" className="mt-4">
              {renderList(neoInstalacoes.map(i => ({ ...i, _tipo: "neo_instalacao" as const })))}
            </TabsContent>
            <TabsContent value="correcoes" className="mt-4">
              {renderList(neoCorrecoes.map(c => ({ ...c, _tipo: "neo_correcao" as const })))}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modais */}
      <NeoInstalacaoModal
        open={openInstalacaoModal}
        onOpenChange={(open) => { setOpenInstalacaoModal(open); if (!open) setEditingInstalacao(null); }}
        neoInstalacao={editingInstalacao}
        onConfirm={handleConfirmInstalacao}
      />

      <NeoCorrecaoModal
        open={openCorrecaoModal}
        onOpenChange={(open) => { setOpenCorrecaoModal(open); if (!open) setEditingCorrecao(null); }}
        neoCorrecao={editingCorrecao}
        onConfirm={handleConfirmCorrecao}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MinimalistLayout>
  );
}
