import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
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
  km_atual: number;
  km_proxima_troca_oleo: number;
  data_proxima_troca_oleo: Date;
}

export function TrocaOleoDialog({ open, onOpenChange, veiculos }: TrocaOleoDialogProps) {
  const { updateVeiculo, isUpdating } = useVeiculos();
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);
  
  const form = useForm<TrocaOleoFormData>({
    defaultValues: {
      veiculo_id: "",
      km_atual: 0,
      km_proxima_troca_oleo: 0,
    },
  });

  const handleVeiculoChange = (veiculoId: string) => {
    const veiculo = veiculos.find(v => v.id === veiculoId);
    setSelectedVeiculo(veiculo || null);
    if (veiculo) {
      form.setValue("km_atual", veiculo.km_atual);
      form.setValue("km_proxima_troca_oleo", veiculo.km_atual + 5000);
    }
  };

  const onSubmit = async (data: TrocaOleoFormData) => {
    await updateVeiculo({
      id: data.veiculo_id,
      data: {
        data_troca_oleo: format(data.data_troca_oleo, "yyyy-MM-dd"),
        km_atual: data.km_atual,
        km_proxima_troca_oleo: data.km_proxima_troca_oleo,
        data_proxima_troca_oleo: format(data.data_proxima_troca_oleo, "yyyy-MM-dd"),
      },
    });
    form.reset();
    setSelectedVeiculo(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5" />
            Marcar Troca de Óleo
          </DialogTitle>
          <DialogDescription>
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
                  <FormLabel>Veículo</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleVeiculoChange(value);
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o veículo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {veiculos.map((veiculo) => (
                        <SelectItem key={veiculo.id} value={veiculo.id}>
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
                  <FormLabel>Data da Troca</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
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
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="km_atual"
              rules={{ required: "Informe o KM atual", min: { value: 1, message: "KM deve ser maior que 0" } }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>KM Atual</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ex: 45000"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="km_proxima_troca_oleo"
              rules={{ required: "Informe o KM da próxima troca", min: { value: 1, message: "KM deve ser maior que 0" } }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>KM Próxima Troca</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ex: 50000"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data_proxima_troca_oleo"
              rules={{ required: "Informe a data da próxima troca" }}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Próxima Troca</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
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
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
