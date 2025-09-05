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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, MapPin, Phone, Mail, User, Camera, Loader2, Map, List, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AutorizadosMapLeaflet from "@/components/AutorizadosMapLeaflet";

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
  latitude?: number;
  longitude?: number;
  last_geocoded_at?: string;
  geocode_precision?: string;
  created_at: string;
  updated_at: string;
  vendedor_id?: string;
  vendedor?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

interface Vendedor {
  id: string;
  nome: string;
  foto_perfil_url?: string;
}

export default function Autorizados() {
  const [autorizados, setAutorizados] = useState<Autorizado[]>([]);
  const [filteredAutorizados, setFilteredAutorizados] = useState<Autorizado[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingAutorizado, setEditingAutorizado] = useState<Autorizado | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [geocoding, setGeocoding] = useState<string | null>(null);
  const [batchGeocoding, setBatchGeocoding] = useState(false);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAutorizados();
    fetchVendedores();
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
        .select(`
          *,
          vendedor:admin_users(nome, foto_perfil_url)
        `)
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

  const fetchVendedores = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, nome, foto_perfil_url')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setVendedores(data || []);
    } catch (error) {
      console.error('Erro ao buscar vendedores:', error);
    }
  };

  const handleEdit = (autorizado: Autorizado) => {
    setEditingAutorizado(autorizado);
    setIsEditDialogOpen(true);
  };

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para upload.');
      }

      const file = event.target.files[0];
      
      // Validação do tipo de arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione apenas arquivos de imagem.');
      }

      // Validação do tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB.');
      }

      // Converter imagem para base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (editingAutorizado) {
          setEditingAutorizado({ 
            ...editingAutorizado, 
            logo_url: base64String 
          });
        }
      };
      reader.readAsDataURL(file);

      toast({
        title: 'Sucesso',
        description: 'Imagem carregada com sucesso!'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    if (editingAutorizado) {
      setEditingAutorizado({ 
        ...editingAutorizado, 
        logo_url: undefined 
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
          logo_url: editingAutorizado.logo_url,
          vendedor_id: editingAutorizado.vendedor_id,
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

  const handleGeocode = async (autorizado: Autorizado) => {
    if (!autorizado.cidade || !autorizado.estado) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Cidade e estado são obrigatórios para geocodificação.'
      });
      return;
    }

    try {
      setGeocoding(autorizado.id);
      
      const { data, error } = await supabase.functions.invoke('geocode-nominatim', {
        body: {
          id: autorizado.id,
          endereco: autorizado.endereco || '',
          cidade: autorizado.cidade,
          estado: autorizado.estado
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Sucesso',
          description: `Coordenadas obtidas: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`
        });
        fetchAutorizados();
      } else {
        throw new Error(data.error || 'Erro ao geocodificar endereço');
      }
    } catch (error: any) {
      console.error('Erro na geocodificação:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na geocodificação',
        description: error.message || 'Não foi possível geocodificar o endereço.'
      });
    } finally {
      setGeocoding(null);
    }
  };

  const handleBatchGeocode = async () => {
    const autorizadosToGeocode = autorizados.filter(autorizado => 
      autorizado.ativo && 
      autorizado.cidade && 
      autorizado.estado && 
      !autorizado.latitude && 
      !autorizado.longitude
    );

    if (autorizadosToGeocode.length === 0) {
      toast({
        title: 'Info',
        description: 'Nenhum autorizado encontrado para geocodificação.'
      });
      return;
    }

    setBatchGeocoding(true);
    let success = 0;
    let errors = 0;

    toast({
      title: 'Geocodificação em lote iniciada',
      description: `Processando ${autorizadosToGeocode.length} autorizados...`
    });

    for (const autorizado of autorizadosToGeocode) {
      try {
        const { data, error } = await supabase.functions.invoke('geocode-nominatim', {
          body: {
            id: autorizado.id,
            endereco: autorizado.endereco || '',
            cidade: autorizado.cidade,
            estado: autorizado.estado
          }
        });

        if (error) throw error;

        if (data.success) {
          success++;
        } else {
          errors++;
        }
      } catch (error) {
        console.error(`Erro ao geocodificar ${autorizado.nome}:`, error);
        errors++;
      }

      // Delay para respeitar limites da API do Nominatim
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setBatchGeocoding(false);
    
    toast({
      title: 'Geocodificação em lote concluída',
      description: `${success} sucessos, ${errors} erros`
    });

    fetchAutorizados();
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

      <Tabs defaultValue="map" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Mapa
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Mapa de Autorizados</CardTitle>
                  <CardDescription>
                    Visualize a localização dos autorizados no mapa do Brasil
                  </CardDescription>
                </div>
                <Button
                  onClick={handleBatchGeocode}
                  disabled={batchGeocoding}
                  variant="outline"
                  size="sm"
                >
                  {batchGeocoding ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Geocodificar todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AutorizadosMapLeaflet autorizados={autorizados} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
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
            </div>
            <Button
              onClick={handleBatchGeocode}
              disabled={batchGeocoding}
              variant="outline"
              size="sm"
              className="ml-4"
            >
              {batchGeocoding ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Geocodificar todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Vendedor</TableHead>
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
                    {autorizado.vendedor ? (
                      <div className="flex items-center space-x-2">
                        {autorizado.vendedor.foto_perfil_url ? (
                          <img
                            src={autorizado.vendedor.foto_perfil_url}
                            alt={autorizado.vendedor.nome}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                        <span className="text-sm">{autorizado.vendedor.nome}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
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
                        onClick={() => navigate(`/dashboard/autorizados/${autorizado.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {autorizado.cidade && autorizado.estado && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGeocode(autorizado)}
                          disabled={geocoding === autorizado.id}
                          title={autorizado.latitude && autorizado.longitude ? 'Atualizar coordenadas' : 'Geocodificar endereço'}
                        >
                          {geocoding === autorizado.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      )}
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
        </TabsContent>
      </Tabs>

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

              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="vendedor">Vendedor</Label>
                  <Select
                    value={editingAutorizado.vendedor_id || ""}
                    onValueChange={(value) =>
                      setEditingAutorizado({ ...editingAutorizado, vendedor_id: value || undefined })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum vendedor</SelectItem>
                      {vendedores.map((vendedor) => (
                        <SelectItem key={vendedor.id} value={vendedor.id}>
                          <div className="flex items-center space-x-2">
                            {vendedor.foto_perfil_url ? (
                              <img
                                src={vendedor.foto_perfil_url}
                                alt={vendedor.nome}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                            <span>{vendedor.nome}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Seção de Upload de Imagem */}
              <div className="space-y-4">
                <Label>Logo do Autorizado</Label>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={editingAutorizado.logo_url} />
                    <AvatarFallback className="text-lg">
                      {getInitials(editingAutorizado.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4 mr-2" />
                        )}
                        {uploading ? 'Carregando...' : 'Escolher Imagem'}
                      </Button>
                      {editingAutorizado.logo_url && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeImage}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={uploadImage}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      Máximo 5MB. Formatos: JPG, PNG, GIF.
                    </p>
                  </div>
                </div>
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