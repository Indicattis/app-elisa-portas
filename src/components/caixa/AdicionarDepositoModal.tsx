import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DepositoCaixa, CategoriaDeposito, CATEGORIAS_DEPOSITO } from "@/types/caixa";

interface AdicionarDepositoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date | null;
  deposito?: DepositoCaixa | null;
  onSave: (data: any) => Promise<boolean>;
  onUpdate?: (id: string, data: any) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
}

export function AdicionarDepositoModal({
  open,
  onOpenChange,
  selectedDate,
  deposito,
  onSave,
  onUpdate,
  onDelete
}: AdicionarDepositoModalProps) {
  const [date, setDate] = useState<Date | undefined>(selectedDate || new Date());
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState<CategoriaDeposito>("travesseiro");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (deposito) {
      setDate(new Date(deposito.data_deposito));
      setValor(String(deposito.valor));
      setCategoria(deposito.categoria);
      setObservacoes(deposito.observacoes || "");
    } else if (selectedDate) {
      setDate(selectedDate);
      setValor("");
      setCategoria("travesseiro");
      setObservacoes("");
    }
  }, [deposito, selectedDate]);

  const handleSave = async () => {
    if (!date || !valor) return;

    setLoading(true);
    
    const data = {
      data_deposito: format(date, 'yyyy-MM-dd'),
      valor: parseFloat(valor),
      categoria,
      observacoes: observacoes || undefined
    };

    let success = false;
    if (deposito && onUpdate) {
      success = await onUpdate(deposito.id, data);
    } else {
      success = await onSave(data);
    }

    setLoading(false);
    
    if (success) {
      handleClose();
    }
  };

  const handleDelete = async () => {
    if (!deposito || !onDelete) return;
    
    if (!confirm("Tem certeza que deseja excluir este depósito?")) return;

    setLoading(true);
    const success = await onDelete(deposito.id);
    setLoading(false);
    
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setDate(selectedDate || new Date());
    setValor("");
    setCategoria("travesseiro");
    setObservacoes("");
    onOpenChange(false);
  };

  const formatValorInput = (value: string) => {
    // Remove tudo exceto números e ponto
    const numericValue = value.replace(/[^\d.]/g, '');
    return numericValue;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {deposito ? 'Editar Depósito' : 'Adicionar Depósito'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date">Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="valor">Valor</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                id="valor"
                type="text"
                placeholder="0,00"
                className="pl-10"
                value={valor}
                onChange={(e) => setValor(formatValorInput(e.target.value))}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={categoria} onValueChange={(value) => setCategoria(value as CategoriaDeposito)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIAS_DEPOSITO).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: value.color }}
                      />
                      {value.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Adicione observações sobre este depósito..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {deposito && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
          <div className="flex gap-2 flex-1 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading || !date || !valor}
            >
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
