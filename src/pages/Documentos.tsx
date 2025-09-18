import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useDocumentos } from '@/hooks/useDocumentos';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORY_LABELS = {
  manual: 'Manual',
  procedimento: 'Procedimento',
  formulario: 'Formulário',
  contrato: 'Contrato',
  politica: 'Política',
  outros: 'Outros',
};

const CATEGORY_COLORS = {
  manual: 'bg-blue-100 text-blue-800',
  procedimento: 'bg-green-100 text-green-800',
  formulario: 'bg-yellow-100 text-yellow-800',
  contrato: 'bg-red-100 text-red-800',
  politica: 'bg-purple-100 text-purple-800',
  outros: 'bg-gray-100 text-gray-800',
};

function formatFileSize(bytes: number) {
  const sizes = ['Bytes', 'KB', 'MB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export default function Documentos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { data: documentos, isLoading } = useDocumentos();

  const filteredDocuments = documentos?.filter(doc => {
    const matchesSearch = doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">Gerencie e visualize documentos públicos</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/documentos/novo">
            <Plus className="h-4 w-4 mr-2" />
            Novo Documento
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!filteredDocuments?.length ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum documento encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece adicionando seu primeiro documento.'}
            </p>
            <Button asChild>
              <Link to="/dashboard/documentos/novo">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Documento
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((documento) => (
            <Card key={documento.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="h-8 w-8 text-red-600 flex-shrink-0" />
                  <Badge className={CATEGORY_COLORS[documento.categoria]}>
                    {CATEGORY_LABELS[documento.categoria]}
                  </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2">{documento.titulo}</CardTitle>
                {documento.descricao && (
                  <CardDescription className="line-clamp-3">
                    {documento.descricao}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>{documento.nome_arquivo}</span>
                  <span>{formatFileSize(documento.tamanho_arquivo)}</span>
                </div>
                <Button 
                  onClick={() => window.open(documento.arquivo_url, '_blank')}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}