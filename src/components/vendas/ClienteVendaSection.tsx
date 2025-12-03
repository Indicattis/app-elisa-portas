import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Search, UserPlus, X, AlertTriangle, Check, User } from 'lucide-react';
import { useSearchClientes, useCheckClienteDuplicado, useCreateCliente, Cliente, ClienteFormData } from '@/hooks/useClientes';
import { useCanaisAquisicao } from '@/hooks/useCanaisAquisicao';
import { ESTADOS_BRASIL, getCidadesPorEstado } from '@/utils/estadosCidades';
import { cn } from '@/lib/utils';

interface DadosCliente {
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email: string;
  cpf_cliente: string;
  estado: string;
  cidade: string;
  cep: string;
  endereco: string;
  bairro: string;
  canal_aquisicao_id: string;
}

interface ClienteVendaSectionProps {
  dados: DadosCliente;
  onChange: (dados: Partial<DadosCliente>) => void;
  onClienteSelecionado?: (cliente: Cliente | null) => void;
}

export function ClienteVendaSection({ dados, onChange, onClienteSelecionado }: ClienteVendaSectionProps) {
  const [modo, setModo] = useState<'buscar' | 'cadastrar'>('buscar');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [cpfParaVerificar, setCpfParaVerificar] = useState('');

  const { data: clientesBusca = [], isLoading: buscando } = useSearchClientes(searchTerm);
  const { data: clienteDuplicado } = useCheckClienteDuplicado(cpfParaVerificar);
  const { canais } = useCanaisAquisicao();
  const createCliente = useCreateCliente();

  const cidades = dados.estado ? getCidadesPorEstado(dados.estado) : [];

  // Quando seleciona um cliente existente, preenche os dados
  const handleSelectCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setSearchOpen(false);
    setSearchTerm('');
    
    onChange({
      cliente_nome: cliente.nome,
      cliente_telefone: cliente.telefone || '',
      cliente_email: cliente.email || '',
      cpf_cliente: cliente.cpf_cnpj || '',
      estado: cliente.estado || '',
      cidade: cliente.cidade || '',
      cep: cliente.cep || '',
      endereco: cliente.endereco || '',
      bairro: cliente.bairro || '',
      canal_aquisicao_id: cliente.canal_aquisicao_id || '',
    });
    
    onClienteSelecionado?.(cliente);
  };

  // Limpa seleção de cliente
  const handleLimparCliente = () => {
    setClienteSelecionado(null);
    onChange({
      cliente_nome: '',
      cliente_telefone: '',
      cliente_email: '',
      cpf_cliente: '',
      estado: '',
      cidade: '',
      cep: '',
      endereco: '',
      bairro: '',
      canal_aquisicao_id: '',
    });
    onClienteSelecionado?.(null);
  };

  // Usa cliente duplicado encontrado
  const handleUsarClienteExistente = () => {
    if (clienteDuplicado) {
      handleSelectCliente(clienteDuplicado as Cliente);
      setModo('buscar');
    }
  };

  // Verificar CPF duplicado quando digita
  useEffect(() => {
    if (modo === 'cadastrar' && dados.cpf_cliente) {
      const timeout = setTimeout(() => {
        setCpfParaVerificar(dados.cpf_cliente);
      }, 500);
      return () => clearTimeout(timeout);
    } else {
      setCpfParaVerificar('');
    }
  }, [dados.cpf_cliente, modo]);

  // Formatar CPF/CNPJ
  const formatarCpfCnpj = (value: string) => {
    let v = value.replace(/\D/g, '');
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      v = v.replace(/(\d{2})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1/$2');
      v = v.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
    return v;
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

  // Formatar CEP
  const formatarCep = (value: string) => {
    let v = value.replace(/\D/g, '');
    if (v.length > 5) {
      v = v.replace(/(\d{5})(\d{1,3})/, '$1-$2');
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
                  {clienteSelecionado.cpf_cnpj && <p>CPF/CNPJ: {clienteSelecionado.cpf_cnpj}</p>}
                  {clienteSelecionado.telefone && <p>Tel: {clienteSelecionado.telefone}</p>}
                  {clienteSelecionado.email && <p>Email: {clienteSelecionado.email}</p>}
                  {clienteSelecionado.cidade && (
                    <p>Local: {clienteSelecionado.endereco && `${clienteSelecionado.endereco}, `}{clienteSelecionado.bairro && `${clienteSelecionado.bairro} - `}{clienteSelecionado.cidade}/{clienteSelecionado.estado}</p>
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
          <>
            {/* Alerta de CPF/CNPJ duplicado */}
            {clienteDuplicado && (
              <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">CPF/CNPJ já cadastrado</AlertTitle>
                <AlertDescription className="text-amber-700">
                  <p>Já existe um cliente com este documento: <strong>{clienteDuplicado.nome}</strong></p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 border-amber-300 hover:bg-amber-100"
                    onClick={handleUsarClienteExistente}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Usar cliente existente
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Dados do Cliente */}
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
                <Label htmlFor="cliente_email" className="text-xs font-medium">E-mail</Label>
                <Input
                  id="cliente_email"
                  type="email"
                  value={dados.cliente_email}
                  onChange={(e) => onChange({ cliente_email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="cpf_cliente" className="text-xs font-medium">CPF/CNPJ *</Label>
                <Input
                  id="cpf_cliente"
                  value={dados.cpf_cliente}
                  onChange={(e) => onChange({ cpf_cliente: formatarCpfCnpj(e.target.value) })}
                  placeholder="CPF ou CNPJ"
                  className={cn("h-9", clienteDuplicado && "border-amber-500 focus-visible:ring-amber-500")}
                  maxLength={18}
                  required
                />
              </div>
            </div>

            {/* Localização */}
            <div className="pt-2 border-t">
              <Label className="text-xs font-medium text-muted-foreground mb-2 block">Localização (obrigatório para NF-e)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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

                <div className="space-y-1">
                  <Label htmlFor="cep" className="text-xs font-medium">CEP *</Label>
                  <Input
                    id="cep"
                    value={dados.cep}
                    onChange={(e) => onChange({ cep: formatarCep(e.target.value) })}
                    placeholder="00000-000"
                    className="h-9"
                    maxLength={9}
                    required
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="endereco" className="text-xs font-medium">Endereço *</Label>
                  <Input
                    id="endereco"
                    value={dados.endereco}
                    onChange={(e) => onChange({ endereco: e.target.value })}
                    placeholder="Ex: Rua das Flores, 123"
                    className="h-9"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bairro" className="text-xs font-medium">Bairro *</Label>
                  <Input
                    id="bairro"
                    value={dados.bairro}
                    onChange={(e) => onChange({ bairro: e.target.value })}
                    placeholder="Nome do bairro"
                    className="h-9"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Canal de Aquisição */}
            <div className="pt-2 border-t">
              <div className="space-y-1 max-w-xs">
                <Label htmlFor="canal_aquisicao_id" className="text-xs font-medium">Canal de Aquisição</Label>
                <Select
                  value={dados.canal_aquisicao_id}
                  onValueChange={(value) => onChange({ canal_aquisicao_id: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Como conheceu?" />
                  </SelectTrigger>
                  <SelectContent>
                    {canais.map((canal) => (
                      <SelectItem key={canal.id} value={canal.id}>
                        {canal.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}