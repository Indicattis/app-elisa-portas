import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useVendas, VendaFormData, ProdutoVenda } from '@/hooks/useVendas';
import { useCanaisAquisicao } from '@/hooks/useCanaisAquisicao';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Plus, CalendarIcon } from 'lucide-react';
import { ESTADOS_BRASIL, getCidadesPorEstado } from '@/utils/estadosCidades';
import { ProdutoVendaForm } from '@/components/vendas/ProdutoVendaForm';
import { ProdutosVendaTable } from '@/components/vendas/ProdutosVendaTable';
import { VendaResumo } from '@/components/vendas/VendaResumo';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { FormaPagamentoSelect } from '@/components/FormaPagamentoSelect';
import { SelecionarAcessoriosModal } from '@/components/vendas/SelecionarAcessoriosModal';

export default function VendasNova() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createVenda, isCreating } = useVendas();
  const { canais } = useCanaisAquisicao();
  
  const [formData, setFormData] = useState<VendaFormData>({
    cliente_nome: '',
    cliente_telefone: '',
    cliente_email: '',
    estado: '',
    cidade: '',
    cep: '',
    bairro: '',
    publico_alvo: '',
    forma_pagamento: '',
    observacoes_venda: '',
    valor_frete: 0,
    valor_entrada: 0,
    valor_a_receber: 0,
    data_prevista_entrega: '',
    tipo_entrega: 'instalacao'
  });

  const [portas, setPortas] = useState<ProdutoVenda[]>([]);
  const [dataVenda, setDataVenda] = useState<Date>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [acessoriosModalOpen, setAcessoriosModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<ProdutoVenda | undefined>(undefined);
  const [indexEditando, setIndexEditando] = useState<number | undefined>(undefined);
  const [tipoInicial, setTipoInicial] = useState<'porta_enrolar' | 'porta_social' | 'pintura_epoxi' | 'acessorio' | 'adicional' | 'manutencao' | undefined>(undefined);
  const [permitirTrocaTipo, setPermitirTrocaTipo] = useState(true);

  const { data: cores } = useQuery({
    queryKey: ['cores-catalogo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalogo_cores')
        .select('*')
        .eq('ativa', true)
        .order('nome');
      if (error) throw error;
      return data;
    }
  });

  const handleAddPorta = (produto: ProdutoVenda) => {
    setPortas(prev => {
      let newPortas;
      
      // Se está editando, substitui o produto na posição correta
      if (indexEditando !== undefined) {
        newPortas = [...prev];
        newPortas[indexEditando] = produto;
      } else {
        // Caso contrário, adiciona um novo produto
        newPortas = [...prev, produto];
      }
      
      const valorTotal = newPortas.reduce((acc, p) => {
        const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
        const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
        return acc + valorBase - desconto;
      }, 0) + (formData.valor_frete || 0);
      
      setFormData(prev => ({
        ...prev,
        valor_a_receber: valorTotal - (prev.valor_entrada || 0)
      }));
      
      // Limpar estado de edição
      setProdutoEditando(undefined);
      setIndexEditando(undefined);
      
      return newPortas;
    });
  };

  const handleAddAcessorios = (produtos: ProdutoVenda[]) => {
    setPortas(prev => {
      const newPortas = [...prev, ...produtos];
      
      const valorTotal = newPortas.reduce((acc, p) => {
        const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
        const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
        return acc + valorBase - desconto;
      }, 0) + (formData.valor_frete || 0);
      
      setFormData(prev => ({
        ...prev,
        valor_a_receber: valorTotal - (prev.valor_entrada || 0)
      }));
      
      return newPortas;
    });
  };

  const handleEditPorta = (index: number) => {
    setProdutoEditando(portas[index]);
    setIndexEditando(index);
    setDialogOpen(true);
  };

  const handleRemovePorta = (index: number) => {
    setPortas(prev => {
      const newPortas = prev.filter((_, i) => i !== index);
      const valorTotal = newPortas.reduce((acc, p) => {
        const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
        const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
        return acc + valorBase - desconto;
      }, 0) + (formData.valor_frete || 0);
      
      setFormData(prev => ({
        ...prev,
        valor_a_receber: valorTotal - (prev.valor_entrada || 0)
      }));
      
      return newPortas;
    });
  };

  const handleUpdateQuantidade = (index: number, novaQuantidade: number) => {
    if (novaQuantidade < 1) return;
    
    setPortas(prev => {
      const newPortas = [...prev];
      newPortas[index] = { ...newPortas[index], quantidade: novaQuantidade };
      
      const valorTotal = newPortas.reduce((acc, p) => {
        const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
        const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
        return acc + valorBase - desconto;
      }, 0) + (formData.valor_frete || 0);
      
      setFormData(prev => ({
        ...prev,
        valor_a_receber: valorTotal - (prev.valor_entrada || 0)
      }));
      
      return newPortas;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (portas.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'É necessário adicionar pelo menos um produto'
      });
      return;
    }

    try {
      await createVenda({ 
        vendaData: {
          ...formData,
          // Usar a data selecionada ou a data atual
          data_venda: dataVenda ? dataVenda.toISOString() : new Date().toISOString(),
        }, 
        portas 
      });
      navigate('/dashboard/vendas');
    } catch (error) {
      console.error('Erro ao criar venda:', error);
    }
  };

  const cidades = formData.estado ? getCidadesPorEstado(formData.estado) : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/dashboard/vendas')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Nova Venda</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Cliente</CardTitle>
            <CardDescription>Informações do cliente</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente_nome">Nome do Cliente *</Label>
              <Input
                id="cliente_nome"
                value={formData.cliente_nome}
                onChange={(e) => setFormData(prev => ({ ...prev, cliente_nome: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente_telefone">Telefone *</Label>
              <Input
                id="cliente_telefone"
                value={formData.cliente_telefone}
                onChange={(e) => setFormData(prev => ({ ...prev, cliente_telefone: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cliente_email">E-mail (opcional)</Label>
              <Input
                id="cliente_email"
                type="email"
                value={formData.cliente_email}
                onChange={(e) => setFormData(prev => ({ ...prev, cliente_email: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Localização */}
        <Card>
          <CardHeader>
            <CardTitle>Localização</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estado">Estado *</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => setFormData(prev => ({ ...prev, estado: value, cidade: '' }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_BRASIL.map(estado => (
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
                onValueChange={(value) => setFormData(prev => ({ ...prev, cidade: value }))}
                required
                disabled={!formData.estado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {cidades.map(cidade => (
                    <SelectItem key={cidade} value={cidade}>
                      {cidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP (opcional)</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro (opcional)</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dados da Venda */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Venda</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_venda">Data da Venda</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataVenda && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataVenda ? format(dataVenda, "PPP", { locale: ptBR }) : <span>Data atual (se não selecionar)</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataVenda}
                    onSelect={setDataVenda}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publico_alvo">Público Alvo *</Label>
              <Select
                value={formData.publico_alvo}
                onValueChange={(value) => setFormData(prev => ({ ...prev, publico_alvo: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
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
                required
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
              required={true}
              className="space-y-2"
            />

            <div className="space-y-2">
              <Label htmlFor="valor_frete">Valor Frete Total (R$)</Label>
              <Input
                id="valor_frete"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_frete}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_frete: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_prevista_entrega">Previsão de Entrega *</Label>
              <Input
                id="data_prevista_entrega"
                type="date"
                value={formData.data_prevista_entrega}
                onChange={(e) => setFormData(prev => ({ ...prev, data_prevista_entrega: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Tipo de Entrega *</Label>
              <RadioGroup
                value={formData.tipo_entrega}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_entrega: value }))}
                className="flex gap-4"
                required
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="instalacao" id="tipo-instalacao" />
                  <Label htmlFor="tipo-instalacao" className="font-normal cursor-pointer">
                    Instalação
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="entrega" id="tipo-entrega" />
                  <Label htmlFor="tipo-entrega" className="font-normal cursor-pointer">
                    Entrega
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_entrada">Valor de Entrada (R$)</Label>
              <Input
                id="valor_entrada"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_entrada}
                onChange={(e) => {
                  const entrada = parseFloat(e.target.value) || 0;
                  const valorTotal = portas.reduce((acc, p) => {
                    const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
                    const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
                    return acc + valorBase - desconto;
                  }, 0) + (formData.valor_frete || 0);
                  
                  setFormData(prev => ({ 
                    ...prev, 
                    valor_entrada: entrada,
                    valor_a_receber: valorTotal - entrada
                  }));
                }}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="observacoes_venda">Observações (opcional)</Label>
              <Textarea
                id="observacoes_venda"
                value={formData.observacoes_venda}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes_venda: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
            <CardDescription>Adicione portas, acessórios e adicionais desta venda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2 flex-wrap">
              <Button 
                type="button" 
                onClick={() => {
                  setProdutoEditando(undefined);
                  setIndexEditando(undefined);
                  setTipoInicial('porta_enrolar');
                  setPermitirTrocaTipo(false);
                  setDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Porta de Enrolar
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={() => {
                  setProdutoEditando(undefined);
                  setIndexEditando(undefined);
                  setTipoInicial('porta_social');
                  setPermitirTrocaTipo(false);
                  setDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Porta Social
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={() => {
                  setProdutoEditando(undefined);
                  setIndexEditando(undefined);
                  setTipoInicial('pintura_epoxi');
                  setPermitirTrocaTipo(false);
                  setDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Pintura Eletrostática
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={() => {
                  setProdutoEditando(undefined);
                  setIndexEditando(undefined);
                  setTipoInicial('manutencao');
                  setPermitirTrocaTipo(false);
                  setDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Manutenção
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={() => setAcessoriosModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Acessório/Adicional
              </Button>
            </div>
              <ProdutoVendaForm 
                open={dialogOpen}
                onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) {
                    setProdutoEditando(undefined);
                    setIndexEditando(undefined);
                    setTipoInicial(undefined);
                  }
                }}
                tipoInicial={tipoInicial}
                permitirTrocaTipo={permitirTrocaTipo}
                onAddProduto={(produto) => {
                    handleAddPorta(produto);
                    setDialogOpen(false);
                  }}
                  produtoEditando={produtoEditando}
                  indexEditando={indexEditando}
                />
                
                <SelecionarAcessoriosModal
                  open={acessoriosModalOpen}
                  onOpenChange={setAcessoriosModalOpen}
                  onConfirm={handleAddAcessorios}
                />
                
                <ProdutosVendaTable
                  produtos={portas}
                  onRemoveProduto={handleRemovePorta}
                  onEditProduto={handleEditPorta}
                  onUpdateQuantidade={handleUpdateQuantidade}
                />
          </CardContent>
        </Card>

        {/* Resumo */}
        {portas.length > 0 && (
          <>
            <VendaResumo produtos={portas} valorFrete={formData.valor_frete} />
            {formData.valor_entrada > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-lg">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Valor de Entrada:</p>
                      <p className="font-semibold text-green-600">R$ {formData.valor_entrada.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Valor a Receber (após instalação):</p>
                      <p className="font-semibold text-orange-600">R$ {formData.valor_a_receber?.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/dashboard/vendas')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isCreating || portas.length === 0}>
            {isCreating ? 'Criando...' : 'Criar Venda'}
          </Button>
        </div>
      </form>
    </div>
  );
}
