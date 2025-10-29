import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ProdutoVenda } from '@/hooks/useVendas';
import { buscarPrecosPorMedidas } from '@/utils/tabelaPrecosHelper';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ProdutoVendaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProduto: (produto: ProdutoVenda) => void;
  produtoEditando?: ProdutoVenda;
  indexEditando?: number;
  tipoInicial?: 'porta_enrolar' | 'porta_social' | 'pintura_epoxi' | 'acessorio' | 'adicional' | 'manutencao';
  permitirTrocaTipo?: boolean;
}

export function ProdutoVendaForm({ 
  open, 
  onOpenChange, 
  onAddProduto,
  produtoEditando,
  indexEditando,
  tipoInicial,
  permitirTrocaTipo = true
}: ProdutoVendaFormProps) {
  const [formData, setFormData] = useState<ProdutoVenda>({
    tipo_produto: tipoInicial || 'porta_enrolar',
    tamanho: '',
    largura: undefined,
    altura: undefined,
    cor_id: '',
    acessorio_id: '',
    adicional_id: '',
    tipo_pintura: '',
    valor_produto: 0,
    valor_pintura: 0,
    valor_instalacao: 0,
    valor_frete: 0,
    tipo_desconto: 'percentual',
    desconto_percentual: 0,
    desconto_valor: 0,
    quantidade: 1,
    descricao: ''
  });

  const [incluirInstalacao, setIncluirInstalacao] = useState(false);
  const [carregandoPrecos, setCarregandoPrecos] = useState(false);

  // Atualizar formulário quando um produto for passado para edição
  useEffect(() => {
    if (produtoEditando) {
      setFormData(produtoEditando);
      setIncluirInstalacao((produtoEditando.valor_instalacao || 0) > 0);
    } else {
      // Resetar formulário quando não há produto para editar
      setFormData({
        tipo_produto: tipoInicial || 'porta_enrolar',
        tamanho: '',
        largura: undefined,
        altura: undefined,
        cor_id: '',
        acessorio_id: '',
        adicional_id: '',
        tipo_pintura: '',
        valor_produto: 0,
        valor_pintura: 0,
        valor_instalacao: 0,
        valor_frete: 0,
        tipo_desconto: 'percentual',
        desconto_percentual: 0,
        desconto_valor: 0,
        quantidade: 1,
        descricao: ''
      });
      setIncluirInstalacao(false);
    }
  }, [produtoEditando, tipoInicial]);

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

  const { data: acessorios } = useQuery({
    queryKey: ['acessorios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acessorios')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
    }
  });

  const { data: adicionais } = useQuery({
    queryKey: ['adicionais'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('adicionais')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
    }
  });

  // Zerar valor de pintura se a cor for "Aço galvanizado"
  useEffect(() => {
    if (formData.cor_id && cores) {
      const corSelecionada = cores.find(c => c.id === formData.cor_id);
      if (corSelecionada && corSelecionada.nome.toLowerCase() === 'aço galvanizado') {
        setFormData(prev => ({ ...prev, valor_pintura: 0 }));
      }
    }
  }, [formData.cor_id, cores]);

  // Buscar preços na tabela de preços quando largura e altura forem informados
  const buscarPrecos = async () => {
    if (!formData.largura || !formData.altura) return;
    
    setCarregandoPrecos(true);
    try {
      const item = await buscarPrecosPorMedidas(formData.largura, formData.altura);
      
      if (item) {
        const tamanho = `${formData.largura}x${formData.altura}`;
        
        if (formData.tipo_produto === 'porta_enrolar' || formData.tipo_produto === 'porta_social') {
          setFormData(prev => ({
            ...prev,
            valor_produto: item.valor_porta,
            tamanho,
            valor_instalacao: incluirInstalacao ? item.valor_instalacao : 0
          }));
          toast.success(`Preço encontrado para ${item.largura}x${item.altura}m`);
        } else if (formData.tipo_produto === 'pintura_epoxi') {
          setFormData(prev => ({
            ...prev,
            valor_pintura: item.valor_pintura,
            tamanho
          }));
          toast.success(`Preço de pintura encontrado para ${item.largura}x${item.altura}m`);
        }
      } else {
        toast.error('Preço não encontrado na tabela para essas medidas');
      }
    } catch (error) {
      console.error('Erro ao buscar preços:', error);
      toast.error('Erro ao buscar preços');
    } finally {
      setCarregandoPrecos(false);
    }
  };

  // Atualizar valor de instalação quando o checkbox mudar
  useEffect(() => {
    const atualizarInstalacao = async () => {
      if ((formData.tipo_produto === 'porta_enrolar' || formData.tipo_produto === 'porta_social') && formData.largura && formData.altura) {
        if (incluirInstalacao) {
          const item = await buscarPrecosPorMedidas(formData.largura, formData.altura);
          if (item) {
            setFormData(prev => ({ ...prev, valor_instalacao: item.valor_instalacao }));
          }
        } else {
          setFormData(prev => ({ ...prev, valor_instalacao: 0 }));
        }
      }
    };
    atualizarInstalacao();
  }, [incluirInstalacao, formData.largura, formData.altura, formData.tipo_produto]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if ((formData.tipo_produto === 'porta_enrolar' || formData.tipo_produto === 'porta_social')) {
      if (!formData.largura || !formData.altura) {
        toast.error('Informe largura e altura da porta');
        return;
      }
    }
    
    if (formData.tipo_produto === 'pintura_epoxi') {
      if (!formData.largura || !formData.altura) {
        toast.error('Informe largura e altura para pintura');
        return;
      }
      if (!formData.cor_id) {
        toast.error('Selecione a cor da pintura');
        return;
      }
    }
    
    if (formData.tipo_produto === 'acessorio' && !formData.acessorio_id) {
      return;
    }
    
    if (formData.tipo_produto === 'adicional' && !formData.adicional_id) {
      return;
    }
    
    if (formData.tipo_produto === 'manutencao' && !formData.descricao) {
      return;
    }
    
    onAddProduto(formData);
    onOpenChange(false);
  };

  const handleNumberChange = (field: keyof ProdutoVenda, value: string) => {
    setFormData(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleAcessorioChange = (acessorioId: string) => {
    const acessorio = acessorios?.find(a => a.id === acessorioId);
    if (acessorio) {
      setFormData(prev => ({
        ...prev,
        acessorio_id: acessorioId,
        valor_produto: acessorio.preco,
        descricao: acessorio.descricao || ''
      }));
    }
  };

  const handleAdicionalChange = (adicionalId: string) => {
    const adicional = adicionais?.find(a => a.id === adicionalId);
    if (adicional) {
      setFormData(prev => ({
        ...prev,
        adicional_id: adicionalId,
        valor_produto: adicional.preco,
        descricao: adicional.descricao || ''
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{produtoEditando ? 'Editar Produto' : 'Adicionar Produto'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Produto */}
          <div className="space-y-2">
            <Label>Tipo de Produto *</Label>
            <Select
              value={formData.tipo_produto}
              onValueChange={(value: 'porta_enrolar' | 'porta_social' | 'pintura_epoxi' | 'acessorio' | 'adicional' | 'manutencao') => 
                setFormData(prev => ({ ...prev, tipo_produto: value }))
              }
              disabled={!permitirTrocaTipo}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="porta_enrolar">Porta de Enrolar</SelectItem>
                <SelectItem value="porta_social">Porta Social</SelectItem>
                <SelectItem value="pintura_epoxi">Pintura Eletrostática</SelectItem>
                <SelectItem value="acessorio">Acessório</SelectItem>
                <SelectItem value="adicional">Adicional</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campos específicos por tipo */}
          {(formData.tipo_produto === 'porta_enrolar' || formData.tipo_produto === 'porta_social') && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="largura">Largura (m) *</Label>
                  <Input
                    id="largura"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.largura || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, largura: parseFloat(e.target.value) || undefined }))}
                    onBlur={buscarPrecos}
                    placeholder="Ex: 2.50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="altura">Altura (m) *</Label>
                  <Input
                    id="altura"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.altura || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, altura: parseFloat(e.target.value) || undefined }))}
                    onBlur={buscarPrecos}
                    placeholder="Ex: 3.00"
                    required
                  />
                </div>
              </div>

              {carregandoPrecos && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando preços...
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluir_instalacao"
                  checked={incluirInstalacao}
                  onCheckedChange={(checked) => setIncluirInstalacao(checked as boolean)}
                />
                <Label htmlFor="incluir_instalacao" className="cursor-pointer">
                  Incluir Instalação
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cor">Cor</Label>
                <Select
                  value={formData.cor_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, cor_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma cor" />
                  </SelectTrigger>
                  <SelectContent>
                    {cores?.map((cor) => (
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
            </>
          )}

          {formData.tipo_produto === 'pintura_epoxi' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="largura_pintura">Largura (m) *</Label>
                  <Input
                    id="largura_pintura"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.largura || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, largura: parseFloat(e.target.value) || undefined }))}
                    onBlur={buscarPrecos}
                    placeholder="Ex: 2.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="altura_pintura">Altura (m) *</Label>
                  <Input
                    id="altura_pintura"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.altura || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, altura: parseFloat(e.target.value) || undefined }))}
                    onBlur={buscarPrecos}
                    placeholder="Ex: 2.50"
                    required
                  />
                </div>
              </div>

              {carregandoPrecos && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando preços...
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="cor">Cor da Pintura *</Label>
                <Select
                  value={formData.cor_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, cor_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a cor" />
                  </SelectTrigger>
                  <SelectContent>
                    {cores?.map((cor) => (
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
            </>
          )}

          {formData.tipo_produto === 'acessorio' && (
            <div className="space-y-2">
              <Label htmlFor="acessorio">Acessório *</Label>
              <Select
                value={formData.acessorio_id}
                onValueChange={handleAcessorioChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um acessório" />
                </SelectTrigger>
                <SelectContent>
                  {acessorios?.map((acessorio) => (
                    <SelectItem key={acessorio.id} value={acessorio.id}>
                      {acessorio.nome} - R$ {acessorio.preco.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.tipo_produto === 'adicional' && (
            <div className="space-y-2">
              <Label htmlFor="adicional">Adicional *</Label>
              <Select
                value={formData.adicional_id}
                onValueChange={handleAdicionalChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um adicional" />
                </SelectTrigger>
                <SelectContent>
                  {adicionais?.map((adicional) => (
                    <SelectItem key={adicional.id} value={adicional.id}>
                      {adicional.nome} - R$ {adicional.preco.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.tipo_produto === 'manutencao' && (
            <div className="space-y-2">
              <Label htmlFor="descricao_manutencao">Descrição do Serviço *</Label>
              <Textarea
                id="descricao_manutencao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva o serviço de manutenção a ser realizado"
                rows={3}
                required
              />
            </div>
          )}

          {/* Campo de quantidade removido - quantidade será editada diretamente na tabela */}

          {/* Valores */}
          <div className="space-y-2">
            <Label htmlFor="valor_produto">
              Valor {formData.tipo_produto === 'pintura_epoxi' ? 'da Pintura' : formData.tipo_produto === 'manutencao' ? 'do Serviço' : 'do Produto'} (R$) *
            </Label>
            <Input
              id="valor_produto"
              type="number"
              step="0.01"
              min="0"
              value={formData.tipo_produto === 'pintura_epoxi' ? formData.valor_pintura : formData.valor_produto}
              onChange={(e) => {
                const valor = parseFloat(e.target.value) || 0;
                if (formData.tipo_produto === 'pintura_epoxi') {
                  setFormData(prev => ({ ...prev, valor_pintura: valor, valor_produto: 0 }));
                } else {
                  setFormData(prev => ({ ...prev, valor_produto: valor }));
                }
              }}
              required
            />
          </div>

          {/* Tipo de Desconto */}
          <div className="space-y-2">
            <Label>Tipo de Desconto</Label>
            <RadioGroup
              value={formData.tipo_desconto}
              onValueChange={(value: 'percentual' | 'valor') => 
                setFormData(prev => ({ ...prev, tipo_desconto: value }))
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentual" id="percentual" />
                <Label htmlFor="percentual" className="cursor-pointer">Percentual (%)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="valor" id="valor" />
                <Label htmlFor="valor" className="cursor-pointer">Valor (R$)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Desconto */}
          {formData.tipo_desconto === 'percentual' ? (
            <div className="space-y-2">
              <Label htmlFor="desconto_percentual">Desconto (%)</Label>
              <Input
                id="desconto_percentual"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.desconto_percentual}
                onChange={(e) => handleNumberChange('desconto_percentual', e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="desconto_valor">Desconto (R$)</Label>
              <Input
                id="desconto_valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.desconto_valor}
                onChange={(e) => handleNumberChange('desconto_valor', e.target.value)}
              />
            </div>
          )}

          {/* Descrição - ocultar se for manutenção pois já tem campo específico */}
          {formData.tipo_produto !== 'manutencao' && (
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                rows={2}
              />
            </div>
          )}

          <Button type="submit" className="w-full">
            {produtoEditando ? 'Salvar Alterações' : 'Adicionar Produto'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
