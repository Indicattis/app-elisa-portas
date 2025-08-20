import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Minus, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateOrcamentoPDF } from "@/utils/orcamentoPDFGenerator";
import { useCanaisAquisicao } from "@/hooks/useCanaisAquisicao";
import type { OrcamentoFormData, Acessorio, Adicional } from "@/types/orcamento";
import type { OrcamentoProduto, OrcamentoCusto } from "@/types/produto";
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
  onSubmit?: (data: OrcamentoFormData, produtos: OrcamentoProduto[], custos: OrcamentoCusto[], valorTotal: number) => Promise<void>;
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
  const {
    toast
  } = useToast();
  const {
    canais
  } = useCanaisAquisicao();
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
    valor_instalacao: "0",
    modalidade_instalacao: "instalacao_elisa",
    forma_pagamento: "",
    desconto_total_percentual: 0,
    requer_analise: false,
    motivo_analise: "",
    canal_aquisicao_id: ""
  });
  const [produtos, setProdutos] = useState<OrcamentoProduto[]>([]);
  const [custos, setCustos] = useState<OrcamentoCusto[]>([]);
  const [cores, setCores] = useState<Cor[]>([]);
  const [acessorios, setAcessorios] = useState<Acessorio[]>([]);
  const [adicionais, setAdicionais] = useState<Adicional[]>([]);
  const [autorizados, setAutorizados] = useState<Autorizado[]>([]);
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  // Produto temporário para adição
  const [novoProduto, setNovoProduto] = useState<Partial<OrcamentoProduto>>({
    tipo_produto: 'porta_enrolar',
    valor: 0,
    quantidade: 1
  });

  // Custo temporário para adição
  const [novoCusto, setNovoCusto] = useState<Partial<OrcamentoCusto>>({
    tipo: 'frete',
    valor: 0
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
      cliente_email: initialData.cliente_email || "",
      cliente_estado: initialData.cliente_estado || "",
      cliente_cidade: initialData.cliente_cidade || "",
      cliente_bairro: initialData.cliente_bairro || "",
      cliente_cep: initialData.cliente_cep || "",
      valor_frete: initialData.valor_frete?.toString() || "0",
      valor_instalacao: initialData.valor_instalacao?.toString() || "0",
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
      const [coresResponse, acessoriosResponse, adicionaisResponse, autorizadosResponse] = await Promise.all([supabase.from('catalogo_cores').select('*').eq('ativa', true), supabase.from('acessorios').select('*').eq('ativo', true), supabase.from('adicionais').select('*').eq('ativo', true), supabase.from('autorizados').select('*').eq('ativo', true)]);
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
    const subtotalProdutos = produtos.reduce((acc, produto) => {
      return acc + (produto.valor * (produto.quantidade || 1));
    }, 0);
    const subtotalCustos = custos.reduce((acc, custo) => {
      return acc + custo.valor;
    }, 0);
    const subtotal = subtotalProdutos + subtotalCustos;
    const total = subtotal * (1 - formData.desconto_total_percentual / 100);
    setCalculatedTotal(total);
  }, [produtos, custos, formData.desconto_total_percentual]);
  const adicionarProduto = () => {
    if (!novoProduto.tipo_produto) return;
    
    let valor = 0;
    let produto: OrcamentoProduto = {
      tipo_produto: novoProduto.tipo_produto,
      valor: 0,
      descricao: '',
      quantidade: novoProduto.quantidade || 1
    };

    // Definir campos específicos baseado no tipo
    switch (novoProduto.tipo_produto) {
      case 'porta_enrolar':
      case 'porta_social':
        produto.medidas = novoProduto.medidas;
        produto.preco_producao = novoProduto.preco_producao || 0;
        produto.descricao = `${getNomeProduto(produto)} ${produto.medidas || ''}`.trim();
        valor = novoProduto.preco_producao || 0;
        break;
      case 'acessorio':
        produto.acessorio_id = novoProduto.acessorio_id;
        const acessorio = acessorios.find(a => a.id === novoProduto.acessorio_id);
        produto.descricao = acessorio?.nome || 'Acessório';
        valor = acessorio?.preco || 0;
        break;
      case 'adicional':
        produto.adicional_id = novoProduto.adicional_id;
        const adicional = adicionais.find(a => a.id === novoProduto.adicional_id);
        produto.descricao = adicional?.nome || 'Adicional';
        valor = adicional?.preco || 0;
        break;
      case 'manutencao':
        produto.descricao_manutencao = novoProduto.descricao_manutencao;
        produto.descricao = novoProduto.descricao_manutencao || 'Serviço de Manutenção';
        valor = novoProduto.valor || 0;
        break;
      case 'pintura_epoxi':
        produto.cor_id = novoProduto.cor_id;
        const corSelecionada = cores.find(c => c.id === novoProduto.cor_id);
        produto.descricao = corSelecionada ? `Pintura Epóxi - ${corSelecionada.nome}` : 'Pintura Epóxi';
        valor = novoProduto.valor || 0;
        break;
    }
    produto.valor = valor;
    setProdutos([...produtos, produto]);

    // Reset form
    setNovoProduto({
      tipo_produto: 'porta_enrolar',
      valor: 0,
      quantidade: 1
    });
  };

  const adicionarCusto = () => {
    if (!novoCusto.tipo || !novoCusto.valor || novoCusto.valor <= 0) return;
    
    const custo: OrcamentoCusto = {
      tipo: novoCusto.tipo,
      descricao: novoCusto.descricao || (novoCusto.tipo === 'frete' ? 'Frete' : 'Instalação'),
      valor: novoCusto.valor
    };
    
    setCustos([...custos, custo]);
    
    // Reset form
    setNovoCusto({
      tipo: 'frete',
      valor: 0,
      descricao: ''
    });
  };
  const removerProduto = (index: number) => {
    setProdutos(produtos.filter((_, i) => i !== index));
  };

  const removerCusto = (index: number) => {
    setCustos(custos.filter((_, i) => i !== index));
  };
  const renderCamposProduto = () => {
    switch (novoProduto.tipo_produto) {
      case 'porta_enrolar':
      case 'porta_social':
        return <>
            <div className="space-y-2">
              <Label>Medidas</Label>
              <Input placeholder="Ex: 3x3m" value={novoProduto.medidas || ""} onChange={e => setNovoProduto({
              ...novoProduto,
              medidas: e.target.value
            })} />
            </div>
            <div className="space-y-2">
              <Label>Preço de Produção (R$)</Label>
              <Input type="number" step="0.01" value={novoProduto.preco_producao || ""} onChange={e => setNovoProduto({
              ...novoProduto,
              preco_producao: parseFloat(e.target.value) || 0
            })} />
            </div>
          </>;
      case 'acessorio':
        return <div className="space-y-2">
            <Label>Acessório</Label>
            <Select value={novoProduto.acessorio_id || ""} onValueChange={value => setNovoProduto({
            ...novoProduto,
            acessorio_id: value
          })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o acessório" />
              </SelectTrigger>
              <SelectContent>
                {acessorios.map(acessorio => <SelectItem key={acessorio.id} value={acessorio.id}>
                    {acessorio.nome} - R$ {acessorio.preco.toFixed(2)}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>;
      case 'adicional':
        return <div className="space-y-2">
            <Label>Adicional</Label>
            <Select value={novoProduto.adicional_id || ""} onValueChange={value => setNovoProduto({
            ...novoProduto,
            adicional_id: value
          })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o adicional" />
              </SelectTrigger>
              <SelectContent>
                {adicionais.map(adicional => <SelectItem key={adicional.id} value={adicional.id}>
                    {adicional.nome} - R$ {adicional.preco.toFixed(2)}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>;
      case 'manutencao':
        return <>
            <div className="space-y-2">
              <Label>Descrição da Manutenção</Label>
              <Textarea placeholder="Descreva o serviço de manutenção" value={novoProduto.descricao_manutencao || ""} onChange={e => setNovoProduto({
              ...novoProduto,
              descricao_manutencao: e.target.value
            })} />
            </div>
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input type="number" step="0.01" value={novoProduto.valor || ""} onChange={e => setNovoProduto({
              ...novoProduto,
              valor: parseFloat(e.target.value) || 0
            })} />
            </div>
          </>;
      case 'pintura_epoxi':
        return <>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Select value={novoProduto.cor_id || ""} onValueChange={value => setNovoProduto({
              ...novoProduto,
              cor_id: value
            })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a cor" />
                </SelectTrigger>
                <SelectContent>
                  {cores.map(cor => <SelectItem key={cor.id} value={cor.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border" style={{
                      backgroundColor: cor.codigo_hex
                    }} />
                        {cor.nome}
                      </div>
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preço Total (R$)</Label>
              <Input type="number" step="0.01" placeholder="Ex: 2500.00" value={novoProduto.valor || ""} onChange={e => setNovoProduto({
              ...novoProduto,
              valor: parseFloat(e.target.value) || 0
            })} />
            </div>
          </>;
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
        calculatedTotal,
        valorInstalacao: parseFloat(formData.valor_instalacao) || 0
      };
      generateOrcamentoPDF(pdfData);
      toast({
        title: "PDF Gerado",
        description: "O orçamento foi baixado com sucesso"
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao gerar o PDF. Tente novamente."
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
      await onSubmit(formData, produtos, custos, calculatedTotal);
    }
  };
  return <div className="space-y-6 max-w-6xl mx-auto">
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
                <Input value={formData.cliente_nome} onChange={e => setFormData({
                  ...formData,
                  cliente_nome: e.target.value
                })} required />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input value={formData.cliente_cpf} onChange={e => setFormData({
                  ...formData,
                  cliente_cpf: e.target.value
                })} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input value={formData.cliente_telefone} onChange={e => setFormData({
                  ...formData,
                  cliente_telefone: e.target.value
                })} required />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" placeholder="E-mail do cliente" value={formData.cliente_email || ""} onChange={e => setFormData({
                  ...formData,
                  cliente_email: e.target.value
                })} />
              </div>
              <div className="space-y-2">
                <Label>Estado *</Label>
                <Input value={formData.cliente_estado} onChange={e => setFormData({
                  ...formData,
                  cliente_estado: e.target.value
                })} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cidade *</Label>
                <Input value={formData.cliente_cidade} onChange={e => setFormData({
                  ...formData,
                  cliente_cidade: e.target.value
                })} required />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input value={formData.cliente_bairro} onChange={e => setFormData({
                  ...formData,
                  cliente_bairro: e.target.value
                })} />
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input value={formData.cliente_cep} onChange={e => setFormData({
                  ...formData,
                  cliente_cep: e.target.value
                })} />
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
                <Select value={novoProduto.tipo_produto} onValueChange={(value: any) => setNovoProduto({
                  ...novoProduto,
                  tipo_produto: value
                })}>
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
                <Label>Quantidade</Label>
                <Input 
                  type="number" 
                  min="1" 
                  value={novoProduto.quantidade || 1}
                  onChange={e => setNovoProduto({
                    ...novoProduto,
                    quantidade: parseInt(e.target.value) || 1
                  })}
                />
              </div>

              <Button type="button" onClick={adicionarProduto}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Produto
              </Button>
            </div>

            {/* Tabela de produtos adicionados */}
            {produtos.length > 0 && (
              <div className="space-y-4">
                <Label>Produtos Adicionados</Label>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Valor Unit.</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="w-20">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtos.map((produto, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {getNomeProduto(produto)}
                          </TableCell>
                          <TableCell>{produto.descricao || produto.medidas}</TableCell>
                          <TableCell>{produto.quantidade || 1}</TableCell>
                          <TableCell>R$ {produto.valor.toFixed(2)}</TableCell>
                          <TableCell className="font-medium">
                            R$ {(produto.valor * (produto.quantidade || 1)).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removerProduto(index)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
            {/* Formulário para adicionar custos */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Custo</Label>
                  <Select 
                    value={novoCusto.tipo || 'frete'} 
                    onValueChange={(value: 'frete' | 'instalacao') => setNovoCusto({
                      ...novoCusto,
                      tipo: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="frete">Frete</SelectItem>
                      <SelectItem value="instalacao">Instalação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Descrição (Opcional)</Label>
                  <Input 
                    placeholder="Ex: Frete para interior"
                    value={novoCusto.descricao || ""}
                    onChange={e => setNovoCusto({
                      ...novoCusto,
                      descricao: e.target.value
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={novoCusto.valor || ""}
                    onChange={e => setNovoCusto({
                      ...novoCusto,
                      valor: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>

              <Button type="button" onClick={adicionarCusto}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Custo
              </Button>
            </div>

            {/* Tabela de custos adicionados */}
            {custos.length > 0 && (
              <div className="space-y-4">
                <Label>Custos Adicionados</Label>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="w-20">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {custos.map((custo, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {custo.tipo === 'frete' ? 'Frete' : 'Instalação'}
                          </TableCell>
                          <TableCell>{custo.descricao}</TableCell>
                          <TableCell className="font-medium">
                            R$ {custo.valor.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removerCusto(index)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Modalidade de Instalação</Label>
              <Select value={formData.modalidade_instalacao} onValueChange={(value: any) => setFormData({
                ...formData,
                modalidade_instalacao: value
              })}>
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
              <Label>Canal de Aquisição</Label>
              <Select value={formData.canal_aquisicao_id || ""} onValueChange={value => setFormData({
                ...formData,
                canal_aquisicao_id: value
              })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o canal de aquisição" />
                </SelectTrigger>
                <SelectContent>
                  {canais.map(canal => <SelectItem key={canal.id} value={canal.id}>
                      {canal.nome}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={formData.forma_pagamento} onValueChange={value => setFormData({
                ...formData,
                forma_pagamento: value
              })}>
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
              <Label>Desconto Total (%)</Label>
              <Input type="number" min="0" max={formData.forma_pagamento === "a_vista" ? "10" : "5"} step="0.1" value={formData.desconto_total_percentual} onChange={e => {
                const valor = parseFloat(e.target.value) || 0;
                const maxDesconto = formData.forma_pagamento === "a_vista" ? 10 : 5;
                if (valor <= maxDesconto) {
                  setFormData({
                    ...formData,
                    desconto_total_percentual: valor
                  });
                }
              }} />
              <p className="text-xs text-muted-foreground">
                {formData.forma_pagamento === "a_vista" ? "Pagamentos à vista permitem desconto de até 10%. Demais formas até 5%" : "Descontos maiores que 5% requerem aprovação da gerência"}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="requer_analise" checked={formData.requer_analise} onCheckedChange={checked => setFormData({
                ...formData,
                requer_analise: !!checked
              })} />
              <Label htmlFor="requer_analise">Requer análise da gerência</Label>
            </div>

            {formData.requer_analise && <div className="space-y-2">
                <Label>Motivo da Análise *</Label>
                <Textarea placeholder="Descreva o motivo pelo qual este orçamento requer análise..." value={formData.motivo_analise} onChange={e => setFormData({
                ...formData,
                motivo_analise: e.target.value
              })} required={formData.requer_analise} />
              </div>}
          </CardContent>
        </Card>

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-lg font-semibold">Total do Orçamento:</span>
            <span className="text-2xl font-bold text-primary">
              R$ {calculatedTotal.toLocaleString("pt-BR", {
              minimumFractionDigits: 2
            })}
            </span>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
                <Button type="button" variant="outline" onClick={handleDownloadPDF} disabled={produtos.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : isEdit ? "Atualizar" : "Criar Orçamento"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>;
}