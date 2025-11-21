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
import { Loader2 } from "lucide-react";

const instalacaoSchema = z.object({
  id_venda: z.string().nullable(),
  nome_cliente: z.string().min(1, "Nome do cliente é obrigatório"),
  data: z.string().min(1, "Data é obrigatória"),
  hora: z.string().min(1, "Hora é obrigatória"),
  produto: z.string().min(1, "Produto é obrigatório"),
  estado: z.string().min(1, "Estado é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  endereco: z.string().optional(),
  cep: z.string().optional(),
  descricao: z.string().optional(),
  equipe_id: z.string().optional(),
});

interface InstalacaoFormProps {
  onSubmit: (data: InstalacaoFormData) => Promise<void>;
  initialData?: Partial<InstalacaoFormData>;
  isLoading?: boolean;
}

export const InstalacaoForm = ({ onSubmit, initialData, isLoading }: InstalacaoFormProps) => {
  const [vendas, setVendas] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [loadingVendas, setLoadingVendas] = useState(false);
  const [loadingVendaData, setLoadingVendaData] = useState(false);
  const [loadingEquipes, setLoadingEquipes] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InstalacaoFormData>({
    resolver: zodResolver(instalacaoSchema),
    defaultValues: initialData,
  });

  const vendaId = watch("id_venda");

  useEffect(() => {
    loadVendas();
    loadEquipes();
  }, []);

  const loadVendas = async () => {
    setLoadingVendas(true);
    try {
      const { data, error } = await supabase
        .from("vendas")
        .select("id, numero_venda, cliente_nome, data_venda")
        .order("data_venda", { ascending: false })
        .limit(100);

      if (error) throw error;
      setVendas(data || []);
    } catch (error) {
      console.error("Erro ao carregar vendas:", error);
      toast.error("Erro ao carregar vendas");
    } finally {
      setLoadingVendas(false);
    }
  };

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

  const handleVendaSelect = async (vendaId: string) => {
    if (!vendaId) return;

    setLoadingVendaData(true);
    try {
      const { data: venda, error } = await supabase
        .from("vendas")
        .select(`
          *,
          produtos:produtos_vendas(*)
        `)
        .eq("id", vendaId)
        .single();

      if (error) throw error;

      // Preencher dados do cliente
      setValue("nome_cliente", venda.cliente_nome || "");
      setValue("estado", venda.estado || "");
      setValue("cidade", venda.cidade || "");
      setValue("cep", venda.cep || "");
      setValue("endereco", `${venda.bairro || ""}, ${venda.cidade || ""}`.trim());

      // Formatar produtos
      if (venda.produtos && venda.produtos.length > 0) {
        const produtosTexto = venda.produtos
          .map((p: any) => {
            const partes = [
              p.tipo_produto,
              p.tamanho ? `${p.tamanho}` : null,
              p.cor_nome ? `${p.cor_nome}` : null,
              p.quantidade > 1 ? `(${p.quantidade}x)` : null,
            ].filter(Boolean);
            return partes.join(" - ");
          })
          .join(", ");
        setValue("produto", produtosTexto);
      }

      toast.success("Dados da venda carregados");
    } catch (error) {
      console.error("Erro ao carregar dados da venda:", error);
      toast.error("Erro ao carregar dados da venda");
    } finally {
      setLoadingVendaData(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Seletor de Venda */}
      <div className="space-y-2">
        <Label>Venda (opcional)</Label>
        <Select
          value={vendaId || ""}
          onValueChange={(value) => {
            setValue("id_venda", value);
            handleVendaSelect(value);
          }}
          disabled={loadingVendas || loadingVendaData}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingVendas ? "Carregando..." : "Selecione uma venda"} />
          </SelectTrigger>
          <SelectContent>
            {vendas.map((venda) => (
              <SelectItem key={venda.id} value={venda.id}>
                #{venda.numero_venda} - {venda.cliente_nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      {/* Produto */}
      <div className="space-y-2">
        <Label htmlFor="produto">Produto *</Label>
        <Input
          id="produto"
          {...register("produto")}
          placeholder="Descrição do produto"
          className="text-base"
        />
        {errors.produto && (
          <p className="text-sm text-destructive">{errors.produto.message}</p>
        )}
      </div>

      {/* Equipe */}
      <div className="space-y-2">
        <Label htmlFor="equipe_id">Equipe de Instalação</Label>
        <Select
          value={watch("equipe_id") || ""}
          onValueChange={(value) => setValue("equipe_id", value || undefined)}
        >
          <SelectTrigger className="text-base">
            <SelectValue placeholder={loadingEquipes ? "Carregando..." : "Selecione uma equipe"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sem equipe</SelectItem>
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
      </div>

      {/* Estado e Cidade */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estado">Estado *</Label>
          <Input
            id="estado"
            {...register("estado")}
            placeholder="UF"
            maxLength={2}
            className="text-base uppercase"
          />
          {errors.estado && (
            <p className="text-sm text-destructive">{errors.estado.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade *</Label>
          <Input
            id="cidade"
            {...register("cidade")}
            placeholder="Nome da cidade"
            className="text-base"
          />
          {errors.cidade && (
            <p className="text-sm text-destructive">{errors.cidade.message}</p>
          )}
        </div>
      </div>

      {/* Endereço e CEP */}
      <div className="space-y-2">
        <Label htmlFor="endereco">Endereço</Label>
        <Input
          id="endereco"
          {...register("endereco")}
          placeholder="Rua, número, bairro"
          className="text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cep">CEP</Label>
        <Input
          id="cep"
          {...register("cep")}
          placeholder="00000-000"
          className="text-base"
        />
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Observações</Label>
        <Textarea
          id="descricao"
          {...register("descricao")}
          placeholder="Informações adicionais sobre a instalação"
          rows={3}
          className="text-base resize-none"
        />
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
    </form>
  );
};
