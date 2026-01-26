import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AnimatedBreadcrumb } from '@/components/AnimatedBreadcrumb';
import { useAutorizadosPrecos, type AutorizadoComPrecos } from '@/hooks/useAutorizadosPrecos';
import { AutorizadoPrecosDialog } from '@/components/autorizados/AutorizadoPrecosDialog';
import { formatCurrency } from '@/lib/utils';

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
];

export default function AutorizadosPrecos() {
  const navigate = useNavigate();
  const { autorizados, loading, upsertPrecos } = useAutorizadosPrecos();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAutorizado, setSelectedAutorizado] = useState<AutorizadoComPrecos | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const autorizadosFiltrados = useMemo(() => {
    return autorizados.filter((aut) => {
      const matchSearch = aut.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aut.cidade.toLowerCase().includes(searchTerm.toLowerCase());
      const matchEstado = filterEstado === 'todos' || aut.estado === filterEstado;
      return matchSearch && matchEstado;
    });
  }, [autorizados, searchTerm, filterEstado]);

  const handleEdit = (autorizado: AutorizadoComPrecos) => {
    setSelectedAutorizado(autorizado);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Logística", path: "/logistica" },
          { label: "Autorizados" }
        ]} 
        mounted={mounted} 
      />
      
      <div className="pt-12">
        {/* Header */}
        <header className="sticky top-0 z-20 px-4 py-3 bg-black/80 backdrop-blur-md border-b border-primary/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/logistica')}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/80" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">Preços por Autorizado</h1>
                <p className="text-xs text-white/60">Gerencie os valores de instalação</p>
              </div>
            </div>
          </div>
        </header>

        {/* Filtros */}
        <div className="px-4 py-3 border-b border-primary/10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Buscar por nome ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Estados</SelectItem>
                {ESTADOS_BR.map(estado => (
                  <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="px-4 py-4 max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : autorizadosFiltrados.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/60">Nenhum autorizado encontrado</p>
            </div>
          ) : (
            <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="border-primary/10 hover:bg-primary/5">
                        <TableHead className="text-xs text-white/70">Autorizado</TableHead>
                        <TableHead className="text-xs text-white/70">Cidade/Estado</TableHead>
                        <TableHead className="text-xs text-white/70 text-center">P (&lt;25m²)</TableHead>
                        <TableHead className="text-xs text-white/70 text-center">G (25-50m²)</TableHead>
                        <TableHead className="text-xs text-white/70 text-center">GG (&gt;50m²)</TableHead>
                        <TableHead className="text-right text-xs text-white/70">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {autorizadosFiltrados.map((aut) => (
                        <TableRow 
                          key={aut.id}
                          className="cursor-pointer border-primary/10 hover:bg-primary/10 text-white/90"
                          onClick={() => handleEdit(aut)}
                        >
                          <TableCell className="font-medium">{aut.nome}</TableCell>
                          <TableCell className="text-white/60">
                            {aut.cidade && aut.estado ? `${aut.cidade} - ${aut.estado}` : '-'}
                          </TableCell>
                          <TableCell className="text-center font-medium text-green-400">
                            {aut.precos.P > 0 ? formatCurrency(aut.precos.P) : '-'}
                          </TableCell>
                          <TableCell className="text-center font-medium text-green-400">
                            {aut.precos.G > 0 ? formatCurrency(aut.precos.G) : '-'}
                          </TableCell>
                          <TableCell className="text-center font-medium text-green-400">
                            {aut.precos.GG > 0 ? formatCurrency(aut.precos.GG) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(aut);
                              }}
                            >
                              <Edit2 className="h-4 w-4 text-white/60" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog de Edição */}
      <AutorizadoPrecosDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        autorizado={selectedAutorizado}
        onSave={upsertPrecos}
      />
    </div>
  );
}
