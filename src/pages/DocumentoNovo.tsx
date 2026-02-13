import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateDocumento, useUploadFile } from '@/hooks/useDocumentos';
import { useToast } from '@/hooks/use-toast';

const CATEGORY_LABELS = {
  manual: 'Manual',
  procedimento: 'Procedimento',
  formulario: 'Formulário',
  contrato: 'Contrato',
  politica: 'Política',
  outros: 'Outros',
};

export default function DocumentoNovo() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    categoria: 'outros' as keyof typeof CATEGORY_LABELS,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const createDocumento = useCreateDocumento();
  const uploadFile = useUploadFile();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Erro",
          description: "Apenas arquivos PDF são permitidos",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        toast({
          title: "Erro",
          description: "Arquivo muito grande. Limite de 20MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo PDF",
        variant: "destructive",
      });
      return;
    }

    if (!formData.titulo.trim()) {
      toast({
        title: "Erro",
        description: "Título é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload do arquivo
      const uploadResult = await uploadFile.mutateAsync(selectedFile);
      
      // Criar documento no banco
      await createDocumento.mutateAsync({
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || undefined,
        arquivo_url: uploadResult.url,
        nome_arquivo: uploadResult.fileName,
        tamanho_arquivo: uploadResult.size,
        categoria: formData.categoria,
        ativo: true,
      });

      navigate('/administrativo/documentos');
    } catch (error) {
      console.error('Erro ao criar documento:', error);
    }
  };

  const isLoading = uploadFile.isPending || createDocumento.isPending;

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate('/administrativo/documentos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Novo Documento</h1>
          <p className="text-muted-foreground">Adicione um novo documento PDF</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Documento</CardTitle>
            <CardDescription>
              Preencha as informações e faça upload do arquivo PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Digite o título do documento"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o conteúdo do documento (opcional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value as keyof typeof CATEGORY_LABELS })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="arquivo">Arquivo PDF *</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <div className="space-y-2">
                    <Label htmlFor="arquivo" className="cursor-pointer">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        <Upload className="h-4 w-4" />
                        {selectedFile ? 'Trocar arquivo' : 'Escolher arquivo PDF'}
                      </div>
                    </Label>
                    <Input
                      id="arquivo"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <p className="text-sm text-muted-foreground">
                      Máximo 20MB • Apenas arquivos PDF
                    </p>
                  </div>
                </div>
                
                {selectedFile && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/administrativo/documentos')}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Documento'}
          </Button>
        </div>
      </form>
    </div>
  );
}