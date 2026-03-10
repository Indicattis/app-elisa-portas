import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, X, Loader2, Check, ClipboardCheck, Droplet } from "lucide-react";
import { addMonths, format } from "date-fns";

import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useVeiculos } from "@/hooks/useVeiculos";
import { useConferencias } from "@/hooks/useConferencias";
import { StatusBadge } from "@/components/frota/StatusBadge";
import { useAuth } from "@/hooks/useAuth";

type FlowType = "conferencia" | "troca_oleo";

export default function FrotaConferenciaMinimalista() {
  const navigate = useNavigate();
  useAuth();
  const { veiculos, isLoading, updateVeiculo, isUpdating } = useVeiculos();
  const { createConferencia, uploadFotoConferencia, isCreating, isUploading } = useConferencias();

  const [selectedType, setSelectedType] = useState<FlowType | null>(null);
  const [selectedVeiculo, setSelectedVeiculo] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Conferência fields
  const [kmAtual, setKmAtual] = useState("");
  const [dataTrocaOleo, setDataTrocaOleo] = useState("");
  const [aguaConferida, setAguaConferida] = useState(false);
  const [nivelOleoConferido, setNivelOleoConferido] = useState(false);
  const [observacoes, setObservacoes] = useState("");

  // Troca de óleo fields
  const [dataTroca, setDataTroca] = useState(format(new Date(), "yyyy-MM-dd"));

  const veiculo = veiculos?.find(v => v.id === selectedVeiculo);

  useEffect(() => {
    if (veiculo) {
      setKmAtual(String(veiculo.km_atual || ""));
      setDataTrocaOleo(veiculo.data_troca_oleo || "");
    }
  }, [veiculo]);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleClearPhoto = () => {
    setCapturedPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBack = () => {
    if (selectedType === "conferencia" && capturedPhoto) {
      handleClearPhoto();
    } else if (selectedVeiculo) {
      setSelectedVeiculo(null);
      setCapturedPhoto(null);
      setPhotoPreview(null);
    } else if (selectedType) {
      setSelectedType(null);
    } else {
      navigate("/logistica/frota");
    }
  };

  const handleSubmitConferencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVeiculo || !capturedPhoto) return;

    const foto_url = await uploadFotoConferencia({
      file: capturedPhoto,
      veiculo_id: selectedVeiculo
    });

    await createConferencia({
      veiculo_id: selectedVeiculo,
      foto_url,
      km_atual: Number(kmAtual),
      data_troca_oleo: dataTrocaOleo || undefined,
      agua_conferida: aguaConferida,
      observacoes: observacoes || undefined,
      status: veiculo?.status || "rodando"
    });

    navigate("/logistica/frota");
  };

  const handleSubmitTrocaOleo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVeiculo || !veiculo) return;

    const kmProximaTroca = (veiculo.km_atual || 0) + 5000;
    const dataProximaTroca = format(addMonths(new Date(dataTroca + "T12:00:00"), 6), "yyyy-MM-dd");

    await updateVeiculo({
      id: selectedVeiculo,
      data: {
        data_troca_oleo: dataTroca,
        km_proxima_troca_oleo: kmProximaTroca,
        data_proxima_troca_oleo: dataProximaTroca,
      }
    });

    navigate("/logistica/frota");
  };

  const stepTitle = !selectedType
    ? "Selecione o tipo"
    : !selectedVeiculo
    ? "Selecione o veículo"
    : selectedType === "troca_oleo"
    ? `Troca de Óleo: ${veiculo?.nome}`
    : !capturedPhoto
    ? `Foto: ${veiculo?.nome}`
    : `Conferir: ${veiculo?.nome}`;

  const inputClass =
    "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400/40 focus-visible:ring-blue-400/20";

  return (
    <MinimalistLayout
      title="Conferência"
      subtitle={stepTitle}
      backPath="/logistica/frota"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Logística", path: "/logistica" },
        { label: "Frota", path: "/logistica/frota" },
        { label: "Conferência" },
      ]}
    >
      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
          </div>
        ) : !selectedType ? (
          /* Step 0: Select Type */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card
              onClick={() => setSelectedType("conferencia")}
              className="cursor-pointer bg-white/5 border-blue-500/10 backdrop-blur-xl hover:bg-blue-500/5 hover:border-blue-400/20 transition-all duration-300"
            >
              <CardContent className="p-8 flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <ClipboardCheck className="h-10 w-10 text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-white">Conferência</h3>
                <p className="text-sm text-white/50 text-center">Registrar conferência do veículo</p>
              </CardContent>
            </Card>
            <Card
              onClick={() => setSelectedType("troca_oleo")}
              className="cursor-pointer bg-white/5 border-blue-500/10 backdrop-blur-xl hover:bg-amber-500/5 hover:border-amber-400/20 transition-all duration-300"
            >
              <CardContent className="p-8 flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Droplet className="h-10 w-10 text-amber-400" />
                </div>
                <h3 className="text-lg font-medium text-white">Troca de Óleo</h3>
                <p className="text-sm text-white/50 text-center">Registrar troca de óleo do veículo</p>
              </CardContent>
            </Card>
          </div>
        ) : !selectedVeiculo ? (
          /* Step 1: Select Vehicle */
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {veiculos?.map((v) => (
                <Card
                  key={v.id}
                  onClick={() => setSelectedVeiculo(v.id)}
                  className="cursor-pointer bg-white/5 border-blue-500/10 backdrop-blur-xl hover:bg-blue-500/5 hover:border-blue-400/20 transition-all duration-300"
                >
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      {v.foto_url ? (
                        <img src={v.foto_url} alt={v.nome} className="w-full h-32 object-cover rounded-lg" />
                      ) : (
                        <div className="w-full h-32 bg-white/5 rounded-lg flex items-center justify-center text-white/30 text-xs">Sem foto</div>
                      )}
                      <div>
                        <h3 className="font-medium text-sm text-white">{v.nome}</h3>
                        <p className="text-xs text-white/50">{v.modelo}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/40">{v.placa || "-"}</span>
                        <StatusBadge status={v.status} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {veiculos?.length === 0 && (
                <div className="col-span-full text-center py-12 text-white/50">Nenhum veículo cadastrado</div>
              )}
            </div>
            <div className="mt-4">
              <Button variant="ghost" onClick={handleBack} className="text-white/60 hover:text-white hover:bg-white/10">
                Voltar
              </Button>
            </div>
          </div>
        ) : selectedType === "troca_oleo" ? (
          /* Troca de Óleo Form */
          <form onSubmit={handleSubmitTrocaOleo} className="space-y-4">
            <Card className="bg-white/5 border-blue-500/10 backdrop-blur-xl">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-white/70 text-xs">Data da Troca *</Label>
                  <Input
                    type="date"
                    value={dataTroca}
                    onChange={(e) => setDataTroca(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70 text-xs">Km Atual</Label>
                  <Input
                    type="number"
                    value={veiculo?.km_atual || 0}
                    readOnly
                    className={`${inputClass} opacity-60`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70 text-xs">Km Próxima Troca</Label>
                  <Input
                    type="number"
                    value={(veiculo?.km_atual || 0) + 5000}
                    readOnly
                    className={`${inputClass} opacity-60`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70 text-xs">Data Próxima Troca</Label>
                  <Input
                    type="text"
                    value={dataTroca ? format(addMonths(new Date(dataTroca + "T12:00:00"), 6), "dd/MM/yyyy") : "-"}
                    readOnly
                    className={`${inputClass} opacity-60`}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleBack} className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10">
                Voltar
              </Button>
              <Button
                type="submit"
                disabled={isUpdating || !dataTroca}
                className="flex-1 bg-amber-500/15 backdrop-blur-md border border-amber-500/25 text-white hover:bg-amber-500/25 hover:border-amber-400/35 transition-all duration-300"
              >
                {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Registrar Troca
              </Button>
            </div>
          </form>
        ) : !capturedPhoto ? (
          /* Step 2: Capture Photo */
          <Card className="bg-white/5 border-blue-500/10 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Camera className="h-12 w-12 text-blue-400" />
                </div>
                <p className="text-center text-white/60 text-sm">Tire uma foto do veículo para registrar a conferência</p>
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} className="hidden" />
                <Button
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-xs bg-blue-500/15 backdrop-blur-md border border-blue-500/25 text-white hover:bg-blue-500/25 hover:border-blue-400/35 transition-all duration-300"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Abrir Câmera
                </Button>
                <Button variant="ghost" onClick={handleBack} className="text-white/60 hover:text-white hover:bg-white/10">
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Step 3: Conferência Form */
          <form onSubmit={handleSubmitConferencia} className="space-y-4">
            <Card className="bg-white/5 border-blue-500/10 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="relative">
                  <img src={photoPreview!} alt="Foto do veículo" className="w-full max-h-64 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={handleClearPhoto}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-red-500/30 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-blue-500/10 backdrop-blur-xl">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-white/70 text-xs">Km Atual *</Label>
                  <Input type="number" step="0.1" value={kmAtual} onChange={(e) => setKmAtual(e.target.value)} placeholder="Quilometragem atual" required className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70 text-xs">Data da Última Troca de Óleo</Label>
                  <Input type="date" value={dataTrocaOleo} onChange={(e) => setDataTrocaOleo(e.target.value)} className={inputClass} />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="agua" checked={aguaConferida} onCheckedChange={(c) => setAguaConferida(c as boolean)} className="border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" />
                  <Label htmlFor="agua" className="text-white/70 text-sm cursor-pointer">Água conferida</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="oleo" checked={nivelOleoConferido} onCheckedChange={(c) => setNivelOleoConferido(c as boolean)} className="border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" />
                  <Label htmlFor="oleo" className="text-white/70 text-sm cursor-pointer">Nível do óleo conferido</Label>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70 text-xs">Observações</Label>
                  <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações da conferência" className={inputClass} />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleBack} className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10">
                Voltar
              </Button>
              <Button
                type="submit"
                disabled={isCreating || isUploading || !kmAtual}
                className="flex-1 bg-blue-500/15 backdrop-blur-md border border-blue-500/25 text-white hover:bg-blue-500/25 hover:border-blue-400/35 transition-all duration-300"
              >
                {(isCreating || isUploading) ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Finalizar Conferência
              </Button>
            </div>
          </form>
        )}
      </div>
    </MinimalistLayout>
  );
}
