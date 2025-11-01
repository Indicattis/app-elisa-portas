
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, ArrowLeft, Plus, ShoppingCart } from "lucide-react";
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

interface Atendente {
  id: string;
  nome: string;
}

export default function VendaNova() {
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
    forma_pagamento: "",
    observacoes_venda: "",
    atendente_id: "",
    numero_parcelas: "1",
    valor_entrada: "",
    nota_fiscal: true,
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
    queryKey: ['produtos-comercializaveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estoque')
        .select('*')
        .eq('ativo', true)
        .eq('comercializado_individualmente', true)
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
        valor_venda: 0, // Será calculado pela trigger ao adicionar produtos
        lucro_total: 0, // Será preenchido no faturamento
        valor_frete: 0,
        valor_instalacao: 0,
        forma_pagamento: formData.forma_pagamento || null,
        observacoes_venda: formData.observacoes_venda || null,
        data_venda: date.toISOString(),
        lead_id: null,
        numero_parcelas: parseInt(formData.numero_parcelas) || 1,
        valor_entrada: parseFloat(formData.valor_entrada) || 0,
        nota_fiscal: formData.nota_fiscal,
        pagamento_na_entrega: formData.pagamento_na_entrega,
        tipo_entrega: formData.tipo_entrega,
      };

      console.log('Criando venda com dados:', vendaData);

      const { data: vendaResult, error } = await supabase
        .from("vendas")
        .insert(vendaData)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar venda:', error);
        throw error;
      }

      console.log('Venda criada com sucesso:', vendaResult);

      // Se for parcelado, criar as parcelas
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

        const { error: parcelasError } = await supabase
          .from("contas_receber")
          .insert(parcelas);

        if (parcelasError) {
          console.error("Erro ao criar parcelas:", parcelasError);
        }
      }

      toast({
        title: "Sucesso",
        description: "Venda criada com sucesso!",
      });

      navigate("/dashboard/faturamento");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard/faturamento")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Faturamento
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nova Venda</h1>
          <p className="text-muted-foreground">
            Criar uma nova venda avulsa
          </p>
        </div>
      </div>

      <Card className="max-w-5xl">
        <CardHeader>
          <CardTitle>Dados da Venda</CardTitle>
          <CardDescription>
            Preencha os dados para criar uma nova venda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados do Cliente */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados do Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente_nome">Nome do Cliente *</Label>
                  <Input
                    id="cliente_nome"
                    placeholder="Nome completo"
                    value={formData.cliente_nome}
                    onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cliente_telefone">Telefone *</Label>
                  <Input
                    id="cliente_telefone"
                    placeholder="(00) 00000-0000"
                    value={formData.cliente_telefone}
                    onChange={(e) => setFormData({ ...formData, cliente_telefone: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cliente_email">Email</Label>
                <Input
                  id="cliente_email"
                  type="email"
                  placeholder="cliente@email.com"
                  value={formData.cliente_email}
                  onChange={(e) => setFormData({ ...formData, cliente_email: e.target.value })}
                />
              </div>
            </div>

            {/* Dados da Venda */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados da Venda</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="atendente_id">Atendente *</Label>
                  <Select 
                    value={formData.atendente_id}
                    onValueChange={(value) => setFormData({ ...formData, atendente_id: value })}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="publico_alvo">Público Alvo *</Label>
                  <Select 
                    value={formData.publico_alvo}
                    onValueChange={(value) => setFormData({ ...formData, publico_alvo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o público" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="serralheiro">Serralheiro</SelectItem>
                      <SelectItem value="cliente_final">Cliente Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="canal_aquisicao_id">Canal de Aquisição *</Label>
                  <Select 
                    value={formData.canal_aquisicao_id}
                    onValueChange={(value) => setFormData({ ...formData, canal_aquisicao_id: value })}
                    required
                  >
                    <SelectTrigger>
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
                <Label>Data da Venda *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
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
              <h3 className="text-lg font-semibold">Localização</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData({ ...formData, estado: value, cidade: '' })}
                    required
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Select
                    value={formData.cidade}
                    onValueChange={(value) => setFormData({ ...formData, cidade: value })}
                    disabled={!formData.estado}
                    required
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  />
                </div>
              </div>
            </div>


            {/* Dados Adicionais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados Adicionais</h3>
              
              <FormaPagamentoSelect
                value={formData.forma_pagamento}
                onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}
                showLabel={true}
                required={false}
              />

              {/* Campos de Parcelamento */}
              {formData.forma_pagamento === "parcelado" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <Label htmlFor="numero_parcelas">Número de Parcelas *</Label>
                    <Input
                      id="numero_parcelas"
                      type="number"
                      min="1"
                      max="36"
                      value={formData.numero_parcelas}
                      onChange={(e) => setFormData({ ...formData, numero_parcelas: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="valor_entrada">Valor de Entrada</Label>
                    <Input
                      id="valor_entrada"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.valor_entrada}
                      onChange={(e) => setFormData({ ...formData, valor_entrada: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="observacoes_venda">Observações</Label>
                <Textarea
                  id="observacoes_venda"
                  placeholder="Observações sobre a venda..."
                  value={formData.observacoes_venda}
                  onChange={(e) => setFormData({ ...formData, observacoes_venda: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Checkboxes de Configuração */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-4 border rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                  <Checkbox 
                    id="nota_fiscal"
                    checked={formData.nota_fiscal}
                    onCheckedChange={(checked) => setFormData({ ...formData, nota_fiscal: checked as boolean })}
                  />
                  <Label htmlFor="nota_fiscal" className="cursor-pointer font-normal flex-1">
                    Esta venda possui nota fiscal
                  </Label>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                  <Checkbox 
                    id="pagamento_na_entrega"
                    checked={formData.pagamento_na_entrega}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, pagamento_na_entrega: checked as boolean })
                    }
                    className="mt-1"
                  />
                  <Label htmlFor="pagamento_na_entrega" className="cursor-pointer flex-1">
                    <span className="font-medium">Pagamento na Entrega</span>
                    <p className="text-sm text-muted-foreground font-normal mt-1">
                      O valor a receber será cobrado no momento da instalação/entrega
                    </p>
                  </Label>
                </div>
              </div>
            </div>

            {/* Produtos Avulsos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Adicionar Produtos Avulsos
              </h3>
              
              {produtosAvulsos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {produtosAvulsos.map((produto) => (
                    <Card 
                      key={produto.id} 
                      className="cursor-pointer hover:border-primary transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {produto.nome_produto}
                            </p>
                            {produto.descricao_produto && (
                              <p className="text-xs text-muted-foreground truncate">
                                {produto.descricao_produto}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                R$ {produto.preco_unitario.toFixed(2)}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {produto.quantidade} {produto.unidade}
                              </Badge>
                            </div>
                          </div>
                          <Button 
                            type="button"
                            size="sm" 
                            variant="ghost"
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum produto configurado para venda avulsa. Configure produtos no módulo de Estoque.
                </p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Criando..." : "Criar Venda"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard/faturamento")}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
