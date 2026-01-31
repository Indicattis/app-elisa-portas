import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { CidadeCollapsible, OrfaosCollapsible } from './CidadeCollapsible';
import type { Estado, Cidade, AutorizadoResumo } from '@/hooks/useEstadosCidades';

interface EstadoDetalheViewProps {
  estado: Estado;
  cidades: Cidade[];
  autorizadosOrfaos: AutorizadoResumo[];
  loading: boolean;
  onVoltar: () => void;
  onNovaCidade: () => void;
  onEditEstado: () => void;
  onDeleteEstado: () => void;
  onEditCidade: (cidade: Cidade) => void;
  onDeleteCidade: (id: string) => void;
  onEditAutorizado: (id: string) => void;
  onDeleteAutorizado: (id: string) => void;
  onTogglePremium: (id: string, isPremium: boolean) => void;
}

export function EstadoDetalheView({
  estado,
  cidades,
  autorizadosOrfaos,
  loading,
  onVoltar,
  onNovaCidade,
  onEditEstado,
  onDeleteEstado,
  onEditCidade,
  onDeleteCidade,
  onEditAutorizado,
  onDeleteAutorizado,
  onTogglePremium
}: EstadoDetalheViewProps) {
  return (
    <div className="space-y-4">
      {/* Header do Estado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onVoltar}
            className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">{estado.nome}</h2>
            <p className="text-sm text-white/60">{estado.sigla}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onNovaCidade}
            className="bg-primary/10 border-primary/20 hover:bg-primary/20"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Cidade
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEditEstado}
            className="hover:bg-primary/10"
          >
            <Pencil className="h-4 w-4 text-white/60" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir estado?</AlertDialogTitle>
                <AlertDialogDescription>
                  O estado "{estado.nome}" e todas as suas cidades cadastradas serão excluídos. Os autorizados não serão afetados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDeleteEstado}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Lista de Cidades */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {cidades.length === 0 && autorizadosOrfaos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60 mb-4">Nenhuma cidade cadastrada para este estado</p>
              <Button onClick={onNovaCidade} variant="outline" className="bg-primary/10 border-primary/20">
                <Plus className="h-4 w-4 mr-1" />
                Cadastrar Cidade
              </Button>
            </div>
          ) : (
            <>
              {cidades.map(cidade => (
                <CidadeCollapsible
                  key={cidade.id}
                  cidade={cidade}
                  onEditAutorizado={onEditAutorizado}
                  onDeleteAutorizado={onDeleteAutorizado}
                  onTogglePremium={onTogglePremium}
                  onEditCidade={onEditCidade}
                  onDeleteCidade={onDeleteCidade}
                />
              ))}
              
              {/* Órfãos */}
              <OrfaosCollapsible
                autorizados={autorizadosOrfaos}
                onEditAutorizado={onEditAutorizado}
                onDeleteAutorizado={onDeleteAutorizado}
                onTogglePremium={onTogglePremium}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
