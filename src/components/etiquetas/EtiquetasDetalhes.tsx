import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tag, Calculator, Info } from 'lucide-react';
import { EtiquetaCalculo } from '@/types/etiqueta';

interface EtiquetasDetalhesProps {
  calculo: EtiquetaCalculo;
}

export function EtiquetasDetalhes({ calculo }: EtiquetasDetalhesProps) {
  const getTipoCalculoBadge = () => {
    switch (calculo.tipoCalculo) {
      case 'meia_cana_grande':
        return <Badge variant="default">Meia Cana - Porta Grande</Badge>;
      case 'meia_cana_pequena':
        return <Badge variant="secondary">Meia Cana - Porta Pequena</Badge>;
      default:
        return <Badge variant="outline">Item Normal</Badge>;
    }
  };

  const getCalculoVisual = () => {
    if (calculo.tipoCalculo === 'normal') {
      return (
        <div className="text-center py-4">
          <div className="text-4xl font-bold text-primary mb-2">
            {calculo.quantidade}
          </div>
          <p className="text-sm text-muted-foreground">
            {calculo.quantidade} {calculo.quantidade === 1 ? 'unidade' : 'unidades'} = {calculo.etiquetasNecessarias} {calculo.etiquetasNecessarias === 1 ? 'etiqueta' : 'etiquetas'}
          </p>
        </div>
      );
    }

    const divisor = calculo.tipoCalculo === 'meia_cana_grande' ? 5 : 10;
    
    return (
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-2xl font-bold">{calculo.quantidade}</span>
          <span className="text-xl text-muted-foreground">÷</span>
          <span className="text-2xl font-bold">{divisor}</span>
          <span className="text-xl text-muted-foreground">=</span>
          <span className="text-4xl font-bold text-primary">{calculo.etiquetasNecessarias}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {calculo.quantidade} meia canas ÷ {divisor} = {calculo.etiquetasNecessarias} {calculo.etiquetasNecessarias === 1 ? 'etiqueta' : 'etiquetas'}
        </p>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Tag className="h-5 w-5" />
          Cálculo de Etiquetas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Produto</p>
          <p className="text-base font-semibold">{calculo.nomeProduto}</p>
        </div>

        <div className="flex gap-4">
          <div>
            <p className="text-sm font-medium mb-1">Quantidade</p>
            <Badge variant="secondary" className="text-base px-3 py-1">
              {calculo.quantidade}
            </Badge>
          </div>
          
          {calculo.largura && calculo.altura && (
            <div>
              <p className="text-sm font-medium mb-1">Dimensões</p>
              <Badge variant="outline" className="text-base px-3 py-1">
                {calculo.largura}m × {calculo.altura}m
              </Badge>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Tipo de Cálculo</p>
          {getTipoCalculoBadge()}
        </div>

        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2 mb-3">
              <Calculator className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium mb-1">Cálculo</p>
                {getCalculoVisual()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {calculo.explicacao}
          </AlertDescription>
        </Alert>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Total de Etiquetas Necessárias</p>
              <div className="text-5xl font-bold text-primary">
                {calculo.etiquetasNecessarias}
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
