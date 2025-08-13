import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Minus, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateOrcamentoPDF } from "@/utils/orcamentoPDFGenerator";
import { OrcamentoPreview } from "./OrcamentoPreview";
import type { OrcamentoFormData, Acessorio, Adicional } from "@/types/orcamento";
import type { OrcamentoProduto } from "@/types/produto";

interface Cor {
  id: string;
  nome: string;
  codigo_hex: string;
}

interface Autorizado {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
}

interface NovoOrcamentoFormProps {
  onSubmit?: (data: OrcamentoFormData, produtos: OrcamentoProduto[], valorTotal: number) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  leadId?: string;
  initialData?: any;
  isEdit?: boolean;
}

export function NovoOrcamentoForm({
  onSubmit,
  onCancel,
  loading,
  leadId,
  initialData,
  isEdit
}: NovoOrcamentoFormProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<OrcamentoFormData>({
    lead_id: leadId || "",
    cliente_nome: "",
    cliente_cpf: "",
    cliente_telefone: "",
    cliente_estado: "",
    cliente_cidade: "",
    cliente_bairro: "",
    cliente_cep: "",
    valor_frete: "0",
    modalidade_instalacao: "instalacao_elisa",
    forma_pagamento: "",
    desconto_total_percentual: 0,
    requer_analise: false,
    motivo_analise: ""
  });

  const [produtos, setProdutos] = useState<OrcamentoProduto[]>([]);
  const [cores, setCores] = useState<Cor[]>([]);
  const [acessorios, setAcessorios] = useState<Acessorio[]>([]);
  const [adicionais, setAdicionais] = useState<Adicional[]>([]);
  const [autorizados, setAutorizados] = useState<Autorizado[]>([]);
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  // Produto temporário para adição
  const [novoProduto, setNovoProduto] = useState<Partial<OrcamentoProduto>>({
    tipo_produto: 'porta_enrolar',
    valor: 0,
    desconto_percentual: 0
  });

  useEffect(() => {
    fetchData();
    if (initialData && isEdit) {
      loadInitialData();
    }
  }, [initialData, isEdit]);

  const loadInitialData = () => {
    if (!initialData) return;
    
    setFormData({
      lead_id: initialData.lead_id,
      cliente_nome: initialData.cliente_nome || "",
      cliente_cpf: initialData.cliente_cpf || "",
      cliente_telefone: initialData.cliente_telefone || "",
      cliente_estado: initialData.cliente_estado || "",
      cliente_cidade: initialData.cliente_cidade || "",
      cliente_bairro: initialData.cliente_bairro || "",
      cliente_cep: initialData.cliente_cep || "",
      valor_frete: initialData.valor_frete?.toString() || "0",
      modalidade_instalacao: initialData.modalidade_instalacao || "instalacao_elisa",
      forma_pagamento: initialData.forma_pagamento || "",
      desconto_total_percentual: initialData.desconto_total_percentual || 0,
      requer_analise: initialData.requer_analise || false,
      motivo_analise: initialData.motivo_analise || ""
    });

    if (initialData.orcamento_produtos) {
      setProdutos(initialData.orcamento_produtos);
    }
  };

  const fetchData = async () => {
    try {
      const [coresResponse, acessoriosResponse, adicionaisResponse, autorizadosResponse] = await Promise.all([
        supabase.from('catalogo_cores').select('*').eq('ativa', true),
        supabase.from('acessorios').select('*').eq('ativo', true),
        supabase.from('adicionais').select('*').eq('ativo', true),
        supabase.from('autorizados').select('*').eq('ativo', true)
      ]);

      if (coresResponse.data) setCores(coresResponse.data);
      if (acessoriosResponse.data) setAcessorios(acessoriosResponse.data);
      if (adicionaisResponse.data) setAdicionais(adicionaisResponse.data);
      if (autorizadosResponse.data) setAutorizados(autorizadosResponse.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar dados do formulário"
      });
    }
  };

  // Calcular total
  useEffect(() => {
    const frete = parseFloat(formData.valor_frete) || 0;
    const subtotalProdutos = produtos.reduce((acc, produto) => {
      const valorComDesconto = produto.valor * (1 - (produto.desconto_percentual || 0) / 100);
      return acc + valorComDesconto;
    }, 0);
    
    const subtotal = subtotalProdutos + frete;
    const total = subtotal * (1 - formData.desconto_total_percentual / 100);
    
    setCalculatedTotal(total);
  }, [produtos, formData.valor_frete, formData.desconto_total_percentual]);

  const adicionarProduto = () => {
    if (!novoProduto.tipo_produto) return;

    let valor = 0;
    let produto: OrcamentoProduto = {
      tipo_produto: novoProduto.tipo_produto,
      valor: 0,
      desconto_percentual: novoProduto.desconto_percentual || 0
    };

    // Definir campos específicos baseado no tipo
    switch (novoProduto.tipo_produto) {
      case 'porta_enrolar':
      case 'porta_social':
        produto.medidas = novoProduto.medidas;
        produto.preco_producao = novoProduto.preco_producao || 0;
        produto.preco_instalacao = novoProduto.preco_instalacao || 0;
        valor = (novoProduto.preco_producao || 0) + (novoProduto.preco_instalacao || 0);
        break;
      
      case 'acessorio':
        produto.acessorio_id = novoProduto.acessorio_id;
        const acessorio = acessorios.find(a => a.id === novoProduto.acessorio_id);
        valor = acessorio?.preco || 0;
        break;
      
      case 'adicional':
        produto.adicional_id = novoProduto.adicional_id;
        const adicional = adicionais.find(a => a.id === novoProduto.adicional_id);
        valor = adicional?.preco || 0;
        break;
      
      case 'manutencao':
        produto.descricao_manutencao = novoProduto.descricao_manutencao;
        valor = novoProduto.valor || 0;
        break;
      
      case 'pintura_epoxi':
        produto.cor_id = novoProduto.cor_id;
        produto.medidas = novoProduto.medidas; // Área em m²
        produto.preco_producao = novoProduto.preco_producao || 0; // Preço por m²
        valor = novoProduto.valor || 0; // Valor total já calculado
        break;
    }

    produto.valor = valor;
    setProdutos([...produtos, produto]);
    
    // Reset form
    setNovoProduto({
      tipo_produto: 'porta_enrolar',
      valor: 0,
      desconto_percentual: 0
    });
  };

  const removerProduto = (index: number) => {
    setProdutos(produtos.filter((_, i) => i !== index));
  };

  const renderCamposProduto = () => {
    switch (novoProduto.tipo_produto) {
      case 'porta_enrolar':
      case 'porta_social':
        return (
          <>
            <div className="space-y-2">
              <Label>Medidas</Label>
              <Input
                placeholder="Ex: 3x3m"
                value={novoProduto.medidas || ""}
                onChange={(e) => setNovoProduto({...novoProduto, medidas: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Preço de Produção (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={novoProduto.preco_producao || ""}
                onChange={(e) => setNovoProduto({...novoProduto, preco_producao: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2">
              <Label>Preço de Instalação (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={novoProduto.preco_instalacao || ""}
                onChange={(e) => setNovoProduto({...novoProduto, preco_instalacao: parseFloat(e.target.value) || 0})}
              />
            </div>
          </>
        );

      case 'acessorio':
        return (
          <div className="space-y-2">
            <Label>Acessório</Label>
            <Select
              value={novoProduto.acessorio_id || ""}
              onValueChange={(value) => setNovoProduto({...novoProduto, acessorio_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o acessório" />
              </SelectTrigger>
              <SelectContent>
                {acessorios.map(acessorio => (
                  <SelectItem key={acessorio.id} value={acessorio.id}>
                    {acessorio.nome} - R$ {acessorio.preco.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'adicional':
        return (
          <div className="space-y-2">
            <Label>Adicional</Label>
            <Select
              value={novoProduto.adicional_id || ""}
              onValueChange={(value) => setNovoProduto({...novoProduto, adicional_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o adicional" />
              </SelectTrigger>
              <SelectContent>
                {adicionais.map(adicional => (
                  <SelectItem key={adicional.id} value={adicional.id}>
                    {adicional.nome} - R$ {adicional.preco.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'manutencao':
        return (
          <>
            <div className="space-y-2">
              <Label>Descrição da Manutenção</Label>
              <Textarea
                placeholder="Descreva o serviço de manutenção"
                value={novoProduto.descricao_manutencao || ""}
                onChange={(e) => setNovoProduto({...novoProduto, descricao_manutencao: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={novoProduto.valor || ""}
                onChange={(e) => setNovoProduto({...novoProduto, valor: parseFloat(e.target.value) || 0})}
              />
            </div>
          </>
        );

      case 'pintura_epoxi':
        return (
          <>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Select
                value={novoProduto.cor_id || ""}
                onValueChange={(value) => setNovoProduto({...novoProduto, cor_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a cor" />
                </SelectTrigger>
                <SelectContent>
                  {cores.map(cor => (
                    <SelectItem key={cor.id} value={cor.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border" 
                          style={{ backgroundColor: cor.codigo_hex }}
                        />
                        {cor.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Área (m²)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 25"
                value={novoProduto.medidas || ""}
                onChange={(e) => {
                  const area = parseFloat(e.target.value) || 0;
                  const preco = novoProduto.preco_producao || 0;
                  setNovoProduto({
                    ...novoProduto, 
                    medidas: e.target.value,
                    valor: area * preco
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Preço por m² (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={novoProduto.preco_producao || ""}
                onChange={(e) => {
                  const preco = parseFloat(e.target.value) || 0;
                  const area = parseFloat(novoProduto.medidas || "0") || 0;
                  setNovoProduto({
                    ...novoProduto, 
                    preco_producao: preco,
                    valor: preco * area
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Total (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={novoProduto.valor || ""}
                readOnly
                className="bg-muted"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const getNomeProduto = (produto: OrcamentoProduto) => {
    const tipos = {
      'porta_enrolar': 'Porta de Enrolar',
      'porta_social': 'Porta Social',
      'acessorio': 'Acessório',
      'adicional': 'Adicional',
      'manutencao': 'Manutenção',
      'pintura_epoxi': 'Pintura Epóxi'
    };
    return tipos[produto.tipo_produto];
  };

  const handleDownloadPDF = () => {
    try {
      const pdfData = {
        formData,
        produtos,
        calculatedTotal
      };

      generateOrcamentoPDF(pdfData);
      
      toast({
        title: "PDF Gerado",
        description: "O orçamento foi baixado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao gerar o PDF. Tente novamente.",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (produtos.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Adicione pelo menos um produto ao orçamento"
      });
      return;
    }

    if (onSubmit) {
      await onSubmit(formData, produtos, calculatedTotal);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulário */}
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.cliente_nome}
                  onChange={(e) => setFormData({...formData, cliente_nome: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input
                  value={formData.cliente_cpf}
                  onChange={(e) => setFormData({...formData, cliente_cpf: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input
                  value={formData.cliente_telefone}
                  onChange={(e) => setFormData({...formData, cliente_telefone: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Estado *</Label>
                <Input
                  value={formData.cliente_estado}
                  onChange={(e) => setFormData({...formData, cliente_estado: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cidade *</Label>
                <Input
                  value={formData.cliente_cidade}
                  onChange={(e) => setFormData({...formData, cliente_cidade: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input
                  value={formData.cliente_bairro}
                  onChange={(e) => setFormData({...formData, cliente_bairro: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input
                  value={formData.cliente_cep}
                  onChange={(e) => setFormData({...formData, cliente_cep: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos do Orçamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Formulário para adicionar produto */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Produto</Label>
                <Select
                  value={novoProduto.tipo_produto}
                  onValueChange={(value: any) => setNovoProduto({...novoProduto, tipo_produto: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="porta_enrolar">Porta de Enrolar</SelectItem>
                    <SelectItem value="porta_social">Porta Social</SelectItem>
                    <SelectItem value="acessorio">Acessório</SelectItem>
                    <SelectItem value="adicional">Adicional</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="pintura_epoxi">Pintura Epóxi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderCamposProduto()}

              <div className="space-y-2">
                <Label>Desconto Individual (%) - Máx. 10%</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={novoProduto.desconto_percentual || ""}
                  onChange={(e) => {
                    const valor = parseFloat(e.target.value) || 0;
                    if (valor <= 10) {
                      setNovoProduto({...novoProduto, desconto_percentual: valor});
                    }
                  }}
                />
              </div>

              <Button type="button" onClick={adicionarProduto}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Produto
              </Button>
            </div>

            {/* Lista de produtos adicionados */}
            {produtos.length > 0 && (
              <div className="space-y-2">
                <Label>Produtos Adicionados</Label>
                {produtos.map((produto, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{getNomeProduto(produto)}</div>
                      <div className="text-sm text-muted-foreground">
                        Valor: R$ {produto.valor.toFixed(2)}
                        {produto.desconto_percentual && produto.desconto_percentual > 0 && (
                          <span> - Desconto: {produto.desconto_percentual}%</span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removerProduto(index)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custos Logísticos */}
        <Card>
          <CardHeader>
            <CardTitle>Custos Logísticos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Frete (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.valor_frete}
                onChange={(e) => setFormData({...formData, valor_frete: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Modalidade de Instalação</Label>
              <Select
                value={formData.modalidade_instalacao}
                onValueChange={(value: any) => setFormData({...formData, modalidade_instalacao: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instalacao_elisa">Instalação Elisa</SelectItem>
                  <SelectItem value="autorizado_elisa">Autorizado Elisa</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </CardContent>
        </Card>

        {/* Informações Finais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Finais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select
                value={formData.forma_pagamento}
                onValueChange={(value) => setFormData({...formData, forma_pagamento: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a_vista">À Vista</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="financiamento">Financiamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Desconto Total (%) - Máx. 10%</Label>
              <Input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.desconto_total_percentual}
                onChange={(e) => {
                  const valor = parseFloat(e.target.value) || 0;
                  if (valor <= 10) {
                    setFormData({...formData, desconto_total_percentual: valor});
                  }
                }}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requer_analise"
                checked={formData.requer_analise}
                onCheckedChange={(checked) => setFormData({...formData, requer_analise: !!checked})}
              />
              <Label htmlFor="requer_analise">Requer análise da gerência</Label>
            </div>

            {formData.requer_analise && (
              <div className="space-y-2">
                <Label>Motivo da Análise *</Label>
                <Textarea
                  placeholder="Descreva o motivo pelo qual este orçamento requer análise..."
                  value={formData.motivo_analise}
                  onChange={(e) => setFormData({...formData, motivo_analise: e.target.value})}
                  required={formData.requer_analise}
                />
              </div>
            )}
          </CardContent>
        </Card>

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-lg font-semibold">Total do Orçamento:</span>
            <span className="text-2xl font-bold text-primary">
              R$ {calculatedTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleDownloadPDF}
                  disabled={produtos.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  className="flex-1"
                  onClick={togglePreview}
                >
                  {showPreview ? "Ocultar Pré-visualização" : "Mostrar Pré-visualização"}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : isEdit ? "Atualizar" : "Criar Orçamento"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Pré-visualização */}
      <div className={`transition-all duration-300 ${showPreview ? 'block' : 'hidden lg:block'}`}>
        <div className="sticky top-6">
          <h3 className="text-lg font-semibold mb-4">Pré-visualização do Orçamento</h3>
          <OrcamentoPreview 
            formData={formData}
            produtos={produtos}
            calculatedTotal={calculatedTotal}
          />
        </div>
      </div>
    </div>
  );
}