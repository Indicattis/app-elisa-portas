import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { variaveisDisponiveis } from "@/hooks/useContratoVariaveis";

export function VariaveisList() {
  const copiarVariavel = (chave: string) => {
    navigator.clipboard.writeText(`{${chave}}`);
    toast.success('Variável copiada!');
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Variáveis Disponíveis</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Clique para copiar e cole no template usando o formato: {'{variavel}'}
      </p>
      
      <div className="space-y-6">
        {variaveisDisponiveis.map((grupo) => (
          <div key={grupo.categoria}>
            <h4 className="font-medium mb-3 text-primary">{grupo.categoria}</h4>
            <div className="grid gap-2">
              {grupo.variaveis.map((variavel) => (
                <div
                  key={variavel.chave}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {'{' + variavel.chave + '}'}
                    </code>
                    <p className="text-xs text-muted-foreground mt-1">
                      {variavel.descricao}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copiarVariavel(variavel.chave)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
