import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAllUsers } from "@/hooks/useAllUsers";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Info, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface NovaRecorrenteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (template: {
    descricao: string;
    responsavel_id: string;
    setor?: string;
    dias_semana: number[];
    hora_criacao?: string;
    data_proxima_criacao?: string;
  }) => Promise<void> | void;
  setor?: string;
  isLoading?: boolean;
}

const DIAS_SEMANA = [
  { label: "Dom", value: 0 },
  { label: "Seg", value: 1 },
  { label: "Ter", value: 2 },
  { label: "Qua", value: 3 },
  { label: "Qui", value: 4 },
  { label: "Sex", value: 5 },
  { label: "Sáb", value: 6 },
];

const DIAS_SEMANA_NOMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function NovaRecorrenteModal({ open, onOpenChange, onSubmit, setor, isLoading }: NovaRecorrenteModalProps) {
  const { userRole } = useAuth();
  const { data: todosUsuarios } = useAllUsers();
  
  const [descricao, setDescricao] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>([]);
  const [horaCriacao, setHoraCriacao] = useState("08:00");

  const podeEscolherResponsavel = userRole?.role === 'diretor' || userRole?.role === 'administrador';

  const previewDias = useMemo(() => {
    if (diasSelecionados.length === 0) return "";
    if (diasSelecionados.length === 7) return "Todos os dias";
    
    const nomes = diasSelecionados
      .sort((a, b) => a - b)
      .map(d => DIAS_SEMANA_NOMES[d]);
    
    if (nomes.length === 1) return `Toda ${nomes[0]}-feira`;
    if (nomes.length === 2) return `Toda ${nomes[0]} e ${nomes[1]}`;
    
    const ultimos = nomes.slice(-1)[0];
    const primeiros = nomes.slice(0, -1).join(", ");
    return `Toda ${primeiros} e ${ultimos}`;
  }, [diasSelecionados]);

  const toggleDia = (dia: number) => {
    setDiasSelecionados(prev => 
      prev.includes(dia) 
        ? prev.filter(d => d !== dia)
        : [...prev, dia]
    );
  };

  const handleSubmit = () => {
    if (!descricao.trim()) {
      return;
    }

    if (!responsavelId && podeEscolherResponsavel) {
      return;
    }

    if (diasSelecionados.length === 0) {
      return;
    }

    // Calculate data_proxima_criacao
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const horaAgora = agora.getHours() * 60 + agora.getMinutes();
    const [horaAgendada, minutoAgendado] = horaCriacao.split(':').map(Number);
    const minutoAgendado_total = horaAgendada * 60 + minutoAgendado;
    const diaHoje = agora.getDay();
    
    let dataProximaCriacao = new Date(hoje);
    
    // Se hoje está nos dias selecionados E ainda não passou o horário, agendar para hoje
    if (diasSelecionados.includes(diaHoje) && horaAgora < minutoAgendado_total) {
      // Já está como hoje
    } else {
      // Senão, agendar para amanhã (a edge function vai buscar o próximo dia correto)
      dataProximaCriacao.setDate(dataProximaCriacao.getDate() + 1);
    }

    onSubmit({
      descricao: descricao.trim(),
      responsavel_id: responsavelId,
      setor,
      dias_semana: diasSelecionados,
      hora_criacao: horaCriacao,
      data_proxima_criacao: dataProximaCriacao.toISOString().split('T')[0],
    });

    // Reset
    setDescricao("");
    setResponsavelId("");
    setDiasSelecionados([]);
    setHoraCriacao("08:00");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Tarefa Recorrente</DialogTitle>
          <DialogDescription>
            Crie uma tarefa que será criada automaticamente nos dias selecionados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Seleção de Responsável */}
          {podeEscolherResponsavel && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Responsável</label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {todosUsuarios?.map((usuario) => (
                    <SelectItem key={usuario.user_id} value={usuario.user_id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={usuario.foto_perfil_url} />
                          <AvatarFallback className="text-xs">
                            {usuario.nome?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{usuario.nome}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição da tarefa</label>
            <Textarea
              placeholder="Digite a descrição da tarefa..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
            />
          </div>

          {/* Seletor de Dias da Semana */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Dias da semana</label>
            <div className="grid grid-cols-7 gap-2">
              {DIAS_SEMANA.map((dia) => (
                <Button
                  key={dia.value}
                  type="button"
                  variant={diasSelecionados.includes(dia.value) ? "default" : "outline"}
                  className={cn(
                    "h-12 text-sm font-medium transition-all",
                    diasSelecionados.includes(dia.value) && "shadow-md"
                  )}
                  onClick={() => toggleDia(dia.value)}
                >
                  {dia.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Horário de Criação */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horário de criação da tarefa
            </label>
            <Input
              type="time"
              value={horaCriacao}
              onChange={(e) => setHoraCriacao(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Preview */}
          {diasSelecionados.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                As tarefas serão criadas automaticamente <strong>{previewDias}</strong> às <strong>{horaCriacao}</strong>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!descricao.trim() || diasSelecionados.length === 0 || (podeEscolherResponsavel && !responsavelId) || isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Criando tarefas...
              </>
            ) : (
              'Criar Tarefa Recorrente'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
