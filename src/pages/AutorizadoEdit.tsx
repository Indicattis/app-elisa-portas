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
import { LogoUpload } from "@/components/LogoUpload";
import { ArrowLeft, Upload, X, User, MapPin, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { ETAPAS, AutorizadoEtapa } from "@/utils/etapas";

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
  etapa: AutorizadoEtapa;
}

interface Vendedor {
  id: string;
  nome: string;
  foto_perfil_url?: string;
}

export default function AutorizadoEdit() {
  const { id } = useParams();
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
    vendedor_id: "",
    etapa: "integracao"
  });
  
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchAutorizado();
      fetchVendedores();
    }
  }, [id]);

  const fetchAutorizado = async () => {
    try {
      const { data, error } = await supabase
        .from('autorizados')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        setForm({
          nome: data.nome || "",
          email: data.email || "",
          telefone: data.telefone || "",
          whatsapp: data.whatsapp || "",
          responsavel: data.responsavel || "",
          endereco: data.endereco || "",
          cidade: data.cidade || "",
          estado: data.estado || "",
          cep: data.cep || "",
          regiao: data.regiao || "",
          ativo: data.ativo,
          logo_url: data.logo_url || "",
          vendedor_id: data.vendedor_id || "",
          etapa: data.etapa || "integracao"
        });
        
        if (data.logo_url) {
          setImagePreview(data.logo_url);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar autorizado:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao carregar dados do autorizado.'
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

  const handleLogoUpdate = (url: string | null) => {
    setForm({ ...form, logo_url: url || "" });
    setImagePreview(url || "");
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
        .update({
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
          vendedor_id: form.vendedor_id === "none" ? null : form.vendedor_id || null,
          etapa: form.etapa
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Autorizado atualizado com sucesso.'
      });

      navigate('/dashboard/autorizados');
    } catch (error) {
      console.error('Erro ao atualizar autorizado:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao atualizar autorizado.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGeocode = async () => {
    if (!form.cidade || !form.estado) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Cidade e estado são obrigatórios para geocodificação.'
      });
      return;
    }

    try {
      setGeocoding(true);
      
      const { data, error } = await supabase.functions.invoke('geocode-nominatim', {
        body: {
          id: id,
          endereco: form.endereco || '',
          cidade: form.cidade,
          estado: form.estado
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Sucesso',
          description: `Coordenadas obtidas: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`
        });
        
        // Atualizar os dados do formulário se necessário
        await fetchAutorizado();
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
      setGeocoding(false);
    }
  };

  if (loading) {
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
            <h1 className="text-3xl font-bold text-foreground">Carregando...</h1>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-foreground">Editar Autorizado</h1>
          <p className="text-muted-foreground">
            Edite as informações do autorizado
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Autorizado</CardTitle>
          <CardDescription>
            Atualize os dados do autorizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label>Logo do Autorizado</Label>
              <LogoUpload
                autorizadoId={id!}
                currentLogoUrl={form.logo_url}
                autorizadoName={form.nome}
                onLogoUpdate={handleLogoUpdate}
              />
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
                  value={form.vendedor_id || "none"}
                  onValueChange={(value) => setForm({ ...form, vendedor_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum vendedor</SelectItem>
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
              <div className="space-y-2">
                <Label htmlFor="etapa">Etapa</Label>
                <Select
                  value={form.etapa}
                  onValueChange={(value: AutorizadoEtapa) => setForm({ ...form, etapa: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ETAPAS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Geocodificação */}
            {form.cidade && form.estado && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeocode}
                  disabled={geocoding}
                  size="sm"
                >
                  {geocoding ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-2" />
                  )}
                  Obter coordenadas
                </Button>
              </div>
            )}

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
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}