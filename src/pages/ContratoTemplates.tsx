import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Power, ArrowLeft } from "lucide-react";
import { useContratosTemplates } from "@/hooks/useContratosTemplates";
import { ContratoTemplate } from "@/types/contrato";
import { TemplateForm } from "@/components/contratos/TemplateForm";
import { GerarContratoModal } from "@/components/contratos/GerarContratoModal";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";

export default function ContratoTemplates() {
  const navigate = useNavigate();
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showGerarContrato, setShowGerarContrato] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContratoTemplate | undefined>();

  const {
    templates,
    isLoading,
    createTemplate,
    isCreating,
    updateTemplate,
    isUpdating,
    toggleTemplate,
    deleteTemplate,
    isDeleting
  } = useContratosTemplates();

  const handleSubmitTemplate = async (data: Partial<ContratoTemplate>) => {
    if (editingTemplate) {
      await updateTemplate({ id: editingTemplate.id, ...data });
    } else {
      await createTemplate(data);
    }
    handleCloseForm();
  };

  const handleEdit = (template: ContratoTemplate) => {
    setEditingTemplate(template);
    setShowTemplateForm(true);
  };

  const handleCloseForm = () => {
    setShowTemplateForm(false);
    setEditingTemplate(undefined);
  };

  const handleGerarContrato = () => {
    setShowGerarContrato(true);
  };

  const templatesAtivos = templates?.filter(t => t.ativo) || [];
  const templatesInativos = templates?.filter(t => !t.ativo) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/vendas/contratos')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Templates de Contratos</h1>
            <p className="text-muted-foreground">Gerencie os modelos de contratos</p>
          </div>
        </div>
        <Button onClick={() => setShowTemplateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Templates Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templatesAtivos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Templates Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templatesInativos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Templates Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {!templates || templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum template cadastrado
            </div>
          ) : (
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
                      {template.descricao || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.ativo ? "default" : "secondary"}>
                        {template.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleTemplate({ id: template.id, ativo: !template.ativo })}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGerarContrato()}
                        >
                          Gerar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
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
    </div>
  );
}
