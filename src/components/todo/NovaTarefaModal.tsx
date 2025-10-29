import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { TarefaInput } from "@/hooks/useTarefas";
import { Info } from "lucide-react";
import { format, addDays, startOfMonth, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NovaTarefaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (tarefa: TarefaInput) => void;
  setor?: string;
}

type TipoRecorrencia = 'todos_os_dias' | 'primeiro_dia_mes' | 'cada_7_dias' | 'cada_15_dias' | 'cada_30_dias';

export function NovaTarefaModal({ open, onOpenChange, onSubmit, setor }: NovaTarefaModalProps) {
  const { user } = useAuth();
  const [descricao, setDescricao] = useState("");
  const [recorrente, setRecorrente] = useState(false);
  const [tipoRecorrencia, setTipoRecorrencia] = useState<TipoRecorrencia>('todos_os_dias');

  const proximaDataRecorrencia = useMemo(() => {
    if (!recorrente) return null;
    
    const hoje = new Date();
    let proximaData: Date;
    
    switch (tipoRecorrencia) {
      case 'todos_os_dias':
        proximaData = addDays(hoje, 1);
        break;
      case 'primeiro_dia_mes':
        proximaData = startOfMonth(addMonths(hoje, 1));
        break;
      case 'cada_7_dias':
        proximaData = addDays(hoje, 7);
        break;
      case 'cada_15_dias':
        proximaData = addDays(hoje, 15);
        break;
      case 'cada_30_dias':
        proximaData = addDays(hoje, 30);
        break;
    }
    
    return format(proximaData, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }, [recorrente, tipoRecorrencia]);

  const handleSubmit = () => {
    if (!descricao.trim() || !user?.id) return;

    onSubmit({
      descricao,
      responsavel_id: user.id,
      recorrente,
      tipo_recorrencia: recorrente ? tipoRecorrencia : null,
      setor: setor || '',
    });

    // Limpar form
    setDescricao("");
    setRecorrente(false);
    setTipoRecorrencia('todos_os_dias');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva a tarefa..."
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="recorrente"
              checked={recorrente}
              onCheckedChange={setRecorrente}
            />
            <Label htmlFor="recorrente">Tarefa recorrente</Label>
          </div>

          {recorrente && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="tipo-recorrencia">Tipo de recorrência</Label>
                <Select
                  value={tipoRecorrencia}
                  onValueChange={(v) => setTipoRecorrencia(v as TipoRecorrencia)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos_os_dias">Todos os dias</SelectItem>
                    <SelectItem value="primeiro_dia_mes">1° dia do mês</SelectItem>
                    <SelectItem value="cada_7_dias">A cada 7 dias (a partir de hoje)</SelectItem>
                    <SelectItem value="cada_15_dias">A cada 15 dias (a partir de hoje)</SelectItem>
                    <SelectItem value="cada_30_dias">A cada 30 dias (a partir de hoje)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {proximaDataRecorrencia && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Próxima tarefa será criada automaticamente em: <strong>{proximaDataRecorrencia}</strong>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!descricao.trim() || !user?.id}>
            Criar Tarefa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
