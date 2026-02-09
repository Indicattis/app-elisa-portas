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
