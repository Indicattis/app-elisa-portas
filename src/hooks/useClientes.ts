import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Cliente {
  id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  cpf_cnpj?: string | null;
  estado?: string | null;
  cidade?: string | null;
  cep?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  canal_aquisicao_id?: string | null;
  canal_aquisicao?: { id: string; nome: string } | null;
  observacoes?: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClienteFormData {
  nome: string;
  telefone?: string;
  email?: string;
  cpf_cnpj?: string;
  estado?: string;
  cidade?: string;
  cep?: string;
  endereco?: string;
  bairro?: string;
  canal_aquisicao_id?: string;
  observacoes?: string;
}

export function useClientes() {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      // Buscar clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from("clientes" as any)
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (clientesError) throw clientesError;
      
      // Buscar canais separadamente para evitar problemas de tipo
      const { data: canaisData } = await supabase
        .from("canais_aquisicao")
        .select("id, nome");
      
      const canaisMap = new Map(canaisData?.map(c => [c.id, c]) || []);
      
      // Combinar dados
      const clientes = (clientesData || []).map((cliente: any) => ({
        ...cliente,
        canal_aquisicao: cliente.canal_aquisicao_id 
          ? canaisMap.get(cliente.canal_aquisicao_id) || null 
          : null
      }));

      return clientes as Cliente[];
    },
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClienteFormData) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data: cliente, error } = await supabase
        .from("clientes" as any)
        .insert({
          ...data,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return cliente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente criado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar cliente:", error);
      toast.error("Erro ao criar cliente");
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClienteFormData }) => {
      const { data: cliente, error } = await supabase
        .from("clientes" as any)
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return cliente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar cliente:", error);
      toast.error("Erro ao atualizar cliente");
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete - marca como inativo
      const { error } = await supabase
        .from("clientes" as any)
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir cliente:", error);
      toast.error("Erro ao excluir cliente");
    },
  });
}
