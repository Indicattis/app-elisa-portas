import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, Plus, X, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAllUsers } from "@/hooks/useAllUsers";

interface CheckboxItem {
  descricao: string;
  prazo?: Date;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { titulo: string; responsavel_id?: string; checkboxes: { descricao: string; prazo?: string }[] }) => void;
  isLoading: boolean;
}

export function NovaMissaoModal({ open, onOpenChange, onSubmit, isLoading }: Props) {
  const [titulo, setTitulo] = useState("");
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [checkboxes, setCheckboxes] = useState<CheckboxItem[]>([{ descricao: "" }]);
  const { data: users = [] } = useAllUsers();

  const resetForm = () => {
    setTitulo("");
    setResponsavelId("");
    setCheckboxes([{ descricao: "" }]);
  };

  const handleSubmit = () => {
    const itensValidos = checkboxes.filter((c) => c.descricao.trim().length > 0);
    if (!titulo.trim() || itensValidos.length === 0) return;

    onSubmit({
      titulo: titulo.trim(),
      responsavel_id: responsavelId || undefined,
      checkboxes: itensValidos.map((item) => ({
        descricao: item.descricao.trim(),
        prazo: item.prazo ? format(item.prazo, "yyyy-MM-dd") : undefined,
      })),
    });
    resetForm();
    onOpenChange(false);
  };

  const removeCheckbox = (index: number) => {
    setCheckboxes(checkboxes.filter((_, i) => i !== index));
  };

  const updateCheckbox = (index: number, updates: Partial<CheckboxItem>) => {
    const updated = [...checkboxes];
    updated[index] = { ...updated[index], ...updates };
    setCheckboxes(updated);
  };

  const itensValidos = checkboxes.filter((c) => c.descricao.trim().length > 0);
  const canSubmit = titulo.trim() && itensValidos.length > 0;

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

          {/* Responsável */}
          <div className="space-y-2">
            <Label className="text-white/70">Responsável</Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Selecionar responsável">
                  {responsavelId ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={users.find(u => u.user_id === responsavelId)?.foto_perfil_url || undefined} />
                        <AvatarFallback className="text-[9px] bg-blue-500/20 text-blue-400">
                          {users.find(u => u.user_id === responsavelId)?.nome?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{users.find(u => u.user_id === responsavelId)?.nome}</span>
                    </div>
                  ) : (
                    <span className="text-white/30">Selecionar responsável</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {users.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={user.foto_perfil_url || undefined} />
                        <AvatarFallback className="text-[9px] bg-blue-500/20 text-blue-400">
                          {user.nome.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{user.nome}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Checkboxes com prazo individual */}
          <div className="space-y-2">
            <Label className="text-white/70">Itens da missão ({itensValidos.length})</Label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {checkboxes.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-sm border border-white/20 flex-shrink-0" />
                  <Input
                    value={item.descricao}
                    onChange={(e) => updateCheckbox(index, { descricao: e.target.value })}
                    placeholder={`Item ${index + 1}`}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-8 text-sm flex-1 min-w-0"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && item.descricao.trim()) {
                        e.preventDefault();
                        setCheckboxes([...checkboxes, { descricao: "" }]);
                      }
                    }}
                  />
                  {/* Date picker per item */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8 flex-shrink-0",
                          item.prazo ? "text-amber-400 hover:text-amber-300" : "text-white/30 hover:text-white/50"
                        )}
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={item.prazo}
                        onSelect={(date) => updateCheckbox(index, { prazo: date || undefined })}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                      {item.prazo && (
                        <div className="px-3 pb-3">
                          <p className="text-xs text-muted-foreground text-center">
                            {format(item.prazo, "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
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
              onClick={() => setCheckboxes([...checkboxes, { descricao: "" }])}
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
