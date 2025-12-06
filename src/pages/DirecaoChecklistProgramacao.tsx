import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTarefas } from "@/hooks/useTarefas";
import { NovaRecorrenteModal } from "@/components/todo/NovaRecorrenteModal";
import { EditarRecorrenteModal } from "@/components/todo/EditarRecorrenteModal";
import { TemplatesTabela } from "@/components/todo/TemplatesTabela";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, CalendarDays } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function DirecaoChecklistProgramacao() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  
  const { 
    templates,
    isLoading,
    criarTemplate,
    deletarTemplate,
    atualizarTemplate
  } = useTarefas();
  
  const [modalRecorrenteAberto, setModalRecorrenteAberto] = useState(false);
  const [templateParaEditar, setTemplateParaEditar] = useState<any>(null);
  const [templateParaDeletar, setTemplateParaDeletar] = useState<string | null>(null);

  const podeGerenciar = userRole?.role === 'diretor' || userRole?.role === 'administrador';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/dashboard/direcao/checklist')}
          className="w-fit -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold truncate flex items-center gap-2">
              <CalendarDays className="h-6 w-6 md:h-8 md:w-8" />
              Programação de Tarefas
            </h1>
            <p className="text-sm text-muted-foreground mt-1 hidden md:block">
              Gerencie templates de tarefas recorrentes
            </p>
          </div>

          {podeGerenciar && (
            <Button onClick={() => setModalRecorrenteAberto(true)} className="hidden md:flex">
              <Plus className="h-4 w-4 mr-2" />
              Nova Recorrente
            </Button>
          )}
        </div>
      </div>

      {/* Badge de resumo */}
      <div className="flex gap-2">
        <Badge variant="secondary" className="text-xs md:text-sm px-2 md:px-3 py-1">
          {templates.length} template(s) configurados
        </Badge>
      </div>

      {/* Tabela de Templates */}
      <Card>
        <CardHeader className="pb-3 px-4 md:px-6">
          <CardTitle className="text-base md:text-lg">Templates Recorrentes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-4 md:px-6">
          <TemplatesTabela
            templates={templates}
            podeGerenciar={podeGerenciar}
            onEditar={setTemplateParaEditar}
            onDeletar={(id) => setTemplateParaDeletar(id)}
          />
        </CardContent>
      </Card>

      {/* FAB Mobile */}
      {podeGerenciar && (
        <Button
          onClick={() => setModalRecorrenteAberto(true)}
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg md:hidden z-50"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Modal Nova Recorrente */}
      <NovaRecorrenteModal
        open={modalRecorrenteAberto}
        onOpenChange={setModalRecorrenteAberto}
        onSubmit={(template) => {
          criarTemplate.mutate(template);
        }}
        isLoading={criarTemplate.isPending}
      />

      {/* Modal Editar Recorrente */}
      {templateParaEditar && (
        <EditarRecorrenteModal
          open={!!templateParaEditar}
          onOpenChange={(open) => !open && setTemplateParaEditar(null)}
          template={templateParaEditar}
          onSubmit={(id, updates) => {
            atualizarTemplate.mutate({ id, ...updates });
            setTemplateParaEditar(null);
          }}
        />
      )}

      {/* Confirmação de Deleção */}
      <AlertDialog open={!!templateParaDeletar} onOpenChange={() => setTemplateParaDeletar(null)}>
        <AlertDialogContent className="max-w-[90vw] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este template? Todas as tarefas futuras associadas também serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (templateParaDeletar) {
                  deletarTemplate.mutate(templateParaDeletar);
                  setTemplateParaDeletar(null);
                }
              }}
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
