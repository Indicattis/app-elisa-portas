
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
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCanaisAquisicao } from "@/hooks/useCanaisAquisicao";

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

  const [formData, setFormData] = useState({
    publico_alvo: "",
    canal_aquisicao_id: "",
    estado: "",
    cidade: "",
    cep: "",
    cliente_nome: "",
    cliente_telefone: "",
    cliente_email: "",
    valor_produto: "",
    custo_produto: "",
    valor_pintura: "",
    custo_pintura: "",
    valor_instalacao: "",
    valor_frete: "",
    resgate: false,
    forma_pagamento: "",
    observacoes_venda: "",
    atendente_id: "",
    numero_parcelas: "1",
    valor_entrada: "",
  });

  useEffect(() => {
    fetchAtendentes();
  }, []);

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
      const valorTotal = 
        (parseFloat(formData.valor_produto) || 0) +
        (parseFloat(formData.valor_pintura) || 0) +
        (parseFloat(formData.valor_instalacao) || 0) +
        (parseFloat(formData.valor_frete) || 0);

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
        valor_produto: parseFloat(formData.valor_produto) || 0,
        custo_produto: parseFloat(formData.custo_produto) || 0,
        valor_pintura: parseFloat(formData.valor_pintura) || 0,
        custo_pintura: parseFloat(formData.custo_pintura) || 0,
        valor_instalacao: parseFloat(formData.valor_instalacao) || 0,
        valor_frete: parseFloat(formData.valor_frete) || 0,
        valor_venda: valorTotal,
        resgate: formData.resgate,
        forma_pagamento: formData.forma_pagamento || null,
        observacoes_venda: formData.observacoes_venda || null,
        data_venda: date.toISOString(),
        lead_id: null,
        numero_parcelas: parseInt(formData.numero_parcelas) || 1,
        valor_entrada: parseFloat(formData.valor_entrada) || 0,
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
        const valorEntrada = parseFloat(formData.valor_entrada);
        const valorRestante = valorTotal - valorEntrada;
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
                  <Input
                    id="estado"
                    placeholder="Estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    placeholder="Cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    required
                  />
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

            {/* Valores e Custos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Valores e Custos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_produto">Valor do Produto *</Label>
                  <Input
                    id="valor_produto"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.valor_produto}
                    onChange={(e) => setFormData({ ...formData, valor_produto: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custo_produto">Custo do Produto *</Label>
                  <Input
                    id="custo_produto"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.custo_produto}
                    onChange={(e) => setFormData({ ...formData, custo_produto: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_pintura">Valor da Pintura *</Label>
                  <Input
                    id="valor_pintura"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.valor_pintura}
                    onChange={(e) => setFormData({ ...formData, valor_pintura: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custo_pintura">Custo da Pintura *</Label>
                  <Input
                    id="custo_pintura"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.custo_pintura}
                    onChange={(e) => setFormData({ ...formData, custo_pintura: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_instalacao">Valor da Instalação *</Label>
                  <Input
                    id="valor_instalacao"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.valor_instalacao}
                    onChange={(e) => setFormData({ ...formData, valor_instalacao: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_frete">Valor do Frete *</Label>
                  <Input
                    id="valor_frete"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.valor_frete}
                    onChange={(e) => setFormData({ ...formData, valor_frete: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="resgate"
                  checked={formData.resgate}
                  onChange={(e) => setFormData({ ...formData, resgate: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="resgate">Marcar como resgate</Label>
              </div>
            </div>

            {/* Dados Adicionais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados Adicionais</h3>
              <div className="space-y-2">
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <Select 
                  value={formData.forma_pagamento}
                  onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="parcelado">Parcelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
