import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface UploadProgress {
  total: number;
  processed: number;
  success: number;
  errors: Array<{ line: number; error: string; data: any }>;
}

interface VendaUpload {
  data_venda: string;
  atendente_id: string;
  publico_alvo?: string;
  canal_aquisicao: string;
  estado?: string;
  cidade?: string;
  cep?: string;
  cliente_nome?: string;
  cliente_telefone?: string;
  cliente_email?: string;
  valor_produto: number;
  custo_produto: number;
  valor_pintura: number;
  custo_pintura: number;
  valor_instalacao: number;
  valor_frete: number;
  valor_venda: number;
  lucro_total?: number; // Calculado automaticamente pelo banco
  resgate?: boolean;
}

export default function BulkUploadVendas({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const exampleData = {
    csv: `data_venda,atendente_id,publico_alvo,canal_aquisicao,estado,cidade,cep,cliente_nome,cliente_telefone,cliente_email,valor_produto,custo_produto,valor_pintura,custo_pintura,valor_instalacao,valor_frete,valor_venda,resgate
2024-01-15T10:00:00Z,550e8400-e29b-41d4-a716-446655440000,Residencial,Google,RS,Porto Alegre,90000-000,João Silva,51999999999,joao@email.com,5000.00,3000.00,800.00,400.00,500.00,200.00,6500.00,false
2024-01-16T14:30:00Z,550e8400-e29b-41d4-a716-446655440001,Comercial,Facebook,SC,Florianópolis,88000-000,Maria Santos,48888888888,maria@empresa.com,8000.00,5000.00,1200.00,600.00,800.00,300.00,10300.00,true`,
    
    json: JSON.stringify([
      {
        data_venda: "2024-01-15T10:00:00Z",
        atendente_id: "550e8400-e29b-41d4-a716-446655440000",
        publico_alvo: "Residencial",
        canal_aquisicao: "Google",
        estado: "RS",
        cidade: "Porto Alegre",
        cep: "90000-000",
        cliente_nome: "João Silva",
        cliente_telefone: "51999999999",
        cliente_email: "joao@email.com",
        valor_produto: 5000.00,
        custo_produto: 3000.00,
        valor_pintura: 800.00,
        custo_pintura: 400.00,
        valor_instalacao: 500.00,
        valor_frete: 200.00,
        valor_venda: 6500.00,
        resgate: false
      },
      {
        data_venda: "2024-01-16T14:30:00Z",
        atendente_id: "550e8400-e29b-41d4-a716-446655440001",
        publico_alvo: "Comercial",
        canal_aquisicao: "Facebook",
        estado: "SC",
        cidade: "Florianópolis",
        cep: "88000-000",
        cliente_nome: "Maria Santos",
        cliente_telefone: "48888888888",
        cliente_email: "maria@empresa.com",
        valor_produto: 8000.00,
        custo_produto: 5000.00,
        valor_pintura: 1200.00,
        custo_pintura: 600.00,
        valor_instalacao: 800.00,
        valor_frete: 300.00,
        valor_venda: 10300.00,
        resgate: true
      }
    ], null, 2)
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['text/csv', 'application/json', 'text/plain'];
      const isValidType = validTypes.includes(selectedFile.type) || 
                         selectedFile.name.endsWith('.csv') || 
                         selectedFile.name.endsWith('.json');
      
      if (!isValidType) {
        toast({
          variant: "destructive",
          title: "Arquivo inválido",
          description: "Apenas arquivos CSV e JSON são aceitos.",
        });
        return;
      }
      
      setFile(selectedFile);
      setProgress(null);
    }
  };

  const parseCSV = (text: string): VendaUpload[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('Arquivo CSV deve ter pelo menos 2 linhas (cabeçalho + dados)');
    
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map((line, index) => {
      const values = line.split(',');
      const obj: any = {};
      
      headers.forEach((header, i) => {
        const value = values[i]?.trim();
        if (value) {
          if (['valor_produto', 'custo_produto', 'valor_pintura', 'custo_pintura', 'valor_instalacao', 'valor_frete', 'valor_venda'].includes(header)) {
            obj[header] = parseFloat(value);
          } else if (header === 'resgate') {
            obj[header] = value.toLowerCase() === 'true';
          } else {
            obj[header] = value;
          }
        }
      });
      
      return obj;
    });
  };

  const validateVenda = (venda: any, index: number): string[] => {
    const errors: string[] = [];
    
    if (!venda.data_venda) errors.push('data_venda é obrigatório');
    if (!venda.atendente_id) errors.push('atendente_id é obrigatório');
    if (!venda.canal_aquisicao) errors.push('canal_aquisicao é obrigatório');
    if (typeof venda.valor_produto !== 'number' || venda.valor_produto < 0) errors.push('valor_produto deve ser um número positivo');
    if (typeof venda.custo_produto !== 'number' || venda.custo_produto < 0) errors.push('custo_produto deve ser um número positivo');
    if (typeof venda.valor_venda !== 'number' || venda.valor_venda < 0) errors.push('valor_venda deve ser um número positivo');
    
    return errors;
  };

  const processUpload = async () => {
    if (!file || !user) return;
    
    setUploading(true);
    setProgress({ total: 0, processed: 0, success: 0, errors: [] });
    
    try {
      const text = await file.text();
      let vendas: VendaUpload[];
      
      if (file.name.endsWith('.csv')) {
        vendas = parseCSV(text);
      } else {
        vendas = JSON.parse(text);
      }
      
      if (!Array.isArray(vendas)) {
        throw new Error('Dados devem ser um array de vendas');
      }
      
      setProgress(prev => prev ? { ...prev, total: vendas.length } : null);
      
      let successCount = 0;
      const errors: Array<{ line: number; error: string; data: any }> = [];
      
      for (let i = 0; i < vendas.length; i++) {
        const venda = vendas[i];
        const validationErrors = validateVenda(venda, i);
        
        if (validationErrors.length > 0) {
          errors.push({
            line: i + 1,
            error: validationErrors.join(', '),
            data: venda
          });
        } else {
          try {
            // Remove lucro_total dos dados antes de inserir
            const { lucro_total, ...vendaData } = venda;
            
            const { error } = await supabase
              .from('vendas')
              .insert({
                ...vendaData,
                data_venda: new Date(venda.data_venda).toISOString()
              });
            
            if (error) {
              errors.push({
                line: i + 1,
                error: error.message,
                data: venda
              });
            } else {
              successCount++;
            }
          } catch (err) {
            errors.push({
              line: i + 1,
              error: err instanceof Error ? err.message : 'Erro desconhecido',
              data: venda
            });
          }
        }
        
        setProgress(prev => prev ? {
          ...prev,
          processed: i + 1,
          success: successCount,
          errors
        } : null);
        
        // Pequeno delay para não sobrecarregar o banco
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      toast({
        title: "Upload concluído",
        description: `${successCount} vendas registradas com sucesso. ${errors.length} erros encontrados.`,
      });
      
      if (onUploadComplete) {
        onUploadComplete();
      }
      
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload de Vendas em Lote
        </CardTitle>
        <CardDescription>
          Importe múltiplas vendas através de arquivos CSV ou JSON
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Exemplo de formato */}
        <div className="space-y-4">
          <h4 className="font-medium">Formato dos dados:</h4>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h5 className="text-sm font-medium mb-2">Exemplo CSV:</h5>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                {exampleData.csv}
              </pre>
            </div>
            
            <div>
              <h5 className="text-sm font-medium mb-2">Exemplo JSON:</h5>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                {exampleData.json}
              </pre>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Campos obrigatórios:</strong> data_venda, atendente_id, canal_aquisicao, valor_produto, custo_produto, valor_venda</p>
            <p><strong>Formato de data:</strong> ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)</p>
            <p><strong>atendente_id:</strong> UUID do usuário atendente (consulte a tabela de usuários)</p>
            <p><strong>Nota:</strong> O campo lucro_total é calculado automaticamente pelo sistema e não deve ser incluído no arquivo</p>
          </div>
        </div>

        {/* Upload */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              disabled={uploading}
            >
              <FileText className="w-4 h-4 mr-2" />
              Selecionar Arquivo
            </Button>
            
            {file && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{file.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={resetUpload}
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          
          {file && !uploading && (
            <Button onClick={processUpload}>
              <Upload className="w-4 h-4 mr-2" />
              Processar Arquivo
            </Button>
          )}
        </div>

        {/* Progress */}
        {progress && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso: {progress.processed} / {progress.total}</span>
                <span className="text-green-600">{progress.success} sucessos</span>
              </div>
              <Progress value={(progress.processed / progress.total) * 100} />
            </div>
            
            <div className="flex gap-4">
              <Badge variant="default">
                <CheckCircle className="w-3 h-3 mr-1" />
                {progress.success} Sucessos
              </Badge>
              {progress.errors.length > 0 && (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {progress.errors.length} Erros
                </Badge>
              )}
            </div>
            
            {progress.errors.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-destructive">Erros encontrados:</h5>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {progress.errors.map((error, index) => (
                    <div key={index} className="text-xs bg-destructive/10 p-2 rounded">
                      <strong>Linha {error.line}:</strong> {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}