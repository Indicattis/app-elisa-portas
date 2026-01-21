import { useState, useMemo, Fragment } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, FlaskConical, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCatalogoCores } from '@/hooks/useCatalogoCores';
import { usePedidoTeste, ConfiguracaoPedidoTeste } from '@/hooks/usePedidoTeste';

interface CriarPedidoTesteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CriarPedidoTesteModal({ open, onOpenChange, onSuccess }: CriarPedidoTesteModalProps) {
  const { coresAtivas, isLoading: loadingCores } = useCatalogoCores();
  const { createPedidoTeste, isCreating } = usePedidoTeste();
  
  const [config, setConfig] = useState<ConfiguracaoPedidoTeste>({
    nomeCliente: `[TESTE] ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
    temPintura: false,
    corPinturaId: undefined,
    corPinturaNome: undefined,
    tipoEntrega: 'entrega',
    tipoFabricacao: 'interno',
    tipoProduto: 'porta_enrolar',
    largura: 3,
    altura: 3
  });

  const fluxoPrevisto = useMemo(() => {
    if (config.tipoProduto === 'manutencao') {
      return ['Expedição Instalação', 'Finalizado'];
    }

    const etapas: string[] = ['Aberto', 'Produção', 'Qualidade'];
    
    if (config.temPintura) {
      etapas.push('Pintura');
    }
    
    if (config.tipoEntrega === 'instalacao') {
      etapas.push('Expedição Instalação');
    } else {
      etapas.push('Expedição Coleta');
    }
    
    etapas.push('Finalizado');
    
    return etapas;
  }, [config.temPintura, config.tipoEntrega, config.tipoProduto]);

  const handleSubmit = async () => {
    const pedidoId = await createPedidoTeste(config);
    if (pedidoId) {
      onSuccess?.();
      onOpenChange(false);
      // Reset config
      setConfig({
        nomeCliente: `[TESTE] ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
        temPintura: false,
        corPinturaId: undefined,
        corPinturaNome: undefined,
        tipoEntrega: 'entrega',
        tipoFabricacao: 'interno',
        tipoProduto: 'porta_enrolar',
        largura: 3,
        altura: 3
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500">
            <FlaskConical className="h-5 w-5" />
            Criar Pedido de Teste
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nome do Cliente */}
          <div className="space-y-2">
            <Label>Nome do Cliente</Label>
            <Input
              value={config.nomeCliente}
              onChange={(e) => setConfig(prev => ({ ...prev, nomeCliente: e.target.value }))}
              placeholder="[TESTE] Nome do cliente"
            />
          </div>

          {/* Tipo de Produto */}
          <div className="space-y-2">
            <Label>Tipo de Produto</Label>
            <Select
              value={config.tipoProduto}
              onValueChange={(value: 'porta_enrolar' | 'porta_social' | 'manutencao') => 
                setConfig(prev => ({ ...prev, tipoProduto: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="porta_enrolar">Porta de Enrolar</SelectItem>
                <SelectItem value="porta_social">Porta Social</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.tipoProduto !== 'manutencao' && (
            <>
              {/* Dimensões */}
              <div className="space-y-2">
                <Label>Dimensões (metros)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Largura</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="10"
                      value={config.largura}
                      onChange={(e) => setConfig(prev => ({ ...prev, largura: parseFloat(e.target.value) || 3 }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Altura</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="10"
                      value={config.altura}
                      onChange={(e) => setConfig(prev => ({ ...prev, altura: parseFloat(e.target.value) || 3 }))}
                    />
                  </div>
                </div>
              </div>

              {/* Pintura */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="temPintura"
                    checked={config.temPintura}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ 
                        ...prev, 
                        temPintura: !!checked,
                        corPinturaId: checked ? prev.corPinturaId : undefined,
                        corPinturaNome: checked ? prev.corPinturaNome : undefined
                      }))
                    }
                  />
                  <Label htmlFor="temPintura" className="cursor-pointer">
                    Pedido com pintura
                  </Label>
                </div>
                
                {config.temPintura && (
                  <Select
                    value={config.corPinturaId || ''}
                    onValueChange={(value) => {
                      const cor = coresAtivas.find(c => c.id === value);
                      setConfig(prev => ({ 
                        ...prev, 
                        corPinturaId: value,
                        corPinturaNome: cor?.nome
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a cor" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCores ? (
                        <SelectItem value="loading" disabled>Carregando cores...</SelectItem>
                      ) : (
                        coresAtivas.map(cor => (
                          <SelectItem key={cor.id} value={cor.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: cor.codigo_hex }}
                              />
                              {cor.nome}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Tipo de Fabricação */}
              <div className="space-y-3">
                <Label>Tipo de Fabricação</Label>
                <RadioGroup
                  value={config.tipoFabricacao}
                  onValueChange={(value: 'interno' | 'terceirizado') => 
                    setConfig(prev => ({ ...prev, tipoFabricacao: value }))
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="interno" id="interno" />
                    <Label htmlFor="interno" className="cursor-pointer">Interno</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="terceirizado" id="terceirizado" />
                    <Label htmlFor="terceirizado" className="cursor-pointer">Terceirizado</Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}

          {/* Tipo de Entrega */}
          <div className="space-y-3">
            <Label>Tipo de Entrega</Label>
            <RadioGroup
              value={config.tipoEntrega}
              onValueChange={(value: 'entrega' | 'instalacao') => 
                setConfig(prev => ({ ...prev, tipoEntrega: value }))
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="entrega" id="entrega" />
                <Label htmlFor="entrega" className="cursor-pointer">Entrega (Coleta)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="instalacao" id="instalacao" />
                <Label htmlFor="instalacao" className="cursor-pointer">Instalação</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Preview do Fluxo */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Fluxo previsto:</Label>
            <div className="flex flex-wrap items-center gap-1 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              {fluxoPrevisto.map((etapa, index) => (
                <Fragment key={etapa}>
                  <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-400">
                    {etapa}
                  </Badge>
                  {index < fluxoPrevisto.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isCreating}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <FlaskConical className="h-4 w-4 mr-2" />
                Criar Pedido Teste
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
