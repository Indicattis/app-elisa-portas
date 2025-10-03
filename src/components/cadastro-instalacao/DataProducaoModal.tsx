import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DataProducaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instalacaoId: string;
  dataAtual?: string | null;
  onSave: (instalacaoId: string, dataProducao: string) => Promise<void>;
}

export const DataProducaoModal = ({
  open,
  onOpenChange,
  instalacaoId,
  dataAtual,
  onSave,
}: DataProducaoModalProps) => {
  const [date, setDate] = useState<Date | undefined>(
    dataAtual ? new Date(dataAtual) : undefined
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!date) return;

    setLoading(true);
    try {
      // Formatar a data para YYYY-MM-DD
      const formattedDate = format(date, 'yyyy-MM-dd');
      await onSave(instalacaoId, formattedDate);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar data de produção:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {dataAtual ? 'Editar Data de Produção' : 'Inserir Data de Produção'}
          </DialogTitle>
          <DialogDescription>
            {dataAtual
              ? 'Altere a data prevista para fabricação completa.'
              : 'Insira a data prevista para fabricação completa.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="data-producao">Data de Produção *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Selecione a data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!date || loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
