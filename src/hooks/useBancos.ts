import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Banco {
  id: string;
  nome: string;
  codigo: string | null;
  agencia: string | null;
  conta: string | null;
  tipo_conta: string | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export type BancoFormData = {
  nome: string;
  codigo?: string;
  agencia?: string;
  conta?: string;
  tipo_conta?: string;
  observacoes?: string;
  ativo?: boolean;
};

export function useBancos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bancos = [], isLoading } = useQuery({
    queryKey: ["bancos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bancos")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as Banco[];
    },
  });

  const criarBanco = useMutation({
    mutationFn: async (dados: BancoFormData) => {
      const { error } = await supabase.from("bancos").insert(dados);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bancos"] });
      toast({ title: "Banco cadastrado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao cadastrar banco", variant: "destructive" });
    },
  });

  const editarBanco = useMutation({
    mutationFn: async ({ id, ...dados }: BancoFormData & { id: string }) => {
      const { error } = await supabase.from("bancos").update(dados).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bancos"] });
      toast({ title: "Banco atualizado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar banco", variant: "destructive" });
    },
  });

  const excluirBanco = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bancos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bancos"] });
      toast({ title: "Banco excluído com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir banco", variant: "destructive" });
    },
  });

  return { bancos, isLoading, criarBanco, editarBanco, excluirBanco };
}
