import { useState, useMemo } from "react";
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
  const { data: todosUsuarios } = useAllUsers();
  
  const [descricao, setDescricao] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>([]);
  const [horaCriacao, setHoraCriacao] = useState("08:00");

  

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

    if (!responsavelId) {
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
      <DialogContent className="sm:max-w-[500px] bg-white/5 backdrop-blur-xl border border-white/10 text-white shadow-2xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-white">Nova Tarefa Recorrente</DialogTitle>
          <DialogDescription className="text-white/50">
            Crie uma tarefa que será criada automaticamente nos dias selecionados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Seleção de Responsável */}
          {(
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Responsável</label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f1d32] border-white/10">
                  {todosUsuarios?.map((usuario) => (
                    <SelectItem key={usuario.user_id} value={usuario.user_id} className="text-white/80 focus:bg-white/10 focus:text-white">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={usuario.foto_perfil_url} />
                          <AvatarFallback className="text-xs bg-white/10 text-white/70">
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
            <label className="text-sm font-medium text-white/70">Descrição da tarefa</label>
            <Textarea
              placeholder="Digite a descrição da tarefa..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500/50"
            />
          </div>

          {/* Seletor de Dias da Semana */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Dias da semana</label>
            <div className="grid grid-cols-7 gap-2">
              {DIAS_SEMANA.map((dia) => (
                <button
                  key={dia.value}
                  type="button"
                  className={cn(
                    "h-12 text-sm font-medium rounded-lg transition-all duration-200 border",
                    diasSelecionados.includes(dia.value)
                      ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white border-blue-500/30 shadow-lg shadow-blue-500/20"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                  )}
                  onClick={() => toggleDia(dia.value)}
                >
                  {dia.label}
                </button>
              ))}
            </div>
          </div>

          {/* Horário de Criação */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horário de criação da tarefa
            </label>
            <Input
              type="time"
              value={horaCriacao}
              onChange={(e) => setHoraCriacao(e.target.value)}
              className="w-full bg-white/5 border-white/10 text-white focus:border-blue-500/50"
            />
          </div>

          {/* Preview */}
          {diasSelecionados.length > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-200/80">
                As tarefas serão criadas automaticamente <strong className="text-blue-300">{previewDias}</strong> às <strong className="text-blue-300">{horaCriacao}</strong>
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white text-sm transition-all duration-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!descricao.trim() || diasSelecionados.length === 0 || !responsavelId || isLoading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white text-sm font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block" />
                Criando tarefas...
              </>
            ) : (
              'Criar Tarefa Recorrente'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
