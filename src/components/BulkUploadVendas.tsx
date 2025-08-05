import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCanaisAquisicao } from "@/hooks/useCanaisAquisicao";

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
  canal_aquisicao?: string; // Para compatibilidade com uploads antigos
  canal_aquisicao_id?: string; // Novo campo padronizado
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
  const { canais } = useCanaisAquisicao();

  // Fetch real system data
  const [atendentes, setAtendentes] = useState<Array<{ user_id: string; nome: string }>>([]);

  useEffect(() => {
    const fetchAtendentes = async () => {
      const { data } = await supabase
        .from('admin_users')
        .select('user_id, nome')
        .eq('ativo', true)
        .order('nome');
      
      if (data) setAtendentes(data);
    };
    
    fetchAtendentes();
  }, []);

  const generateCSVTemplate = () => {
    const headers = 'data_venda,atendente_id,publico_alvo,canal_aquisicao_id,estado,cidade,cep,cliente_nome,cliente_telefone,cliente_email,valor_produto,custo_produto,valor_pintura,custo_pintura,valor_instalacao,valor_frete,valor_venda,resgate';
    
    const exampleRow = canais.length > 0 && atendentes.length > 0 
      ? `2024-01-15T10:00:00Z,${atendentes[0].user_id},Residencial,${canais[0].id},RS,Porto Alegre,90000-000,João Silva,51999999999,joao@email.com,5000.00,3000.00,800.00,400.00,500.00,200.00,6500.00,false`
      : `2024-01-15T10:00:00Z,SEU_ATENDENTE_ID,Residencial,SEU_CANAL_ID,RS,Porto Alegre,90000-000,João Silva,51999999999,joao@email.com,5000.00,3000.00,800.00,400.00,500.00,200.00,6500.00,false`;
    
    return `${headers}\n${exampleRow}`;
  };

  const downloadTemplate = () => {
    const csvContent = generateCSVTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'template-vendas.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Template baixado",
      description: "Use este arquivo como base para seu upload",
    });
  };

  const exampleData = {
    csv: generateCSVTemplate(),
    
    json: JSON.stringify([
      {
        data_venda: "2024-01-15T10:00:00Z",
        atendente_id: atendentes[0]?.user_id || "SEU_ATENDENTE_ID",
        publico_alvo: "Residencial",
        canal_aquisicao_id: canais[0]?.id || "SEU_CANAL_ID",
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
        atendente_id: atendentes[1]?.user_id || "OUTRO_ATENDENTE_ID",
        publico_alvo: "Comercial",
        canal_aquisicao_id: canais[1]?.id || "OUTRO_CANAL_ID",
        estado: "SC",
        cidade: "Florianópolis",
        bairro: "Centro",
        cep: "88000-000",
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
    if (!venda.canal_aquisicao_id && !venda.canal_aquisicao) errors.push('canal_aquisicao_id ou canal_aquisicao é obrigatório');
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
            
            // Buscar canal se venda.canal_aquisicao foi fornecido em vez de canal_aquisicao_id
            if (venda.canal_aquisicao && !venda.canal_aquisicao_id) {
              const canal = canais.find(c => c.nome === venda.canal_aquisicao);
              if (canal) {
                vendaData.canal_aquisicao_id = canal.id;
              }
              delete vendaData.canal_aquisicao;
            }
            
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
        {/* Template Download */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Template para Download</h4>
            <Button onClick={downloadTemplate} variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Baixar Template CSV
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Baixe um arquivo CSV com os cabeçalhos corretos e uma linha de exemplo para facilitar o upload.
          </p>
        </div>

        {/* Dados do Sistema */}
        <div className="space-y-4">
          <h4 className="font-medium">Dados do Sistema:</h4>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h5 className="text-sm font-medium mb-2">Atendentes Disponíveis:</h5>
              <div className="max-h-32 overflow-y-auto bg-muted p-3 rounded-md">
                {atendentes.length > 0 ? (
                  <div className="space-y-1">
                    {atendentes.map((atendente) => (
                      <div key={atendente.user_id} className="text-xs">
                        <strong>{atendente.nome}:</strong> {atendente.user_id}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Carregando atendentes...</div>
                )}
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium mb-2">Canais de Aquisição:</h5>
              <div className="max-h-32 overflow-y-auto bg-muted p-3 rounded-md">
                {canais.length > 0 ? (
                  <div className="space-y-1">
                    {canais.map((canal) => (
                      <div key={canal.id} className="text-xs">
                        <strong>{canal.nome}:</strong> {canal.id}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Carregando canais...</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Exemplo de formato */}
        <div className="space-y-4">
          <h4 className="font-medium">Exemplos de Formato:</h4>
          
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
          
          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
            <h5 className="font-medium text-blue-800">Instruções importantes:</h5>
            <div className="text-sm text-blue-700 space-y-2">
              <div>
                <strong>Campos obrigatórios:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>data_venda (formato: YYYY-MM-DDTHH:mm:ssZ)</li>
                  <li>atendente_id (usar IDs da tabela acima)</li>
                  <li>canal_aquisicao_id (usar IDs da tabela acima)</li>
                  <li>valor_produto, custo_produto, valor_venda (números positivos)</li>
                </ul>
              </div>
              <div>
                <strong>Campos opcionais:</strong> publico_alvo, estado, cidade, bairro, cep, cliente_nome, cliente_telefone, cliente_email, valor_pintura, custo_pintura, valor_instalacao, valor_frete, resgate
              </div>
              <div>
                <strong>Valores monetários:</strong> Use ponto (.) como separador decimal (ex: 1234.56)
              </div>
              <div>
                <strong>Campo resgate:</strong> Use true/false (sem aspas no CSV)
              </div>
              <div>
                <strong>Nota:</strong> O campo lucro_total é calculado automaticamente e não deve ser incluído
              </div>
            </div>
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