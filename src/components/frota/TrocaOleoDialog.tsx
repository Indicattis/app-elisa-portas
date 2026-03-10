import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Droplet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Veiculo, useVeiculos } from "@/hooks/useVeiculos";

interface TrocaOleoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  veiculos: Veiculo[];
}

interface TrocaOleoFormData {
  veiculo_id: string;
  data_troca_oleo: Date;
}

const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/40";
const labelClass = "text-white/70 text-xs";

export function TrocaOleoDialog({ open, onOpenChange, veiculos }: TrocaOleoDialogProps) {
  const { updateVeiculo, isUpdating } = useVeiculos();
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);
  
  const form = useForm<TrocaOleoFormData>({
    defaultValues: {
      veiculo_id: "",
    },
  });

  const handleVeiculoChange = (veiculoId: string) => {
    const veiculo = veiculos.find(v => v.id === veiculoId);
    setSelectedVeiculo(veiculo || null);
  };

  const kmAtual = selectedVeiculo?.km_atual || 0;
  const kmProximaTroca = kmAtual + 5000;
  const dataProximaTroca = addMonths(new Date(), 6);

  const onSubmit = async (data: TrocaOleoFormData) => {
    await updateVeiculo({
      id: data.veiculo_id,
      data: {
        data_troca_oleo: format(data.data_troca_oleo, "yyyy-MM-dd"),
        km_atual: kmAtual,
        km_proxima_troca_oleo: kmProximaTroca,
        data_proxima_troca_oleo: format(dataProximaTroca, "yyyy-MM-dd"),
      },
    });
    form.reset();
    setSelectedVeiculo(null);
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) {
      form.reset();
      setSelectedVeiculo(null);
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-black/80 backdrop-blur-xl border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Droplet className="h-5 w-5 text-blue-400" />
            Marcar Troca de Óleo
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Registre a troca de óleo de um veículo da frota.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="veiculo_id"
              rules={{ required: "Selecione um veículo" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Veículo</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleVeiculoChange(value);
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder="Selecione o veículo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
                      {veiculos.map((veiculo) => (
                        <SelectItem 
                          key={veiculo.id} 
                          value={veiculo.id}
                          className="text-white focus:bg-white/10 focus:text-white"
                        >
                          {veiculo.nome} - {veiculo.placa || veiculo.modelo}
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
              name="data_troca_oleo"
              rules={{ required: "Informe a data da troca" }}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className={labelClass}>Data da Troca</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            inputClass,
                            !field.value && "text-white/40"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-black/90 border-white/10 backdrop-blur-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto text-white")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedVeiculo && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel className={labelClass}>KM Atual</FormLabel>
                    <Input
                      value={kmAtual.toLocaleString('pt-BR')}
                      disabled
                      className="bg-white/5 border-white/10 text-white/50"
                    />
                  </FormItem>
                  <FormItem>
                    <FormLabel className={labelClass}>KM Próxima Troca</FormLabel>
                    <Input
                      value={kmProximaTroca.toLocaleString('pt-BR')}
                      disabled
                      className="bg-white/5 border-white/10 text-white/50"
                    />
                  </FormItem>
                </div>
                <FormItem>
                  <FormLabel className={labelClass}>Data Próxima Troca</FormLabel>
                  <Input
                    value={format(dataProximaTroca, "dd/MM/yyyy", { locale: ptBR })}
                    disabled
                    className="bg-white/5 border-white/10 text-white/50"
                  />
                </FormItem>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isUpdating || !selectedVeiculo}
                className="bg-blue-500/15 backdrop-blur-md border border-blue-500/25 text-white hover:bg-blue-500/25 hover:border-blue-400/35"
              >
                {isUpdating ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
