import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { titulo: string; prazo: string; checkboxes: { descricao: string }[] }) => void;
  isLoading: boolean;
}

export function NovaMissaoModal({ open, onOpenChange, onSubmit, isLoading }: Props) {
  const [titulo, setTitulo] = useState("");
  const [prazo, setPrazo] = useState<Date>();
  const [checkboxes, setCheckboxes] = useState<string[]>([""]);
  const [novoItem, setNovoItem] = useState("");

  const resetForm = () => {
    setTitulo("");
    setPrazo(undefined);
    setCheckboxes([""]);
    setNovoItem("");
  };

  const handleSubmit = () => {
    const itensValidos = checkboxes.filter((c) => c.trim().length > 0);
    if (!titulo.trim() || !prazo || itensValidos.length === 0) return;

    onSubmit({
      titulo: titulo.trim(),
      prazo: format(prazo, "yyyy-MM-dd"),
      checkboxes: itensValidos.map((d) => ({ descricao: d.trim() })),
    });
    resetForm();
    onOpenChange(false);
  };

  const addCheckbox = () => {
    if (novoItem.trim()) {
      setCheckboxes([...checkboxes.filter(c => c.trim()), novoItem.trim(), ""]);
      setNovoItem("");
    }
  };

  const removeCheckbox = (index: number) => {
    setCheckboxes(checkboxes.filter((_, i) => i !== index));
  };

  const updateCheckbox = (index: number, value: string) => {
    const updated = [...checkboxes];
    updated[index] = value;
    setCheckboxes(updated);
  };

  const itensValidos = checkboxes.filter((c) => c.trim().length > 0);
  const canSubmit = titulo.trim() && prazo && itensValidos.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg bg-slate-900/95 border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Nova Missão</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label className="text-white/70">Título da missão</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Implementar novo processo de vendas"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>

          {/* Prazo */}
          <div className="space-y-2">
            <Label className="text-white/70">Prazo</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white/5 border-white/10 text-white hover:bg-white/10",
                    !prazo && "text-white/30"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {prazo ? format(prazo, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar prazo"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={prazo}
                  onSelect={setPrazo}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <Label className="text-white/70">Itens da missão ({itensValidos.length})</Label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {checkboxes.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-sm border border-white/20 flex-shrink-0" />
                  <Input
                    value={item}
                    onChange={(e) => updateCheckbox(index, e.target.value)}
                    placeholder={`Item ${index + 1}`}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && item.trim()) {
                        e.preventDefault();
                        setCheckboxes([...checkboxes, ""]);
                        setTimeout(() => {
                          const inputs = document.querySelectorAll<HTMLInputElement>('.missao-checkbox-input');
                          inputs[inputs.length - 1]?.focus();
                        }, 50);
                      }
                    }}
                  />
                  {checkboxes.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0"
                      onClick={() => removeCheckbox(index)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 w-full"
              onClick={() => setCheckboxes([...checkboxes, ""])}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Adicionar item
            </Button>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white"
          >
            {isLoading ? "Criando..." : "Criar Missão"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
