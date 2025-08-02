import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, MapPin, Phone, Mail, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Autorizado {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  responsavel?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  regiao?: string;
  ativo: boolean;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export default function Autorizados() {
  const [autorizados, setAutorizados] = useState<Autorizado[]>([]);
  const [filteredAutorizados, setFilteredAutorizados] = useState<Autorizado[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingAutorizado, setEditingAutorizado] = useState<Autorizado | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAutorizados();
  }, []);

  useEffect(() => {
    const filtered = autorizados.filter(autorizado =>
      autorizado.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      autorizado.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      autorizado.cidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      autorizado.regiao?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAutorizados(filtered);
  }, [searchTerm, autorizados]);

  const fetchAutorizados = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('autorizados')
        .select('*')
        .order('nome');

      if (error) throw error;
      setAutorizados(data || []);
    } catch (error) {
      console.error('Erro ao buscar autorizados:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao buscar autorizados.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (autorizado: Autorizado) => {
    setEditingAutorizado(autorizado);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAutorizado) return;

    try {
      const { error } = await supabase
        .from('autorizados')
        .update({
          nome: editingAutorizado.nome,
          email: editingAutorizado.email,
          telefone: editingAutorizado.telefone,
          whatsapp: editingAutorizado.whatsapp,
          responsavel: editingAutorizado.responsavel,
          endereco: editingAutorizado.endereco,
          cidade: editingAutorizado.cidade,
          estado: editingAutorizado.estado,
          cep: editingAutorizado.cep,
          regiao: editingAutorizado.regiao,
          ativo: editingAutorizado.ativo,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingAutorizado.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Autorizado atualizado com sucesso.'
      });

      setIsEditDialogOpen(false);
      setEditingAutorizado(null);
      fetchAutorizados();
    } catch (error) {
      console.error('Erro ao atualizar autorizado:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao atualizar autorizado.'
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('autorizados')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Autorizado excluído com sucesso.'
      });

      fetchAutorizados();
    } catch (error) {
      console.error('Erro ao excluir autorizado:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao excluir autorizado.'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando autorizados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Autorizados</h1>
          <p className="text-muted-foreground">
            Gerencie a rede de autorizados da empresa
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/autorizados/novo')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Autorizado
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Autorizados</CardTitle>
          <CardDescription>
            {filteredAutorizados.length} autorizado(s) encontrado(s)
          </CardDescription>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, email, cidade ou região..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAutorizados.map((autorizado) => (
                <TableRow key={autorizado.id}>
                  <TableCell>
                    {autorizado.logo_url ? (
                      <img
                        src={autorizado.logo_url}
                        alt={`Logo ${autorizado.nome}`}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{autorizado.nome}</p>
                      {autorizado.responsavel && (
                        <p className="text-sm text-muted-foreground">{autorizado.responsavel}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {autorizado.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1" />
                          {autorizado.email}
                        </div>
                      )}
                      {autorizado.telefone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1" />
                          {autorizado.telefone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {autorizado.cidade && autorizado.estado && (
                        <div className="flex items-center text-sm">
                          <MapPin className="h-3 w-3 mr-1" />
                          {autorizado.cidade}, {autorizado.estado}
                        </div>
                      )}
                      {autorizado.regiao && (
                        <Badge variant="outline" className="text-xs">
                          {autorizado.regiao}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={autorizado.ativo ? "default" : "secondary"}>
                      {autorizado.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(autorizado)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o autorizado "{autorizado.nome}"?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(autorizado.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
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
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Autorizado</DialogTitle>
            <DialogDescription>
              Atualize as informações do autorizado
            </DialogDescription>
          </DialogHeader>
          {editingAutorizado && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={editingAutorizado.nome}
                    onChange={(e) =>
                      setEditingAutorizado({ ...editingAutorizado, nome: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Input
                    id="responsavel"
                    value={editingAutorizado.responsavel || ""}
                    onChange={(e) =>
                      setEditingAutorizado({ ...editingAutorizado, responsavel: e.target.value })
                    }
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingAutorizado.email || ""}
                    onChange={(e) =>
                      setEditingAutorizado({ ...editingAutorizado, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={editingAutorizado.telefone || ""}
                    onChange={(e) =>
                      setEditingAutorizado({ ...editingAutorizado, telefone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Textarea
                  id="endereco"
                  value={editingAutorizado.endereco || ""}
                  onChange={(e) =>
                    setEditingAutorizado({ ...editingAutorizado, endereco: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={editingAutorizado.cidade || ""}
                    onChange={(e) =>
                      setEditingAutorizado({ ...editingAutorizado, cidade: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={editingAutorizado.estado || ""}
                    onChange={(e) =>
                      setEditingAutorizado({ ...editingAutorizado, estado: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={editingAutorizado.cep || ""}
                    onChange={(e) =>
                      setEditingAutorizado({ ...editingAutorizado, cep: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="regiao">Região</Label>
                <Input
                  id="regiao"
                  value={editingAutorizado.regiao || ""}
                  onChange={(e) =>
                    setEditingAutorizado({ ...editingAutorizado, regiao: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={editingAutorizado.ativo}
                  onCheckedChange={(checked) =>
                    setEditingAutorizado({ ...editingAutorizado, ativo: checked })
                  }
                />
                <Label htmlFor="ativo">Ativo</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}