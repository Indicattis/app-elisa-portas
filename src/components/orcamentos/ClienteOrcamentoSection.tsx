import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, X, Check, User } from 'lucide-react';
import { useSearchClientes, Cliente } from '@/hooks/useClientes';
import { ESTADOS_BRASIL, getCidadesPorEstado } from '@/utils/estadosCidades';

interface DadosClienteOrcamento {
  cliente_nome: string;
  cliente_telefone: string;
  estado: string;
  cidade: string;
}

interface ClienteOrcamentoSectionProps {
  dados: DadosClienteOrcamento;
  onChange: (dados: Partial<DadosClienteOrcamento>) => void;
  onClienteSelecionado?: (cliente: Cliente | null) => void;
}

export function ClienteOrcamentoSection({ dados, onChange, onClienteSelecionado }: ClienteOrcamentoSectionProps) {
  const [modo, setModo] = useState<'buscar' | 'cadastrar'>('buscar');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);

  const { data: clientesBusca = [], isLoading: buscando } = useSearchClientes(searchTerm);

  const cidades = dados.estado ? getCidadesPorEstado(dados.estado) : [];

  // Quando seleciona um cliente existente, preenche os dados
  const handleSelectCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setSearchOpen(false);
    setSearchTerm('');
    
    onChange({
      cliente_nome: cliente.nome,
      cliente_telefone: cliente.telefone || '',
      estado: cliente.estado || '',
      cidade: cliente.cidade || '',
    });
    
    onClienteSelecionado?.(cliente);
  };

  // Limpa seleção de cliente
  const handleLimparCliente = () => {
    setClienteSelecionado(null);
    onChange({
      cliente_nome: '',
      cliente_telefone: '',
      estado: '',
      cidade: '',
    });
    onClienteSelecionado?.(null);
  };

  // Formatar telefone
  const formatarTelefone = (value: string) => {
    let v = value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 6) {
      v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    } else if (v.length > 2) {
      v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    }
    return v;
  };

  return (
    <Card>
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Cliente</CardTitle>
          <RadioGroup
            value={modo}
            onValueChange={(v) => {
              setModo(v as 'buscar' | 'cadastrar');
              if (v === 'buscar') {
                handleLimparCliente();
              }
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="buscar" id="buscar" />
              <Label htmlFor="buscar" className="text-sm cursor-pointer">Buscar existente</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cadastrar" id="cadastrar" />
              <Label htmlFor="cadastrar" className="text-sm cursor-pointer">Cadastrar novo</Label>
            </div>
          </RadioGroup>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-4">
        {/* Modo Buscar */}
        {modo === 'buscar' && !clienteSelecionado && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Buscar por nome ou CPF/CNPJ</Label>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-start h-9"
                >
                  <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Digite para buscar...</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Nome ou CPF/CNPJ..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  <CommandList>
                    {buscando && (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        Buscando...
                      </div>
                    )}
                    {!buscando && searchTerm.length >= 2 && clientesBusca.length === 0 && (
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    )}
                    {!buscando && clientesBusca.length > 0 && (
                      <CommandGroup heading="Clientes encontrados">
                        {clientesBusca.map((cliente) => (
                          <CommandItem
                            key={cliente.id}
                            onSelect={() => handleSelectCliente(cliente)}
                            className="cursor-pointer"
                          >
                            <User className="mr-2 h-4 w-4" />
                            <div className="flex flex-col">
                              <span className="font-medium">{cliente.nome}</span>
                              <span className="text-xs text-muted-foreground">
                                {cliente.cpf_cnpj && `${cliente.cpf_cnpj} • `}
                                {cliente.cidade && `${cliente.cidade}/${cliente.estado}`}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Ou selecione "Cadastrar novo" para adicionar um cliente
            </p>
          </div>
        )}

        {/* Cliente Selecionado */}
        {modo === 'buscar' && clienteSelecionado && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{clienteSelecionado.nome}</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-0.5">
                  {clienteSelecionado.telefone && <p>Tel: {clienteSelecionado.telefone}</p>}
                  {clienteSelecionado.cidade && (
                    <p>Local: {clienteSelecionado.cidade}/{clienteSelecionado.estado}</p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLimparCliente}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Modo Cadastrar */}
        {modo === 'cadastrar' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="cliente_nome" className="text-xs font-medium">Nome *</Label>
              <Input
                id="cliente_nome"
                value={dados.cliente_nome}
                onChange={(e) => onChange({ cliente_nome: e.target.value })}
                placeholder="Nome completo"
                className="h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="cliente_telefone" className="text-xs font-medium">Telefone *</Label>
              <Input
                id="cliente_telefone"
                value={dados.cliente_telefone}
                onChange={(e) => onChange({ cliente_telefone: formatarTelefone(e.target.value) })}
                placeholder="(00) 00000-0000"
                className="h-9"
                maxLength={15}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="estado" className="text-xs font-medium">Estado *</Label>
              <Select
                value={dados.estado}
                onValueChange={(value) => onChange({ estado: value, cidade: '' })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_BRASIL.map(estado => (
                    <SelectItem key={estado.sigla} value={estado.sigla}>
                      {estado.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cidade" className="text-xs font-medium">Cidade *</Label>
              <Select
                value={dados.cidade}
                onValueChange={(value) => onChange({ cidade: value })}
                disabled={!dados.estado}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione a cidade" />
                </SelectTrigger>
                <SelectContent>
                  {cidades.map(cidade => (
                    <SelectItem key={cidade} value={cidade}>
                      {cidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
