import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, PauseCircle } from "lucide-react";

interface LinhaSimples {
  id: string;
  item: string;
  quantidade: number;
  tamanho: string | null;
}

interface AvisoFaltaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  numeroOrdem: string;
  linhas?: LinhaSimples[];
  onConfirm: (justificativa: string, linhaProblemaId?: string) => Promise<void>;
  isPausing?: boolean;
}

export function AvisoFaltaModal({
  open,
  onOpenChange,
  numeroOrdem,
  linhas = [],
  onConfirm,
  isPausing = false,
}: AvisoFaltaModalProps) {
  const [justificativa, setJustificativa] = useState("");
  const [tipoProblema, setTipoProblema] = useState<string>("outros");
  const [error, setError] = useState<string | null>(null);

  const linhaSelecionada = useMemo(() => {
    if (tipoProblema === "outros") return null;
    return linhas.find(l => l.id === tipoProblema) || null;
  }, [tipoProblema, linhas]);

  const handleSubmit = async () => {
    if (tipoProblema === "outros" && justificativa.trim().length < 10) {
      setError("A justificativa deve ter pelo menos 10 caracteres");
      return;
    }

    setError(null);
    
    const linhaProblemaId = tipoProblema !== "outros" ? tipoProblema : undefined;
    const justificativaFinal = tipoProblema === "outros" 
      ? justificativa 
      : `Falta: ${linhaSelecionada?.item}${justificativa.trim() ? ` - ${justificativa}` : ''}`;
    
    await onConfirm(justificativaFinal, linhaProblemaId);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setJustificativa("");
    setTipoProblema("outros");
    setError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const isFormValid = tipoProblema === "outros" 
    ? justificativa.trim().length >= 10 
    : true;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Aviso de Falta
          </DialogTitle>
          <DialogDescription>
            Você está pausando a ordem <span className="font-semibold">{numeroOrdem}</span>.
            Selecione a linha com problema ou informe o motivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Seleção de tipo de problema */}
          <div className="space-y-2">
            <Label htmlFor="tipo-problema">Tipo do problema *</Label>
            <Select value={tipoProblema} onValueChange={setTipoProblema}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o problema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outros">Outros (digitar motivo)</SelectItem>
                {linhas.map((linha) => (
                  <SelectItem key={linha.id} value={linha.id}>
                    {linha.item} - Qtd: {linha.quantidade}
                    {linha.tamanho && ` - ${linha.tamanho}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campo de justificativa */}
          {tipoProblema === "outros" ? (
            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa *</Label>
              <Textarea
                id="justificativa"
                placeholder="Ex: Falta de perfil L 40mm, aguardando reposição do fornecedor..."
                value={justificativa}
                onChange={(e) => {
                  setJustificativa(e.target.value);
                  if (error) setError(null);
                }}
                rows={4}
                className="resize-none"
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Mínimo de 10 caracteres ({justificativa.length}/10)
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>Linha selecionada:</strong>
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  {linhaSelecionada?.item} - Qtd: {linhaSelecionada?.quantidade}
                  {linhaSelecionada?.tamanho && ` - Tam: ${linhaSelecionada.tamanho}`}
                </p>
              </div>
              
              <Label htmlFor="justificativa-extra">Detalhes adicionais (opcional)</Label>
              <Textarea
                id="justificativa-extra"
                placeholder="Ex: Aguardando chegada do fornecedor..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          )}

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>Atenção:</strong> Ao pausar, o cronômetro será interrompido e a ordem ficará disponível para outro operador retomar.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPausing}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isPausing || !isFormValid}
          >
            <PauseCircle className="h-4 w-4 mr-2" />
            {isPausing ? "Pausando..." : "Pausar Ordem"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
