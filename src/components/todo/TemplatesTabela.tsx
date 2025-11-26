import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Repeat } from "lucide-react";
import { TarefaTemplate } from "@/hooks/useTarefas";
import { useIsMobile } from "@/hooks/use-mobile";

interface TemplatesTabelaProps {
  templates: TarefaTemplate[];
  podeGerenciar: boolean;
  onEditar: (template: TarefaTemplate) => void;
  onDeletar: (id: string) => void;
}

export function TemplatesTabela({
  templates,
  podeGerenciar,
  onEditar,
  onDeletar,
}: TemplatesTabelaProps) {
  const isMobile = useIsMobile();

  if (templates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum template recorrente encontrado
      </div>
    );
  }

  // Mobile: Card layout
  if (isMobile) {
    return (
      <div className="space-y-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="p-3 border rounded-lg space-y-2 bg-secondary/20"
          >
            {/* Row 1: Icon + Description + Actions */}
            <div className="flex items-start gap-3">
              <Repeat className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="flex-1 text-sm font-medium text-primary">
                {template.descricao}
              </p>
              {podeGerenciar && (
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEditar(template)}
                  >
                    <Edit className="h-4 w-4 text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onDeletar(template.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>

            {/* Row 2: Avatar + Name + Time */}
            <div className="flex items-center justify-between pl-7">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={template.responsavel?.foto_perfil_url} />
                  <AvatarFallback className="text-[10px]">
                    {template.responsavel?.nome?.substring(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {template.responsavel?.nome}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {template.hora_criacao || '00:00'}
              </span>
            </div>

            {/* Row 3: Badges */}
            <div className="flex items-center gap-2 pl-7">
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                Template
              </Badge>
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                <Repeat className="h-2.5 w-2.5 mr-0.5" />
                Recorrente
              </Badge>
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
            <TableHead className="w-[100px] h-8">Horário</TableHead>
            <TableHead className="w-[90px] h-8">Tipo</TableHead>
            {podeGerenciar && <TableHead className="w-20 h-8"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id} className="h-10 bg-secondary/20">
              <TableCell className="py-1">
                <Repeat className="h-4 w-4 text-muted-foreground" />
              </TableCell>
              <TableCell className="py-1 text-sm font-medium text-primary">
                {template.descricao}
              </TableCell>
              <TableCell className="py-1">
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={template.responsavel?.foto_perfil_url} />
                    <AvatarFallback className="text-[10px]">
                      {template.responsavel?.nome?.substring(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate">{template.responsavel?.nome}</span>
                </div>
              </TableCell>
              <TableCell className="py-1">
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={template.criador?.foto_perfil_url} />
                    <AvatarFallback className="text-[10px]">
                      {template.criador?.nome?.substring(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate">{template.criador?.nome}</span>
                </div>
              </TableCell>
              <TableCell className="py-1">
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                  Template
                </Badge>
              </TableCell>
              <TableCell className="py-1 text-xs text-muted-foreground">
                {template.hora_criacao || '00:00'}
              </TableCell>
              <TableCell className="py-1">
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                  <Repeat className="h-2.5 w-2.5 mr-0.5" />
                  Recorrente
                </Badge>
              </TableCell>
              {podeGerenciar && (
                <TableCell className="py-1">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onEditar(template)}
                    >
                      <Edit className="h-3 w-3 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onDeletar(template.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}