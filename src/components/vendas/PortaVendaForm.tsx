import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { PortaVenda } from '@/hooks/useVendas';

interface PortaVendaFormProps {
  onAddPorta: (porta: PortaVenda) => void;
}

export function PortaVendaForm({ onAddPorta }: PortaVendaFormProps) {
  const [formData, setFormData] = useState<PortaVenda>({
    tamanho: '',
    cor_id: '',
    valor_produto: 0,
    valor_pintura: 0,
    valor_frete: 0,
    valor_instalacao: 0,
    desconto_percentual: 0
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tamanho) {
      return;
    }

    onAddPorta(formData);
    
    // Resetar formulário
    setFormData({
      tamanho: '',
      cor_id: '',
      valor_produto: 0,
      valor_pintura: 0,
      valor_frete: 0,
      valor_instalacao: 0,
      desconto_percentual: 0
    });
  };

  const handleNumberChange = (field: keyof PortaVenda, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <h3 className="font-semibold text-lg">Adicionar Porta de Enrolar</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tamanho">Tamanho *</Label>
          <Input
            id="tamanho"
            placeholder="Ex: 2.0x2.5m"
            value={formData.tamanho}
            onChange={(e) => setFormData(prev => ({ ...prev, tamanho: e.target.value }))}
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
              <SelectValue placeholder="Selecione a cor" />
            </SelectTrigger>
            <SelectContent>
              {cores?.map((cor) => (
                <SelectItem key={cor.id} value={cor.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border"
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
          <Label htmlFor="valor_produto">Valor Produto (R$)</Label>
          <Input
            id="valor_produto"
            type="number"
            step="0.01"
            min="0"
            value={formData.valor_produto}
            onChange={(e) => handleNumberChange('valor_produto', e.target.value)}
          />
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="desconto">Desconto (%)</Label>
          <Input
            id="desconto"
            type="number"
            min="0"
            max="100"
            value={formData.desconto_percentual}
            onChange={(e) => handleNumberChange('desconto_percentual', e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <Button type="submit" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Porta
          </Button>
        </div>
      </div>
    </form>
  );
}
