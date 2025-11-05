import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Clock, CheckCircle, AlertCircle, Wrench } from 'lucide-react';
import { Entrega } from '@/hooks/useEntregas';
import { isPast, startOfDay } from 'date-fns';

interface EntregasIndicadoresProps {
  entregas: Entrega[];
}

export const EntregasIndicadores = ({ entregas }: EntregasIndicadoresProps) => {
  const stats = useMemo(() => {
    const status = {
      pronta_fabrica: 0,
      finalizada: 0,
      atrasadas: 0,
    };

    entregas.forEach((entrega) => {
      // Verificar se está atrasada (pronta_fabrica com data_entrega vencida)
      const estaAtrasada = entrega.status === 'pronta_fabrica' &&
        entrega.data_entrega &&
        isPast(startOfDay(new Date(entrega.data_entrega))) &&
        startOfDay(new Date(entrega.data_entrega)) < startOfDay(new Date());

      if (estaAtrasada) {
        status.atrasadas++;
      } else if (entrega.status === 'pronta_fabrica' || entrega.status === 'finalizada') {
        status[entrega.status]++;
      }
    });

    return {
      status,
      total: entregas.length,
    };
  }, [entregas]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
      {/* Status: Pronta Fábrica */}
      <Card>
        <CardHeader className="pb-1 p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium flex items-center gap-1">
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
            Pronta para Coleta
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-lg sm:text-2xl font-bold">{stats.status.pronta_fabrica}</div>
        </CardContent>
      </Card>

      {/* Status: Finalizadas */}
      <Card>
        <CardHeader className="pb-1 p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium flex items-center gap-1">
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            Finalizadas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-lg sm:text-2xl font-bold">{stats.status.finalizada}</div>
        </CardContent>
      </Card>

      {/* Atrasadas */}
      <Card className="border-red-500/20 bg-red-500/5">
        <CardHeader className="pb-1 p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium flex items-center gap-1">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
            Atrasadas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-lg sm:text-2xl font-bold text-red-500">{stats.status.atrasadas}</div>
        </CardContent>
      </Card>
    </div>
  );
};
