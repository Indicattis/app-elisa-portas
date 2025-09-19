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
import { useNavigate, useParams } from "react-router-dom";
import { 
  TipoParceiro, 
  TIPO_PARCEIRO_LABELS, 
  getEtapasByTipo 
} from "@/utils/parceiros";
import { LogoUpload } from "@/components/LogoUpload";

interface ParceiroForm {
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
  etapa?: string;
  representante_etapa?: string;
  licenciado_etapa?: string;
  tipo_parceiro: TipoParceiro;
}

interface Vendedor {
  id: string;
  nome: string;
  foto_perfil_url?: string;
}

export default function ParceiroNovo() {
  const { tipoParceiro } = useParams<{ tipoParceiro: TipoParceiro }>();
  const tipoParceiroFinal = tipoParceiro || 'autorizado';
  const { etapas, order } = getEtapasByTipo(tipoParceiroFinal);
  
  const [form, setForm] = useState<ParceiroForm>({
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
    etapa: tipoParceiroFinal === 'autorizado' ? order[0] : undefined,
    representante_etapa: tipoParceiroFinal === 'representante' ? order[0] : undefined,
    licenciado_etapa: tipoParceiroFinal === 'licenciado' ? order[0] : undefined,
    tipo_parceiro: tipoParceiroFinal
  });
  
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Campos obrigatórios
    if (!form.nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!form.endereco.trim()) newErrors.endereco = "Endereço é obrigatório";
    if (!form.cidade.trim()) newErrors.cidade = "Cidade é obrigatória";
    if (!form.estado.trim()) newErrors.estado = "Estado é obrigatório";
    if (!form.cep.trim()) newErrors.cep = "CEP é obrigatório";
    if (!form.whatsapp.trim()) newErrors.whatsapp = "WhatsApp é obrigatório";
    if (!form.responsavel.trim()) newErrors.responsavel = "Responsável é obrigatório";
    if (!form.telefone.trim()) newErrors.telefone = "Telefone é obrigatório";
    if (!form.vendedor_id) newErrors.vendedor_id = "Atendente é obrigatório";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogoUpdate = (logoUrl: string) => {
    setForm({ ...form, logo_url: logoUrl });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Erro de validação',
        description: 'Por favor, preencha todos os campos obrigatórios.'
      });
      return;
    }

    try {
      setSaving(true);

      const insertData: any = {
        nome: form.nome,
        email: form.email || null,
        telefone: form.telefone,
        whatsapp: form.whatsapp,
        responsavel: form.responsavel,
        endereco: form.endereco,
        cidade: form.cidade,
        estado: form.estado,
        cep: form.cep,
        regiao: form.regiao || null,
        ativo: form.ativo,
        logo_url: form.logo_url || null,
        vendedor_id: form.vendedor_id,
        tipo_parceiro: form.tipo_parceiro,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Adicionar campos específicos por tipo
      if (tipoParceiroFinal === 'autorizado') {
        insertData.etapa = form.etapa;
      } else if (tipoParceiroFinal === 'representante') {
        insertData.representante_etapa = form.representante_etapa;
      } else if (tipoParceiroFinal === 'licenciado') {
        insertData.licenciado_etapa = form.licenciado_etapa;
      }

      const { error } = await supabase
        .from('autorizados')
        .insert([insertData]);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `${TIPO_PARCEIRO_LABELS[tipoParceiroFinal]} criado com sucesso.`
      });

      navigate('/dashboard/parceiros');
    } catch (error) {
      console.error('Erro ao criar parceiro:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao criar parceiro.'
      });
    } finally {
      setSaving(false);
    }
  };

  const getEtapaValue = () => {
    switch (tipoParceiroFinal) {
      case 'representante':
        return form.representante_etapa;
      case 'licenciado':
        return form.licenciado_etapa;
      default:
        return form.etapa;
    }
  };

  const setEtapaValue = (value: string) => {
    const updates: Partial<ParceiroForm> = {};
    switch (tipoParceiroFinal) {
      case 'representante':
        updates.representante_etapa = value;
        break;
      case 'licenciado':
        updates.licenciado_etapa = value;
        break;
      default:
        updates.etapa = value;
        break;
    }
    setForm({ ...form, ...updates });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/dashboard/parceiros')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Novo {TIPO_PARCEIRO_LABELS[tipoParceiroFinal]}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do {TIPO_PARCEIRO_LABELS[tipoParceiroFinal]}</CardTitle>
          <CardDescription>
            Preencha as informações básicas do novo {TIPO_PARCEIRO_LABELS[tipoParceiroFinal].toLowerCase()}.
            Campos marcados com * são obrigatórios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna Esquerda */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    placeholder="Nome do parceiro"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className={errors.nome ? "border-red-500" : ""}
                  />
                  {errors.nome && <p className="text-sm text-red-500">{errors.nome}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    className={errors.telefone ? "border-red-500" : ""}
                  />
                  {errors.telefone && <p className="text-sm text-red-500">{errors.telefone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp *</Label>
                  <Input
                    id="whatsapp"
                    placeholder="(00) 00000-0000"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    className={errors.whatsapp ? "border-red-500" : ""}
                  />
                  {errors.whatsapp && <p className="text-sm text-red-500">{errors.whatsapp}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável *</Label>
                  <Input
                    id="responsavel"
                    placeholder="Nome do responsável"
                    value={form.responsavel}
                    onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                    className={errors.responsavel ? "border-red-500" : ""}
                  />
                  {errors.responsavel && <p className="text-sm text-red-500">{errors.responsavel}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendedor_id">Atendente *</Label>
                  <Select 
                    value={form.vendedor_id} 
                    onValueChange={(value) => setForm({ ...form, vendedor_id: value })}
                  >
                    <SelectTrigger className={errors.vendedor_id ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecione um atendente" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendedores.map((vendedor) => (
                        <SelectItem key={vendedor.id} value={vendedor.id}>
                          {vendedor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.vendedor_id && <p className="text-sm text-red-500">{errors.vendedor_id}</p>}
                </div>
              </div>

              {/* Coluna Direita */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço *</Label>
                  <Input
                    id="endereco"
                    placeholder="Rua, número, bairro"
                    value={form.endereco}
                    onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                    className={errors.endereco ? "border-red-500" : ""}
                  />
                  {errors.endereco && <p className="text-sm text-red-500">{errors.endereco}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      placeholder="Cidade"
                      value={form.cidade}
                      onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                      className={errors.cidade ? "border-red-500" : ""}
                    />
                    {errors.cidade && <p className="text-sm text-red-500">{errors.cidade}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado *</Label>
                    <Input
                      id="estado"
                      placeholder="Estado"
                      value={form.estado}
                      onChange={(e) => setForm({ ...form, estado: e.target.value })}
                      className={errors.estado ? "border-red-500" : ""}
                    />
                    {errors.estado && <p className="text-sm text-red-500">{errors.estado}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    value={form.cep}
                    onChange={(e) => setForm({ ...form, cep: e.target.value })}
                    className={errors.cep ? "border-red-500" : ""}
                  />
                  {errors.cep && <p className="text-sm text-red-500">{errors.cep}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regiao">Região</Label>
                  <Input
                    id="regiao"
                    placeholder="Região de atuação"
                    value={form.regiao}
                    onChange={(e) => setForm({ ...form, regiao: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Etapa</Label>
                  <Select 
                    value={getEtapaValue()} 
                    onValueChange={setEtapaValue}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      {order.map((etapaKey) => (
                        <SelectItem key={etapaKey} value={etapaKey}>
                          {etapas[etapaKey as keyof typeof etapas]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={form.ativo}
                    onCheckedChange={(checked) => setForm({ ...form, ativo: checked })}
                  />
                  <Label htmlFor="ativo">Ativo</Label>
                </div>
              </div>
            </div>

            {/* Upload de Logo */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-full">
                  {form.logo_url ? (
                    <img 
                      src={form.logo_url} 
                      alt="Logo preview" 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <label className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Logo
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Criar preview local
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setForm({ ...form, logo_url: event.target?.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </Button>
                  {form.logo_url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setForm({ ...form, logo_url: "" })}
                    >
                      Remover
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG ou GIF. Máx. 5MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/parceiros')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Criando..." : `Criar ${TIPO_PARCEIRO_LABELS[tipoParceiroFinal]}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}