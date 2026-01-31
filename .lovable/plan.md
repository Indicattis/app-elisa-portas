
# Plano: Gestao de Estados e Cidades para Autorizados

## Resumo

Implementar um sistema de gestao de estados e cidades em `/direcao/autorizados`, permitindo criar/editar/excluir estados e cidades, com autorizados agrupados automaticamente. Incluir funcionalidades de excluir, editar e definir como premium os autorizados diretamente nessa pagina.

## Arquitetura do Banco de Dados

### Novas Tabelas

**1. estados_autorizados**
```sql
CREATE TABLE estados_autorizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sigla TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**2. cidades_autorizados**
```sql
CREATE TABLE cidades_autorizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estado_id UUID REFERENCES estados_autorizados(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(estado_id, nome)
);
```

### Politicas RLS

```sql
-- Estados
ALTER TABLE estados_autorizados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados podem ver estados" ON estados_autorizados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados podem gerenciar estados" ON estados_autorizados FOR ALL TO authenticated USING (true);

-- Cidades
ALTER TABLE cidades_autorizados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados podem ver cidades" ON cidades_autorizados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados podem gerenciar cidades" ON cidades_autorizados FOR ALL TO authenticated USING (true);
```

## Layout da Interface

```text
+------------------------------------------------------------------+
|  Gestao de Autorizados                                           |
|  [+ Novo Estado]                                                 |
+------------------------------------------------------------------+
|                                                                  |
|  ESTADOS                                                         |
|  +------------------------+  +------------------------+          |
|  | RS                     |  | SC                     |          |
|  | 36 autorizados         |  | 22 autorizados         |          |
|  | 5 cidades cadastradas  |  | 3 cidades cadastradas  |          |
|  +------------------------+  +------------------------+          |
|                                                                  |
+------------------------------------------------------------------+
|  (Ao clicar em RS)                                               |
|                                                                  |
|  RIO GRANDE DO SUL  [+ Nova Cidade] [Editar] [Excluir]          |
|                                                                  |
|  > Caxias do Sul (8 autorizados)                    [v]          |
|    +----------------------------------------------------------+  |
|    | Autorizado      | Etapa    | Acoes                       |  |
|    | Metalurgica X   | Ativo    | [Editar] [Premium] [Excluir]|  |
|    | Serralheria Y   | Premium* | [Editar] [Premium] [Excluir]|  |
|    +----------------------------------------------------------+  |
|                                                                  |
|  > Porto Alegre (5 autorizados)                     [v]          |
|                                                                  |
|  > Sem cidade cadastrada (3 autorizados)            [v]          |
|    (autorizados com estado=RS mas sem cidade)                    |
+------------------------------------------------------------------+
```

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useEstadosCidades.ts` | Hook para gerenciar estados e cidades |
| `src/components/autorizados/EstadoCard.tsx` | Card de estado com contadores |
| `src/components/autorizados/CidadeCollapsible.tsx` | Cidade colapsavel com lista de autorizados |
| `src/components/autorizados/EstadoDetalheView.tsx` | View detalhada do estado selecionado |
| `src/components/autorizados/NovoEstadoDialog.tsx` | Dialog para criar/editar estado |
| `src/components/autorizados/NovaCidadeDialog.tsx` | Dialog para criar/editar cidade |
| `src/components/autorizados/AutorizadoRowActions.tsx` | Acoes inline do autorizado |

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/direcao/AutorizadosPrecosDirecao.tsx` | Reescrever completamente com nova UI |

## Detalhes de Implementacao

### 1. Hook useEstadosCidades

```typescript
interface Estado {
  id: string;
  sigla: string;
  nome: string;
  totalAutorizados: number;
  totalCidades: number;
}

interface Cidade {
  id: string;
  estado_id: string;
  nome: string;
  autorizados: AutorizadoResumo[];
}

interface AutorizadoResumo {
  id: string;
  nome: string;
  etapa: string;
  cidade: string | null;
  estado: string | null;
}

export const useEstadosCidades = () => {
  // Estados
  const [estados, setEstados] = useState<Estado[]>([]);
  const [estadoSelecionado, setEstadoSelecionado] = useState<string | null>(null);
  
  // Cidades do estado selecionado
  const [cidades, setCidades] = useState<Cidade[]>([]);
  
  // Autorizados orfaos (sem cidade)
  const [autorizadosOrfaos, setAutorizadosOrfaos] = useState<AutorizadoResumo[]>([]);

  // Funcoes CRUD
  const criarEstado = async (sigla: string, nome: string) => {...};
  const editarEstado = async (id: string, sigla: string, nome: string) => {...};
  const excluirEstado = async (id: string) => {...};
  
  const criarCidade = async (estadoId: string, nome: string) => {...};
  const editarCidade = async (id: string, nome: string) => {...};
  const excluirCidade = async (id: string) => {...};

  // Funcoes de autorizado
  const definirPremium = async (autorizadoId: string) => {...};
  const removerPremium = async (autorizadoId: string) => {...};
  const excluirAutorizado = async (autorizadoId: string) => {...};
  
  return {...};
};
```

### 2. Logica de Agrupamento

```typescript
// Ao selecionar um estado, buscar autorizados
const fetchAutorizadosDoEstado = async (siglaEstado: string) => {
  // 1. Buscar cidades cadastradas desse estado
  const { data: cidadesCadastradas } = await supabase
    .from('cidades_autorizados')
    .select('id, nome')
    .eq('estado_id', estadoId);

  // 2. Buscar autorizados desse estado
  const { data: autorizados } = await supabase
    .from('autorizados')
    .select('id, nome, cidade, estado, etapa')
    .eq('ativo', true)
    .eq('estado', siglaEstado)
    .in('etapa', ['ativo', 'premium']);

  // 3. Agrupar por cidade
  const cidadesMap = new Map();
  
  cidadesCadastradas.forEach(cidade => {
    const autorizadosDaCidade = autorizados.filter(
      a => a.cidade?.toLowerCase() === cidade.nome.toLowerCase()
    );
    cidadesMap.set(cidade.id, {
      ...cidade,
      autorizados: autorizadosDaCidade
    });
  });

  // 4. Identificar orfaos (com estado mas sem cidade cadastrada)
  const cidadesNomes = cidadesCadastradas.map(c => c.nome.toLowerCase());
  const orfaos = autorizados.filter(
    a => !a.cidade || !cidadesNomes.includes(a.cidade.toLowerCase())
  );

  return { cidades: Array.from(cidadesMap.values()), orfaos };
};
```

### 3. Componente EstadoCard

```typescript
interface EstadoCardProps {
  estado: Estado;
  onClick: () => void;
  isSelected: boolean;
}

export function EstadoCard({ estado, onClick, isSelected }: EstadoCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{estado.sigla}</h3>
            <p className="text-sm text-muted-foreground">{estado.nome}</p>
          </div>
          <MapPin className="h-6 w-6 text-primary/50" />
        </div>
        <div className="mt-3 flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{estado.totalAutorizados} autorizados</span>
          </div>
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            <span>{estado.totalCidades} cidades</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 4. Componente CidadeCollapsible

```typescript
interface CidadeCollapsibleProps {
  cidade: Cidade;
  onEditAutorizado: (id: string) => void;
  onDeleteAutorizado: (id: string) => void;
  onTogglePremium: (id: string, isPremium: boolean) => void;
}

export function CidadeCollapsible({
  cidade,
  onEditAutorizado,
  onDeleteAutorizado,
  onTogglePremium
}: CidadeCollapsibleProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="font-medium">{cidade.nome}</span>
            <Badge variant="secondary" className="text-xs">
              {cidade.autorizados.length} autorizados
            </Badge>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Autorizado</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cidade.autorizados.map(aut => (
              <TableRow key={aut.id}>
                <TableCell className="font-medium">
                  {aut.nome}
                  {aut.etapa === 'premium' && (
                    <Star className="inline h-4 w-4 ml-1 text-yellow-500 fill-yellow-500" />
                  )}
                </TableCell>
                <TableCell>
                  <Badge>{aut.etapa}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onEditAutorizado(aut.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onTogglePremium(aut.id, aut.etapa === 'premium')}
                    >
                      <Star className={cn(
                        "h-4 w-4",
                        aut.etapa === 'premium' && "fill-yellow-500 text-yellow-500"
                      )} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir autorizado?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acao nao pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteAutorizado(aut.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

### 5. Pagina Principal Atualizada

```typescript
export default function AutorizadosPrecosDirecao() {
  const navigate = useNavigate();
  const {
    estados,
    estadoSelecionado,
    setEstadoSelecionado,
    cidades,
    autorizadosOrfaos,
    criarEstado,
    editarEstado,
    excluirEstado,
    criarCidade,
    editarCidade,
    excluirCidade,
    definirPremium,
    removerPremium,
    excluirAutorizado,
    loading
  } = useEstadosCidades();

  const [novoEstadoOpen, setNovoEstadoOpen] = useState(false);
  const [novaCidadeOpen, setNovaCidadeOpen] = useState(false);

  const handleTogglePremium = async (autorizadoId: string, isPremium: boolean) => {
    if (isPremium) {
      await removerPremium(autorizadoId);
    } else {
      await definirPremium(autorizadoId);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Breadcrumb */}
      
      {/* Header com botao Novo Estado */}
      <header>
        <h1>Gestao de Autorizados</h1>
        <Button onClick={() => setNovoEstadoOpen(true)}>
          <Plus /> Novo Estado
        </Button>
      </header>

      {/* Grid de Estados */}
      {!estadoSelecionado && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {estados.map(estado => (
            <EstadoCard
              key={estado.id}
              estado={estado}
              onClick={() => setEstadoSelecionado(estado.sigla)}
              isSelected={false}
            />
          ))}
        </div>
      )}

      {/* Detalhe do Estado Selecionado */}
      {estadoSelecionado && (
        <EstadoDetalheView
          estadoSigla={estadoSelecionado}
          cidades={cidades}
          autorizadosOrfaos={autorizadosOrfaos}
          onVoltar={() => setEstadoSelecionado(null)}
          onNovaCidade={() => setNovaCidadeOpen(true)}
          onEditAutorizado={(id) => navigate(`/dashboard/parceiros/${id}/edit/autorizado`)}
          onDeleteAutorizado={excluirAutorizado}
          onTogglePremium={handleTogglePremium}
        />
      )}

      {/* Dialogs */}
      <NovoEstadoDialog
        open={novoEstadoOpen}
        onOpenChange={setNovoEstadoOpen}
        onSave={criarEstado}
      />
      <NovaCidadeDialog
        open={novaCidadeOpen}
        onOpenChange={setNovaCidadeOpen}
        estadoId={estadoSelecionado}
        onSave={criarCidade}
      />
    </div>
  );
}
```

## Fluxo de Dados

```text
1. Usuario abre /direcao/autorizados
   |
   v
2. Hook carrega estados da tabela estados_autorizados
   + Conta autorizados por estado (join com autorizados)
   + Conta cidades por estado
   |
   v
3. Usuario clica em um estado (ex: RS)
   |
   v
4. Hook carrega:
   - Cidades cadastradas desse estado
   - Autorizados com estado=RS
   - Agrupa autorizados nas cidades
   - Separa orfaos (sem cidade ou cidade nao cadastrada)
   |
   v
5. Usuario pode:
   - Criar nova cidade -> abre dialog
   - Expandir cidade -> ve autorizados
   - Editar autorizado -> navega para /dashboard/parceiros/:id/edit
   - Definir premium -> atualiza etapa para 'premium'
   - Excluir autorizado -> confirma e deleta
```

## Resultado Esperado

1. Ao abrir a pagina, usuario ve cards dos estados com contadores
2. Ao clicar em um estado, ve as cidades cadastradas e autorizados agrupados
3. Autorizados sem cidade aparecem em "Sem cidade cadastrada"
4. Criar cidade agrupa automaticamente autorizados que possuem aquela cidade no campo texto
5. Acoes rapidas de editar, definir premium e excluir autorizados
6. Interface intuitiva com colapsaveis para cada cidade
