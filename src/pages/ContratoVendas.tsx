import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useContratosTemplates } from "@/hooks/useContratosTemplates";
import { TemplateForm } from "@/components/contratos/TemplateForm";
import { GerarContratoModal } from "@/components/contratos/GerarContratoModal";
import { UploadContratoModal } from "@/components/contratos/UploadContratoModal";
import { 
  Plus, 
  FileText, 
  Edit, 
  Power, 
  PowerOff, 
  FileDown,
  Upload,
  Loader2
} from "lucide-react";
import { ContratoTemplate } from "@/types/contrato";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ContratoVendas() {
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showGerarContrato, setShowGerarContrato] = useState(false);
  const [showUploadContrato, setShowUploadContrato] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContratoTemplate | undefined>();

  const {
    templates,
    isLoading,
    createTemplate,
    isCreating,
    updateTemplate,
    isUpdating,
    toggleTemplate
  } = useContratosTemplates();

  const templatesAtivos = templates?.filter(t => t.ativo).length || 0;
  const templatesInativos = templates?.filter(t => !t.ativo).length || 0;

  const handleSubmitTemplate = (data: Partial<ContratoTemplate>) => {
    if (editingTemplate) {
      updateTemplate({ ...data, id: editingTemplate.id }, {
        onSuccess: () => {
          setShowTemplateForm(false);
          setEditingTemplate(undefined);
        }
      });
    } else {
      createTemplate(data, {
        onSuccess: () => {
          setShowTemplateForm(false);
        }
      });
    }
  };

  const handleEdit = (template: ContratoTemplate) => {
    setEditingTemplate(template);
    setShowTemplateForm(true);
  };

  const handleCloseForm = () => {
    setShowTemplateForm(false);
    setEditingTemplate(undefined);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contratos de Vendas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie templates e contratos de vendas
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowUploadContrato(true)} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Adicionar Contrato
          </Button>
          <Button onClick={() => setShowGerarContrato(true)}>
            <FileDown className="h-4 w-4 mr-2" />
            Gerar Contrato
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Templates Ativos</p>
              <p className="text-2xl font-bold">{templatesAtivos}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Templates Inativos</p>
              <p className="text-2xl font-bold">{templatesInativos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Templates</p>
              <p className="text-2xl font-bold">{templates?.length || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de Templates */}
      <Card>
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Templates de Contratos</h2>
          <Button onClick={() => setShowTemplateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : templates && templates.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.nome}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {template.descricao || 'Sem descrição'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.ativo ? 'default' : 'secondary'}>
                      {template.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(template)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleTemplate({ id: template.id, ativo: !template.ativo })}
                        title={template.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {template.ativo ? (
                          <PowerOff className="h-4 w-4 text-orange-500" />
                        ) : (
                          <Power className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhum template cadastrado
            </p>
            <Button onClick={() => setShowTemplateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Template
            </Button>
          </div>
        )}
      </Card>

      {/* Modals */}
      <TemplateForm
        open={showTemplateForm}
        onOpenChange={handleCloseForm}
        onSubmit={handleSubmitTemplate}
        template={editingTemplate}
        isLoading={isCreating || isUpdating}
      />

      <GerarContratoModal
        open={showGerarContrato}
        onOpenChange={setShowGerarContrato}
      />

      <UploadContratoModal
        open={showUploadContrato}
        onOpenChange={setShowUploadContrato}
      />
    </div>
  );
}
