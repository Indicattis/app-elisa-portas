import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useVisitas } from "@/hooks/useVisitas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin } from "lucide-react";
import { TURNO_LABELS } from "@/types/visita";

const visitaSchema = z.object({
  responsavel_id: z.string().min(1, "Selecione um responsável"),
  data_visita: z.string().min(1, "Data é obrigatória"),
  turno: z.enum(["manha", "tarde", "noite"], {
    required_error: "Selecione um turno",
  }),
  observacoes: z.string().optional(),
});

type VisitaFormData = z.infer<typeof visitaSchema>;

export default function VisitaNova() {
  const navigate = useNavigate();
  const { leadId } = useParams<{ leadId: string }>();
  const { createVisita } = useVisitas();
  const { toast } = useToast();
  const [lead, setLead] = useState<any>(null);
  const [atendentes, setAtendentes] = useState<Array<{ id: string; nome: string }>>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<VisitaFormData>({
    resolver: zodResolver(visitaSchema),
  });

  useEffect(() => {
    const loadData = async () => {
      if (!leadId) return;
      
      try {
        // Buscar dados do lead
        const { data: leadData, error: leadError } = await supabase
          .from('elisaportas_leads')
          .select()
          .eq('id', leadId)
          .single();

        if (leadError) throw leadError;

        // Verificar se o lead tem endereço completo
        if (!leadData.endereco_rua || !leadData.endereco_numero || !leadData.endereco_bairro || !leadData.endereco_cep) {
          toast({
            title: "Endereço incompleto",
            description: "É necessário preencher o endereço completo do lead antes de criar uma visita técnica",
            variant: "destructive",
          });
          navigate(`/dashboard/leads/${leadId}`);
          return;
        }

        setLead(leadData);

        // Buscar atendentes
        const { data: atendentesData, error: atendentesError } = await supabase
          .from('admin_users')
          .select('user_id, nome')
          .eq('ativo', true)
          .in('role', ['atendente', 'gerente_comercial']);

        if (atendentesError) throw atendentesError;

        setAtendentes(atendentesData.map(a => ({ id: a.user_id, nome: a.nome })));
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados necessários",
          variant: "destructive",
        });
        navigate('/dashboard/leads');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [leadId, navigate, toast]);

  const onSubmit = async (data: VisitaFormData) => {
    if (!leadId) return;

    const success = await createVisita({
      lead_id: leadId,
      responsavel_id: data.responsavel_id,
      data_visita: data.data_visita,
      turno: data.turno,
      observacoes: data.observacoes,
    });

    if (success) {
      navigate('/dashboard/visitas');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center">
        <p>Lead não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(`/dashboard/leads/${leadId}`)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nova Visita Técnica</h1>
          <p className="text-muted-foreground">Agende uma visita técnica para o lead {lead.nome}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Informações do Lead */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Informações do Lead
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">Nome:</p>
              <p className="text-muted-foreground">{lead.nome}</p>
            </div>
            <div>
              <p className="font-medium">Telefone:</p>
              <p className="text-muted-foreground">{lead.telefone}</p>
            </div>
            <div>
              <p className="font-medium">Endereço:</p>
              <p className="text-muted-foreground">
                {lead.endereco_rua}, {lead.endereco_numero}
                <br />
                {lead.endereco_bairro} - {lead.endereco_cep}
                <br />
                {lead.endereco_cidade_completa || lead.cidade}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Agendamento */}
        <Card>
          <CardHeader>
            <CardTitle>Agendamento da Visita</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="responsavel_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável pela Visita</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o responsável" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {atendentes.map((atendente) => (
                            <SelectItem key={atendente.id} value={atendente.id}>
                              {atendente.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_visita"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Visita</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="turno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turno</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o turno" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manha">{TURNO_LABELS.manha}</SelectItem>
                          <SelectItem value="tarde">{TURNO_LABELS.tarde}</SelectItem>
                          <SelectItem value="noite">{TURNO_LABELS.noite}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações sobre a visita..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1">
                    Agendar Visita
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/dashboard/leads/${leadId}`)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}