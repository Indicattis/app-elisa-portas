import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Upload, Camera, FileText, X } from "lucide-react";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVeiculos, type Veiculo } from "@/hooks/useVeiculos";
import { useAllUsers } from "@/hooks/useAllUsers";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function FrotaEditMinimalista() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useAuth();
  const { veiculos, isLoading, updateVeiculo, uploadFoto, uploadDocumento, isUpdating, isUploading, isUploadingDocumento } = useVeiculos();
  const { data: users } = useAllUsers();
  const { toast } = useToast();
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const veiculo = veiculos?.find((v) => v.id === id);

  const [form, setForm] = useState({
    nome: "",
    placa: "",
    modelo: "",
    ano: 2024,
    responsavel: "",
    foto_url: "",
    documento_url: "",
    documento_nome: "",
    status: "rodando" as "rodando" | "mecanico" | "parado",
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (veiculo) {
      setForm({
        nome: veiculo.nome || "",
        placa: veiculo.placa || "",
        modelo: veiculo.modelo || "",
        ano: veiculo.ano,
        responsavel: veiculo.responsavel || "",
        foto_url: veiculo.foto_url || "",
        documento_url: veiculo.documento_url || "",
        documento_nome: veiculo.documento_nome || "",
        status: veiculo.status,
      });
    }
  }, [veiculo]);

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFoto({ file, veiculo_id: id });
      setForm((f) => ({ ...f, foto_url: url }));
    } catch {}
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadDocumento({ file, veiculo_id: id });
      setForm((f) => ({ ...f, documento_url: result.url, documento_nome: result.nome }));
    } catch {}
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateVeiculo({
        id,
        data: {
          nome: form.nome,
          placa: form.placa || undefined,
          modelo: form.modelo,
          ano: form.ano,
          responsavel: form.responsavel || undefined,
          foto_url: form.foto_url || undefined,
          documento_url: form.documento_url || undefined,
          documento_nome: form.documento_nome || undefined,
          status: form.status,
        },
      });
      navigate("/logistica/frota");
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
      </div>
    );
  }

  if (!veiculo) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-white/60">Veículo não encontrado</p>
        <Button variant="outline" onClick={() => navigate("/logistica/frota")} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
          Voltar
        </Button>
      </div>
    );
  }

  const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/40 focus-visible:ring-blue-400/20";
  const labelClass = "text-white/70 text-xs";

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <AnimatedBreadcrumb
        items={[
          { label: "Home", path: "/home" },
          { label: "Logística", path: "/logistica" },
          { label: "Frota", path: "/logistica/frota" },
          { label: "Editar" },
        ]}
        mounted={mounted}
      />

      <div className="relative z-10 min-h-screen flex flex-col pt-14">
        <header className="sticky top-0 z-20 px-4 py-3 bg-black/80 backdrop-blur-md border-b border-blue-500/20">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/logistica/frota")} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white/80" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">Editar Veículo</h1>
                <p className="text-xs text-white/60">{veiculo.nome} — {veiculo.modelo}</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isUpdating}
              className="bg-blue-500/15 backdrop-blur-md border border-blue-500/25 text-white shadow-lg shadow-blue-500/5 hover:bg-blue-500/25 hover:border-blue-400/35 transition-all duration-300 text-xs gap-1"
            >
              <Save className="h-3.5 w-3.5" />
              {isUpdating ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-auto">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Foto e Documento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-white/5 border-blue-500/10 backdrop-blur-xl">
                <CardContent className="p-4 space-y-3">
                  <Label className={labelClass}>Foto do Veículo</Label>
                  {form.foto_url ? (
                    <div className="relative group">
                      <img src={form.foto_url} alt="Foto" className="w-full h-40 object-cover rounded-lg border border-white/10" />
                      <button
                        onClick={() => setForm((f) => ({ ...f, foto_url: "" }))}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fotoInputRef.current?.click()}
                      className="w-full h-40 rounded-lg border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-400/40 hover:bg-blue-500/5 transition-all"
                    >
                      <Camera className="h-6 w-6 text-white/40" />
                      <span className="text-xs text-white/40">{isUploading ? "Enviando..." : "Clique para adicionar foto"}</span>
                    </div>
                  )}
                  <input ref={fotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-blue-500/10 backdrop-blur-xl">
                <CardContent className="p-4 space-y-3">
                  <Label className={labelClass}>Documento</Label>
                  {form.documento_url ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                      <FileText className="h-5 w-5 text-white/50 shrink-0" />
                      <span className="text-xs text-white/70 truncate flex-1">{form.documento_nome || "Documento"}</span>
                      <button onClick={() => setForm((f) => ({ ...f, documento_url: "", documento_nome: "" }))} className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => docInputRef.current?.click()}
                      className="w-full h-20 rounded-lg border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-400/40 hover:bg-blue-500/5 transition-all"
                    >
                      <Upload className="h-5 w-5 text-white/40" />
                      <span className="text-xs text-white/40">{isUploadingDocumento ? "Enviando..." : "Clique para enviar documento"}</span>
                    </div>
                  )}
                  <input ref={docInputRef} type="file" className="hidden" onChange={handleDocUpload} />
                </CardContent>
              </Card>
            </div>

            {/* Campos do formulário */}
            <Card className="bg-white/5 border-blue-500/10 backdrop-blur-xl">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Modelo</Label>
                    <Input value={form.modelo} onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))} className={inputClass} placeholder="Fiat Ducato" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Apelido</Label>
                    <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className={inputClass} placeholder="Ex: Ducato" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Placa</Label>
                    <Input value={form.placa} onChange={(e) => setForm((f) => ({ ...f, placa: e.target.value }))} className={inputClass} placeholder="ABC-1234" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Ano</Label>
                    <Input type="number" value={form.ano} onChange={(e) => setForm((f) => ({ ...f, ano: parseInt(e.target.value) || 2024 }))} className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Responsável</Label>
                    <Select value={form.responsavel} onValueChange={(v) => setForm((f) => ({ ...f, responsavel: v }))}>
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.nome} className="text-white focus:bg-white/10 focus:text-white">
                            {user.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as "rodando" | "mecanico" | "parado" }))}>
                      <SelectTrigger className={inputClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
                        <SelectItem value="rodando" className="text-white focus:bg-white/10 focus:text-white">Rodando</SelectItem>
                        <SelectItem value="mecanico" className="text-white focus:bg-white/10 focus:text-white">Mecânico</SelectItem>
                        <SelectItem value="parado" className="text-white focus:bg-white/10 focus:text-white">Parado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Campos somente leitura */}
                <div className="pt-3 border-t border-blue-500/10 space-y-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Informações gerenciadas pelo sistema</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelClass}>Km Atual</Label>
                      <Input value={veiculo.km_atual.toLocaleString("pt-BR")} disabled className="bg-white/[0.02] border-white/5 text-white/50 cursor-not-allowed" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelClass}>Última Troca de Óleo</Label>
                      <Input value={veiculo.data_troca_oleo || "—"} disabled className="bg-white/[0.02] border-white/5 text-white/50 cursor-not-allowed" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelClass}>Próx. Troca de Óleo</Label>
                      <Input value={veiculo.data_proxima_troca_oleo || "—"} disabled className="bg-white/[0.02] border-white/5 text-white/50 cursor-not-allowed" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
