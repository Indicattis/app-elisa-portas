import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Database, Users, Building2, Trash2, BarChart3 } from "lucide-react";

export function StorageMigration() {
  const [migrating, setMigrating] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const runMigration = async (table: 'admin_users' | 'autorizados') => {
    try {
      setMigrating(table);
      setResults(null);

      const { data, error } = await supabase.functions.invoke('migrate-images-to-storage', {
        body: { table }
      });

      if (error) {
        throw error;
      }

      setResults(data);
      
      toast({
        title: "Migração concluída",
        description: `${data.results.successful} registros migrados com sucesso`,
      });
    } catch (error: any) {
      console.error('Migration error:', error);
      toast({
        variant: "destructive",
        title: "Erro na migração",
        description: error?.message || "Erro ao executar migração",
      });
    } finally {
      setMigrating(null);
    }
  };

  const runCleanup = async (action: 'vacuum_full' | 'analyze_storage') => {
    try {
      setMigrating(action);

      const { data, error } = await supabase.functions.invoke('cleanup-database', {
        body: { action }
      });

      if (error) {
        throw error;
      }

      if (action === 'analyze_storage') {
        setResults(data);
      }
      
      toast({
        title: "Operação concluída",
        description: action === 'vacuum_full' 
          ? "Espaço do banco de dados foi otimizado" 
          : "Análise de armazenamento concluída",
      });
    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast({
        variant: "destructive",
        title: "Erro na operação",
        description: error?.message || "Erro ao executar operação",
      });
    } finally {
      setMigrating(null);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Otimização de Armazenamento
        </CardTitle>
        <CardDescription>
          Migre imagens base64 para Supabase Storage e otimize o espaço do banco de dados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Esta ferramenta converte imagens base64 armazenadas no banco para arquivos no Supabase Storage,
            reduzindo significativamente o tamanho do banco de dados.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              <div>
                <h3 className="font-medium">Fotos de Perfil (admin_users)</h3>
                <p className="text-sm text-muted-foreground">Migrar avatares de usuários</p>
              </div>
            </div>
            <Button
              onClick={() => runMigration('admin_users')}
              disabled={migrating !== null}
            >
              {migrating === 'admin_users' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Migrando...
                </>
              ) : (
                'Migrar'
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5" />
              <div>
                <h3 className="font-medium">Logos (autorizados)</h3>
                <p className="text-sm text-muted-foreground">Migrar logos de autorizados</p>
              </div>
            </div>
            <Button
              onClick={() => runMigration('autorizados')}
              disabled={migrating !== null}
            >
              {migrating === 'autorizados' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Migrando...
                </>
              ) : (
                'Migrar'
              )}
            </Button>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Otimização Pós-Migração</h3>
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <div>
                  <p className="font-medium text-sm">Recuperar Espaço</p>
                  <p className="text-xs text-muted-foreground">Execute VACUUM para liberar espaço</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => runCleanup('vacuum_full')}
                disabled={migrating !== null}
              >
                {migrating === 'vacuum_full' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  'Executar'
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <div>
                  <p className="font-medium text-sm">Analisar Armazenamento</p>
                  <p className="text-xs text-muted-foreground">Ver tamanhos das tabelas e estatísticas</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => runCleanup('analyze_storage')}
                disabled={migrating !== null}
              >
                {migrating === 'analyze_storage' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  'Analisar'
                )}
              </Button>
            </div>
          </div>
        </div>

        {results && (
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Resultados:</strong></p>
                {results.results && (
                  <>
                    <p>✅ Sucessos: {results.results.successful}</p>
                    <p>❌ Falhas: {results.results.failed}</p>
                  </>
                )}
                {results.table_sizes && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">Ver tamanhos das tabelas</summary>
                    <div className="mt-2 space-y-1 text-xs">
                      {results.table_sizes.map((table: any, index: number) => (
                        <p key={index}>
                          <strong>{table.table_name}:</strong> {table.size_pretty}
                        </p>
                      ))}
                    </div>
                  </details>
                )}
                {results.remaining_base64_images && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">Imagens base64 restantes</summary>
                    <div className="mt-2 space-y-1 text-xs">
                      {results.remaining_base64_images.map((count: any, index: number) => (
                        <p key={index}>
                          <strong>{count.table_name}:</strong> {count.base64_count} imagens
                        </p>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}