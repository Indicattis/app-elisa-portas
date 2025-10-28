import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, Wrench, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { InstalacaoCadastrada } from '@/hooks/useInstalacoesCadastradas';
import { isPast, startOfDay } from 'date-fns';

interface InstalacaoIndicadoresProps {
  instalacoes: InstalacaoCadastrada[];
}

export const InstalacaoIndicadores = ({ instalacoes }: InstalacaoIndicadoresProps) => {
  const stats = useMemo(() => {
    const categorias = {
      instalacao: 0,
      entrega: 0,
      correcao: 0,
      carregamento_agendado: 0,
    };

    const status = {
      pendente_producao: 0,
      pronta_fabrica: 0,
      finalizada: 0,
    };

    let atrasadas = 0;

    instalacoes.forEach((inst) => {
      // Contar por categoria
      if (inst.categoria in categorias) {
        categorias[inst.categoria as keyof typeof categorias]++;
      }

      // Contar por status
      if (inst.status in status) {
        status[inst.status as keyof typeof status]++;
      }

      // Contar atrasadas
      if (
        inst.data_instalacao &&
        inst.status !== 'finalizada' &&
        isPast(startOfDay(new Date(inst.data_instalacao))) &&
        startOfDay(new Date(inst.data_instalacao)) < startOfDay(new Date())
      ) {
        atrasadas++;
      }
    });

    return {
      categorias,
      status,
      atrasadas,
      total: instalacoes.length,
    };
  }, [instalacoes]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4">
      {/* Categoria: Instalações */}
      <Card>
        <CardHeader className="pb-1 p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium flex items-center gap-1">
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
            Instalações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-lg sm:text-2xl font-bold">{stats.categorias.instalacao}</div>
        </CardContent>
      </Card>

      {/* Categoria: Entregas */}
      <Card>
        <CardHeader className="pb-1 p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium flex items-center gap-1">
            <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
            Entregas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-lg sm:text-2xl font-bold">{stats.categorias.entrega}</div>
        </CardContent>
      </Card>

      {/* Categoria: Correções */}
      <Card>
        <CardHeader className="pb-1 p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium flex items-center gap-1">
            <Wrench className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
            Correções
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-lg sm:text-2xl font-bold">{stats.categorias.correcao}</div>
        </CardContent>
      </Card>

      {/* Categoria: Carregamento Agendado */}
      <Card>
        <CardHeader className="pb-1 p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium flex items-center gap-1">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
            Agendados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-lg sm:text-2xl font-bold">{stats.categorias.carregamento_agendado}</div>
        </CardContent>
      </Card>

      {/* Status: Pendente Produção */}
      <Card>
        <CardHeader className="pb-1 p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium flex items-center gap-1">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
            Pendente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-lg sm:text-2xl font-bold">{stats.status.pendente_producao}</div>
        </CardContent>
      </Card>

      {/* Status: Pronta Fábrica */}
      <Card>
        <CardHeader className="pb-1 p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium flex items-center gap-1">
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
            Pronta
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
          <div className="text-lg sm:text-2xl font-bold text-red-500">{stats.atrasadas}</div>
        </CardContent>
      </Card>
    </div>
  );
};
