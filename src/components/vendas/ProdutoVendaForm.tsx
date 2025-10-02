import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ProdutoVenda } from '@/hooks/useVendas';

interface ProdutoVendaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProduto: (produto: ProdutoVenda) => void;
}

export function ProdutoVendaForm({ open, onOpenChange, onAddProduto }: ProdutoVendaFormProps) {
  const [formData, setFormData] = useState<ProdutoVenda>({
    tipo_produto: 'porta',
    tamanho: '',
    cor_id: '',
    acessorio_id: '',
    adicional_id: '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.tipo_produto === 'porta' && !formData.tamanho) {
      return;
    }
    
    if (formData.tipo_produto === 'acessorio' && !formData.acessorio_id) {
      return;
    }
    
    if (formData.tipo_produto === 'adicional' && !formData.adicional_id) {
      return;
    }
    
    onAddProduto(formData);
    
    // Reset form
    setFormData({
      tipo_produto: 'porta',
      tamanho: '',
      cor_id: '',
      acessorio_id: '',
      adicional_id: '',
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
          <DialogTitle>Adicionar Produto</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Produto */}
          <div className="space-y-2">
            <Label>Tipo de Produto *</Label>
            <Select
              value={formData.tipo_produto}
              onValueChange={(value: 'porta' | 'acessorio' | 'adicional') => 
                setFormData(prev => ({ ...prev, tipo_produto: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="porta">Porta de Enrolar</SelectItem>
                <SelectItem value="acessorio">Acessório</SelectItem>
                <SelectItem value="adicional">Adicional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campos específicos por tipo */}
          {formData.tipo_produto === 'porta' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="tamanho">Tamanho *</Label>
                <Input
                  id="tamanho"
                  value={formData.tamanho}
                  onChange={(e) => setFormData(prev => ({ ...prev, tamanho: e.target.value }))}
                  placeholder="Ex: 2.00 x 2.50"
                  required
                />
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

          {/* Quantidade */}
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade *</Label>
            <Input
              id="quantidade"
              type="number"
              min="1"
              value={formData.quantidade}
              onChange={(e) => handleNumberChange('quantidade', e.target.value)}
              required
            />
          </div>

          {/* Valores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_produto">Valor Produto (R$) *</Label>
              <Input
                id="valor_produto"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_produto}
                onChange={(e) => handleNumberChange('valor_produto', e.target.value)}
                required
              />
            </div>

            {formData.tipo_produto === 'porta' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="valor_pintura">Valor Pintura (R$)</Label>
                  <Input
                    id="valor_pintura"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_pintura}
                    onChange={(e) => handleNumberChange('valor_pintura', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_instalacao">Valor Instalação (R$)</Label>
                  <Input
                    id="valor_instalacao"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_instalacao}
                    onChange={(e) => handleNumberChange('valor_instalacao', e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="valor_frete">Valor Frete (R$)</Label>
              <Input
                id="valor_frete"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_frete}
                onChange={(e) => handleNumberChange('valor_frete', e.target.value)}
              />
            </div>
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

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full">
            Adicionar Produto
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
