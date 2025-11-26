import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Repeat } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tarefa } from "@/hooks/useTarefas";
import { useIsMobile } from "@/hooks/use-mobile";

interface TarefasTabelaProps {
  tarefas: Tarefa[];
  podeGerenciar: boolean;
  onMarcarConcluida: (id: string) => void;
  onReabrir: (id: string) => void;
  onDeletar: (id: string) => void;
}

export function TarefasTabela({
  tarefas,
  podeGerenciar,
  onMarcarConcluida,
  onReabrir,
  onDeletar,
}: TarefasTabelaProps) {
  const isMobile = useIsMobile();

  if (tarefas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma tarefa encontrada
      </div>
    );
  }

  // Mobile: Card layout
  if (isMobile) {
    return (
      <div className="space-y-3">
        {tarefas.map((tarefa) => (
          <div
            key={tarefa.id}
            className={`p-3 border rounded-lg space-y-2 ${
              tarefa.status === 'concluida' ? 'opacity-60 bg-muted/30' : 'bg-card'
            }`}
          >
            {/* Row 1: Checkbox + Description */}
            <div className="flex items-start gap-3">
              <Checkbox
                checked={tarefa.status === 'concluida'}
                onCheckedChange={() => {
                  if (tarefa.status === 'concluida') {
                    onReabrir(tarefa.id);
                  } else {
                    onMarcarConcluida(tarefa.id);
                  }
                }}
                disabled={!podeGerenciar}
                className="mt-0.5"
              />
              <p className={`flex-1 text-sm ${
                tarefa.status === 'concluida' ? 'line-through text-muted-foreground' : 'font-medium'
              }`}>
                {tarefa.descricao}
              </p>
              {podeGerenciar && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => onDeletar(tarefa.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>

            {/* Row 2: Avatar + Name + Date */}
            <div className="flex items-center justify-between pl-7">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={tarefa.responsavel?.foto_perfil_url} />
                  <AvatarFallback className="text-[10px]">
                    {tarefa.responsavel?.nome?.substring(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {tarefa.responsavel?.nome}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(tarefa.created_at), "dd/MM", { locale: ptBR })}
              </span>
            </div>

            {/* Row 3: Status + Type badges */}
            <div className="flex items-center gap-2 pl-7">
              <Badge
                variant={tarefa.status === 'em_andamento' ? 'destructive' : 'default'}
                className="text-[10px] h-5 px-1.5"
              >
                {tarefa.status === 'em_andamento' ? 'Pendente' : 'Concluída'}
              </Badge>
              {tarefa.recorrente ? (
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                  <Repeat className="h-2.5 w-2.5 mr-0.5" />
                  Rec.
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5">Única</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop: Table layout
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 h-8"></TableHead>
            <TableHead className="h-8">Descrição</TableHead>
            <TableHead className="w-[180px] h-8">Responsável</TableHead>
            <TableHead className="w-[180px] h-8">Criado por</TableHead>
            <TableHead className="w-[90px] h-8">Status</TableHead>
            <TableHead className="w-[100px] h-8">Data</TableHead>
            <TableHead className="w-[90px] h-8">Tipo</TableHead>
            {podeGerenciar && <TableHead className="w-10 h-8"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tarefas.map((tarefa) => (
            <TableRow
              key={tarefa.id}
              className={`h-10 ${
                tarefa.status === 'concluida' ? 'opacity-60' : 'hover:bg-accent/30'
              }`}
            >
              <TableCell className="py-1">
                <Checkbox
                  checked={tarefa.status === 'concluida'}
                  onCheckedChange={() => {
                    if (tarefa.status === 'concluida') {
                      onReabrir(tarefa.id);
                    } else {
                      onMarcarConcluida(tarefa.id);
                    }
                  }}
                  disabled={!podeGerenciar}
                  className="h-4 w-4"
                />
              </TableCell>
              <TableCell
                className={`py-1 text-sm ${
                  tarefa.status === 'concluida' ? 'line-through' : 'font-medium'
                }`}
              >
                {tarefa.descricao}
              </TableCell>
              <TableCell className="py-1">
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={tarefa.responsavel?.foto_perfil_url} />
                    <AvatarFallback className="text-[10px]">
                      {tarefa.responsavel?.nome?.substring(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate">{tarefa.responsavel?.nome}</span>
                </div>
              </TableCell>
              <TableCell className="py-1">
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={tarefa.criador?.foto_perfil_url} />
                    <AvatarFallback className="text-[10px]">
                      {tarefa.criador?.nome?.substring(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate">{tarefa.criador?.nome}</span>
                </div>
              </TableCell>
              <TableCell className="py-1">
                <Badge
                  variant={tarefa.status === 'em_andamento' ? 'destructive' : 'default'}
                  className="text-[10px] h-5 px-1.5"
                >
                  {tarefa.status === 'em_andamento' ? 'Pendente' : 'Concluída'}
                </Badge>
              </TableCell>
              <TableCell className="py-1 text-xs text-muted-foreground">
                {format(new Date(tarefa.created_at), "dd/MM/yy", { locale: ptBR })}
              </TableCell>
              <TableCell className="py-1">
                {tarefa.recorrente ? (
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                    <Repeat className="h-2.5 w-2.5 mr-0.5" />
                    Rec.
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5">Única</Badge>
                )}
              </TableCell>
              {podeGerenciar && (
                <TableCell className="py-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onDeletar(tarefa.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}