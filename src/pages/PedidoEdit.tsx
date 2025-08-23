import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save } from "lucide-react";

interface PedidoCompleto {
  id: string;
  numero_pedido: string;
  orcamento_id?: string;
  cliente_nome: string;
  cliente_telefone?: string;
  cliente_email?: string;
  cliente_cpf?: string;
  cliente_bairro?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  endereco_cep?: string;
  data_entrega?: string;
  status: string;
  observacoes?: string;
  forma_pagamento?: string;
  valor_venda?: number;
  valor_entrada?: number;
  numero_parcelas?: number;
  observacoes_venda?: string;
  produtos: any[];
  valor_frete?: number;
  valor_instalacao?: number;
  modalidade_instalacao?: string;
}

const statusOptions = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'para_instalacao', label: 'Para Instalação' },
  { value: 'concluido', label: 'Concluído' },
];

const modalidadeOptions = [
  { value: 'instalacao_elisa', label: 'Instalação Elisa' },
  { value: 'autorizado_elisa', label: 'Autorizado Elisa' },
  { value: 'sem_instalacao', label: 'Sem instalação' },
];

export default function PedidoEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pedido, setPedido] = useState<PedidoCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [catalogoCores, setCatalogoCores] = useState<Array<{ nome: string; codigo_hex: string }>>([]);

  useEffect(() => {
    fetchPedido();
    fetchCatalogoCores();
  }, [id]);

  const fetchPedido = async () => {
    try {
      const { data, error } = await supabase
        .from("pedidos_producao")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setPedido({
        ...data,
        produtos: Array.isArray(data.produtos) ? data.produtos : []
      });
    } catch (error) {
      console.error("Erro ao buscar pedido:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar pedido",
      });
      navigate("/dashboard/pedidos");
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalogoCores = async () => {
    try {
      const { data, error } = await supabase
        .from("catalogo_cores")
        .select("nome, codigo_hex")
        .eq("ativa", true)
        .order("nome");

      if (error) throw error;
      setCatalogoCores(data || []);
    } catch (error) {
      console.error("Erro ao buscar cores:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedido) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("pedidos_producao")
        .update({
          cliente_nome: pedido.cliente_nome,
          cliente_telefone: pedido.cliente_telefone,
          cliente_email: pedido.cliente_email,
          cliente_cpf: pedido.cliente_cpf,
          cliente_bairro: pedido.cliente_bairro,
          endereco_rua: pedido.endereco_rua,
          endereco_numero: pedido.endereco_numero,
          endereco_cidade: pedido.endereco_cidade,
          endereco_estado: pedido.endereco_estado,
          endereco_cep: pedido.endereco_cep,
          data_entrega: pedido.data_entrega,
          status: pedido.status,
          observacoes: pedido.observacoes,
          forma_pagamento: pedido.forma_pagamento,
          valor_venda: pedido.valor_venda,
          valor_entrada: pedido.valor_entrada,
          numero_parcelas: pedido.numero_parcelas,
          observacoes_venda: pedido.observacoes_venda,
          modalidade_instalacao: pedido.modalidade_instalacao,
        })
        .eq("id", pedido.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pedido atualizado com sucesso",
      });
      navigate("/dashboard/pedidos");
    } catch (error) {
      console.error("Erro ao atualizar pedido:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar pedido",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof PedidoCompleto, value: any) => {
    setPedido(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Carregando pedido...</div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Pedido não encontrado</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard/pedidos")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Pedido</h1>
          <p className="text-muted-foreground">Pedido #{pedido.numero_pedido}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cliente_nome">Nome do Cliente</Label>
                <Input
                  id="cliente_nome"
                  value={pedido.cliente_nome || ""}
                  onChange={(e) => handleInputChange("cliente_nome", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cliente_telefone">Telefone</Label>
                <Input
                  id="cliente_telefone"
                  value={pedido.cliente_telefone || ""}
                  onChange={(e) => handleInputChange("cliente_telefone", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cliente_email">E-mail</Label>
                <Input
                  id="cliente_email"
                  type="email"
                  value={pedido.cliente_email || ""}
                  onChange={(e) => handleInputChange("cliente_email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cliente_cpf">CPF</Label>
                <Input
                  id="cliente_cpf"
                  value={pedido.cliente_cpf || ""}
                  onChange={(e) => handleInputChange("cliente_cpf", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="endereco_rua">Rua</Label>
                <Input
                  id="endereco_rua"
                  value={pedido.endereco_rua || ""}
                  onChange={(e) => handleInputChange("endereco_rua", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endereco_numero">Número</Label>
                <Input
                  id="endereco_numero"
                  value={pedido.endereco_numero || ""}
                  onChange={(e) => handleInputChange("endereco_numero", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cliente_bairro">Bairro</Label>
                <Input
                  id="cliente_bairro"
                  value={pedido.cliente_bairro || ""}
                  onChange={(e) => handleInputChange("cliente_bairro", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endereco_cidade">Cidade</Label>
                <Input
                  id="endereco_cidade"
                  value={pedido.endereco_cidade || ""}
                  onChange={(e) => handleInputChange("endereco_cidade", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endereco_estado">Estado</Label>
                <Input
                  id="endereco_estado"
                  value={pedido.endereco_estado || ""}
                  onChange={(e) => handleInputChange("endereco_estado", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="endereco_cep">CEP</Label>
              <Input
                id="endereco_cep"
                value={pedido.endereco_cep || ""}
                onChange={(e) => handleInputChange("endereco_cep", e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos do Pedido</CardTitle>
            <p className="text-sm text-muted-foreground">
              Os produtos são herdados do orçamento e não podem ser alterados
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pedido.produtos && pedido.produtos.length > 0 ? (
                pedido.produtos.map((produto: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 bg-muted/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Tipo</Label>
                        <p className="text-sm text-muted-foreground">{produto.tipo_produto || 'Não especificado'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Cor</Label>
                        <p className="text-sm text-muted-foreground">{produto.cor || 'Não especificado'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Medidas</Label>
                        <p className="text-sm text-muted-foreground">{produto.medidas || 'Não especificado'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label className="text-sm font-medium">Quantidade</Label>
                        <p className="text-sm text-muted-foreground">{produto.quantidade || 1}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Valor</Label>
                        <p className="text-sm text-muted-foreground">
                          R$ {produto.valor ? produto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Descrição</Label>
                        <p className="text-sm text-muted-foreground">{produto.descricao || 'Sem descrição'}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum produto encontrado</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagamento e Entrega */}
        <Card>
          <CardHeader>
            <CardTitle>Pagamento e Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <Input
                  id="forma_pagamento"
                  value={pedido.forma_pagamento || ""}
                  onChange={(e) => handleInputChange("forma_pagamento", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="modalidade_instalacao">Modalidade de Instalação</Label>
                <Select 
                  value={pedido.modalidade_instalacao || ""} 
                  onValueChange={(value) => handleInputChange("modalidade_instalacao", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {modalidadeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="valor_venda">Valor da Venda</Label>
                <Input
                  id="valor_venda"
                  type="number"
                  step="0.01"
                  value={pedido.valor_venda || ""}
                  onChange={(e) => handleInputChange("valor_venda", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="valor_entrada">Valor de Entrada</Label>
                <Input
                  id="valor_entrada"
                  type="number"
                  step="0.01"
                  value={pedido.valor_entrada || ""}
                  onChange={(e) => handleInputChange("valor_entrada", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="numero_parcelas">Número de Parcelas</Label>
                <Input
                  id="numero_parcelas"
                  type="number"
                  value={pedido.numero_parcelas || ""}
                  onChange={(e) => handleInputChange("numero_parcelas", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="data_entrega">Data de Entrega</Label>
              <Input
                id="data_entrega"
                type="date"
                value={pedido.data_entrega || ""}
                onChange={(e) => handleInputChange("data_entrega", e.target.value)}
                className="max-w-xs"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={pedido.status || ""} 
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="observacoes">Detalhamento do Pedido</Label>
              <Textarea
                id="observacoes"
                value={pedido.observacoes || ""}
                onChange={(e) => handleInputChange("observacoes", e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="observacoes_venda">Observações da Venda</Label>
              <Textarea
                id="observacoes_venda"
                value={pedido.observacoes_venda || ""}
                onChange={(e) => handleInputChange("observacoes_venda", e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/dashboard/pedidos")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}