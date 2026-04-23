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
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, PauseCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  onConfirm: (justificativa: string, linhasProblemaIds?: string[], comentarioPedido?: string) => Promise<void>;
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
  const [linhasSelecionadas, setLinhasSelecionadas] = useState<string[]>([]);
  const [modoOutros, setModoOutros] = useState(false);
  const [comentarioPedido, setComentarioPedido] = useState("");
  const [error, setError] = useState<string | null>(null);

  const linhasInfo = useMemo(() => {
    return linhas.filter(l => linhasSelecionadas.includes(l.id));
  }, [linhasSelecionadas, linhas]);

  const handleToggleLinha = (linhaId: string) => {
    setLinhasSelecionadas(prev => 
      prev.includes(linhaId)
        ? prev.filter(id => id !== linhaId)
        : [...prev, linhaId]
    );
    // Se selecionar uma linha, desmarcar "Outros"
    if (!linhasSelecionadas.includes(linhaId)) {
      setModoOutros(false);
    }
  };

  const handleToggleOutros = () => {
    setModoOutros(prev => !prev);
    // Se marcar "Outros", limpar linhas selecionadas
    if (!modoOutros) {
      setLinhasSelecionadas([]);
    }
  };

  const handleSubmit = async () => {
    if (modoOutros && justificativa.trim().length < 10) {
      setError("A justificativa deve ter pelo menos 10 caracteres");
      return;
    }

    if (!modoOutros && linhasSelecionadas.length === 0) {
      setError("Selecione ao menos uma linha com problema ou marque 'Outros'");
      return;
    }

    setError(null);
    
    let justificativaFinal: string;
    
    if (modoOutros) {
      justificativaFinal = justificativa;
    } else {
      const linhasTexto = linhasInfo.map(l => l.item).join(', ');
      justificativaFinal = `Falta: ${linhasTexto}${justificativa.trim() ? ` - ${justificativa}` : ''}`;
    }
    
    await onConfirm(
      justificativaFinal, 
      modoOutros ? undefined : linhasSelecionadas,
      comentarioPedido.trim() || undefined
    );
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setJustificativa("");
    setLinhasSelecionadas([]);
    setModoOutros(false);
    setComentarioPedido("");
    setError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const isFormValid = modoOutros 
    ? justificativa.trim().length >= 10 
    : linhasSelecionadas.length > 0;

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
            Selecione as linhas com problema ou informe o motivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Lista de linhas com checkboxes */}
          <div className="space-y-2">
            <Label>Linhas com problema</Label>
            <ScrollArea className="h-[200px] rounded-md border p-3">
              <div className="space-y-2">
                {linhas.map((linha) => (
                  <div
                    key={linha.id}
                    className={`flex items-center space-x-3 p-2 rounded-md transition-colors cursor-pointer ${
                      linhasSelecionadas.includes(linha.id)
                        ? 'bg-destructive/10 border border-destructive/30'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleToggleLinha(linha.id)}
                  >
                    <Checkbox
                      id={linha.id}
                      checked={linhasSelecionadas.includes(linha.id)}
                      onCheckedChange={() => handleToggleLinha(linha.id)}
                      disabled={modoOutros}
                    />
                    <label
                      htmlFor={linha.id}
                      className={`flex-1 text-sm cursor-pointer ${
                        modoOutros ? 'opacity-50' : ''
                      }`}
                    >
                      <span className="font-medium">{linha.item}</span>
                      <span className="text-muted-foreground ml-2">
                        Qtd: {linha.quantidade}
                        {linha.tamanho && ` - ${linha.tamanho}`}
                      </span>
                    </label>
                  </div>
                ))}
                
                {/* Opção "Outros" */}
                <div
                  className={`flex items-center space-x-3 p-2 rounded-md transition-colors cursor-pointer border-t pt-3 mt-2 ${
                    modoOutros
                      ? 'bg-amber-500/10 border border-amber-500/30'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={handleToggleOutros}
                >
                  <Checkbox
                    id="outros"
                    checked={modoOutros}
                    onCheckedChange={handleToggleOutros}
                  />
                  <label
                    htmlFor="outros"
                    className="flex-1 text-sm cursor-pointer font-medium"
                  >
                    Outros (digitar motivo)
                  </label>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Resumo das linhas selecionadas */}
          {linhasSelecionadas.length > 0 && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm font-medium text-destructive mb-1">
                {linhasSelecionadas.length} linha(s) selecionada(s):
              </p>
              <p className="text-sm text-muted-foreground">
                {linhasInfo.map(l => l.item).join(', ')}
              </p>
            </div>
          )}

          {/* Campo de justificativa */}
          <div className="space-y-2">
            <Label htmlFor="justificativa">
              {modoOutros ? 'Justificativa *' : 'Detalhes adicionais (opcional)'}
            </Label>
            <Textarea
              id="justificativa"
              placeholder={modoOutros 
                ? "Ex: Falta de perfil L 40mm, aguardando reposição do fornecedor..."
                : "Ex: Aguardando chegada do fornecedor..."
              }
              value={justificativa}
              onChange={(e) => {
                setJustificativa(e.target.value);
                if (error) setError(null);
              }}
              rows={modoOutros ? 4 : 2}
              className="resize-none"
            />
            {modoOutros && (
              <p className="text-xs text-muted-foreground">
                Mínimo de 10 caracteres ({justificativa.length}/10)
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Comentário no pedido (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="comentario-pedido">
              Adicionar comentário ao pedido (opcional)
            </Label>
            <Textarea
              id="comentario-pedido"
              placeholder="Ex: Cliente já avisado, aguardando reposição da cor X..."
              value={comentarioPedido}
              onChange={(e) => setComentarioPedido(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Se preenchido, ficará registrado no histórico de comentários do pedido.
            </p>
          </div>

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
