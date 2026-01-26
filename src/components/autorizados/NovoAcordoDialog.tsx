import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAutorizadosPrecos } from '@/hooks/useAutorizadosPrecos';
import { formatCurrency } from '@/lib/utils';
import type { NovoAcordo, PortaAcordo, AcordoAutorizado } from '@/hooks/useAcordosAutorizados';

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
];

interface NovoAcordoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (acordo: NovoAcordo) => Promise<any>;
  acordoParaEditar?: AcordoAutorizado | null;
}

interface PortaLocal {
  id: string;
  tamanho: 'P' | 'G' | 'GG';
  valor_unitario: number;
}

export function NovoAcordoDialog({ 
  open, 
  onOpenChange, 
  onSave,
  acordoParaEditar 
}: NovoAcordoDialogProps) {
  const { autorizados } = useAutorizadosPrecos();
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [clienteNome, setClienteNome] = useState('');
  const [clienteCidade, setClienteCidade] = useState('');
  const [clienteEstado, setClienteEstado] = useState('');
  const [autorizadoId, setAutorizadoId] = useState('');
  const [portas, setPortas] = useState<PortaLocal[]>([]);
  const [valorAcordado, setValorAcordado] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [dataAcordo, setDataAcordo] = useState(new Date().toISOString().split('T')[0]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (acordoParaEditar) {
        setClienteNome(acordoParaEditar.cliente_nome);
        setClienteCidade(acordoParaEditar.cliente_cidade);
        setClienteEstado(acordoParaEditar.cliente_estado);
        setAutorizadoId(acordoParaEditar.autorizado_id);
        setPortas(acordoParaEditar.portas.map((p, idx) => ({
          id: p.id || `temp-${idx}`,
          tamanho: p.tamanho,
          valor_unitario: p.valor_unitario
        })));
        setValorAcordado(String(acordoParaEditar.valor_acordado));
        setObservacoes(acordoParaEditar.observacoes || '');
        setDataAcordo(acordoParaEditar.data_acordo);
      } else {
        setClienteNome('');
        setClienteCidade('');
        setClienteEstado('');
        setAutorizadoId('');
        setPortas([{ id: 'temp-1', tamanho: 'P', valor_unitario: 0 }]);
        setValorAcordado('');
        setObservacoes('');
        setDataAcordo(new Date().toISOString().split('T')[0]);
      }
    }
  }, [open, acordoParaEditar]);

  // Calcular valor sugerido baseado nos preços cadastrados
  const autorizadoSelecionado = autorizados.find(a => a.id === autorizadoId);
  const valorSugerido = portas.reduce((total, porta) => {
    if (!autorizadoSelecionado) return total;
    const precoTamanho = autorizadoSelecionado.precos[porta.tamanho] || 0;
    return total + precoTamanho;
  }, 0);

  const adicionarPorta = () => {
    setPortas([...portas, { 
      id: `temp-${Date.now()}`, 
      tamanho: 'P', 
      valor_unitario: autorizadoSelecionado?.precos.P || 0 
    }]);
  };

  const removerPorta = (id: string) => {
    if (portas.length > 1) {
      setPortas(portas.filter(p => p.id !== id));
    }
  };

  const atualizarPorta = (id: string, tamanho: 'P' | 'G' | 'GG') => {
    setPortas(portas.map(p => {
      if (p.id === id) {
        const novoValor = autorizadoSelecionado?.precos[tamanho] || 0;
        return { ...p, tamanho, valor_unitario: novoValor };
      }
      return p;
    }));
  };

  const handleSave = async () => {
    if (!clienteNome || !clienteCidade || !clienteEstado || !autorizadoId) {
      return;
    }

    setSaving(true);
    try {
      const novoAcordo: NovoAcordo = {
        autorizado_id: autorizadoId,
        cliente_nome: clienteNome,
        cliente_cidade: clienteCidade,
        cliente_estado: clienteEstado,
        valor_acordado: parseFloat(valorAcordado) || valorSugerido,
        status: 'pendente',
        data_acordo: dataAcordo,
        observacoes: observacoes || undefined,
        portas: portas.map(p => ({
          tamanho: p.tamanho,
          valor_unitario: p.valor_unitario
        }))
      };

      await onSave(novoAcordo);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar acordo:', error);
    } finally {
      setSaving(false);
    }
  };

  // Resumo de portas
  const resumoPortas = portas.reduce((acc, p) => {
    acc[p.tamanho] = (acc[p.tamanho] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const resumoTexto = Object.entries(resumoPortas)
    .map(([tam, qtd]) => `${qtd}${tam}`)
    .join(', ');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-zinc-900 border-zinc-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {acordoParaEditar ? 'Editar Acordo' : 'Novo Acordo de Instalação'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Formulário para cadastrar um acordo de instalação com autorizado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cliente */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-white/70">CLIENTE</Label>
            <Input
              placeholder="Nome do Cliente"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Cidade"
                value={clienteCidade}
                onChange={(e) => setClienteCidade(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <Select value={clienteEstado} onValueChange={setClienteEstado}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {ESTADOS_BR.map(estado => (
                    <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Autorizado */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white/70">AUTORIZADO</Label>
            <Select value={autorizadoId} onValueChange={setAutorizadoId}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Selecione o autorizado..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                {autorizados.map(aut => (
                  <SelectItem key={aut.id} value={aut.id}>
                    {aut.nome} {aut.cidade && aut.estado ? `- ${aut.cidade}/${aut.estado}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Portas */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white/70">
              PORTAS {portas.length > 0 && <span className="text-white/50">({resumoTexto})</span>}
            </Label>
            <div className="space-y-2">
              {portas.map((porta, index) => (
                <div key={porta.id} className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg">
                  <span className="text-xs text-white/50 w-16">Porta {index + 1}</span>
                  <Select 
                    value={porta.tamanho} 
                    onValueChange={(v) => atualizarPorta(porta.id, v as 'P' | 'G' | 'GG')}
                  >
                    <SelectTrigger className="flex-1 bg-zinc-800 border-zinc-700 text-white h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="P">P (&lt;25m²)</SelectItem>
                      <SelectItem value="G">G (25-50m²)</SelectItem>
                      <SelectItem value="GG">GG (&gt;50m²)</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-green-400 w-24 text-right">
                    {porta.valor_unitario > 0 ? formatCurrency(porta.valor_unitario) : '-'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-400"
                    onClick={() => removerPorta(porta.id)}
                    disabled={portas.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed border-zinc-600 text-white/70 hover:text-white hover:bg-zinc-800"
              onClick={adicionarPorta}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Porta
            </Button>
          </div>

          {/* Valor Acordado */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white/70">VALOR ACORDADO</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="R$ 0,00"
              value={valorAcordado}
              onChange={(e) => setValorAcordado(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
            {valorSugerido > 0 && (
              <p className="text-xs text-white/50">
                Valor sugerido: {formatCurrency(valorSugerido)} (baseado nos preços cadastrados)
              </p>
            )}
          </div>

          {/* Data do Acordo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white/70">DATA DO ACORDO</Label>
            <Input
              type="date"
              value={dataAcordo}
              onChange={(e) => setDataAcordo(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white/70">OBSERVAÇÕES (opcional)</Label>
            <Textarea
              placeholder="Observações sobre o acordo..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-600 text-white hover:bg-zinc-800"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !clienteNome || !clienteCidade || !clienteEstado || !autorizadoId}
            className="bg-primary hover:bg-primary/90"
          >
            {saving ? 'Salvando...' : acordoParaEditar ? 'Salvar Alterações' : 'Salvar Acordo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
