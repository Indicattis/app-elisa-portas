import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { executarInativacaoAutomatica } from "@/hooks/useAutorizadosPerformance";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";

interface InativacaoAutomaticaModalProps {
  isOpen: boolean;
  onClose: () => void;
  autorizadosCriticos: Array<{
    nome: string;
    diasSemAvaliacao: number;
    ultimaAvaliacao: string | null;
  }>;
}

export function InativacaoAutomaticaModal({ 
  isOpen, 
  onClose, 
  autorizadosCriticos 
}: InativacaoAutomaticaModalProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [resultado, setResultado] = useState<{ inativados: number; autorizados: string[] } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleExecutarInativacao = async () => {
    setIsExecuting(true);
    try {
      const result = await executarInativacaoAutomatica();
      setResultado(result);
      
      // Atualizar dados
      queryClient.invalidateQueries({ queryKey: ['autorizados-performance'] });
      queryClient.invalidateQueries({ queryKey: ['autorizados-with-ratings'] });
      
      toast({
        title: "Inativação executada",
        description: `${result.inativados} autorizado(s) foram inativados automaticamente.`,
      });
    } catch (error) {
      console.error('Erro ao executar inativação:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClose = () => {
    setResultado(null);
    onClose();
  };

  const formatarTempo = (dias: number) => {
    if (dias >= 30) {
      const meses = Math.floor(dias / 30);
      const diasRestantes = dias % 30;
      return `${meses} mês${meses > 1 ? 'es' : ''}${diasRestantes > 0 ? ` e ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}` : ''}`;
    }
    return `${dias} dia${dias > 1 ? 's' : ''}`;
  };

  const formatarData = (data: string | null) => {
    if (!data) return "Nunca avaliado";
    return new Date(data).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Inativação Automática de Autorizados
          </DialogTitle>
          <DialogDescription>
            {resultado 
              ? "Resultado da inativação automática"
              : "Os seguintes autorizados serão inativados por não terem avaliações há mais de 3 meses (90 dias)."
            }
          </DialogDescription>
        </DialogHeader>

        {resultado ? (
          <div className="space-y-4">
            {resultado.inativados === 0 ? (
              <Alert>
                <AlertDescription>
                  Nenhum autorizado foi inativado. Todos estão dentro do prazo de avaliação.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <Alert>
                  <AlertDescription>
                    <strong>{resultado.inativados}</strong> autorizado(s) foram inativados com sucesso.
                  </AlertDescription>
                </Alert>
                <div>
                  <h4 className="font-medium mb-2">Autorizados inativados:</h4>
                  <div className="grid gap-2">
                    {resultado.autorizados.map((nome, index) => (
                      <Badge key={index} variant="destructive" className="justify-start">
                        {nome}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {autorizadosCriticos.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Não há autorizados para inativação automática no momento. 
                  Todos estão dentro do prazo de avaliação.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{autorizadosCriticos.length}</strong> autorizado(s) será(ão) inativado(s) automaticamente.
                    Esta ação não pode ser desfeita, mas pode ser revertida manualmente pelos administradores.
                  </AlertDescription>
                </Alert>
                
                <ScrollArea className="h-64 w-full border rounded-md p-4">
                  <div className="space-y-3">
                    {autorizadosCriticos.map((autorizado, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                        <div>
                          <p className="font-medium">{autorizado.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            Última avaliação: {formatarData(autorizado.ultimaAvaliacao)}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {formatarTempo(autorizado.diasSemAvaliacao)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          {resultado ? (
            <Button onClick={handleClose}>
              Fechar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              {autorizadosCriticos.length > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={handleExecutarInativacao}
                  disabled={isExecuting}
                >
                  {isExecuting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Executar Inativação
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}