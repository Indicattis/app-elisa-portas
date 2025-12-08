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
import { Loader2, Search, X, MapPin } from "lucide-react";
import { SelecionarVendaModal } from "./SelecionarVendaModal";
import { ESTADOS_BRASIL, getCidadesPorEstado } from "@/utils/estadosCidades";

const instalacaoSchema = z.object({
  id_venda: z.string().nullable(),
  nome_cliente: z.string().min(1, "Nome do cliente é obrigatório"),
  data: z.string().min(1, "Data é obrigatória"),
  hora: z.string().min(1, "Hora é obrigatória"),
  equipe_id: z.string().min(1, "Selecione uma equipe"),
  // Novos campos opcionais
  cep: z.string().optional(),
  endereco: z.string().optional(),
  estado: z.string().optional(),
  cidade: z.string().optional(),
  telefone_cliente: z.string().optional(),
  cor_id: z.string().optional(),
  observacoes: z.string().optional(),
});

interface InstalacaoFormProps {
  onSubmit: (data: InstalacaoFormData) => Promise<void>;
  initialData?: Partial<InstalacaoFormData>;
  isLoading?: boolean;
}

interface Cor {
  id: string;
  nome: string;
  codigo_hex: string;
}

export const InstalacaoForm = ({ onSubmit, initialData, isLoading }: InstalacaoFormProps) => {
  const [equipes, setEquipes] = useState<any[]>([]);
  const [cores, setCores] = useState<Cor[]>([]);
  const [loadingVendaData, setLoadingVendaData] = useState(false);
  const [loadingEquipes, setLoadingEquipes] = useState(false);
  const [loadingCores, setLoadingCores] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [modalVendaOpen, setModalVendaOpen] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState<any>(null);
  const [cidadesDisponiveis, setCidadesDisponiveis] = useState<string[]>([]);

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
  const estadoSelecionado = watch("estado");

  useEffect(() => {
    loadEquipes();
    loadCores();
  }, []);

  // Atualizar valores do formulário quando initialData mudar
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  // Atualizar cidades quando estado mudar
  useEffect(() => {
    if (estadoSelecionado) {
      const cidades = getCidadesPorEstado(estadoSelecionado);
      setCidadesDisponiveis(cidades);
    } else {
      setCidadesDisponiveis([]);
    }
  }, [estadoSelecionado]);

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

  const loadCores = async () => {
    setLoadingCores(true);
    try {
      const { data, error } = await supabase
        .from("catalogo_cores")
        .select("id, nome, codigo_hex")
        .eq("ativa", true)
        .order("nome");

      if (error) throw error;
      setCores(data || []);
    } catch (error) {
      console.error("Erro ao carregar cores:", error);
    } finally {
      setLoadingCores(false);
    }
  };

  const buscarCep = async () => {
    const cep = watch("cep")?.replace(/\D/g, "");
    if (!cep || cep.length !== 8) {
      toast.error("CEP inválido. Digite 8 números.");
      return;
    }

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      // Preencher campos
      setValue("endereco", `${data.logradouro}${data.bairro ? `, ${data.bairro}` : ""}`);
      setValue("estado", data.uf);
      setValue("cidade", data.localidade);

      toast.success("Endereço encontrado!");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast.error("Erro ao buscar CEP");
    } finally {
      setLoadingCep(false);
    }
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
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
      if (vendaCompleta.cliente_telefone) {
        setValue("telefone_cliente", formatTelefone(vendaCompleta.cliente_telefone));
      }
      if (vendaCompleta.cep) {
        setValue("cep", formatCep(vendaCompleta.cep));
      }
      // Usar bairro como parte do endereço se disponível
      if (vendaCompleta.bairro) {
        setValue("endereco", vendaCompleta.bairro);
      }
      if (vendaCompleta.estado) {
        setValue("estado", vendaCompleta.estado);
      }
      if (vendaCompleta.cidade) {
        setValue("cidade", vendaCompleta.cidade);
      }

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

      {/* Telefone do Cliente */}
      <div className="space-y-2">
        <Label htmlFor="telefone_cliente">Telefone do Cliente</Label>
        <Input
          id="telefone_cliente"
          {...register("telefone_cliente")}
          placeholder="(00) 00000-0000"
          className="text-base"
          onChange={(e) => setValue("telefone_cliente", formatTelefone(e.target.value))}
          maxLength={16}
        />
      </div>

      {/* CEP e Buscar */}
      <div className="space-y-2">
        <Label htmlFor="cep">CEP</Label>
        <div className="flex gap-2">
          <Input
            id="cep"
            {...register("cep")}
            placeholder="00000-000"
            className="text-base flex-1"
            onChange={(e) => setValue("cep", formatCep(e.target.value))}
            maxLength={9}
          />
          <Button
            type="button"
            variant="outline"
            onClick={buscarCep}
            disabled={loadingCep}
            className="shrink-0"
          >
            {loadingCep ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Endereço */}
      <div className="space-y-2">
        <Label htmlFor="endereco">Endereço</Label>
        <Input
          id="endereco"
          {...register("endereco")}
          placeholder="Rua, número, bairro"
          className="text-base"
        />
      </div>

      {/* Estado e Cidade */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estado">Estado</Label>
          <Select
            value={watch("estado") || ""}
            onValueChange={(value) => {
              setValue("estado", value);
              setValue("cidade", ""); // Reset cidade when estado changes
            }}
          >
            <SelectTrigger className="text-base">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_BRASIL.map((estado) => (
                <SelectItem key={estado.sigla} value={estado.sigla}>
                  {estado.sigla} - {estado.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade</Label>
          <Select
            value={watch("cidade") || ""}
            onValueChange={(value) => setValue("cidade", value)}
            disabled={!estadoSelecionado}
          >
            <SelectTrigger className="text-base">
              <SelectValue placeholder={estadoSelecionado ? "Selecione" : "Selecione o estado"} />
            </SelectTrigger>
            <SelectContent>
              {cidadesDisponiveis.map((cidade) => (
                <SelectItem key={cidade} value={cidade}>
                  {cidade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

      {/* Cor da Porta */}
      <div className="space-y-2">
        <Label htmlFor="cor_id">Cor da Porta</Label>
        <Select
          value={watch("cor_id") || ""}
          onValueChange={(value) => setValue("cor_id", value)}
        >
          <SelectTrigger className="text-base">
            <SelectValue placeholder={loadingCores ? "Carregando..." : "Selecione uma cor"} />
          </SelectTrigger>
          <SelectContent>
            {cores.map((cor) => (
              <SelectItem key={cor.id} value={cor.id}>
                <div className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 rounded border border-border flex-shrink-0"
                    style={{ backgroundColor: cor.codigo_hex }}
                  />
                  {cor.nome}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="observacoes">Descrição / Observações</Label>
        <Textarea
          id="observacoes"
          {...register("observacoes")}
          placeholder="Informações adicionais sobre a instalação..."
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
