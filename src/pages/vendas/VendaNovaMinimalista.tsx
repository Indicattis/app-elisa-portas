import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Plus, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCanaisAquisicao } from "@/hooks/useCanaisAquisicao";
import { FormaPagamentoSelect } from "@/components/FormaPagamentoSelect";
import { ESTADOS_BRASIL, getCidadesPorEstado } from '@/utils/estadosCidades';
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { MinimalistLayout } from "@/components/MinimalistLayout";

interface Atendente {
  id: string;
  nome: string;
}

export default function VendaNovaMinimalista() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { canais } = useCanaisAquisicao();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [atendentes, setAtendentes] = useState<Atendente[]>([]);
  const [cidadesDisponiveis, setCidadesDisponiveis] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    publico_alvo: "",
    canal_aquisicao_id: "",
    estado: "",
    cidade: "",
    cep: "",
    cliente_nome: "",
    cliente_telefone: "",
    cliente_email: "",
    cpf_cliente: "",
    forma_pagamento: "",
    observacoes_venda: "",
    atendente_id: "",
    numero_parcelas: "1",
    valor_entrada: "",
    venda_presencial: false,
    pagamento_na_entrega: false,
    tipo_entrega: "instalacao",
  });

  useEffect(() => {
    fetchAtendentes();
  }, []);

  useEffect(() => {
    if (formData.estado) {
      setCidadesDisponiveis(getCidadesPorEstado(formData.estado));
    }
  }, [formData.estado]);

  const fetchAtendentes = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("id, nome")
        .eq("ativo", true)
        .in("role", ["atendente", "gerente_comercial", "administrador"])
        .order("nome");

      if (error) throw error;
      setAtendentes(data || []);
    } catch (error) {
      console.error("Erro ao buscar atendentes:", error);
    }
  };

  const { data: produtosAvulsos = [] } = useQuery({
    queryKey: ['vendas-catalogo-disponiveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas_catalogo')
        .select('*')
        .eq('ativo', true)
        .gt('quantidade', 0)
        .order('destaque', { ascending: false })
        .order('nome_produto');
      
      if (error) throw error;
      return data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.atendente_id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um atendente para a venda.",
      });
      return;
    }

    setLoading(true);
    try {
      const vendaData = {
        atendente_id: formData.atendente_id,
        publico_alvo: formData.publico_alvo || null,
        canal_aquisicao_id: formData.canal_aquisicao_id || null,
        estado: formData.estado || null,
        cidade: formData.cidade || null,
        bairro: null,
        cliente_nome: formData.cliente_nome || null,
        cliente_telefone: formData.cliente_telefone || null,
        cliente_email: formData.cliente_email || null,
        cpf_cliente: formData.cpf_cliente || null,
        valor_venda: 0,
        lucro_total: 0,
        valor_frete: 0,
        valor_instalacao: 0,
        forma_pagamento: formData.forma_pagamento || null,
        observacoes_venda: formData.observacoes_venda || null,
        data_venda: date.toISOString(),
        lead_id: null,
        numero_parcelas: parseInt(formData.numero_parcelas) || 1,
        valor_entrada: parseFloat(formData.valor_entrada) || 0,
        venda_presencial: formData.venda_presencial,
        pagamento_na_entrega: formData.pagamento_na_entrega,
        tipo_entrega: formData.tipo_entrega,
      };

      const { data: vendaResult, error } = await supabase
        .from("vendas")
        .insert(vendaData)
        .select()
        .single();

      if (error) throw error;

      if (formData.forma_pagamento === "parcelado" && vendaResult) {
        const numeroParcelas = parseInt(formData.numero_parcelas);
        const valorEntrada = parseFloat(formData.valor_entrada) || 0;
        const valorRestante = vendaResult.valor_venda - valorEntrada;
        const valorParcela = valorRestante / numeroParcelas;

        const parcelas = [];
        for (let i = 1; i <= numeroParcelas; i++) {
          const dataVencimento = new Date();
          dataVencimento.setMonth(dataVencimento.getMonth() + i);
          
          parcelas.push({
            venda_id: vendaResult.id,
            numero_parcela: i,
            valor_parcela: valorParcela,
            data_vencimento: dataVencimento.toISOString().split('T')[0],
            status: 'pendente'
          });
        }

        await supabase.from("contas_receber").insert(parcelas);
      }

      toast({
        title: "Sucesso",
        description: "Venda criada com sucesso!",
      });

      navigate("/vendas/minhas-vendas");
    } catch (error) {
      console.error("Erro ao criar venda:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar venda. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "bg-primary/5 border-primary/10 text-white placeholder:text-white/40";
  const selectTriggerClasses = "bg-primary/5 border-primary/10 text-white [&>span]:text-white";
  const labelClasses = "text-white/80";

  return (
    <MinimalistLayout 
      title="Nova Venda" 
      subtitle="Criar uma nova venda"
      backPath="/vendas/minhas-vendas"
    >
      <div className="bg-primary/5 border border-primary/10 rounded-xl backdrop-blur-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Dados do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cliente_nome" className={labelClasses}>Nome do Cliente *</Label>
                <Input
                  id="cliente_nome"
                  placeholder="Nome completo"
                  value={formData.cliente_nome}
                  onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
                  className={inputClasses}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cliente_telefone" className={labelClasses}>Telefone *</Label>
                <Input
                  id="cliente_telefone"
                  placeholder="(00) 00000-0000"
                  value={formData.cliente_telefone}
                  onChange={(e) => setFormData({ ...formData, cliente_telefone: e.target.value })}
                  className={inputClasses}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cliente_email" className={labelClasses}>Email</Label>
                <Input
                  id="cliente_email"
                  type="email"
                  placeholder="cliente@email.com"
                  value={formData.cliente_email}
                  onChange={(e) => setFormData({ ...formData, cliente_email: e.target.value })}
                  className={inputClasses}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cpf_cliente" className={labelClasses}>CPF *</Label>
                <Input
                  id="cpf_cliente"
                  placeholder="000.000.000-00"
                  value={formData.cpf_cliente}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 11) {
                      value = value.replace(/(\d{3})(\d)/, '$1.$2');
                      value = value.replace(/(\d{3})(\d)/, '$1.$2');
                      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                    }
                    setFormData({ ...formData, cpf_cliente: value });
                  }}
                  maxLength={14}
                  className={inputClasses}
                  required
                />
              </div>
            </div>
          </div>

          {/* Dados da Venda */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Dados da Venda</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="atendente_id" className={labelClasses}>Atendente *</Label>
                <Select 
                  value={formData.atendente_id}
                  onValueChange={(value) => setFormData({ ...formData, atendente_id: value })}
                >
                  <SelectTrigger className={selectTriggerClasses}>
                    <SelectValue placeholder="Selecione o atendente" />
                  </SelectTrigger>
                  <SelectContent>
                    {atendentes.map((atendente) => (
                      <SelectItem key={atendente.id} value={atendente.id}>
                        {atendente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publico_alvo" className={labelClasses}>Público Alvo *</Label>
                <Select 
                  value={formData.publico_alvo}
                  onValueChange={(value) => setFormData({ ...formData, publico_alvo: value })}
                >
                  <SelectTrigger className={selectTriggerClasses}>
                    <SelectValue placeholder="Selecione o público" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serralheiro">Serralheiro</SelectItem>
                    <SelectItem value="cliente_final">Cliente Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="canal_aquisicao_id" className={labelClasses}>Canal de Aquisição *</Label>
                <Select 
                  value={formData.canal_aquisicao_id}
                  onValueChange={(value) => setFormData({ ...formData, canal_aquisicao_id: value })}
                >
                  <SelectTrigger className={selectTriggerClasses}>
                    <SelectValue placeholder="Selecione o canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {canais.map((canal) => (
                      <SelectItem key={canal.id} value={canal.id}>
                        {canal.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className={labelClasses}>Data da Venda *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      inputClasses,
                      !date && "text-white/40"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Localização */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Localização</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estado" className={labelClasses}>Estado *</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value, cidade: '' })}
                >
                  <SelectTrigger className={selectTriggerClasses}>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BRASIL.map((estado) => (
                      <SelectItem key={estado.sigla} value={estado.sigla}>
                        {estado.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade" className={labelClasses}>Cidade *</Label>
                <Select
                  value={formData.cidade}
                  onValueChange={(value) => setFormData({ ...formData, cidade: value })}
                  disabled={!formData.estado}
                >
                  <SelectTrigger className={selectTriggerClasses}>
                    <SelectValue placeholder={formData.estado ? "Selecione a cidade" : "Selecione o estado primeiro"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {cidadesDisponiveis.map((cidade) => (
                      <SelectItem key={cidade} value={cidade}>
                        {cidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep" className={labelClasses}>CEP</Label>
                <Input
                  id="cep"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          {/* Dados Adicionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Dados Adicionais</h3>
            
            <FormaPagamentoSelect
              value={formData.forma_pagamento}
              onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}
              showLabel={true}
              required={false}
            />

            {formData.forma_pagamento === "parcelado" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-primary/10 rounded-lg bg-primary/5">
                <div className="space-y-2">
                  <Label htmlFor="numero_parcelas" className={labelClasses}>Número de Parcelas *</Label>
                  <Input
                    id="numero_parcelas"
                    type="number"
                    min="1"
                    max="36"
                    value={formData.numero_parcelas}
                    onChange={(e) => setFormData({ ...formData, numero_parcelas: e.target.value })}
                    className={inputClasses}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_entrada" className={labelClasses}>Valor de Entrada</Label>
                  <Input
                    id="valor_entrada"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.valor_entrada}
                    onChange={(e) => setFormData({ ...formData, valor_entrada: e.target.value })}
                    className={inputClasses}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="observacoes_venda" className={labelClasses}>Observações</Label>
              <Textarea
                id="observacoes_venda"
                placeholder="Observações sobre a venda..."
                value={formData.observacoes_venda}
                onChange={(e) => setFormData({ ...formData, observacoes_venda: e.target.value })}
                className={cn(inputClasses, "resize-none min-h-[100px]")}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-4 border border-primary/10 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all">
                <Checkbox
                  id="venda_presencial"
                  checked={formData.venda_presencial}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, venda_presencial: checked as boolean })
                  }
                  className="mt-1 border-primary/30 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor="venda_presencial" className="cursor-pointer flex-1">
                  <span className="font-medium text-white">Venda Presencial</span>
                  <p className="text-sm text-white/60 font-normal mt-1">
                    Esta venda foi realizada presencialmente na loja
                  </p>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-4 border border-primary/10 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                <Checkbox
                  id="pagamento_na_entrega"
                  checked={formData.pagamento_na_entrega}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, pagamento_na_entrega: checked as boolean })
                  }
                  className="mt-1 border-primary/30 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor="pagamento_na_entrega" className="cursor-pointer flex-1">
                  <span className="font-medium text-white">Pagamento na Entrega</span>
                  <p className="text-sm text-white/60 font-normal mt-1">
                    O valor a receber será cobrado no momento da instalação/entrega
                  </p>
                </Label>
              </div>
            </div>
          </div>

          {/* Produtos Avulsos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Adicionar Produtos Avulsos
            </h3>
            
            {produtosAvulsos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {produtosAvulsos.map((produto: any) => (
                  <div
                    key={produto.id}
                    className="bg-primary/5 border border-primary/10 rounded-lg p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-white truncate">
                          {produto.nome_produto}
                        </p>
                        {produto.descricao_produto && (
                          <p className="text-xs text-white/60 truncate">
                            {produto.descricao_produto}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs border-primary/30 text-blue-400">
                            R$ {produto.preco_venda.toFixed(2)}
                          </Badge>
                          <Badge className="text-xs bg-primary/10 text-white/70 border-primary/20">
                            {produto.quantidade} {produto.unidade || 'un'}
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        type="button"
                        size="sm" 
                        variant="ghost"
                        className="text-white/60 hover:text-white hover:bg-white/10"
                        onClick={() => {
                          toast({
                            title: "Disponível após criar a venda",
                            description: "Produtos avulsos podem ser adicionados na edição da venda"
                          });
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/60">
                Nenhum produto configurado para venda avulsa. Configure produtos no módulo de Estoque.
              </p>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Criando..." : "Criar Venda"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/vendas/minhas-vendas")}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </MinimalistLayout>
  );
}
