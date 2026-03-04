import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Download, X, FileText, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UploadProgress {
  total: number;
  processed: number;
  successful: number;
  errors: string[];
}

interface ItemUpload {
  descricao: string;
  largura: number;
  altura: number;
  valor_porta: number;
  valor_instalacao: number;
  valor_pintura: number;
  lucro: number;
}

interface BulkUploadTabelaPrecosProps {
  onUploadComplete?: () => void;
}

export function BulkUploadTabelaPrecos({ onUploadComplete }: BulkUploadTabelaPrecosProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    errors: []
  });

  const generateCSVTemplate = () => {
    const headers = ['descricao', 'largura', 'altura', 'valor_porta', 'valor_instalacao', 'valor_pintura', 'lucro'];
    const exampleRow = ['Porta 2.00 x 2.10', '2.00', '2.10', '1500.00', '300.00', '200.00', '500.00'];
    return `${headers.join(',')}\n${exampleRow.join(',')}`;
  };

  const downloadTemplate = () => {
    const csv = generateCSVTemplate();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_tabela_precos.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exampleData = {
    csv: `descricao,largura,altura,valor_porta,valor_instalacao,valor_pintura,lucro
Porta 2.00 x 2.10,2.00,2.10,1500.00,300.00,200.00,500.00
Porta 2.50 x 2.10,2.50,2.10,1800.00,350.00,250.00,600.00
Porta 3.00 x 2.10,3.00,2.10,2100.00,400.00,300.00,700.00`,
    json: `[
  {
    "descricao": "Porta 2.00 x 2.10",
    "largura": 2.00,
    "altura": 2.10,
    "valor_porta": 1500.00,
    "valor_instalacao": 300.00,
    "valor_pintura": 200.00,
    "lucro": 500.00
  },
  {
    "descricao": "Porta 2.50 x 2.10",
    "largura": 2.50,
    "altura": 2.10,
    "valor_porta": 1800.00,
    "valor_instalacao": 350.00,
    "valor_pintura": 250.00,
    "lucro": 600.00
  }
]`
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'csv' && fileExtension !== 'json') {
        toast.error('Por favor, selecione um arquivo CSV ou JSON');
        return;
      }
      setFile(selectedFile);
      setProgress({ total: 0, processed: 0, successful: 0, errors: [] });
    }
  };

  const parseCSV = (text: string): ItemUpload[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const item: any = {};
      
      headers.forEach((header, i) => {
        const value = values[i];
        if (['largura', 'altura', 'valor_porta', 'valor_instalacao', 'valor_pintura', 'lucro'].includes(header)) {
          item[header] = parseFloat(value.replace(',', '.'));
        } else {
          item[header] = value;
        }
      });
      
      return item as ItemUpload;
    });
  };

  const validateItem = (item: ItemUpload, index: number): string | null => {
    if (!item.descricao || item.descricao.trim() === '') {
      return `Linha ${index + 2}: Descrição é obrigatória`;
    }
    if (!item.largura || item.largura <= 0) {
      return `Linha ${index + 2}: Largura inválida`;
    }
    if (!item.altura || item.altura <= 0) {
      return `Linha ${index + 2}: Altura inválida`;
    }
    if (!item.valor_porta || item.valor_porta < 0) {
      return `Linha ${index + 2}: Valor da porta inválido`;
    }
    if (!item.valor_instalacao || item.valor_instalacao < 0) {
      return `Linha ${index + 2}: Valor de instalação inválido`;
    }
    if (!item.valor_pintura || item.valor_pintura < 0) {
      return `Linha ${index + 2}: Valor de pintura inválido`;
    }
    return null;
  };

  const processUpload = async () => {
    if (!file) return;

    setUploading(true);
    const newProgress: UploadProgress = {
      total: 0,
      processed: 0,
      successful: 0,
      errors: []
    };

    try {
      const text = await file.text();
      let items: ItemUpload[];

      if (file.name.endsWith('.json')) {
        items = JSON.parse(text);
      } else {
        items = parseCSV(text);
      }

      newProgress.total = items.length;
      setProgress({ ...newProgress });

      const { data: { user } } = await supabase.auth.getUser();

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const validationError = validateItem(item, i);

        if (validationError) {
          newProgress.errors.push(validationError);
          newProgress.processed++;
          setProgress({ ...newProgress });
          continue;
        }

        try {
          const { error } = await supabase
            .from('tabela_precos_portas')
            .insert([{
              descricao: item.descricao,
              largura: item.largura,
              altura: item.altura,
              valor_porta: item.valor_porta,
              valor_instalacao: item.valor_instalacao,
              valor_pintura: item.valor_pintura,
              lucro: item.lucro || 0,
              created_by: user?.id
            }]);

          if (error) throw error;

          newProgress.successful++;
        } catch (error: any) {
          console.error(`Erro ao processar linha ${i + 2}:`, error);
          newProgress.errors.push(`Linha ${i + 2}: ${error.message}`);
        }

        newProgress.processed++;
        setProgress({ ...newProgress });
      }

      if (newProgress.successful > 0) {
        toast.success(`${newProgress.successful} itens importados com sucesso!`);
        if (onUploadComplete) {
          onUploadComplete();
        }
      }

      if (newProgress.errors.length > 0) {
        toast.error(`${newProgress.errors.length} erros durante a importação`);
      }
    } catch (error: any) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao processar arquivo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setProgress({ total: 0, processed: 0, successful: 0, errors: [] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload em Massa
        </CardTitle>
        <CardDescription>
          Importe múltiplos itens usando arquivos CSV ou JSON
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Download Template */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">1. Baixe o modelo</h4>
          <Button onClick={downloadTemplate} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Baixar Template CSV
          </Button>
        </div>

        {/* Example Formats */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">2. Formatos aceitos</h4>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Exemplo CSV:</p>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                {exampleData.csv}
              </pre>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Exemplo JSON:</p>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                {exampleData.json}
              </pre>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Importante:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Todos os campos são obrigatórios</li>
              <li>Use ponto (.) como separador decimal</li>
              <li>Largura e altura devem ser em metros</li>
              <li>Valores devem ser em reais (R$)</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* File Selection */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">3. Selecione o arquivo</h4>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".csv,.json"
              onChange={handleFileSelect}
              disabled={uploading}
              className="flex-1"
            />
            {file && !uploading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={resetUpload}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Selected File */}
        {file && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <FileText className="h-4 w-4" />
            <span className="text-sm flex-1">{file.name}</span>
            <span className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(2)} KB
            </span>
          </div>
        )}

        {/* Upload Button */}
        {file && !uploading && progress.processed === 0 && (
          <Button onClick={processUpload} className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            Iniciar Importação
          </Button>
        )}

        {/* Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processando...</span>
              <span>{progress.processed} / {progress.total}</span>
            </div>
            <Progress value={(progress.processed / progress.total) * 100} />
          </div>
        )}

        {/* Results */}
        {progress.processed > 0 && !uploading && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-green-50 dark:bg-green-950 rounded-md">
                <span className="font-medium text-green-700 dark:text-green-300">
                  Sucesso: {progress.successful}
                </span>
              </div>
              <div className="p-2 bg-red-50 dark:bg-red-950 rounded-md">
                <span className="font-medium text-red-700 dark:text-red-300">
                  Erros: {progress.errors.length}
                </span>
              </div>
            </div>

            {progress.errors.length > 0 && (
              <div className="space-y-1">
                <h5 className="text-sm font-medium">Erros encontrados:</h5>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {progress.errors.map((error, index) => (
                    <p key={index} className="text-xs text-red-600 dark:text-red-400">
                      • {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={resetUpload} variant="outline" className="w-full">
              Novo Upload
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
