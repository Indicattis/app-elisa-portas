
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCanEditVenda } from "@/hooks/useCanEditVenda";
import { CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { usePortasVenda } from "@/hooks/usePortasVenda";
import { ProdutoVendaForm } from "@/components/vendas/ProdutoVendaForm";
import { PortasVendaTable } from "@/components/vendas/PortasVendaTable";
import type { ProdutoVenda } from "@/hooks/useVendas";
import { useCanaisAquisicao } from "@/hooks/useCanaisAquisicao";
import { FormaPagamentoSelect } from "@/components/FormaPagamentoSelect";

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
}

export default function VendaEdit() {
  const { id } = useParams<{ id: string }>();
  const [venda, setVenda] = useState<Tables<"vendas"> | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [showProdutoForm, setShowProdutoForm] = useState(false);
  const { portas, isLoading: isLoadingPortas, addPorta, deletePorta } = usePortasVenda(id);
  const { canais } = useCanaisAquisicao();
  const [formData, setFormData] = useState({
    data_venda: "",
    publico_alvo: "cliente_final",
    canal_aquisicao_id: "",
    forma_pagamento: "",
    valor_entrada: "",
    numero_parcelas: "",
    data_prevista_entrega: "",
    tipo_entrega: "instalacao",
    cliente_nome: "",
    cliente_telefone: "",
    cliente_email: "",
    estado: "",
    cidade: "",
    bairro: "",
    cep: "",
    observacoes_venda: "",
    valor_frete: "",
    nota_fiscal: false,
  });

  const { user, isAdmin } = useAuth();
  const { canEdit } = useCanEditVenda(venda?.atendente_id);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchVenda();
    }
  }, [id]);


  const fetchVenda = async () => {
    if (!id) return;
    
    try {
      const { data: vendaData, error: vendaError } = await supabase
        .from("vendas")
        .select("*")
        .eq("id", id)
        .single();

      if (vendaError) throw vendaError;
      
      setVenda(vendaData);
      setFormData({
        data_venda: new Date(vendaData.data_venda).toISOString().slice(0, 16),
        publico_alvo: vendaData.publico_alvo || "cliente_final",
        canal_aquisicao_id: vendaData.canal_aquisicao_id || "",
        forma_pagamento: vendaData.forma_pagamento || "",
        valor_entrada: (vendaData.valor_entrada ? vendaData.valor_entrada * 100 : 0).toString(),
        numero_parcelas: vendaData.numero_parcelas?.toString() || "",
        data_prevista_entrega: vendaData.data_prevista_entrega || "",
        tipo_entrega: vendaData.tipo_entrega || "instalacao",
        cliente_nome: vendaData.cliente_nome || "",
        cliente_telefone: vendaData.cliente_telefone || "",
        cliente_email: vendaData.cliente_email || "",
        estado: vendaData.estado || "",
        cidade: vendaData.cidade || "",
        bairro: vendaData.bairro || "",
        cep: vendaData.cep || "",
        observacoes_venda: vendaData.observacoes_venda || "",
        valor_frete: (vendaData.valor_frete ? vendaData.valor_frete * 100 : 0).toString(),
        nota_fiscal: vendaData.nota_fiscal || false,
      });

      // Vendas table doesn't have lead_id, so skip lead lookup
    } catch (error) {
      console.error("Erro ao buscar venda:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar dados da venda",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;

    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Você não tem permissão para editar esta venda",
      });
      return;
    }
    
    setLoading(true);

    try {
      const valorEntrada = parseFloat(formData.valor_entrada) / 100;
      const valorFrete = parseFloat(formData.valor_frete) / 100;

      const updateData: any = {
        publico_alvo: formData.publico_alvo,
        canal_aquisicao_id: formData.canal_aquisicao_id || null,
        forma_pagamento: formData.forma_pagamento || null,
        valor_entrada: valorEntrada,
        numero_parcelas: formData.numero_parcelas ? parseInt(formData.numero_parcelas) : null,
        data_prevista_entrega: formData.data_prevista_entrega || null,
        tipo_entrega: formData.tipo_entrega,
        cliente_nome: formData.cliente_nome || null,
        cliente_telefone: formData.cliente_telefone || null,
        cliente_email: formData.cliente_email || null,
        estado: formData.estado || null,
        cidade: formData.cidade || null,
        bairro: formData.bairro || null,
        cep: formData.cep || null,
        observacoes_venda: formData.observacoes_venda || null,
        valor_frete: valorFrete,
        nota_fiscal: formData.nota_fiscal,
      };

      // Apenas admins podem editar a data da venda
      if (isAdmin) {
        updateData.data_venda = new Date(formData.data_venda).toISOString();
      }

      const { error } = await supabase
        .from("vendas")
        .update(updateData)
        .eq("id", id);

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Venda atualizada com sucesso",
      });

      navigate("/dashboard/vendas");
    } catch (error) {
      console.error("Erro ao atualizar venda:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Erro ao atualizar venda: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  if (!canEdit && !loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para editar esta venda.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Venda</h1>
          <p className="text-muted-foreground">Editar dados da venda</p>
        </div>
      </div>

      {lead && (
        <Card>
          <CardHeader>
            <CardTitle>Dados do Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Nome:</strong> {lead.nome}</div>
              <div><strong>Email:</strong> {lead.email}</div>
              <div><strong>Telefone:</strong> {lead.telefone}</div>
              <div><strong>Cidade:</strong> {lead.cidade}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dados da Venda</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_venda">
                  Data da Venda * {!isAdmin && <span className="text-xs text-muted-foreground">(Somente admin pode editar)</span>}
                </Label>
                <Input
                  id="data_venda"
                  type="datetime-local"
                  value={formData.data_venda}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_venda: e.target.value }))}
                  disabled={!isAdmin}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publico_alvo">Público Alvo *</Label>
                <Select
                  value={formData.publico_alvo}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, publico_alvo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente_final">Cliente Final</SelectItem>
                    <SelectItem value="serralheiro">Serralheiro</SelectItem>
                    <SelectItem value="empresa">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="canal_aquisicao_id">Canal de Aquisição *</Label>
                <Select
                  value={formData.canal_aquisicao_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, canal_aquisicao_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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

              <FormaPagamentoSelect
                value={formData.forma_pagamento}
                onValueChange={(value) => setFormData(prev => ({ ...prev, forma_pagamento: value }))}
                showLabel={true}
              />

              <div className="space-y-2">
                <Label htmlFor="valor_entrada">Valor de Entrada</Label>
                <Input
                  id="valor_entrada"
                  placeholder="R$ 0,00"
                  value={formatCurrency(formData.valor_entrada)}
                  onChange={(e) => {
                    const numbers = e.target.value.replace(/\D/g, "");
                    setFormData(prev => ({ ...prev, valor_entrada: numbers }));
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_parcelas">Número de Parcelas</Label>
                <Input
                  id="numero_parcelas"
                  type="number"
                  placeholder="Ex: 3"
                  value={formData.numero_parcelas}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero_parcelas: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor_frete">Valor do Frete Total</Label>
                <Input
                  id="valor_frete"
                  placeholder="R$ 0,00"
                  value={formatCurrency(formData.valor_frete)}
                  onChange={(e) => {
                    const numbers = e.target.value.replace(/\D/g, "");
                    setFormData(prev => ({ ...prev, valor_frete: numbers }));
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_prevista_entrega">Data Prevista de Entrega</Label>
                <Input
                  id="data_prevista_entrega"
                  type="date"
                  value={formData.data_prevista_entrega}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_prevista_entrega: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_entrega">Tipo de Entrega</Label>
                <Select
                  value={formData.tipo_entrega}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_entrega: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de entrega" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instalacao">Instalação</SelectItem>
                    <SelectItem value="retirada">Retirada</SelectItem>
                    <SelectItem value="entrega">Entrega</SelectItem>
                    <SelectItem value="correcao">Correção</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="nota_fiscal"
                    checked={formData.nota_fiscal}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, nota_fiscal: checked as boolean }))
                    }
                  />
                  <Label htmlFor="nota_fiscal" className="cursor-pointer">
                    Nota Fiscal emitida
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Dados do Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente_nome">Nome do Cliente *</Label>
                  <Input
                    id="cliente_nome"
                    placeholder="Nome completo"
                    value={formData.cliente_nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente_nome: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cliente_telefone">Telefone do Cliente *</Label>
                  <Input
                    id="cliente_telefone"
                    placeholder="(11) 99999-9999"
                    value={formData.cliente_telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente_telefone: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cliente_email">E-mail do Cliente</Label>
                  <Input
                    id="cliente_email"
                    type="email"
                    placeholder="cliente@email.com"
                    value={formData.cliente_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente_email: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  placeholder="Ex: SP"
                  value={formData.estado}
                  onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  placeholder="Nome da cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  placeholder="Nome do bairro"
                  value={formData.bairro}
                  onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes_venda">Observações</Label>
              <Textarea
                id="observacoes_venda"
                placeholder="Observações sobre a venda..."
                value={formData.observacoes_venda}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes_venda: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Atualizar Venda"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos da Venda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={() => setShowProdutoForm(true)}>
            Adicionar Produto
          </Button>

          <ProdutoVendaForm 
            open={showProdutoForm}
            onOpenChange={setShowProdutoForm}
            onAddProduto={async (produto: ProdutoVenda) => {
              await addPorta(produto);
              setShowProdutoForm(false);
            }}
          />
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Produtos Adicionados</h3>
            {isLoadingPortas ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando produtos...
              </div>
            ) : (
              <PortasVendaTable 
                portas={(portas || []).map(p => ({
                  tipo_produto: p.tipo_produto as 'porta' | 'acessorio' | 'adicional',
                  tamanho: p.tamanho || '',
                  cor_id: p.cor_id || '',
                  acessorio_id: p.acessorio_id || '',
                  adicional_id: p.adicional_id || '',
                  valor_produto: p.valor_produto,
                  valor_pintura: p.valor_pintura,
                  valor_instalacao: p.valor_instalacao,
                  valor_frete: p.valor_frete,
                  tipo_desconto: p.tipo_desconto as 'percentual' | 'valor',
                  desconto_percentual: p.desconto_percentual,
                  desconto_valor: p.desconto_valor,
                  quantidade: p.quantidade,
                  descricao: p.descricao || ''
                }))} 
                onRemovePorta={async (index: number) => {
                  const produto = portas?.[index];
                  if (produto?.id) {
                    await deletePorta(produto.id);
                  }
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
