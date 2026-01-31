import { useState } from 'react';
import { Building2, ChevronDown, Edit, Star, Trash2, Pencil } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { Cidade, AutorizadoResumo } from '@/hooks/useEstadosCidades';

interface CidadeCollapsibleProps {
  cidade: Cidade;
  onEditAutorizado: (id: string) => void;
  onDeleteAutorizado: (id: string) => void;
  onTogglePremium: (id: string, isPremium: boolean) => void;
  onEditCidade?: (cidade: Cidade) => void;
  onDeleteCidade?: (id: string) => void;
}

export function CidadeCollapsible({
  cidade,
  onEditAutorizado,
  onDeleteAutorizado,
  onTogglePremium,
  onEditCidade,
  onDeleteCidade
}: CidadeCollapsibleProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full">
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-white/60" />
            <span className="font-medium text-white">{cidade.nome}</span>
            <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
              {cidade.autorizados.length} autorizados
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {onEditCidade && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCidade(cidade);
                }}
              >
                <Pencil className="h-3.5 w-3.5 text-white/60" />
              </Button>
            )}
            {onDeleteCidade && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir cidade?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Os autorizados não serão excluídos, apenas ficarão sem cidade cadastrada.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDeleteCidade(cidade.id)}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <ChevronDown className={cn("h-4 w-4 text-white/60 transition-transform", open && "rotate-180")} />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {cidade.autorizados.length === 0 ? (
          <div className="p-4 text-center text-white/50 text-sm">
            Nenhum autorizado nesta cidade
          </div>
        ) : (
          <div className="mt-2 rounded-lg overflow-hidden border border-primary/10">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="border-primary/10 hover:bg-transparent">
                  <TableHead className="text-xs text-white/70">Autorizado</TableHead>
                  <TableHead className="text-xs text-white/70">Etapa</TableHead>
                  <TableHead className="text-right text-xs text-white/70">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cidade.autorizados.map(aut => (
                  <AutorizadoRow
                    key={aut.id}
                    autorizado={aut}
                    onEdit={onEditAutorizado}
                    onDelete={onDeleteAutorizado}
                    onTogglePremium={onTogglePremium}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface AutorizadoRowProps {
  autorizado: AutorizadoResumo;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePremium: (id: string, isPremium: boolean) => void;
}

function AutorizadoRow({ autorizado, onEdit, onDelete, onTogglePremium }: AutorizadoRowProps) {
  const isPremium = autorizado.etapa === 'premium';
  
  return (
    <TableRow className="border-primary/10 hover:bg-primary/5">
      <TableCell className="font-medium text-white">
        {autorizado.nome}
        {isPremium && (
          <Star className="inline h-3.5 w-3.5 ml-1 text-yellow-500 fill-yellow-500" />
        )}
      </TableCell>
      <TableCell>
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs",
            isPremium 
              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
          )}
        >
          {autorizado.etapa || 'ativo'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-7 w-7 hover:bg-primary/10"
            onClick={() => onEdit(autorizado.id)}
          >
            <Edit className="h-3.5 w-3.5 text-white/60" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-7 w-7 hover:bg-primary/10"
            onClick={() => onTogglePremium(autorizado.id, isPremium)}
          >
            <Star className={cn(
              "h-3.5 w-3.5",
              isPremium ? "fill-yellow-500 text-yellow-500" : "text-white/60"
            )} />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir autorizado?</AlertDialogTitle>
                <AlertDialogDescription>
                  O autorizado "{autorizado.nome}" será desativado.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(autorizado.id)}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

// Componente para lista de órfãos
interface OrfaosCollapsibleProps {
  autorizados: AutorizadoResumo[];
  onEditAutorizado: (id: string) => void;
  onDeleteAutorizado: (id: string) => void;
  onTogglePremium: (id: string, isPremium: boolean) => void;
}

export function OrfaosCollapsible({
  autorizados,
  onEditAutorizado,
  onDeleteAutorizado,
  onTogglePremium
}: OrfaosCollapsibleProps) {
  const [open, setOpen] = useState(false);

  if (autorizados.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full">
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors border border-amber-500/20">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-400" />
            <span className="font-medium text-amber-300">Sem cidade cadastrada</span>
            <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-400">
              {autorizados.length} autorizados
            </Badge>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-amber-400 transition-transform", open && "rotate-180")} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 rounded-lg overflow-hidden border border-amber-500/20">
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="border-amber-500/20 hover:bg-transparent">
                <TableHead className="text-xs text-white/70">Autorizado</TableHead>
                <TableHead className="text-xs text-white/70">Cidade (texto)</TableHead>
                <TableHead className="text-xs text-white/70">Etapa</TableHead>
                <TableHead className="text-right text-xs text-white/70">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {autorizados.map(aut => (
                <TableRow key={aut.id} className="border-amber-500/20 hover:bg-amber-500/5">
                  <TableCell className="font-medium text-white">
                    {aut.nome}
                    {aut.etapa === 'premium' && (
                      <Star className="inline h-3.5 w-3.5 ml-1 text-yellow-500 fill-yellow-500" />
                    )}
                  </TableCell>
                  <TableCell className="text-white/60">
                    {aut.cidade || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        aut.etapa === 'premium' 
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      )}
                    >
                      {aut.etapa || 'ativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-7 w-7 hover:bg-primary/10"
                        onClick={() => onEditAutorizado(aut.id)}
                      >
                        <Edit className="h-3.5 w-3.5 text-white/60" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-7 w-7 hover:bg-primary/10"
                        onClick={() => onTogglePremium(aut.id, aut.etapa === 'premium')}
                      >
                        <Star className={cn(
                          "h-3.5 w-3.5",
                          aut.etapa === 'premium' ? "fill-yellow-500 text-yellow-500" : "text-white/60"
                        )} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir autorizado?</AlertDialogTitle>
                            <AlertDialogDescription>
                              O autorizado "{aut.nome}" será desativado.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteAutorizado(aut.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
