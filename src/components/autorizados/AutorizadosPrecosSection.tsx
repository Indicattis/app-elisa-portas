import { useMemo, useState } from 'react';
import { Search, Edit2, Trash2, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAutorizadosPrecos, type AutorizadoComPrecos } from '@/hooks/useAutorizadosPrecos';
import { AutorizadoPrecosDialog } from '@/components/autorizados/AutorizadoPrecosDialog';
import { formatCurrency } from '@/lib/utils';

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
];

export function AutorizadosPrecosSection() {
  const { autorizados, loading, upsertPrecos, excluirAutorizado } = useAutorizadosPrecos();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAutorizado, setSelectedAutorizado] = useState<AutorizadoComPrecos | null>(null);

  const autorizadosFiltrados = useMemo(() => {
    return autorizados
      .filter((aut) => {
        const matchSearch = aut.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          aut.cidade.toLowerCase().includes(searchTerm.toLowerCase());
        const matchEstado = filterEstado === 'todos' || aut.estado === filterEstado;
        return matchSearch && matchEstado;
      })
      .sort((a, b) => {
        if (!a.cidade && !b.cidade) return a.nome.localeCompare(b.nome);
        if (!a.cidade) return 1;
        if (!b.cidade) return -1;
        const cidadeCompare = a.cidade.localeCompare(b.cidade);
        if (cidadeCompare !== 0) return cidadeCompare;
        return a.nome.localeCompare(b.nome);
      });
  }, [autorizados, searchTerm, filterEstado]);

  const handleEdit = (autorizado: AutorizadoComPrecos) => {
    setSelectedAutorizado(autorizado);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-primary/5 border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-white">
            Preços por Autorizado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
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
              <SelectContent className="bg-background border z-50">
                <SelectItem value="todos">Todos</SelectItem>
                {ESTADOS_BR.map(estado => (
                  <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabela simples */}
          {autorizadosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/60">Nenhum autorizado encontrado</p>
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden border border-primary/10">
              <div className="max-h-[400px] overflow-y-auto">
                <Table className="text-xs">
                  <TableHeader className="sticky top-0 bg-black/90">
                    <TableRow className="border-primary/10 hover:bg-transparent">
                      <TableHead className="text-xs text-white/70">Autorizado</TableHead>
                      <TableHead className="text-xs text-white/70">Cidade/UF</TableHead>
                      <TableHead className="text-xs text-white/70">Vendedor</TableHead>
                      <TableHead className="text-xs text-white/70 text-center">P</TableHead>
                      <TableHead className="text-xs text-white/70 text-center">G</TableHead>
                      <TableHead className="text-xs text-white/70 text-center">GG</TableHead>
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
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {aut.nome}
                            {aut.etapa === 'premium' && (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5 py-0">
                                <Star className="h-2.5 w-2.5 mr-0.5 fill-yellow-400" />
                                Premium
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-white/60">
                          {aut.cidade ? `${aut.cidade}/${aut.estado}` : aut.estado || '-'}
                        </TableCell>
                        <TableCell className="text-white/60">
                          {aut.vendedor_nome || '-'}
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
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(aut);
                              }}
                            >
                              <Edit2 className="h-3.5 w-3.5 text-white/60" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-destructive/10 text-destructive"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir autorizado?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    O autorizado "{aut.nome}" será desativado.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => excluirAutorizado(aut.id)}>
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AutorizadoPrecosDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        autorizado={selectedAutorizado}
        onSave={upsertPrecos}
      />
    </div>
  );
}
