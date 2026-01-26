import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AutorizadoComPrecos, PrecosInput } from '@/hooks/useAutorizadosPrecos';

interface AutorizadoPrecosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autorizado: AutorizadoComPrecos | null;
  onSave: (autorizadoId: string, precos: PrecosInput) => Promise<boolean>;
}

export function AutorizadoPrecosDialog({
  open,
  onOpenChange,
  autorizado,
  onSave,
}: AutorizadoPrecosDialogProps) {
  const [precos, setPrecos] = useState<PrecosInput>({ P: 0, G: 0, GG: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (autorizado) {
      setPrecos(autorizado.precos);
    }
  }, [autorizado]);

  const handleSave = async () => {
    if (!autorizado) return;
    setSaving(true);
    const success = await onSave(autorizado.id, precos);
    setSaving(false);
    if (success) {
      onOpenChange(false);
    }
  };

  const handleValueChange = (tamanho: keyof PrecosInput, value: string) => {
    const numValue = parseFloat(value.replace(',', '.')) || 0;
    setPrecos((prev) => ({ ...prev, [tamanho]: numValue }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white">
            Definir Preços - {autorizado?.nome}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {autorizado?.cidade && autorizado?.estado 
              ? `${autorizado.cidade} - ${autorizado.estado}`
              : 'Defina os valores de instalação por tamanho de porta'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="preco-p" className="text-white/80">
              Tamanho P <span className="text-zinc-500">(&lt; 25m²)</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                R$
              </span>
              <Input
                id="preco-p"
                type="number"
                step="0.01"
                min="0"
                value={precos.P || ''}
                onChange={(e) => handleValueChange('P', e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preco-g" className="text-white/80">
              Tamanho G <span className="text-zinc-500">(25m² - 50m²)</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                R$
              </span>
              <Input
                id="preco-g"
                type="number"
                step="0.01"
                min="0"
                value={precos.G || ''}
                onChange={(e) => handleValueChange('G', e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preco-gg" className="text-white/80">
              Tamanho GG <span className="text-zinc-500">(&gt; 50m²)</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                R$
              </span>
              <Input
                id="preco-gg"
                type="number"
                step="0.01"
                min="0"
                value={precos.GG || ''}
                onChange={(e) => handleValueChange('GG', e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                placeholder="0,00"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-700 text-white hover:bg-zinc-800"
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
