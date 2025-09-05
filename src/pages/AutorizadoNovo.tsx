import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, X, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AutorizadoForm {
  nome: string;
  email: string;
  telefone: string;
  whatsapp: string;
  responsavel: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  regiao: string;
  ativo: boolean;
  logo_url: string;
  vendedor_id: string;
}

interface Vendedor {
  id: string;
  nome: string;
  foto_perfil_url?: string;
}

export default function AutorizadoNovo() {
  const [form, setForm] = useState<AutorizadoForm>({
    nome: "",
    email: "",
    telefone: "",
    whatsapp: "",
    responsavel: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    regiao: "",
    ativo: true,
    logo_url: "",
    vendedor_id: ""
  });
  
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchVendedores();
  }, []);

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Por favor, selecione apenas arquivos de imagem.'
        });
        return;
      }

      // Verificar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'A imagem deve ter no máximo 5MB.'
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setForm({ ...form, logo_url: base64 });
        setImagePreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setForm({ ...form, logo_url: "" });
    setImagePreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.nome.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'O nome é obrigatório.'
      });
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('autorizados')
        .insert({
          nome: form.nome.trim(),
          email: form.email.trim() || null,
          telefone: form.telefone.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          responsavel: form.responsavel.trim() || null,
          endereco: form.endereco.trim() || null,
          cidade: form.cidade.trim() || null,
          estado: form.estado.trim() || null,
          cep: form.cep.trim() || null,
          regiao: form.regiao.trim() || null,
          ativo: form.ativo,
          logo_url: form.logo_url || null,
          vendedor_id: form.vendedor_id || null
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Autorizado criado com sucesso.'
      });

      navigate('/dashboard/autorizados');
    } catch (error) {
      console.error('Erro ao criar autorizado:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao criar autorizado.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/autorizados')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Novo Autorizado</h1>
          <p className="text-muted-foreground">
            Cadastre um novo autorizado na rede
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Autorizado</CardTitle>
          <CardDescription>
            Preencha os dados do novo autorizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload de Logo */}
            <div className="space-y-4">
              <Label>Logo do Autorizado</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 rounded object-cover border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={removeImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-20 h-20 border-2 border-dashed border-muted-foreground/25 rounded flex items-center justify-center">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="max-w-sm"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Formatos aceitos: JPG, PNG, GIF (máximo 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Informações Básicas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  value={form.responsavel}
                  onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                />
              </div>
            </div>

            {/* Contato */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Textarea
                id="endereco"
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={form.cep}
                  onChange={(e) => setForm({ ...form, cep: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regiao">Região</Label>
                <Input
                  id="regiao"
                  value={form.regiao}
                  onChange={(e) => setForm({ ...form, regiao: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendedor">Vendedor</Label>
                <Select
                  value={form.vendedor_id}
                  onValueChange={(value) => setForm({ ...form, vendedor_id: value })}
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

            {/* Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={form.ativo}
                onCheckedChange={(checked) => setForm({ ...form, ativo: checked })}
              />
              <Label htmlFor="ativo">Ativo</Label>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/autorizados')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Criar Autorizado"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}