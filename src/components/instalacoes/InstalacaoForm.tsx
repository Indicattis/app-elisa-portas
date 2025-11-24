import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { InstalacaoFormData } from "@/types/instalacao";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Search, X } from "lucide-react";
import { SelecionarVendaModal } from "./SelecionarVendaModal";

const instalacaoSchema = z.object({
  id_venda: z.string().nullable(),
  nome_cliente: z.string().min(1, "Nome do cliente é obrigatório"),
  data: z.string().min(1, "Data é obrigatória"),
  hora: z.string().min(1, "Hora é obrigatória"),
  equipe_id: z.string().min(1, "Selecione uma equipe"),
});

interface InstalacaoFormProps {
  onSubmit: (data: InstalacaoFormData) => Promise<void>;
  initialData?: Partial<InstalacaoFormData>;
  isLoading?: boolean;
}

export const InstalacaoForm = ({ onSubmit, initialData, isLoading }: InstalacaoFormProps) => {
  const [equipes, setEquipes] = useState<any[]>([]);
  const [loadingVendaData, setLoadingVendaData] = useState(false);
  const [loadingEquipes, setLoadingEquipes] = useState(false);
  const [modalVendaOpen, setModalVendaOpen] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InstalacaoFormData>({
    resolver: zodResolver(instalacaoSchema),
    defaultValues: initialData,
  });

  const vendaId = watch("id_venda");

  useEffect(() => {
    loadEquipes();
  }, []);

  // Atualizar valores do formulário quando initialData mudar
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);


  const loadEquipes = async () => {
    setLoadingEquipes(true);
    try {
      const { data, error } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("ativa", true)
        .order("nome");

      if (error) throw error;
      setEquipes(data || []);
    } catch (error) {
      console.error("Erro ao carregar equipes:", error);
      toast.error("Erro ao carregar equipes");
    } finally {
      setLoadingEquipes(false);
    }
  };

  const handleVendaSelect = async (venda: any) => {
    setVendaSelecionada(venda);
    setValue("id_venda", venda.id);

    setLoadingVendaData(true);
    try {
      const { data: vendaCompleta, error } = await supabase
        .from("vendas")
        .select(`
          *,
          produtos:produtos_vendas(*)
        `)
        .eq("id", venda.id)
        .single();

      if (error) throw error;

      // Preencher dados do cliente
      setValue("nome_cliente", vendaCompleta.cliente_nome || "");

      toast.success("Dados da venda carregados");
    } catch (error) {
      console.error("Erro ao carregar dados da venda:", error);
      toast.error("Erro ao carregar dados da venda");
    } finally {
      setLoadingVendaData(false);
    }
  };

  const handleRemoverVenda = () => {
    setVendaSelecionada(null);
    setValue("id_venda", null);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Buscar Venda */}
      <div className="space-y-2">
        <Label>Venda (opcional)</Label>
        
        {vendaSelecionada ? (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-accent/50">
            <div className="flex-1">
              <p className="font-medium">{vendaSelecionada.cliente_nome}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(vendaSelecionada.data_venda).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemoverVenda}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setModalVendaOpen(true)}
            className="w-full justify-start gap-2"
          >
            <Search className="h-4 w-4" />
            Buscar venda
          </Button>
        )}
        
        {loadingVendaData && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Carregando dados da venda...
          </p>
        )}
      </div>

      {/* Nome do Cliente */}
      <div className="space-y-2">
        <Label htmlFor="nome_cliente">Nome do Cliente *</Label>
        <Input
          id="nome_cliente"
          {...register("nome_cliente")}
          placeholder="Nome completo"
          className="text-base"
        />
        {errors.nome_cliente && (
          <p className="text-sm text-destructive">{errors.nome_cliente.message}</p>
        )}
      </div>

      {/* Data e Hora */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data">Data *</Label>
          <Input
            id="data"
            type="date"
            {...register("data")}
            className="text-base"
          />
          {errors.data && (
            <p className="text-sm text-destructive">{errors.data.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="hora">Hora *</Label>
          <Input
            id="hora"
            type="time"
            {...register("hora")}
            className="text-base"
          />
          {errors.hora && (
            <p className="text-sm text-destructive">{errors.hora.message}</p>
          )}
        </div>
      </div>

      {/* Equipe */}
      <div className="space-y-2">
        <Label htmlFor="equipe_id">Equipe de Instalação *</Label>
        <Select
          value={watch("equipe_id") || ""}
          onValueChange={(value) => setValue("equipe_id", value)}
        >
          <SelectTrigger className="text-base">
            <SelectValue placeholder={loadingEquipes ? "Carregando..." : "Selecione uma equipe"} />
          </SelectTrigger>
          <SelectContent>
            {equipes.map((equipe) => (
              <SelectItem key={equipe.id} value={equipe.id}>
                <div className="flex items-center gap-2">
                  {equipe.cor && (
                    <span
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: equipe.cor }}
                    />
                  )}
                  {equipe.nome}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.equipe_id && (
          <p className="text-sm text-destructive">{errors.equipe_id.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Salvar Instalação"
        )}
      </Button>

      {/* Modal de Buscar Venda */}
      <SelecionarVendaModal
        open={modalVendaOpen}
        onOpenChange={setModalVendaOpen}
        onSelect={handleVendaSelect}
        vendaSelecionada={vendaSelecionada?.id}
      />
    </form>
  );
};
