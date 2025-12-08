import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InstalacaoForm } from "./InstalacaoForm";
import { InstalacaoFormData } from "@/types/instalacao";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CriarInstalacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultDate?: string;
}

export const CriarInstalacaoModal = ({ 
  open, 
  onOpenChange, 
  onSuccess,
  defaultDate
}: CriarInstalacaoModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: InstalacaoFormData) => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("instalacoes")
        .insert({
          nome_cliente: data.nome_cliente,
          data_instalacao: data.data,
          data_carregamento: data.data,
          hora: data.hora,
          hora_carregamento: data.hora,
          responsavel_instalacao_id: data.equipe_id,
          venda_id: data.id_venda,
          status: "pendente_producao",
          tipo_instalacao: "elisa",
          created_by: user.user?.id,
        });

      if (error) throw error;

      toast.success("Instalação criada com sucesso!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao criar instalação:", error);
      toast.error("Erro ao criar instalação");
    } finally {
      setIsLoading(false);
    }
  };

  // Dados iniciais com a data selecionada
  const initialData = defaultDate ? {
    data: defaultDate,
    hora: "08:00",
  } : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Instalação</DialogTitle>
        </DialogHeader>
        <InstalacaoForm 
          onSubmit={handleSubmit} 
          isLoading={isLoading} 
          initialData={initialData}
          key={defaultDate} // Force re-render when date changes
        />
      </DialogContent>
    </Dialog>
  );
};
