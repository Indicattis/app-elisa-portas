import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Camera, Upload, FileText, X } from "lucide-react";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVeiculos } from "@/hooks/useVeiculos";
import { useAllUsers } from "@/hooks/useAllUsers";
import { useAuth } from "@/hooks/useAuth";

export default function FrotaNovoMinimalista() {
  const navigate = useNavigate();
  useAuth();
  const { createVeiculo, uploadFoto, uploadDocumento, isCreating, isUploading, isUploadingDocumento } = useVeiculos();
  const { data: users } = useAllUsers();
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nome: "",
    placa: "",
    modelo: "",
    ano: 2024,
    responsavel: "",
    mecanico: "",
    motorista: "",
    foto_url: "",
    documento_url: "",
    documento_nome: "",
    status: "rodando" as "rodando" | "mecanico" | "parado",
    tipo_frota: "empresa" as "empresa" | "particular",
  });

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFoto({ file });
      setForm((f) => ({ ...f, foto_url: url }));
    } catch {}
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadDocumento({ file });
      setForm((f) => ({ ...f, documento_url: result.url, documento_nome: result.nome }));
    } catch {}
  };

  const handleSave = async () => {
    if (!form.modelo || !form.nome) return;
    try {
      await createVeiculo({
        nome: form.nome,
        modelo: form.modelo,
        placa: form.placa || undefined,
        ano: form.ano,
        km_atual: 0,
        responsavel: form.responsavel || undefined,
        mecanico: form.mecanico || undefined,
        motorista: form.motorista || undefined,
        foto_url: form.foto_url || undefined,
        documento_url: form.documento_url || undefined,
        documento_nome: form.documento_nome || undefined,
        status: form.status,
        tipo_frota: form.tipo_frota,
      });
      navigate("/logistica/frota");
    } catch {}
  };

  const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/40 focus-visible:ring-blue-400/20";
  const labelClass = "text-white/70 text-xs";

  const headerActions = (
    <Button
      size="sm"
      onClick={handleSave}
      disabled={isCreating}
      className="bg-blue-500/15 backdrop-blur-md border border-blue-500/25 text-white shadow-lg shadow-blue-500/5 hover:bg-blue-500/25 hover:border-blue-400/35 transition-all duration-300 text-xs gap-1"
    >
      <Save className="h-3.5 w-3.5" />
      {isCreating ? "Cadastrando..." : "Cadastrar"}
    </Button>
  );

  return (
    <MinimalistLayout
      title="Novo Veículo"
      subtitle="Cadastre um novo veículo da frota"
      backPath="/logistica/frota"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Logística", path: "/logistica" },
        { label: "Frota", path: "/logistica/frota" },
        { label: "Novo" },
      ]}
      headerActions={headerActions}
    >
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
                <Label className={labelClass}>Motorista</Label>
                <Input value={form.motorista} onChange={(e) => setForm((f) => ({ ...f, motorista: e.target.value }))} className={inputClass} placeholder="Nome do motorista" />
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Mecânico</Label>
                <Input value={form.mecanico} onChange={(e) => setForm((f) => ({ ...f, mecanico: e.target.value }))} className={inputClass} placeholder="Nome do mecânico" />
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Tipo de Frota</Label>
                <Select value={form.tipo_frota} onValueChange={(v) => setForm((f) => ({ ...f, tipo_frota: v as "empresa" | "particular" }))}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
                    <SelectItem value="empresa" className="text-white focus:bg-white/10 focus:text-white">Empresa</SelectItem>
                    <SelectItem value="particular" className="text-white focus:bg-white/10 focus:text-white">Particular</SelectItem>
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
          </CardContent>
        </Card>
      </div>
    </MinimalistLayout>
  );
}
